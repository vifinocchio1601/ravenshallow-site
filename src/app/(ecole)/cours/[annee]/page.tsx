import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEXTES_COURS } from "@/lib/cours/constantes";
import {
  auChoix,
  chargeDe,
  cycleDe,
  estUneAnnee,
  obligatoires,
  peutOuvrirLAnnee,
  statutDe,
  matiereDe,
  type Annee,
  type Matiere,
} from "@/lib/cours/cursus";
import { FONCTIONS, libelleAnnee, type Fonction } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";
import { avecDe } from "@/lib/francais";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff } from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_COURS.annee;

export const metadata: Metadata = {
  title: `${TEXTES_COURS.annees.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le programme d’une année.**
 *
 * ⚠️ **404 pour une année qu’on ne peut pas ouvrir**, exactement comme pour
 * une année qui n’existe pas — « elle existe, mais pas pour vous » se lit
 * comme une confirmation. Même choix que le forum, la Tour, le Grand Hall et
 * les maisons.
 *
 * L’adresse porte le NOMBRE — `/cours/3` —, et non un slug : la conversion
 * est dérivée, sans table tenue à la main. Une correspondance écrite à la main
 * finirait par laisser une année joignable par deux adresses ou par aucune.
 */
export default async function Page({ params }: { params: { annee: string } }) {
  const compte = await exigerAcces(ROUTES.cours);

  if (!estUneAnnee(params.annee)) notFound();
  const annee = Number(params.annee) as Annee;

  const pouvoirs = await pouvoirsDe(compte.id);
  if (!peutOuvrirLAnnee(compte.fonction as Fonction, annee, estStaff(pouvoirs))) {
    notFound();
  }

  const cycle = cycleDe(annee);
  const imposees = obligatoires(annee);
  const offertes = auChoix(annee);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.cours}
        className="eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-aurora-teal"
      >
        <span aria-hidden="true">←</span>
        {T.retour}
      </Link>

      <h1 className="mt-4 font-display text-[clamp(1.6rem,4.5vw,2.3rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {libelleAnnee(FONCTIONS[annee - 1] as Fonction)}
      </h1>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-body text-sm italic text-silver">
        <span>{T.cycle.replace("{cycle}", cycle.nom)}</span>
        <span>{T.charge.replace("{n}", String(chargeDe(annee)))}</span>
      </p>

      <section aria-labelledby="imposees" className="mt-12">
        <h2
          id="imposees"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {T.imposees.titre}
        </h2>
        <p className="mt-2 font-body text-sm italic leading-relaxed text-silver">
          {T.imposees.aide}
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-3">
          {imposees.map((matiere) => (
            <LigneMatiere key={matiere.id} matiere={matiere} annee={annee} />
          ))}
        </ul>
      </section>

      {/* Le Seuil n’offre aucun choix : la section disparaît plutôt que de
          s’afficher vide — il n’y a rien à choisir, ce n’est pas une porte
          fermée. */}
      {cycle.choixParAnnee === 0 ? null : (
        <section aria-labelledby="choix" className="mt-14">
          <h2
            id="choix"
            className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
          >
            {T.choix.titre}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {T.choix.aide
              .replace("{choix}", String(cycle.choixParAnnee))
              .replace("{offertes}", String(offertes.length))}
          </p>
          {cycle.id === "VEILLE" ? (
            <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
              {T.choix.hauteEtude}
            </p>
          ) : null}

          <ul className="mt-5 grid grid-cols-1 gap-3">
            {offertes.map((matiere) => (
              <LigneMatiere key={matiere.id} matiere={matiere} annee={annee} />
            ))}
          </ul>

          <p className="mt-5 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {TEXTES_COURS.inscriptions.aVenir}
          </p>
        </section>
      )}

      <p className="mt-14 max-w-[68ch] font-body italic leading-[1.8] text-silver">
        {T.aVenir}
      </p>

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}

/** Une matière du programme : son nom, son statut, et d’où elle vient. */
function LigneMatiere({
  matiere,
  annee,
}: {
  matiere: Matiere;
  annee: Annee;
}) {
  const statut = statutDe(matiere.id, annee);
  // Les prérequis sont nommés, jamais montrés par leur identifiant : c’est le
  // nom que l’élève connaît.
  const requis = matiere.prerequis
    .map((id) => matiereDe(id)?.nom)
    .filter((nom): nom is string => Boolean(nom));

  return (
    <li className="min-w-0 rounded-md border border-silver/15 bg-void/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="min-w-0 break-words font-display text-lg leading-snug text-parchment">
          {matiere.nom}
        </h3>
        {/* Le statut est un mot, jamais une couleur seule. */}
        {statut ? (
          <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/80">
            {T.matiere.statuts[statut]}
          </span>
        ) : null}
      </div>

      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs italic text-silver">
        {/* « Héritage d’Alaric », jamais « de Alaric » : deux des quatre
            fondateurs commencent par une voyelle. */}
        {matiere.heritage ? (
          <span>{T.matiere.heritage.replace("{qui}", avecDe(matiere.heritage))}</span>
        ) : null}
        {requis.length > 0 ? (
          <span>{T.matiere.prerequis.replace("{matieres}", requis.join(", "))}</span>
        ) : null}
      </p>
    </li>
  );
}
