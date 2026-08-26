"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import BlasonCorrespondant from "@/components/corbeaux/BlasonCorrespondant";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import type { ResultatRecherche } from "@/lib/corbeaux/depot";
import { nettoyerRecherche } from "@/lib/corbeaux/schema";
import { ROUTES } from "@/lib/ecole/menu";
import ChampCorbeau from "./ChampCorbeau";

/**
 * Trouver quelqu’un, puis lui écrire.
 *
 * ── Accessibilité ──
 *
 * C’est une liste de suggestions, pas une boîte magique : le champ porte
 * `role="combobox"`, la liste `role="listbox"`, et le nombre de réponses est
 * annoncé dans une région `aria-live` **polie** — le lecteur d’écran apprend
 * qu’il y a trois noms sans se faire arracher le curseur à chaque frappe.
 *
 * Les flèches parcourent, Entrée choisit. C’est le même principe que
 * `bjornstav/EtapeChoix.tsx` : **une flèche ne décide pas**. Ici l’enjeu est
 * moindre — rien n’est définitif — mais un joueur au clavier ne doit pas se
 * retrouver à écrire au premier nom de la liste sans avoir lu les autres.
 */
export default function RechercheCorbeau() {
  const router = useRouter();
  const champId = useId();
  const listeId = `${champId}-liste`;
  const aideId = `${champId}-aide`;

  const [saisie, setSaisie] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [cherche, setCherche] = useState(false);
  const [survole, setSurvole] = useState(-1);
  const [choisi, setChoisi] = useState<ResultatRecherche | null>(null);

  const t = TEXTES_CORBEAUX;
  const requete = nettoyerRecherche(saisie);

  // La requête en cours, pour ignorer une réponse lente arrivée après une
  // plus récente — sans quoi la liste afficherait le résultat d'une frappe
  // qu'on a déjà dépassée.
  const tour = useRef(0);

  useEffect(() => {
    if (choisi) return;
    if (!requete) {
      setResultats([]);
      return;
    }

    const monTour = ++tour.current;
    setCherche(true);

    // Un court délai : on n'interroge pas le serveur à chaque touche.
    const attente = setTimeout(async () => {
      try {
        const reponse = await fetch(
          `/api/corbeaux/recherche?q=${encodeURIComponent(requete)}`,
          { cache: "no-store" },
        );
        if (monTour !== tour.current) return;
        if (!reponse.ok) {
          setResultats([]);
          return;
        }
        const lu = (await reponse.json()) as { personnages: ResultatRecherche[] };
        if (monTour !== tour.current) return;
        setResultats(lu.personnages);
        setSurvole(-1);
      } catch {
        if (monTour === tour.current) setResultats([]);
      } finally {
        if (monTour === tour.current) setCherche(false);
      }
    }, 250);

    return () => clearTimeout(attente);
  }, [requete, choisi]);

  function retenir(personnage: ResultatRecherche) {
    // Un fil existe déjà : on n'en ouvre pas un second, on rejoint celui-là.
    if (personnage.conversationId) {
      router.push(`${ROUTES.corbeaux}/${personnage.conversationId}`);
      return;
    }
    setChoisi(personnage);
    setResultats([]);
  }

  async function envoyer(corps: string): Promise<{ ok: boolean; message?: string }> {
    if (!choisi) return { ok: false, message: t.erreurs.destinataireInconnu };

    const reponse = await fetch("/api/corbeaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinataireId: choisi.id, corps }),
    });

    if (!reponse.ok) {
      const lu = (await reponse.json().catch(() => null)) as { erreur?: string } | null;
      return { ok: false, message: lu?.erreur ?? t.erreurs.envoiEchoue };
    }

    const { conversationId } = (await reponse.json()) as { conversationId: string };
    router.push(`${ROUTES.corbeaux}/${conversationId}`);
    return { ok: true };
  }

  // ── Le destinataire est choisi : place au corbeau ──
  if (choisi) {
    return (
      <div>
        <div className="flex items-center gap-4 rounded-sm border border-silver/15 bg-mist/40 px-4 py-3">
          <BlasonCorrespondant correspondant={choisi} />
          <p className="font-display text-[0.82rem] uppercase tracking-[0.1em] text-parchment">
            {choisi.prenomNom}
          </p>
          <button
            type="button"
            onClick={() => {
              setChoisi(null);
              setSaisie("");
            }}
            className="ml-auto font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-aurora-teal"
          >
            {t.nouveau.changer}
          </button>
        </div>

        <div className="mt-5">
          <ChampCorbeau onEnvoyer={envoyer} />
        </div>
      </div>
    );
  }

  // ── La recherche ──
  return (
    <div>
      <label
        htmlFor={champId}
        className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
      >
        {t.nouveau.champ}
      </label>

      <input
        id={champId}
        type="text"
        role="combobox"
        aria-expanded={resultats.length > 0}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={
          survole >= 0 ? `${listeId}-${survole}` : undefined
        }
        aria-describedby={aideId}
        autoComplete="off"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        onKeyDown={(e) => {
          if (resultats.length === 0) return;
          // Les flèches parcourent — elles ne choisissent pas.
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSurvole((i) => (i + 1) % resultats.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSurvole((i) => (i <= 0 ? resultats.length - 1 : i - 1));
          } else if (e.key === "Enter" && survole >= 0) {
            e.preventDefault();
            retenir(resultats[survole]);
          }
        }}
        placeholder={t.nouveau.invite}
        className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/50 px-4 py-3 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
      />

      {/* Annoncé sans voler le focus : on tape, on entend « 3 personnages
          trouvés », on continue. */}
      <p id={aideId} aria-live="polite" className="mt-2 min-h-[1.25rem] font-body text-sm italic text-silver">
        {!requete
          ? saisie.length > 0
            ? t.nouveau.tropCourt
            : t.nouveau.aide
          : cherche
            ? ""
            : resultats.length === 0
              ? t.nouveau.aucun
              : resultats.length === 1
                ? t.nouveau.unResultatAria
                : t.nouveau.resultatsAria.replace("{n}", String(resultats.length))}
      </p>

      {/* Même précaution que dans la liste des conversations : une colonne de
          grille vaut `auto` et un élément de liste `min-width: auto`, si bien
          qu'un nom long élargissait la liste au-delà de l'écran. */}
      {resultats.length > 0 ? (
        <ul id={listeId} role="listbox" className="mt-2 grid grid-cols-1 gap-2">
          {resultats.map((personnage, i) => (
            <li
              key={personnage.id}
              id={`${listeId}-${i}`}
              role="option"
              aria-selected={i === survole}
              className="min-w-0"
            >
              <button
                type="button"
                onClick={() => retenir(personnage)}
                onMouseEnter={() => setSurvole(i)}
                className={`flex w-full items-center gap-4 rounded-sm border px-4 py-3 text-left transition-colors duration-300 ${
                  i === survole
                    ? "border-aurora-teal/50 bg-mist/70"
                    : "border-silver/12 bg-mist/40 hover:border-silver/30"
                }`}
              >
                <BlasonCorrespondant correspondant={personnage} taille="petit" />
                <span className="truncate font-display text-[0.8rem] uppercase tracking-[0.1em] text-parchment">
                  {personnage.prenomNom}
                </span>
                {personnage.conversationId ? (
                  <span className="ml-auto font-body text-xs italic text-silver">
                    {t.nouveau.dejaOuverte}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : requete && !cherche ? (
        <p className="mt-2 font-body text-sm leading-relaxed text-parchment-dim">
          {t.nouveau.aucunAide}
        </p>
      ) : null}
    </div>
  );
}
