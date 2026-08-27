"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { mieuxVautClore, peutRetirerLaScene } from "@/lib/forum/suppression";

/**
 * **Retirer une scène du forum.**
 *
 * L'écran pose la même question que la route — `peutRetirerLaScene`, le même
 * fichier — plutôt que de deviner : un bouton offert que le serveur refuserait
 * serait pire qu'un bouton absent.
 *
 * ── Ce que la boîte propose, et dans quel ordre ──
 *
 * Dès qu'un autre a écrit, **la clôture passe devant** : elle ferme la scène
 * sans rien retirer à personne, et c'est presque toujours le bon geste. Pour
 * l'auteur, c'est même le seul qui lui reste — le retrait lui est refusé, et
 * le bouton n'apparaît pas.
 *
 * Le motif n'est réclamé qu'au staff. Un auteur qui retire sa propre scène,
 * seul à y avoir écrit, n'a personne à qui se justifier.
 *
 * Un `<dialog>` natif : focus piégé, sortie par Échap, focus sur **Annuler**
 * à l'ouverture — jamais sur le bouton qui agit.
 */
export default function BoutonRetirerScene({
  sujetId,
  estStaff,
  estLAuteur,
  auteursAutres,
}: {
  sujetId: string;
  estStaff: boolean;
  estLAuteur: boolean;
  /** Combien d'AUTRES membres ont écrit dans la scène. */
  auteursAutres: number;
}) {
  const routeur = useRouter();
  const titreId = useId();
  const idMotif = useId();

  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);

  const t = TEXTES_FORUM.suppression.scene;
  const etat = { estStaff, estLAuteur, auteursAutres };
  const verdict = peutRetirerLaScene(etat);
  const clorePlutot = mieuxVautClore(etat);

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

  if (!verdict.peut) return null;

  async function appeler(charge: Record<string, unknown>) {
    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch(`/api/forum/sujets/${sujetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(charge),
    }).catch(() => null);

    setEnvoi(false);

    if (!reponse || !reponse.ok) {
      const lu = (await reponse?.json().catch(() => ({}))) as {
        erreur?: string;
      };
      setErreur(lu?.erreur ?? TEXTES_FORUM.erreurs.refuse);
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
        className="rounded-sm border border-ember/30 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-ember/60 hover:text-parchment"
      >
        {t.action}
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={titreId}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-sm border border-silver/30 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <h2
            id={titreId}
            className="font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre}
          </h2>

          <p className="mt-4 font-body leading-[1.7] text-parchment-dim">
            {estStaff ? t.avertissementStaff : t.avertissementSeul}
          </p>

          {/* La clôture, proposée d'abord — et présentée comme ce qu'elle est :
              ce qui ferme sans rien retirer à personne. */}
          {clorePlutot ? (
            <p className="mt-4 rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm leading-relaxed text-silver">
              {t.plutotClore}
            </p>
          ) : null}

          {estStaff ? (
            <div className="mt-5">
              <label
                htmlFor={idMotif}
                className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
              >
                {t.motif}
              </label>
              <textarea
                id={idMotif}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                aria-describedby={`${idMotif}-aide`}
                className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-4 py-2 font-body text-base text-parchment focus:border-aurora-teal/70"
              />
              <p
                id={`${idMotif}-aide`}
                className="mt-1 font-body text-xs italic text-silver"
              >
                {t.motifAide}
              </p>
            </div>
          ) : null}

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

            {clorePlutot ? (
              <button
                type="button"
                disabled={envoi}
                onClick={() => appeler({ clos: true })}
                className="btn btn-solid px-5 tracking-[0.12em] disabled:opacity-50"
              >
                {t.clore}
              </button>
            ) : null}

            <button
              type="button"
              disabled={envoi}
              onClick={() => appeler({ supprime: true, motif })}
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
