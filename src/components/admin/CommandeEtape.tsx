"use client";

import { useEffect, useRef, useState } from "react";
import { modifierEtatEtapeAction } from "@/app/admin/actions";
import {
  LIBELLES_ETAT_ETAPE,
  TEXTES_ETATS,
  type Etape,
  type EtatEtape,
} from "@/lib/dossier/etats";

/**
 * Retirer une étape à un compte, ou la lui rendre.
 *
 * Un seul bouton par étape, dont le sens suit l’état : un compte sans objet
 * se rétablit, tout autre se retire. Les deux commandes — maison et baguette
 * — sont indépendantes, et ne touchent jamais au rôle affiché.
 *
 * La confirmation reprend le `<dialog>` natif de la corbeille : focus piégé,
 * fermeture à Échap, retour au bouton d’origine, sans code. Elle dit ce qui
 * disparaît **et ce qui est conservé** — un administrateur doit savoir avant
 * de cliquer qu’il n’efface rien.
 */
export default function CommandeEtape({
  id,
  nom,
  etape,
  etat,
  valeur,
}: {
  id: string;
  nom: string;
  etape: Etape;
  etat: EtatEtape;
  /** « Tideål », « If, cœur de cristal de glace », ou `null`. */
  valeur: string | null;
}) {
  const [ouvert, setOuvert] = useState(false);
  const dialogueRef = useRef<HTMLDialogElement | null>(null);
  const annulerRef = useRef<HTMLButtonElement | null>(null);

  const t = TEXTES_ETATS.admin.etapes;
  const te = t[etape];

  const action = etat === "SANS_OBJET" ? "RETABLIR" : "RETIRER";
  const mots = action === "RETIRER" ? te.retrait : te.retablissement;

  // Le corps de la confirmation dépend de ce qu’il y a à conserver — ou à
  // retrouver. Sans valeur, promettre « elle sera rétablie » serait faux.
  const corps =
    action === "RETIRER"
      ? [mots.corps, valeur ? te.retrait.conserve.replace("{valeur}", valeur) : null]
      : [
          valeur
            ? te.retablissement.corps.replace("{valeur}", valeur)
            : te.retablissement.sansValeur,
        ];

  useEffect(() => {
    const dialogue = dialogueRef.current;
    if (!dialogue) return;
    if (ouvert && !dialogue.open) {
      dialogue.showModal();
      annulerRef.current?.focus();
    } else if (!ouvert && dialogue.open) {
      dialogue.close();
    }
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="btn btn-ghost shrink-0 px-4 text-[0.66rem] tracking-[0.12em]"
      >
        {action === "RETIRER" ? t.retirer : t.retablir}
        <span className="sr-only"> — {te.terme} de {nom}</span>
      </button>

      <dialog
        ref={dialogueRef}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={`etape-${etape}-${id}-titre`}
        className="w-[min(33rem,calc(100vw-2rem))] rounded-sm border border-silver/30 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <p className="eyebrow flex items-center gap-3 text-aurora-teal">
            <span aria-hidden="true" className="rune">
              ᛗ
            </span>
            <span>{te.eyebrow}</span>
          </p>

          <h2
            id={`etape-${etape}-${id}-titre`}
            className="mt-4 font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {mots.titre.replace("{nom}", nom)}
          </h2>

          {corps.filter(Boolean).map((phrase) => (
            <p key={phrase} className="mt-4 leading-[1.7] text-parchment-dim">
              {phrase}
            </p>
          ))}

          {/* L’état courant, écrit noir sur blanc : la confirmation ne doit
              pas obliger à se souvenir de ce qu’on vient de lire à l’écran. */}
          <p className="mt-5 font-body text-sm italic text-silver">
            {te.terme} — {LIBELLES_ETAT_ETAPE[etat].toLowerCase()}
            {valeur ? ` : ${valeur}` : ""}
          </p>

          <form
            action={modifierEtatEtapeAction}
            className="mt-8 flex flex-wrap items-center justify-end gap-3"
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="etape" value={etape} />
            <input type="hidden" name="action" value={action} />

            {/* « Annuler » d’abord, et c’est lui qui reçoit le focus. */}
            <button
              type="button"
              ref={annulerRef}
              onClick={() => setOuvert(false)}
              className="btn btn-ghost px-5 tracking-[0.12em]"
            >
              {t.annuler}
            </button>

            <button
              type="submit"
              className="btn border border-aurora-teal bg-aurora-teal px-5 tracking-[0.12em] text-void transition-colors duration-300 hover:bg-[#7fd8cf]"
            >
              {mots.confirmer}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
