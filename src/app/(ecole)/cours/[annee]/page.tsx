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
import {
  estOuverteAuxEleves,
  leconsDe,
  peutOuvrirLaLecon,
} from "@/lib/cours/lecons";
import { jourEtHeureAnnonces } from "@/lib/dates";
import { controlesEnvoyesDe, type ControleEnvoye } from "@/lib/cours/depot";
import { joursRestants } from "@/lib/cours/delai";
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

  // ⚠️ **Une requête pour toute la page**, jamais une par leçon : la première
  // année en compte six, et la septième en comptera cinq de plus.
  const controles = compte.eleveId
    ? await controlesEnvoyesDe(compte.eleveId)
    : new Map<string, ControleEnvoye>();
  // L'instant est pris UNE fois : deux lectures d'horloge dans le même rendu
  // pourraient tomber de part et d'autre d'une minute et afficher deux
  // décomptes différents sur la même page.
  const maintenant = new Date();

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
            <LigneMatiere
              key={matiere.id}
              matiere={matiere}
              annee={annee}
              anneeOuverte
              staff={estStaff(pouvoirs)}
              controles={controles}
              maintenant={maintenant}
            />
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
              <LigneMatiere
                key={matiere.id}
                matiere={matiere}
                annee={annee}
                anneeOuverte
                staff={estStaff(pouvoirs)}
                controles={controles}
                maintenant={maintenant}
              />
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
  anneeOuverte,
  staff,
  controles,
  maintenant,
}: {
  matiere: Matiere;
  annee: Annee;
  /** L’année est déjà ouverte : on est sur sa page. */
  anneeOuverte: boolean;
  staff: boolean;
  /** Ce que ce compte a déjà envoyé, par clé « matiere/rang ». */
  controles: Map<string, ControleEnvoye>;
  maintenant: Date;
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

      <LeconsDeLaMatiere
        matiereId={matiere.id}
        annee={annee}
        anneeOuverte={anneeOuverte}
        staff={staff}
        controles={controles}
        maintenant={maintenant}
      />
    </li>
  );
}

/**
 * Les leçons en ligne d’une matière.
 *
 * ⚠️ **Une leçon qu’on ne peut pas ouvrir ne s’affiche pas du tout**, à la
 * différence d’une année fermée ou d’une maison qu’on ne visite pas — qui,
 * elles, se montrent avec leur raison écrite.
 *
 * La différence tient à ce qu’on annonce : une porte close est un fait du
 * monde, qu’un élève gagne à connaître. Une leçon pas encore ouverte n’est pas
 * une porte, c’est du travail en cours — l’annoncer promettrait une date qu’on
 * n’a pas.
 *
 * Le staff, lui, la voit **avec la mention en toutes lettres**.
 */
function LeconsDeLaMatiere({
  matiereId,
  annee,
  anneeOuverte,
  staff,
  controles,
  maintenant,
}: {
  matiereId: string;
  annee: Annee;
  anneeOuverte: boolean;
  staff: boolean;
  controles: Map<string, ControleEnvoye>;
  maintenant: Date;
}) {
  const visibles = leconsDe(matiereId, annee).filter((l) =>
    peutOuvrirLaLecon(l, anneeOuverte, staff, maintenant),
  );
  if (visibles.length === 0) return null;

  return (
    <ul className="mt-4 grid grid-cols-1 gap-2 border-t border-silver/10 pt-4">
      {visibles.map((lecon) => {
        const envoye = controles.get(`${lecon.matiereId}/${lecon.rang}`);
        const jours = envoye ? joursRestants(envoye.envoyeLe, maintenant) : 0;

        return (
          <li key={lecon.rang} className="min-w-0">
            <a
              href={`${ROUTES.cours}/${annee}/${lecon.matiereId}/${lecon.rang}`}
              className="group inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-sm text-parchment transition-colors duration-300 hover:text-aurora-teal"
            >
              <span className="min-w-0 break-words">
                {T.lecons.lien
                  .replace("{rang}", String(lecon.rang))
                  .replace("{total}", String(lecon.surCombien))
                  .replace("{titre}", lecon.titre)}
              </span>
              {/* ⚠️ En toutes lettres, jamais une couleur seule — et avec la
                  DATE : « pas encore ouverte » sans dire quand n'apprend rien
                  au staff, qui est le seul à voir cette mention. */}
              {estOuverteAuxEleves(lecon, maintenant) ? null : (
                <span className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-silver">
                  {lecon.ouverteAuxElevesLe
                    ? T.lecons.ouvreLe.replace(
                        "{quand}",
                        jourEtHeureAnnonces(lecon.ouverteAuxElevesLe),
                      )
                    : T.lecons.fermee}
                </span>
              )}
            </a>

            {/*
              Le contrôle passé, et le chrono des sept jours.

              ⚠️ **Hors du lien**, et c'est voulu : le lien mène à la LEÇON,
              et son nom accessible ne doit pas se charger d'une note qui n'a
              rien à voir avec l'endroit où il conduit.

              ⚠️ **Le chrono tourne même sans leçon 2** — décision du joueur,
              4 septembre 2026. Il n'ouvre rien aujourd'hui ; il dit que le
              contrôle est enregistré et quand la suite viendra.
            */}
            {envoye ? (
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-body text-xs italic text-silver">
                <span>
                  {T.lecons.controleEnvoye
                    .replace("{note}", String(envoye.note))
                    .replace("{total}", String(envoye.surCombien))}
                </span>
                <span className="text-aurora-teal/70">
                  {jours === 0
                    ? T.lecons.prochaineOuverte
                    : jours === 1
                      ? T.lecons.prochaineDansUnJour
                      : T.lecons.prochaineDans.replace("{n}", String(jours))}
                </span>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
