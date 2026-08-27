"use client";

import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { donnerAction, type EtatDon } from "@/app/admin/points/actions";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import type { Maison } from "@/lib/dossier/etats";

/**
 * **Donner des points à un joueur.**
 *
 * Jumeau de `FormulaireAjustement`, et volontairement distinct de lui : les
 * deux gestes se ressemblent et ne font pas la même chose. Celui-ci vise un
 * élève et alimente **les deux compteurs** (art. 18.2) ; l’autre vise une
 * maison et n’alimente que le sien.
 *
 * Un seul formulaire avec un interrupteur « maison / joueur » aurait été plus
 * compact et plus dangereux : on se trompe d’interrupteur sans s’en
 * apercevoir, et un point personnel accordé par erreur fait passer une année.
 *
 * Composant client pour deux raisons : dire pourquoi ça n’a pas marché plutôt
 * que de laisser le bouton muet, et vider le formulaire quand ça a marché —
 * sans quoi on donne deux fois les mêmes points sans le voir.
 */

export type EleveAChoisir = {
  eleveId: string;
  prenomNom: string;
  /** Celle qui compte, jamais la colonne. Nulle = ne marque pour personne. */
  maison: Maison | null;
  points: number;
};

const DEPART: EtatDon = { erreur: null, fait: false };

export default function FormulaireDon({ eleves }: { eleves: EleveAChoisir[] }) {
  const [etat, envoyer] = useFormState(donnerAction, DEPART);
  const formulaire = useRef<HTMLFormElement>(null);
  const t = TEXTES_POINTS.admin.don;
  const listeId = useId();
  const erreurId = useId();

  // Vidé seulement quand le don est passé : un refus doit laisser le motif en
  // place, sinon on le retape en entier pour une virgule.
  useEffect(() => {
    if (etat.fait) formulaire.current?.reset();
  }, [etat.fait]);

  if (eleves.length === 0) {
    return (
      <p className="mt-3 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
        {t.aucunEleve}
      </p>
    );
  }

  return (
    <form
      ref={formulaire}
      action={envoyer}
      className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Champ libelle={t.joueur} pour="don-eleve">
          <select
            id="don-eleve"
            name="eleveId"
            defaultValue={eleves[0]!.eleveId}
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          >
            {eleves.map((eleve) => (
              <option key={eleve.eleveId} value={eleve.eleveId}>
                {t.option
                  .replace("{nom}", eleve.prenomNom)
                  .replace(
                    "{maison}",
                    eleve.maison
                      ? (NOMS_MAISON[eleve.maison] ?? eleve.maison)
                      : t.sansMaison,
                  )
                  .replace("{points}", String(eleve.points))}
              </option>
            ))}
          </select>
        </Champ>

        <Champ libelle={t.points} pour="don-points" aide={t.pointsAide}>
          <input
            id="don-points"
            name="points"
            type="number"
            step={1}
            required
            placeholder="5"
            className="w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          />
        </Champ>
      </div>

      <div className="mt-4">
        <Champ libelle={t.motif} pour="don-motif">
          <input
            id="don-motif"
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
 * cela, un second clic donnerait deux fois les mêmes points, et le joueur en
 * recevrait le double sans que personne l’ait voulu.
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
