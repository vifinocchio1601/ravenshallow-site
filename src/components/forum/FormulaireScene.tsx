"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import ChampPost from "@/components/forum/ChampPost";
import { TEXTES_FORUM, type MotsDuLieu } from "@/lib/forum/constantes";
import { respecteLeMinimum } from "@/lib/forum/longueur";
import { TITRE_MAX } from "@/lib/forum/limites";

/**
 * Ouvrir une scène, ou répondre dans celle-ci — le même formulaire.
 *
 * Il ne décide de rien : il grise un bouton pour éviter un aller-retour
 * inutile, et **c’est la route qui a le dernier mot**. Le champ se contourne
 * en fermant JavaScript ; la route, non.
 *
 * L’erreur rendue par le serveur s’affiche telle quelle, dans une région
 * `role="alert"` : c’est elle qui dit combien de lignes il manque, et elle est
 * plus juste que tout ce qu’on pourrait deviner ici.
 */
export default function FormulaireScene({
  espace,
  lieu,
  sujetId,
  lignesMinimum,
  mots,
  racine,
}: {
  /** Pour ouvrir une scène : la clé de l’espace et l’adresse du lieu. */
  espace?: string;
  lieu?: string;
  /** Pour répondre : l’identifiant du sujet. Exclusif du couple ci-dessus. */
  sujetId?: string;
  lignesMinimum: number | null;
  /**
   * Le vocabulaire de l’espace. « Titre de la scène » n’a pas de sens dans
   * « Présentations », et l’aide du mode de participation — (LIBRE),
   * (RÉSERVÉ) — ne parle que du jeu de rôle : elle disparaît hors RP.
   */
  mots: MotsDuLieu;
  /**
   * L'adresse de l'espace — « /ecole », « /non-mages ». Nulle en réponse : on
   * y est déjà, et rien ne redirige.
   */
  racine?: string;
}) {
  const router = useRouter();
  const t = TEXTES_FORUM.ecrire;
  const idTitre = useId();
  const idAideTitre = useId();

  const [titre, setTitre] = useState("");
  const [corps, setCorps] = useState("");
  const [avertissement, setAvertissement] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const estUneReponse = sujetId !== undefined;
  const pret =
    respecteLeMinimum(corps, lignesMinimum) &&
    (estUneReponse || titre.trim().length > 0);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    setErreur(null);

    const adresse = estUneReponse
      ? `/api/forum/sujets/${sujetId}/posts`
      : "/api/forum/sujets";
    const charge = estUneReponse
      ? { corps, avertissement }
      : { espace, lieu, titre, corps, avertissement };

    try {
      const reponse = await fetch(adresse, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(charge),
      });
      const lu = (await reponse.json().catch(() => ({}))) as {
        erreur?: string;
        sujetId?: string;
      };

      if (!reponse.ok) {
        setErreur(lu.erreur ?? TEXTES_FORUM.erreurs.refuse);
        setEnvoi(false);
        return;
      }

      setTitre("");
      setCorps("");
      setAvertissement("");
      setEnvoi(false);
      // ⚠️ **La racine vient de l'espace, jamais écrite en dur.** Elle valait
      // « /ecole » jusqu'au 28 août 2026 : un sujet ouvert dans « Présentations »
      // atterrissait donc au château, sous le vocabulaire du jeu de rôle. Le
      // sujet était bien créé au bon endroit — c'était l'adresse d'arrivée qui
      // mentait.
      if (lu.sujetId) router.push(`${racine}/${lieu}/${lu.sujetId}`);
      else router.refresh();
    } catch {
      setErreur(TEXTES_FORUM.erreurs.refuse);
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-6 grid gap-5">
      {estUneReponse ? null : (
        <div>
          <label
            htmlFor={idTitre}
            className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
          >
            {mots.titreLibelle}
          </label>
          <input
            id={idTitre}
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            maxLength={TITRE_MAX}
            disabled={envoi}
            placeholder={mots.titreExemple}
            aria-describedby={idAideTitre}
            className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-4 py-2 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70 disabled:opacity-60"
          />
          {/* Le mode est une convention entre joueurs, et l'aide le dit sans
              l'imposer : un titre sans mention passe. */}
          {/* ⚠️ **L'aide du mode de participation ne s'affiche qu'en RP.**
              « (LIBRE), (SUR INVITATION), (RÉSERVÉ) » est une convention entre
              joueurs pour les scènes ; dans « Présentations », elle donnerait
              une consigne qui ne s'applique à rien. Le hors RP se reconnaît à
              son absence de minimum de lignes — c'est l'espace qui le dit,
              jamais le nom du lieu. */}
          {lignesMinimum !== null ? (
            <p
              id={idAideTitre}
              className="mt-1 max-w-[62ch] font-body text-xs italic leading-relaxed text-silver"
            >
              {t.titre.aide}
            </p>
          ) : null}
        </div>
      )}

      <ChampPost
        valeur={corps}
        onChange={setCorps}
        lignesMinimum={lignesMinimum}
        libelleCorps={mots.corpsLibelle}
        estDuJeuDeRole={mots.estDuJeuDeRole}
        avertissement={avertissement}
        onAvertissement={setAvertissement}
        reponse={estUneReponse}
        desactive={envoi}
      />

      {/* Hauteur non réservée à dessein : le message pousse le bouton vers le
          bas, ce qui le fait remarquer. Il est annoncé par `role="alert"`. */}
      {erreur ? (
        <p
          role="alert"
          className="rounded-sm border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm leading-relaxed text-parchment"
        >
          {erreur}
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={!pret || envoi} className="btn btn-ghost">
          {envoi ? t.envoi : estUneReponse ? t.repondre : mots.ouvrir}
        </button>
      </div>
    </form>
  );
}
