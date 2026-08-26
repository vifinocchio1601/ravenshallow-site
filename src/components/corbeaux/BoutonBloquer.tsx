"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";

/**
 * Bloquer quelqu’un, depuis la conversation.
 *
 * La confirmation passe par un `<dialog>` natif, comme celle de la
 * suppression d’un membre : il piège le focus, se ferme à Échap et rend la
 * main au bouton d’origine, sans une ligne de code pour cela. « Annuler »
 * reçoit le focus à l’ouverture — jamais le geste irréversible.
 *
 * **Le dialogue dit ce que le blocage fait ET ce qu’il ne fait pas**, en cinq
 * lignes, dont celle-ci : la personne n’en sera pas informée. Ce n’est pas un
 * détail d’implémentation qu’on tairait — c’est la mesure elle-même, et
 * quelqu’un qui croirait avoir « prévenu » l’autre se comporterait autrement.
 *
 * Il rappelle aussi que **signaler est un geste séparé** : bloquer ne prévient
 * personne, et un membre qui subit des messages problématiques doit savoir
 * qu’il lui reste quelque chose à faire.
 */
export default function BoutonBloquer({
  membreId,
  nom,
  onBloque,
}: {
  membreId: string;
  nom: string;
  /** Prévient le fil, qui se referme sans attendre un rechargement. */
  onBloque: () => void;
}) {
  const titreId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);
  const t = TEXTES_CORBEAUX.bloquer;

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

    const reponse = await fetch("/api/corbeaux/blocages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membreId, action: "BLOQUER" }),
    });

    setEnvoi(false);

    if (!reponse.ok) {
      const lu = (await reponse.json().catch(() => null)) as {
        erreur?: string;
      } | null;
      setErreur(lu?.erreur ?? TEXTES_CORBEAUX.erreurs.blocageImpossible);
      return;
    }

    setOuvert(false);
    onBloque();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={t.actionAria.replace("{nom}", nom)}
        className="shrink-0 font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-ember"
      >
        {t.action}
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={titreId}
        className="w-[min(33rem,calc(100vw-2rem))] rounded-sm border border-ember/35 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <h2
            id={titreId}
            className="font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre.replace("{nom}", nom)}
          </h2>

          {/* Une liste, et non un paragraphe : chaque conséquence se lit
              séparément, et celle qui compte le plus — « elle n’en sera pas
              informée » — ne se noie pas au milieu d’une phrase. */}
          <ul className="mt-5 space-y-2">
            {t.consequences.map((ligne: string) => (
              <li
                key={ligne}
                className="flex gap-3 font-body leading-[1.7] text-parchment-dim"
              >
                <span aria-hidden="true" className="mt-[0.4em] text-[0.5rem] text-silver">
                  ◆
                </span>
                <span>{ligne}</span>
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-silver/15 pt-4 font-body text-sm italic leading-relaxed text-silver">
            {t.etSignaler}
          </p>

          {/* Hauteur réservée : le message ne fait pas sauter les boutons. */}
          <p role="alert" className="mt-2 min-h-[1.25rem] font-body text-sm text-ember">
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
              className="btn border border-ember bg-ember px-5 tracking-[0.12em] text-void transition-colors duration-300 hover:bg-[#d98d4f] disabled:opacity-50"
            >
              {t.confirmer}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
