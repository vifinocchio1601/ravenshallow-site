"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_FORUM } from "@/lib/forum/constantes";

/**
 * **Retirer son propre post.**
 *
 * Ce qu'un joueur a écrit est à lui (art. 6.4) : le retrait ne lui est jamais
 * refusé. Ce qui change, c'est ce qu'il en reste — et la confirmation le dit
 * **avant** le geste, parce que les deux issues ne se valent pas :
 *
 *   - il fermait la scène → il s'en va sans laisser de vide ;
 *   - on a répondu après → sa place reste, avec la mention qu'un post a été
 *     retiré. Sans elle, la suite de la scène ne se comprendrait plus.
 *
 * `aDesPostsApres` est calculé par la page, qui a la liste sous les yeux. Le
 * serveur le recalcule de toute façon : celui-ci n'est qu'un affichage.
 */
export default function BoutonRetirerPost({
  postId,
  aDesPostsApres,
}: {
  postId: string;
  aDesPostsApres: boolean;
}) {
  const routeur = useRouter();
  const titreId = useId();

  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);

  const t = TEXTES_FORUM.suppression.post;

  useEffect(() => {
    const el = dialogue.current;
    if (!el) return;
    if (ouvert && !el.open) {
      el.showModal();
      annuler.current?.focus();
    } else if (!ouvert && el.open) {
      el.close();
    }
  }, [ouvert]);

  async function confirmer() {
    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch(`/api/forum/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retire: true }),
    }).catch(() => null);

    setEnvoi(false);

    if (!reponse || !reponse.ok) {
      setErreur(TEXTES_FORUM.erreurs.refuse);
      return;
    }

    setOuvert(false);
    routeur.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErreur(null);
          setOuvert(true);
        }}
        className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
      >
        {t.action}
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={titreId}
        className="w-[min(32rem,calc(100vw-2rem))] rounded-sm border border-silver/30 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <h2
            id={titreId}
            className="font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre}
          </h2>

          <p className="mt-4 font-body leading-[1.7] text-parchment-dim">
            {aDesPostsApres ? t.avertissementSuivi : t.avertissementSeul}
          </p>

          <p
            role="alert"
            className="mt-2 min-h-[1.25rem] font-body text-sm text-ember"
          >
            {erreur ?? ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              ref={annuler}
              onClick={() => setOuvert(false)}
              className="btn btn-ghost px-5 tracking-[0.12em]"
            >
              {t.annuler}
            </button>
            <button
              type="button"
              onClick={confirmer}
              disabled={envoi}
              className="btn btn-ghost px-5 tracking-[0.12em] disabled:opacity-50"
            >
              {t.confirmer}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
