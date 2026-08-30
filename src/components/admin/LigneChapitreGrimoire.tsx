"use client";

import { useId } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  chapitreAction,
  type EtatGrimoire,
} from "@/app/admin/grimoires/actions";
import type { AccesGrimoire } from "@/lib/grimoires/acces";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { TITRE_CHAPITRE_MAX } from "@/lib/grimoires/limites";

const t = TEXTES_GRIMOIRES.administration.chapitres;

/**
 * **Un chapitre : son titre, et surtout qui le lit.**
 *
 * ⚠️ **C'est la seule décision de tout ce lot qui ferme quelque chose.** Un
 * chapitre réservé ne descend pas dans le navigateur d'un joueur — ni son
 * contenu, ni son titre, ni sa ligne au sommaire. L'aide le dit sous le
 * champ, au moment du geste, plutôt que dans une page qu'il faudrait penser
 * à ouvrir.
 *
 * Composant client pour une raison précise : **ouvrir un chapitre qui porte
 * un sortilège interdit est refusé par la base**, et ce refus doit se lire en
 * une phrase, pas en erreur 500.
 */
export default function LigneChapitreGrimoire({
  chapitre,
}: {
  chapitre: {
    id: string;
    titre: string;
    acces: AccesGrimoire;
    blocs: number;
  };
}) {
  const [etat, envoyer] = useFormState<EtatGrimoire, FormData>(chapitreAction, {
    erreur: null,
    fait: false,
  });

  const idTitre = useId();
  const idAcces = useId();
  const idAide = useId();

  const compte =
    chapitre.blocs === 1
      ? TEXTES_GRIMOIRES.administration.liste.blocUn
      : TEXTES_GRIMOIRES.administration.liste.blocs.replace(
          "{n}",
          String(chapitre.blocs),
        );

  return (
    <form
      action={envoyer}
      className="grid gap-3 border-t border-silver/12 py-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end sm:gap-4"
    >
      <input type="hidden" name="id" value={chapitre.id} />

      <p className="grid gap-1">
        <label htmlFor={idTitre} className={ETIQUETTE}>
          {t.champTitre}
        </label>
        <input
          id={idTitre}
          name="titre"
          required
          maxLength={TITRE_CHAPITRE_MAX}
          defaultValue={chapitre.titre}
          className={CHAMP}
        />
        <span className="font-body text-xs italic text-silver">{compte}</span>
      </p>

      <p className="grid gap-1">
        <label htmlFor={idAcces} className={ETIQUETTE}>
          {t.champAcces}
        </label>
        <select
          id={idAcces}
          name="acces"
          defaultValue={chapitre.acces}
          aria-describedby={idAide}
          className={CHAMP}
        >
          <option value="TOUS">{t.acces.TOUS}</option>
          <option value="ADMINISTRATION">{t.acces.ADMINISTRATION}</option>
        </select>
        <span id={idAide} className="font-body text-xs italic text-silver">
          {t.aideAcces}
        </span>
      </p>

      <div className="grid gap-1">
        <Bouton />
        {etat.erreur ? (
          <p role="alert" className="font-body text-sm text-ember">
            {etat.erreur}
          </p>
        ) : null}
        {etat.fait && !etat.erreur ? (
          <p className="font-body text-sm text-aurora-teal">{t.enregistre}</p>
        ) : null}
      </div>
    </form>
  );
}

const ETIQUETTE =
  "font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim";

const CHAMP =
  "w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70";

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
    >
      {t.enregistrer}
    </button>
  );
}
