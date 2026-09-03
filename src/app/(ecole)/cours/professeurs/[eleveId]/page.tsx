import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEXTES_COURS } from "@/lib/cours/constantes";
import { type Annee } from "@/lib/cours/cursus";
import { fichePourLeReleve } from "@/lib/cours/depot";
import { relevePour, type AnneeDuReleve, type MatiereDuReleve } from "@/lib/cours/releve";
import { FONCTIONS, libelleAnnee, type Fonction } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { avecDe } from "@/lib/francais";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVoirLesControles } from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_COURS.releve;

export const metadata: Metadata = {
  title: `${TEXTES_COURS.salle.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le relevé d'un élève** — ce qu'il a passé, et où il en est.
 *
 * ⚠️ **404 pour qui n'a pas le droit, et pour une fiche qui n'existe pas.**
 * Les deux se lisent pareil : « elle existe, mais pas pour vous » serait une
 * confirmation. Même choix que le forum, la Tour et les maisons.
 *
 * ── Ce qu'on y voit, et ce qu'on n'y voit pas ──
 *
 * Le programme de son année, matière par matière, avec la note de chaque
 * contrôle passé et la mention de ce qui reste. **Aucune copie** : le dépôt ne
 * demande pas `reponses`, et cette page n'aurait pas de quoi les afficher.
 *
 * ── Ce que la page ne calcule pas ──
 *
 * Elle n'invente aucun seuil. Les deux du cursus — 50 % par matière, 60 % de
 * moyenne — portent sur les **examens de fin d'année**, qui ne sont pas
 * construits ; les afficher ici ferait croire à un professeur qu'un élève est
 * reçu ou recalé sur ses contrôles de leçon. On montre des faits : combien il
 * a passé, combien de bonnes réponses.
 */
export default async function Page({
  params,
}: {
  params: { eleveId: string };
}) {
  const compte = await exigerAcces(ROUTES.cours);
  const pouvoirs = await pouvoirsDe(compte.id);
  if (!peutVoirLesControles(pouvoirs)) notFound();

  const fiche = await fichePourLeReleve(params.eleveId);
  if (!fiche) notFound();

  // ⚠️ **L'instant est pris UNE fois** : deux lectures d'horloge dans le même
  // rendu peuvent tomber de part et d'autre d'une ouverture, et deux matières
  // se contrediraient sur la même page.
  const maintenant = new Date();
  const releve = relevePour(fiche.annee as Annee, fiche.controles, maintenant);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={`${ROUTES.cours}/professeurs`}
        className="eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-aurora-teal"
      >
        <span aria-hidden="true">←</span>
        {T.retour}
      </Link>

      <h1 className="mt-4 min-w-0 break-words font-display text-[clamp(1.6rem,4.5vw,2.3rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre.replace("{qui}", avecDe(fiche.prenomNom))}
      </h1>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-body text-sm italic text-silver">
        {/* L'année, **ou le titre au château qui la remplace**. */}
        <span>{fiche.place}</span>
        {fiche.maison ? (
          <span>{NOMS_MAISON[fiche.maison] ?? fiche.maison}</span>
        ) : null}
      </p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-display text-[0.72rem] uppercase tracking-[0.18em]">
        <span className="text-aurora-teal">{resume(releve)}</span>
        <span className="text-silver">{total(releve)}</span>
      </p>

      {releve.annees.length === 0 ? (
        <p className="mt-10 font-body italic text-silver">{T.rien}</p>
      ) : (
        releve.annees.map((annee) => (
          <AnneeDuProgramme key={annee.annee} annee={annee} />
        ))
      )}
    </main>
  );
}

/**
 * « 3 contrôles passés sur 6 ouverts ».
 *
 * ⚠️ **Le singulier a sa phrase, des deux côtés** — « 1 contrôles » et
 * « sur 1 ouverts » sont la faute que personne ne relit, et c'est la
 * troisième fois qu'on la corrige sur ce site.
 */
function resume(releve: {
  envoyes: number;
  possibles: number;
}): string {
  if (releve.possibles === 0) return T.resumeRien;
  if (releve.possibles === 1)
    return T.resumeUnSeulOuvert.replace("{envoyes}", String(releve.envoyes));
  if (releve.envoyes === 1)
    return T.resumeUn.replace("{possibles}", String(releve.possibles));
  return T.resume
    .replace("{envoyes}", String(releve.envoyes))
    .replace("{possibles}", String(releve.possibles));
}

/** « 17 bonnes réponses sur 20 ». Pas une moyenne, pas un seuil : un fait. */
function total(releve: { points: number; surCombien: number }): string {
  if (releve.surCombien === 0) return T.totalAucun;
  return T.total
    .replace("{points}", String(releve.points))
    .replace("{surCombien}", String(releve.surCombien));
}

function AnneeDuProgramme({ annee }: { annee: AnneeDuReleve }) {
  return (
    <section aria-labelledby={`annee-${annee.annee}`} className="mt-12">
      <h2
        id={`annee-${annee.annee}`}
        className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
      >
        {libelleAnnee(FONCTIONS[annee.annee - 1] as Fonction)}
      </h2>

      <ul className="mt-4 grid grid-cols-1 gap-3">
        {annee.matieres.map((matiere) => (
          <LigneMatiere key={matiere.matiereId} matiere={matiere} />
        ))}
      </ul>
    </section>
  );
}

/** Une matière, et l'état de chacune de ses leçons. */
function LigneMatiere({ matiere }: { matiere: MatiereDuReleve }) {
  return (
    <li className="min-w-0 rounded-md border border-silver/15 bg-void/40 p-5">
      <h3 className="min-w-0 break-words font-display text-base leading-snug text-parchment">
        {matiere.nom}
      </h3>

      <ul className="mt-3 grid grid-cols-1 gap-2 border-t border-silver/10 pt-3">
        {matiere.lecons.map(({ lecon, ouverte, controle }) => (
          <li
            key={lecon.rang}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          >
            <span className="min-w-0 break-words font-body text-sm text-parchment-dim">
              {TEXTES_COURS.annee.lecons.lien
                .replace("{rang}", String(lecon.rang))
                .replace("{total}", String(lecon.surCombien))
                .replace("{titre}", lecon.titre)}
            </span>

            {/*
              Trois états, et ils se lisent en toutes lettres — jamais par une
              couleur seule : la note, « pas encore passé », « pas encore
              ouverte ». Le troisième n'accuse personne, et c'est le point :
              un élève n'a pas à porter le retard d'une leçon qu'on écrit.
            */}
            {controle ? (
              <span className="font-display text-sm text-aurora-teal">
                {T.passe
                  .replace("{note}", String(controle.note))
                  .replace("{surCombien}", String(controle.surCombien))}
              </span>
            ) : (
              <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver">
                {ouverte ? T.pasPasse : T.pasOuverte}
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}
