"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supprimerMembreAction } from "@/app/admin/actions";
import { TEXTES_ETATS } from "@/lib/dossier/etats";

/**
 * Corbeille d’un membre, avec confirmation.
 *
 * La confirmation passe par un `<dialog>` natif : il piège le focus, se ferme
 * à Échap et rend la main au bouton d’origine — tout cela sans code. Le
 * bouton de confirmation est le second du dialogue, jamais celui qui reçoit
 * le focus à l’ouverture.
 */
export default function BoutonSupprimerMembre({
  id,
  nom,
}: {
  id: string;
  nom: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const dialogueRef = useRef<HTMLDialogElement | null>(null);
  const annulerRef = useRef<HTMLButtonElement | null>(null);
  const t = TEXTES_ETATS.admin.suppression;

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
        aria-label={`${t.bouton} — ${nom}`}
        title={t.bouton}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-transparent text-ember/70 transition-[color,border-color,background-color] duration-300 hover:border-ember/40 hover:bg-ember/[0.08] hover:text-ember"
      >
        <Trash2 aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />
      </button>

      <dialog
        ref={dialogueRef}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={`suppression-${id}-titre`}
        className="w-[min(31rem,calc(100vw-2rem))] rounded-sm border border-ember/35 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <p className="eyebrow flex items-center gap-3 text-ember">
            <span aria-hidden="true" className="rune">
              ᚦ
            </span>
            <span>Suppression</span>
          </p>

          <h2
            id={`suppression-${id}-titre`}
            className="mt-4 font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre.replace("{nom}", nom)}
          </h2>

          <p className="mt-4 leading-[1.7] text-parchment-dim">{t.corps}</p>

          {/* Les deux boutons dans le même formulaire : côte à côte, et
              « Annuler » reste le premier atteint au clavier. */}
          <form
            action={supprimerMembreAction}
            className="mt-8 flex flex-wrap items-center justify-end gap-3"
          >
            <input type="hidden" name="id" value={id} />

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
              className="btn border border-ember bg-ember px-5 tracking-[0.12em] text-void transition-colors duration-300 hover:bg-[#d98d4f]"
            >
              {t.confirmer}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
