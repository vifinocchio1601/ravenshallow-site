"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { cloturerAction, type EtatCloture } from "@/app/admin/cloture/actions";
import { libelleAnnee } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { enPoints } from "@/lib/points/affichage";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import type { Passage } from "@/lib/points/cloture";

/**
 * **Clore la session, et cocher qui passe.**
 *
 * Composant client pour trois raisons, et trois seulement : demander
 * confirmation avant le geste le plus irréversible du site, dire pourquoi ça
 * n’a pas marché plutôt que de laisser le bouton muet, et offrir « tout
 * cocher » — trente cases à la main, c’est trente occasions d’en oublier une.
 *
 * Aucune règle n’est décidée ici. Le nom, les passages et la clôture
 * elle-même sont revalidés par `lib/points/cloture.ts`, qui relit les années
 * en base : l’écran a pu rester ouvert une heure, et une année ne se lit pas
 * dans un champ caché.
 */

const DEPART: EtatCloture = { erreur: null, message: null };

export default function FormulaireCloture({ eleves }: { eleves: Passage[] }) {
  const [etat, envoyer] = useFormState(cloturerAction, DEPART);
  const formulaire = useRef<HTMLFormElement>(null);
  const [tout, setTout] = useState(false);
  const t = TEXTES_POINTS.cloture;

  /** Les seuls qui peuvent passer : en septième année, il n’y a plus d’après. */
  const passables = eleves.filter((e) => e.versLAnnee !== null);

  function basculerTout() {
    const suivant = !tout;
    setTout(suivant);
    formulaire.current
      ?.querySelectorAll<HTMLInputElement>('input[name="passe"]')
      .forEach((c) => {
        c.checked = suivant;
      });
  }

  // Une fois la session close, le formulaire ne veut plus rien dire : ses
  // élèves ont changé d'année, et la saison n'est plus la même. On rend le
  // résultat, et la page se recharge d'elle-même à la navigation suivante.
  if (etat.message) {
    return (
      <p className="mt-3 rounded-sm border border-aurora-teal/40 bg-aurora-teal/[0.06] px-5 py-6 font-body leading-[1.7] text-parchment">
        {etat.message}
      </p>
    );
  }

  return (
    <form ref={formulaire} action={envoyer} className="mt-3">
      <section>
        <h3 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
          {t.passages.titre}
        </h3>
        <p className="mt-1 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.passages.aide}
        </p>

        {eleves.length === 0 ? (
          <p className="mt-3 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
            {t.passages.aucun}
          </p>
        ) : (
          <>
            {passables.length > 1 ? (
              <button
                type="button"
                onClick={basculerTout}
                className="mt-3 rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
              >
                {tout ? t.passages.toutDecocher : t.passages.toutCocher}
              </button>
            ) : null}

            <ul className="mt-3 grid grid-cols-1 gap-2">
              {eleves.map((eleve) => {
                const id = `passe-${eleve.eleveId}`;
                const fin = eleve.versLAnnee === null;
                return (
                  <li
                    key={eleve.eleveId}
                    className="min-w-0 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="flex min-w-0 items-center gap-3">
                        {/* La case n'existe pas en septième année : une case
                            grisée laisserait croire qu'on peut la cocher. */}
                        {fin ? (
                          <span aria-hidden="true" className="w-4" />
                        ) : (
                          <input
                            id={id}
                            name="passe"
                            value={eleve.eleveId}
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-aurora-teal"
                          />
                        )}
                        <label
                          htmlFor={fin ? undefined : id}
                          className="min-w-0 font-body text-parchment"
                        >
                          {eleve.prenomNom}
                          <span className="ml-2 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver">
                            {eleve.maison
                              ? (NOMS_MAISON[eleve.maison] ?? eleve.maison)
                              : t.passages.sansMaison}
                          </span>
                        </label>
                      </div>

                      <span className="font-body text-xs italic text-silver">
                        {fin
                          ? t.passages.derniereAnnee
                          : t.passages.vers
                              .replace("{de}", libelleAnnee(eleve.fonction))
                              .replace("{a}", libelleAnnee(eleve.versLAnnee!))}
                        {" · "}
                        {enPoints(eleve.points)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="mt-8 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6">
        <label
          htmlFor="nom-saison"
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {t.formulaire.nom}
        </label>
        <input
          id="nom-saison"
          name="nom"
          type="text"
          required
          placeholder={t.formulaire.nomPlaceholder}
          className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
        />
        <p className="mt-1 font-body text-xs italic leading-relaxed text-silver">
          {t.formulaire.nomAide}
        </p>

        {etat.erreur ? (
          <p role="alert" className="mt-3 font-body text-sm leading-relaxed text-ember">
            {etat.erreur}
          </p>
        ) : null}

        <Envoyer libelle={t.formulaire.envoyer} confirmation={t.formulaire.confirmation} />
      </div>
    </form>
  );
}

/**
 * Le bouton se ferme pendant l’envoi, et demande d’abord.
 *
 * La confirmation native suffit : c’est un geste rare, fait par une seule
 * personne, et un dialogue maison n’ajouterait ici qu’une occasion de se
 * tromper. Le bouton fermé, lui, évite qu’un second clic sur une base qui
 * sort de veille ne clôture deux fois.
 */
function Envoyer({
  libelle,
  confirmation,
}: {
  libelle: string;
  confirmation: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmation)) e.preventDefault();
      }}
      className="btn btn-ghost mt-6 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {libelle}
    </button>
  );
}
