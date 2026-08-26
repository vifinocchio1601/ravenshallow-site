"use client";

import { useId, useRef, useState } from "react";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { CORBEAU_MAX, validerCorbeau } from "@/lib/corbeaux/schema";

/**
 * Le champ d’écriture.
 *
 * Il valide **avec le même fichier que la route** — `lib/corbeaux/schema.ts`.
 * Aucune règle n’est réécrite ici : celle du serveur reste la seule qui
 * protège, ce champ ne fait que l’annoncer plus tôt. Il se contourne en
 * fermant JavaScript ; la route, non.
 *
 * Deux gestes, séparés :
 *   Entrée        — va à la ligne. Un corbeau se rédige, il n’est pas un chat.
 *   Ctrl/⌘+Entrée — envoie, pour qui préfère le clavier.
 *
 * Le bouton reste **toujours atteignable au clavier** et ne dépend d’aucun
 * survol : c’est un `<button>` dans le flux, pas une icône qui apparaît au
 * passage de la souris.
 */
export default function ChampCorbeau({
  onEnvoyer,
}: {
  onEnvoyer: (corps: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const champId = useId();
  const aideId = `${champId}-aide`;
  const erreurId = `${champId}-erreur`;

  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLTextAreaElement>(null);

  const t = TEXTES_CORBEAUX;
  const lu = validerCorbeau(texte);
  const restants = CORBEAU_MAX - texte.length;
  // Le compteur ne s’affiche qu’en approchant : un compteur permanent donne à
  // une conversation ordinaire des airs d’examen.
  const compteurVisible = restants <= 400;

  async function envoyer() {
    if (!lu.ok || envoi) return;

    setEnvoi(true);
    setErreur(null);
    const resultat = await onEnvoyer(lu.corps);
    setEnvoi(false);

    if (!resultat.ok) {
      // Le texte reste dans le champ : rien n’est plus décourageant que de
      // voir disparaître ce qu’on vient d’écrire.
      setErreur(resultat.message ?? t.erreurs.envoiEchoue);
      champ.current?.focus();
      return;
    }

    setTexte("");
    champ.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void envoyer();
      }}
    >
      <label htmlFor={champId} className="sr-only">
        {t.ecrire.libelle}
      </label>

      <textarea
        id={champId}
        ref={champ}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void envoyer();
          }
        }}
        rows={3}
        maxLength={CORBEAU_MAX}
        placeholder={t.ecrire.invite}
        aria-describedby={erreur ? `${aideId} ${erreurId}` : aideId}
        aria-invalid={erreur ? true : undefined}
        className="w-full resize-y rounded-sm border border-silver/25 bg-mist/50 px-4 py-3 font-body text-base leading-[1.7] text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
      />

      {/* Hauteur réservée : le message d’erreur ne fait pas sauter le bouton
          en apparaissant. Même principe que `dossier/Champ.tsx`. */}
      <p id={erreurId} role="alert" className="min-h-[1.25rem] font-body text-sm text-ember">
        {erreur ?? ""}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={aideId} className="font-body text-xs italic text-silver">
          {t.ecrire.horsJeu}
          {compteurVisible ? (
            <span className={restants < 0 ? "text-ember" : undefined}>
              {" · "}
              {t.ecrire.restants.replace("{n}", String(restants))}
            </span>
          ) : null}
        </p>

        <button
          type="submit"
          disabled={!lu.ok || envoi}
          className="btn btn-ghost disabled:opacity-40"
        >
          {envoi ? t.ecrire.envoiEnCours : t.ecrire.envoyer}
        </button>
      </div>
    </form>
  );
}
