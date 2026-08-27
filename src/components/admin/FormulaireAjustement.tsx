"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ajusterAction, type EtatAjustement } from "@/app/admin/points/actions";
import { MAISONS } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POINTS } from "@/lib/points/constantes";

/**
 * Ajouter ou retirer des points à une maison.
 *
 * Composant client pour deux raisons, et deux seulement : **dire pourquoi ça
 * n’a pas marché** plutôt que de laisser le bouton muet, et vider le
 * formulaire quand ça a marché — sans quoi on renvoie deux fois le même
 * ajustement sans s’en apercevoir.
 *
 * Aucune règle n’est réécrite ici. Le motif obligatoire et la valeur non nulle
 * sont vérifiés par `lib/points/depot.ts`, et par la base au-dessous : ce
 * composant peut être contourné en fermant JavaScript, et rien ne passerait
 * pour autant.
 */

const DEPART: EtatAjustement = { erreur: null, fait: false };

export default function FormulaireAjustement() {
  const [etat, envoyer] = useFormState(ajusterAction, DEPART);
  const formulaire = useRef<HTMLFormElement>(null);
  const t = TEXTES_POINTS.admin.formulaire;
  const listeId = useId();
  const erreurId = useId();

  // Vidé seulement quand l'ajustement est passé : un refus doit laisser le
  // motif en place, sinon on le retape en entier pour une virgule.
  useEffect(() => {
    if (etat.fait) formulaire.current?.reset();
  }, [etat.fait]);

  return (
    <form
      ref={formulaire}
      action={envoyer}
      className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Champ libelle={t.maison} pour="ajustement-maison">
          <select
            id="ajustement-maison"
            name="maison"
            defaultValue={MAISONS[0]}
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          >
            {MAISONS.map((maison) => (
              <option key={maison} value={maison}>
                {NOMS_MAISON[maison] ?? maison}
              </option>
            ))}
          </select>
        </Champ>

        <Champ libelle={t.points} pour="ajustement-points" aide={t.pointsAide}>
          <input
            id="ajustement-points"
            name="points"
            type="number"
            step={1}
            required
            placeholder="−10"
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          />
        </Champ>
      </div>

      <div className="mt-4">
        <Champ libelle={t.motif} pour="ajustement-motif">
          <input
            id="ajustement-motif"
            name="motif"
            type="text"
            required
            list={listeId}
            placeholder={t.motifPlaceholder}
            aria-describedby={etat.erreur ? erreurId : undefined}
            aria-invalid={etat.erreur ? true : undefined}
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          />
          {/* Une aide, jamais une contrainte : toute autre phrase reste
              acceptable, et c'est celle qui décrit vraiment le geste qu'on
              veut lire six mois plus tard. */}
          <datalist id={listeId}>
            {t.suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Champ>
      </div>

      {etat.erreur ? (
        <p
          id={erreurId}
          role="alert"
          className="mt-3 font-body text-sm leading-relaxed text-ember"
        >
          {etat.erreur}
        </p>
      ) : null}

      <Envoyer libelle={t.envoyer} />
    </form>
  );
}

/**
 * Le bouton se ferme pendant l’envoi.
 *
 * Neon peut mettre une seconde ou deux à répondre après une accalmie : sans
 * cela, un second clic poserait un second ajustement, et l’historique en
 * porterait deux là où l’administrateur n’en voulait qu’un.
 */
function Envoyer({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-ghost mt-5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {libelle}
    </button>
  );
}

function Champ({
  libelle,
  pour,
  aide,
  children,
}: {
  libelle: string;
  pour: string;
  aide?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={pour}
        className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
      >
        {libelle}
      </label>
      <div className="mt-2">{children}</div>
      {aide ? (
        <p className="mt-1 font-body text-xs italic leading-relaxed text-silver">
          {aide}
        </p>
      ) : null}
    </div>
  );
}
