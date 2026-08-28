"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  avecLeMot,
  TEXTES_FORUM,
  type MotsDuLieu,
} from "@/lib/forum/constantes";

/**
 * Ce que le staff peut faire sur une scène et sur un post.
 *
 * **Rien ici ne décide** : chaque bouton appelle une route, et c’est le dépôt
 * qui vérifie le droit. Un composant caché à l’écran n’a jamais protégé une
 * route — et celle-ci est publique.
 *
 * Les boutons disent **ce qu’ils feront**, jamais un état par la seule
 * couleur : « Clore la scène » ou « Rouvrir la scène », pas une icône.
 */

function useAction() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const appeler = async (adresse: string, charge: Record<string, unknown>) => {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(adresse, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(charge),
      });
      if (!reponse.ok) {
        const lu = (await reponse.json().catch(() => ({}))) as {
          erreur?: string;
        };
        setErreur(lu.erreur ?? TEXTES_FORUM.erreurs.refuse);
      } else {
        router.refresh();
      }
    } catch {
      setErreur(TEXTES_FORUM.erreurs.refuse);
    }
    setEnCours(false);
  };

  return { appeler, enCours, erreur };
}

const BOUTON =
  "rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment disabled:opacity-50";

/** Clore ou rouvrir une scène, l’épingler ou la décrocher. */
export function ActionsSujet({
  sujetId,
  clos,
  epingle,
  peutClore,
  peutEpingler,
  mots,
}: {
  sujetId: string;
  clos: boolean;
  epingle: boolean;
  peutClore: boolean;
  peutEpingler: boolean;
  /** Le vocabulaire de l'espace : « Clore la scène » ou « Clore le sujet ». */
  mots: MotsDuLieu;
}) {
  const { appeler, enCours, erreur } = useAction();
  const t = TEXTES_FORUM.moderation;
  if (!peutClore && !peutEpingler) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {peutClore ? (
        <button
          type="button"
          disabled={enCours}
          onClick={() => appeler(`/api/forum/sujets/${sujetId}`, { clos: !clos })}
          className={BOUTON}
        >
          {avecLeMot(clos ? t.rouvrir : t.clore, mots)}
        </button>
      ) : null}

      {peutEpingler ? (
        <button
          type="button"
          disabled={enCours}
          onClick={() =>
            appeler(`/api/forum/sujets/${sujetId}`, { epingle: !epingle })
          }
          className={BOUTON}
        >
          {epingle ? t.desepingler : t.epingler}
        </button>
      ) : null}

      {erreur ? (
        <p role="alert" className="font-body text-xs text-ember">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Masquer un post le temps d’une correction — art. 19.3.
 *
 * Le motif est **obligatoire** : le joueur ne verra que ça pour savoir quoi
 * reprendre. C’est l’inverse du signalement, où le motif est facultatif parce
 * que c’est celui qui subit qui écrit.
 */
export function ActionsPost({
  postId,
  masque,
}: {
  postId: string;
  masque: boolean;
}) {
  const { appeler, enCours, erreur } = useAction();
  const [motif, setMotif] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const t = TEXTES_FORUM.masquage;

  if (masque) {
    return (
      <div className="border-t border-silver/10 px-5 py-3">
        <button
          type="button"
          disabled={enCours}
          onClick={() => appeler(`/api/forum/posts/${postId}`, { masque: false })}
          className={BOUTON}
        >
          {t.demasquer}
        </button>
        {erreur ? (
          <p role="alert" className="mt-2 font-body text-xs text-ember">
            {erreur}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-silver/10 px-5 py-3">
      {ouvert ? (
        <div className="grid gap-2">
          <label
            htmlFor={`motif-${postId}`}
            className="font-display text-[0.6rem] uppercase tracking-[0.12em] text-parchment-dim"
          >
            {t.motif}
          </label>
          <input
            id={`motif-${postId}`}
            type="text"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={t.motifRequis}
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-sm text-parchment placeholder:italic placeholder:text-silver/50 focus:border-aurora-teal/70"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={enCours || motif.trim().length === 0}
              onClick={() =>
                appeler(`/api/forum/posts/${postId}`, { masque: true, motif })
              }
              className={BOUTON}
            >
              {t.masquer}
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className={BOUTON}
            >
              {TEXTES_FORUM.ecrire.annuler}
            </button>
          </div>
          {erreur ? (
            <p role="alert" className="font-body text-xs text-ember">
              {erreur}
            </p>
          ) : null}
        </div>
      ) : (
        <button type="button" onClick={() => setOuvert(true)} className={BOUTON}>
          {t.masquer}
        </button>
      )}
    </div>
  );
}
