"use client";

import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  corrigerAction,
  poserAction,
  type EtatGrimoire,
} from "@/app/admin/grimoires/actions";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import {
  DESCRIPTION_GRIMOIRE_MAX,
  EXERGUE_MAX,
  TITRE_GRIMOIRE_MAX,
} from "@/lib/grimoires/limites";
import { RELIURES } from "@/lib/grimoires/reliures";

const t = TEXTES_GRIMOIRES.administration;

/**
 * **Poser un volume, et corriger ceux qui sont là.**
 *
 * Un seul formulaire pour les deux gestes — c'est le même geste sur deux
 * objets. Deux champs qui divergeraient accepteraient deux saisies
 * différentes, et le dépôt trancherait trop tard. Même parti pris que les
 * annonces et le calendrier.
 *
 * ⚠️ **Il ne touche pas au contenu.** Les blocs entrent par l'import : les
 * volumes s'écrivent sous Word, `scripts/lire-grimoire.mjs` les lit et
 * `poser-grimoire.mjs` les pose. Un éditeur de blocs serait un lot à part.
 */
export default function FormulaireGrimoire({
  volume,
}: {
  volume?: {
    id: string;
    slug: string;
    titre: string;
    exergue: string | null;
    description: string;
    reliure: string;
  };
}) {
  const enCorrection = volume !== undefined;
  const [etat, envoyer] = useFormState<EtatGrimoire, FormData>(
    enCorrection ? corrigerAction : poserAction,
    { erreur: null, fait: false },
  );

  const formulaire = useRef<HTMLFormElement>(null);
  const idTitre = useId();
  const idSlug = useId();
  const idAideSlug = useId();
  const idExergue = useId();
  const idAideExergue = useId();
  const idDescription = useId();
  const idAideDescription = useId();
  const idReliure = useId();

  // Vider après un envoi réussi — sans quoi on pose deux fois le même volume
  // sans le voir. À la correction, on garde ce qui est à l'écran.
  useEffect(() => {
    if (etat.fait && !enCorrection) formulaire.current?.reset();
  }, [etat.fait, enCorrection]);

  return (
    <form ref={formulaire} action={envoyer} className="mt-4 grid gap-4">
      {enCorrection ? <input type="hidden" name="id" value={volume.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <p className="grid gap-1">
          <label htmlFor={idTitre} className={ETIQUETTE}>
            {t.formulaire.champTitre}
          </label>
          <input
            id={idTitre}
            name="titre"
            required
            maxLength={TITRE_GRIMOIRE_MAX}
            defaultValue={volume?.titre ?? ""}
            className={CHAMP}
          />
        </p>

        <p className="grid gap-1">
          <label htmlFor={idSlug} className={ETIQUETTE}>
            {t.formulaire.champSlug}
          </label>
          <input
            id={idSlug}
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={volume?.slug ?? ""}
            aria-describedby={idAideSlug}
            className={CHAMP}
          />
          <span id={idAideSlug} className={AIDE}>
            {t.formulaire.aideSlug}
          </span>
        </p>
      </div>

      <p className="grid gap-1">
        <label htmlFor={idExergue} className={ETIQUETTE}>
          {t.formulaire.champExergue}
        </label>
        <input
          id={idExergue}
          name="exergue"
          maxLength={EXERGUE_MAX}
          defaultValue={volume?.exergue ?? ""}
          aria-describedby={idAideExergue}
          className={CHAMP}
        />
        <span id={idAideExergue} className={AIDE}>
          {t.formulaire.aideExergue}
        </span>
      </p>

      <p className="grid gap-1">
        <label htmlFor={idDescription} className={ETIQUETTE}>
          {t.formulaire.champDescription}
        </label>
        <input
          id={idDescription}
          name="description"
          required
          maxLength={DESCRIPTION_GRIMOIRE_MAX}
          defaultValue={volume?.description ?? ""}
          aria-describedby={idAideDescription}
          className={CHAMP}
        />
        <span id={idAideDescription} className={AIDE}>
          {t.formulaire.aideDescription}
        </span>
      </p>

      <p className="grid gap-1 sm:max-w-[16rem]">
        <label htmlFor={idReliure} className={ETIQUETTE}>
          {t.formulaire.champReliure}
        </label>
        <select
          id={idReliure}
          name="reliure"
          defaultValue={volume?.reliure ?? RELIURES[0]}
          className={CHAMP}
        >
          {RELIURES.map((reliure) => (
            <option key={reliure} value={reliure}>
              {t.reliures[reliure]}
            </option>
          ))}
        </select>
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Bouton libelle={enCorrection ? t.formulaire.enregistrer : t.formulaire.poser} />

        <p role="alert" className="font-body text-sm text-ember">
          {etat.erreur}
        </p>

        {etat.fait && !etat.erreur ? (
          <p className="font-body text-sm text-aurora-teal">
            {enCorrection ? t.formulaire.corrige : t.formulaire.pose}
          </p>
        ) : null}
      </div>
    </form>
  );
}

const ETIQUETTE =
  "font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim";

const CHAMP =
  "w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70";

const AIDE = "font-body text-xs italic leading-relaxed text-silver";

/**
 * Le bouton se ferme pendant l'envoi : Neon peut mettre une seconde ou deux à
 * répondre après une accalmie, et deux clics poseraient deux volumes.
 */
function Bouton({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
      {libelle}
    </button>
  );
}
