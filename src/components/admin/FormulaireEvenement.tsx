"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  corrigerAction,
  poserAction,
  type EtatEvenement,
} from "@/app/admin/calendrier/actions";
import { TEXTES_CALENDRIER } from "@/lib/calendrier/constantes";
import {
  DESCRIPTION_EVENEMENT_MAX,
  TITRE_EVENEMENT_MAX,
} from "@/lib/calendrier/limites";
import { NATURES } from "@/lib/calendrier/natures";
import { enJourSaisissable } from "@/lib/dates";

/**
 * **Poser une date au calendrier**, et corriger celles qui y sont.
 *
 * Un seul formulaire pour les deux gestes, comme pour une annonce : c'est le
 * même geste sur deux objets. Deux champs qui divergeraient accepteraient
 * deux saisies différentes, et le dépôt trancherait trop tard.
 *
 * **Du texte brut, pas d'éditeur** — décision du joueur, 28 août 2026 : un
 * calendrier porte des repères, pas des articles, et une barre de mise en
 * forme inviterait à écrire long. Le détail s'écrit dans une annonce.
 *
 * Composant client pour deux raisons : dire pourquoi un envoi n'est pas
 * passé, et vider le formulaire quand il l'est — sans quoi on pose deux fois
 * la même date sans le voir.
 */
export default function FormulaireEvenement({
  evenement,
}: {
  /** Absent : on pose une date neuve. Présent : on la corrige. */
  evenement?: {
    id: string;
    titre: string;
    description: string;
    nature: string;
    debuteLe: string;
    finitLe: string | null;
  };
}) {
  const enCorrection = evenement !== undefined;
  const [etat, envoyer] = useFormState<EtatEvenement, FormData>(
    enCorrection ? corrigerAction : poserAction,
    { erreur: null, fait: false },
  );

  const t = TEXTES_CALENDRIER.administration.formulaire;
  const formulaire = useRef<HTMLFormElement>(null);
  const idTitre = useId();
  const idDescription = useId();
  const idAideDescription = useId();
  const idNature = useId();
  const idAideNature = useId();
  const idDebut = useId();
  const idFin = useId();
  const idAideFin = useId();

  // Le compteur de signes est le seul état à tenir : il n'existe que pour
  // qu'on ne se fasse pas refuser une description à deux mille signes après
  // l'avoir écrite.
  const [description, setDescription] = useState(evenement?.description ?? "");

  // Vidé seulement quand l'envoi est passé, et jamais en correction : un refus
  // doit laisser la saisie en place, sinon on la retape pour une virgule.
  useEffect(() => {
    if (etat.fait && !enCorrection) {
      formulaire.current?.reset();
      setDescription("");
    }
  }, [etat.fait, enCorrection]);

  return (
    <form
      ref={formulaire}
      action={envoyer}
      className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6"
    >
      {enCorrection ? (
        <input type="hidden" name="id" value={evenement.id} />
      ) : null}

      <div>
        <label htmlFor={idTitre} className={ETIQUETTE}>
          {t.titreChamp}
        </label>
        <input
          id={idTitre}
          name="titre"
          type="text"
          required
          maxLength={TITRE_EVENEMENT_MAX}
          placeholder={t.titrePlaceholder}
          defaultValue={evenement?.titre ?? ""}
          className={CHAMP}
        />
      </div>

      <div className="mt-5">
        <label htmlFor={idDescription} className={ETIQUETTE}>
          {t.descriptionChamp}
        </label>
        <textarea
          id={idDescription}
          name="description"
          required
          rows={3}
          maxLength={DESCRIPTION_EVENEMENT_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-describedby={idAideDescription}
          className={`${CHAMP} resize-y`}
        />
        <p
          id={idAideDescription}
          className="mt-1 font-body text-xs italic leading-relaxed text-silver"
        >
          {t.descriptionAide}
        </p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor={idNature} className={ETIQUETTE}>
            {t.natureChamp}
          </label>
          <select
            id={idNature}
            name="nature"
            required
            defaultValue={evenement?.nature ?? NATURES[0]}
            aria-describedby={idAideNature}
            className={CHAMP}
          >
            {/* L'ordre vient de `NATURES`, la source unique : une liste tenue
                à la main ici finirait par oublier la quatrième. */}
            {NATURES.map((nature) => (
              <option key={nature} value={nature}>
                {TEXTES_CALENDRIER.natures[nature]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={idDebut} className={ETIQUETTE}>
            {t.debutChamp}
          </label>
          <input
            id={idDebut}
            name="debut"
            type="date"
            required
            // ⚠️ **En heure locale, jamais `toISOString`** : une date posée à
            // midi le 4 sortirait « 2026-09-03 » pour qui vit à l'ouest, et le
            // champ afficherait la veille de ce qu'on a saisi.
            defaultValue={enJourSaisissable(evenement?.debuteLe ?? null)}
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor={idFin} className={ETIQUETTE}>
            {t.finChamp}
          </label>
          <input
            id={idFin}
            name="fin"
            type="date"
            defaultValue={enJourSaisissable(evenement?.finitLe ?? null)}
            aria-describedby={idAideFin}
            className={CHAMP}
          />
        </div>
      </div>

      <p
        id={idAideNature}
        className="mt-2 font-body text-xs italic leading-relaxed text-silver"
      >
        {t.natureAide}
      </p>
      <p
        id={idAideFin}
        className="mt-1 font-body text-xs italic leading-relaxed text-silver"
      >
        {t.finAide}
      </p>

      {etat.erreur ? (
        <p role="alert" className="mt-4 font-body text-sm leading-relaxed text-ember">
          {etat.erreur}
        </p>
      ) : null}

      <Envoyer libelle={enCorrection ? t.enregistrer : t.poser} />
    </form>
  );
}

const ETIQUETTE =
  "font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim";

const CHAMP =
  "mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70";

/**
 * Le bouton se ferme pendant l'envoi.
 *
 * Neon peut mettre une seconde ou deux à répondre après une accalmie : sans
 * cela, un second clic poserait deux fois la même date.
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
