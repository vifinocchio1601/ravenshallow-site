"use client";

import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  ajouterAction,
  corrigerAction,
  type EtatPartenaire,
} from "@/app/admin/partenaires/actions";
import { enJourSaisissable } from "@/lib/dates";
import { TEXTES_PARTENARIAT } from "@/lib/partenariat/constantes";
import {
  BANNIERE_URL_MAX,
  DESCRIPTION_PARTENAIRE_MAX,
  NOM_FORUM_MAX,
  URL_MAX,
} from "@/lib/partenariat/limites";

/**
 * **Ajouter un partenaire au bloc**, et corriger ceux qui y sont.
 *
 * Un seul formulaire pour les deux gestes, comme pour une annonce ou une date
 * du calendrier : c'est le même geste sur deux objets. Deux champs qui
 * divergeraient accepteraient deux saisies différentes, et le dépôt
 * trancherait trop tard.
 */
export default function FormulairePartenaire({
  partenaire,
}: {
  /** Absent : on ajoute. Présent : on corrige. */
  partenaire?: {
    id: string;
    nom: string;
    url: string;
    banniereUrl: string | null;
    description: string | null;
    noueLe: string;
  };
}) {
  const enCorrection = partenaire !== undefined;
  const [etat, envoyer] = useFormState<EtatPartenaire, FormData>(
    enCorrection ? corrigerAction : ajouterAction,
    { erreur: null, fait: false },
  );

  const t = TEXTES_PARTENARIAT.administration.formulaire;
  const formulaire = useRef<HTMLFormElement>(null);
  const idNom = useId();
  const idUrl = useId();
  const idBanniere = useId();
  const idAideBanniere = useId();
  const idDescription = useId();
  const idNoue = useId();

  // Vidé seulement quand l'envoi est passé, et jamais en correction : un refus
  // doit laisser la saisie en place, sinon on la retape pour une virgule.
  useEffect(() => {
    if (etat.fait && !enCorrection) formulaire.current?.reset();
  }, [etat.fait, enCorrection]);

  return (
    <form
      ref={formulaire}
      action={envoyer}
      className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6"
    >
      {enCorrection ? (
        <input type="hidden" name="id" value={partenaire.id} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={idNom} className={ETIQUETTE}>
            {t.nom}
          </label>
          <input
            id={idNom}
            name="nom"
            type="text"
            required
            maxLength={NOM_FORUM_MAX}
            defaultValue={partenaire?.nom ?? ""}
            className={CHAMP}
          />
        </div>

        <div>
          <label htmlFor={idUrl} className={ETIQUETTE}>
            {t.url}
          </label>
          <input
            id={idUrl}
            name="url"
            type="url"
            required
            maxLength={URL_MAX}
            placeholder="https://"
            defaultValue={partenaire?.url ?? ""}
            className={CHAMP}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={idBanniere} className={ETIQUETTE}>
          {t.banniere}
        </label>
        <input
          id={idBanniere}
          name="banniere"
          type="url"
          maxLength={BANNIERE_URL_MAX}
          placeholder="https://"
          defaultValue={partenaire?.banniereUrl ?? ""}
          aria-describedby={idAideBanniere}
          className={CHAMP}
        />
        <p id={idAideBanniere} className={AIDE}>
          {t.banniereAide}
        </p>
      </div>

      <div className="mt-5">
        <label htmlFor={idDescription} className={ETIQUETTE}>
          {t.description}
        </label>
        <input
          id={idDescription}
          name="description"
          type="text"
          maxLength={DESCRIPTION_PARTENAIRE_MAX}
          defaultValue={partenaire?.description ?? ""}
          className={CHAMP}
        />
      </div>

      <div className="mt-5 max-w-[16rem]">
        <label htmlFor={idNoue} className={ETIQUETTE}>
          {t.noue}
        </label>
        {/* ⚠️ Le champ `date` se relit en heure LOCALE — `enJourSaisissable`,
            jamais `toISOString` : le formulaire de correction afficherait
            sinon la veille de ce qu'on a saisi. Piège déjà payé sur les
            annonces, tenu depuis à un seul endroit. */}
        <input
          id={idNoue}
          name="noue"
          type="date"
          required
          defaultValue={
            partenaire
              ? enJourSaisissable(new Date(partenaire.noueLe))
              : enJourSaisissable(new Date())
          }
          className={CHAMP}
        />
      </div>

      {etat.erreur ? (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-aurora-violet/30 bg-void/50 px-4 py-3 text-sm leading-relaxed text-parchment"
        >
          {etat.erreur}
        </p>
      ) : null}

      <div className="mt-6">
        <Bouton enCorrection={enCorrection} />
      </div>
    </form>
  );
}

function Bouton({ enCorrection }: { enCorrection: boolean }) {
  const { pending } = useFormStatus();
  const t = TEXTES_PARTENARIAT.administration.formulaire;

  return (
    <button type="submit" disabled={pending} className="btn btn-solid">
      {enCorrection ? t.corriger : t.poser}
    </button>
  );
}

const ETIQUETTE =
  "block font-display text-[0.66rem] uppercase tracking-[0.2em] text-parchment-dim";

const CHAMP =
  "mt-2 w-full rounded-sm border border-silver/15 bg-void/60 px-3 py-2 font-body text-parchment placeholder:text-silver/40 focus:border-aurora-teal/50 focus:outline-none";

const AIDE = "mt-1 font-body text-xs italic leading-relaxed text-silver";
