"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  corrigerAction,
  publierAction,
  type EtatAnnonce,
} from "@/app/admin/annonces/actions";
import EditeurPost from "@/components/forum/EditeurPost";
import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { TITRE_ANNONCE_MAX } from "@/lib/annonces/limites";

/**
 * **Écrire une annonce du Grand Hall**, et corriger celles qui y sont.
 *
 * Un seul formulaire pour les deux gestes, et c'est le contraire du choix
 * fait pour les points — où deux formulaires voisins ont été séparés exprès.
 * La raison tient en une phrase : là-bas, deux gestes DIFFÉRENTS se
 * ressemblaient ; ici, c'est le même geste sur deux objets. Deux champs qui
 * divergeraient accepteraient deux textes différents, et le dépôt
 * trancherait trop tard — exactement l'argument de `ChampPost`, partagé entre
 * publier et reprendre un post.
 *
 * **Le même éditeur que les posts**, donc la même barre, la même liste
 * blanche, les mêmes couleurs. Une annonce écrite dans un champ plus pauvre
 * que celui des joueurs serait le seul texte du site qu'on ne pourrait pas
 * mettre en forme.
 *
 * Composant client pour trois raisons : l'éditeur en est un, il faut dire
 * pourquoi un envoi n'est pas passé, et il faut vider le formulaire quand il
 * l'est — sans quoi on affiche deux fois la même annonce sans le voir.
 */
export default function FormulaireAnnonce({
  annonce,
}: {
  /** Absente : on écrit une annonce neuve. Présente : on la corrige. */
  annonce?: {
    id: string;
    titre: string;
    corps: string;
    entreeEnVigueurLe: string | null;
  };
}) {
  const enCorrection = annonce !== undefined;
  const [etat, envoyer] = useFormState<EtatAnnonce, FormData>(
    enCorrection ? corrigerAction : publierAction,
    { erreur: null, fait: false },
  );

  const t = TEXTES_ANNONCES.administration;
  const formulaire = useRef<HTMLFormElement>(null);
  const idTitre = useId();
  const idCorps = useId();
  const idAideCorps = useId();
  const idVigueur = useId();
  const idAideVigueur = useId();
  const idErreur = useId();

  const [corps, setCorps] = useState(annonce?.corps ?? "");

  // Vidé seulement quand l'envoi est passé, et jamais en correction : un refus
  // doit laisser le texte en place, sinon on le retape en entier pour une
  // virgule. Après une correction, la page se recharge avec la valeur à jour.
  useEffect(() => {
    if (etat.fait && !enCorrection) {
      formulaire.current?.reset();
      setCorps("");
    }
  }, [etat.fait, enCorrection]);

  return (
    <form
      ref={formulaire}
      action={envoyer}
      className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6"
    >
      {enCorrection ? <input type="hidden" name="id" value={annonce.id} /> : null}

      <div>
        <label
          htmlFor={idTitre}
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {t.champTitre}
        </label>
        <input
          id={idTitre}
          name="titre"
          type="text"
          required
          maxLength={TITRE_ANNONCE_MAX}
          defaultValue={annonce?.titre ?? ""}
          className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
        />
        <p className="mt-1 font-body text-xs italic leading-relaxed text-silver">
          {t.champTitreAide}
        </p>
      </div>

      <div className="mt-5">
        <span
          id={idCorps}
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {t.champCorps}
        </span>
        <div className="mt-2">
          <EditeurPost
            valeur={corps}
            onChange={setCorps}
            idEtiquette={idCorps}
            idDescription={idAideCorps}
            hauteur="min-h-[12rem]"
          />
        </div>
        {/* L'éditeur écrit dans un `contenteditable` : la valeur ne voyage
            qu'à travers ce champ caché. Sans lui, le formulaire partirait
            vide. */}
        <input type="hidden" name="corps" value={corps} />
        <p id={idAideCorps} className="sr-only">
          {t.champCorps}
        </p>
      </div>

      <div className="mt-5 max-w-[16rem]">
        <label
          htmlFor={idVigueur}
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {t.champVigueur}
        </label>
        <input
          id={idVigueur}
          name="entreeEnVigueur"
          type="date"
          defaultValue={enJourISO(annonce?.entreeEnVigueurLe ?? null)}
          aria-describedby={idAideVigueur}
          className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
        />
        <p
          id={idAideVigueur}
          className="mt-1 font-body text-xs italic leading-relaxed text-silver"
        >
          {t.champVigueurAide}
        </p>
      </div>

      {etat.erreur ? (
        <p
          id={idErreur}
          role="alert"
          className="mt-4 font-body text-sm leading-relaxed text-ember"
        >
          {etat.erreur}
        </p>
      ) : null}

      <Envoyer libelle={enCorrection ? t.enregistrer : t.publier} />
    </form>
  );
}

/**
 * Le bouton se ferme pendant l'envoi.
 *
 * Neon peut mettre une seconde ou deux à répondre après une accalmie : sans
 * cela, un second clic afficherait deux fois la même annonce au Grand Hall.
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

/**
 * L'instant devient la journée que le champ attend — « 2026-09-04 ».
 *
 * ⚠️ **En heure LOCALE, jamais `toISOString`**, qui rend l'heure UTC : une
 * date posée à midi le 4 sortirait « 2026-09-03 » pour qui vit à l'ouest, et
 * le champ afficherait la veille de ce qu'on a saisi.
 */
function enJourISO(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const deuxChiffres = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}
