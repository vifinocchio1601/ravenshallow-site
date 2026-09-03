import {
  ANNEES,
  matiereDe,
  obligatoires,
  auChoix,
  statutDe,
  type Annee,
  type Statut,
} from "./cursus";
import { estOuverteAuxEleves, leconsDe, type Lecon } from "./lecons";

/**
 * **Le relevé d'un élève** — ce qu'il a passé, et où il en est.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * Comment un relevé se compose : quelles années y figurent, quelles leçons,
 * lesquelles comptent dans l'avancement. Deux écrans le liront — la liste de
 * la salle des professeurs et la fiche d'un élève — et deux calculs qui
 * divergeraient donneraient deux avancements pour la même personne.
 *
 * ── Pur, et c'est ce qui le rend éprouvable ──
 *
 * Ni base, ni session, ni horloge : les contrôles envoyés et l'instant
 * arrivent en paramètres. Une année entière s'éprouve donc sans rien écrire —
 * même parti pris qu'`etatDuPlafond`, que le frein du salon et que le délai
 * entre deux leçons.
 *
 * ⚠️ **Il ne connaît AUCUNE réponse d'élève.** Un relevé porte des notes, pas
 * des copies : c'est ce que la permission ouvre, et rien de plus.
 */

/** Ce qu'un contrôle envoyé apporte au relevé. Jamais les réponses. */
export type ControleAuReleve = {
  matiereId: string;
  annee: number;
  rang: number;
  note: number;
  surCombien: number;
  envoyeLe: Date;
};

export type LeconDuReleve = {
  lecon: Lecon;
  /** Ouverte aux élèves à cet instant ? Le staff, lui, passe toujours. */
  ouverte: boolean;
  /** Le contrôle, s'il l'a envoyé. */
  controle: ControleAuReleve | null;
};

export type MatiereDuReleve = {
  matiereId: string;
  nom: string;
  statut: Statut;
  lecons: LeconDuReleve[];
};

export type AnneeDuReleve = {
  annee: Annee;
  matieres: MatiereDuReleve[];
};

export type Releve = {
  annees: AnneeDuReleve[];
  /** Combien de contrôles il a envoyés, parmi les leçons qui lui sont ouvertes. */
  envoyes: number;
  /** Combien il pouvait en envoyer — le nombre de leçons ouvertes. */
  possibles: number;
  /** La somme de ses notes, et le total possible sur ce qu'il a passé. */
  points: number;
  surCombien: number;
};

/**
 * **Le relevé d'un élève, jusqu'à son année.**
 *
 * ⚠️ **Les années sans aucune leçon en ligne n'y figurent pas.** Afficher six
 * années vides sous la première ne dirait rien d'autre que « ce n'est pas
 * encore écrit », et noierait la seule qui porte quelque chose. Elles
 * apparaîtront d'elles-mêmes le jour où une leçon s'y posera.
 *
 * ⚠️ **On ne va jamais au-delà de son année** — art. 14.4. Un professeur qui
 * consulte le relevé d'un première année ne doit pas y voir le programme de
 * septième : ce n'est pas le sien, et cela ne dit rien de son avancement.
 *
 * `maintenant` sert à savoir ce qui lui est ouvert. ⚠️ **Il est pris UNE fois
 * par l'appelant** : deux lectures d'horloge dans le même rendu peuvent tomber
 * de part et d'autre d'une ouverture, et deux matières se contrediraient.
 */
export function relevePour(
  anneeDeLEleve: Annee,
  controles: readonly ControleAuReleve[],
  maintenant: Date,
): Releve {
  const parCle = new Map(
    controles.map((c) => [`${c.matiereId}/${c.annee}/${c.rang}`, c]),
  );

  const annees: AnneeDuReleve[] = [];
  let envoyes = 0;
  let possibles = 0;
  let points = 0;
  let surCombien = 0;

  for (const annee of ANNEES) {
    if (annee > anneeDeLEleve) break;

    // L'ordre du programme : les imposées d'abord, puis celles au choix —
    // c'est celui de la page de l'année, et l'œil ne doit pas réapprendre.
    const matieres: MatiereDuReleve[] = [];
    for (const matiere of [...obligatoires(annee), ...auChoix(annee)]) {
      const lecons = leconsDe(matiere.id, annee);
      if (lecons.length === 0) continue;

      matieres.push({
        matiereId: matiere.id,
        nom: matiereDe(matiere.id)?.nom ?? matiere.id,
        statut: statutDe(matiere.id, annee),
        lecons: lecons.map((lecon) => {
          const ouverte = estOuverteAuxEleves(lecon, maintenant);
          const controle =
            parCle.get(`${lecon.matiereId}/${annee}/${lecon.rang}`) ?? null;

          // ⚠️ **L'avancement se mesure sur ce qui lui est OUVERT.** Une leçon
          // que personne ne peut encore ouvrir ne compte pas contre lui : « 0
          // sur 24 » à la rentrée serait faux et décourageant. Un contrôle
          // passé avant l'heure — le staff le peut — s'affiche quand même,
          // mais ne gonfle pas le dénominateur.
          if (ouverte) {
            possibles += 1;
            if (controle) envoyes += 1;
          }
          if (controle) {
            points += controle.note;
            surCombien += controle.surCombien;
          }

          return { lecon, ouverte, controle };
        }),
      });
    }

    if (matieres.length > 0) annees.push({ annee, matieres });
  }

  return { annees, envoyes, possibles, points, surCombien };
}

/**
 * **La part de contrôles passés, en pourcentage entier**, ou `null` quand il
 * n'y a rien à mesurer.
 *
 * ⚠️ **Ce n'est pas une note, et surtout pas une moyenne d'examen.** Les deux
 * seuils du cursus — 50 % par matière, 60 % de moyenne — portent sur les
 * EXAMENS de fin d'année, qui ne sont pas construits. Les afficher ici ferait
 * croire à un élève qu'il est reçu ou recalé sur ses contrôles de leçon.
 */
export function partDesControlesPasses(releve: Releve): number | null {
  if (releve.possibles === 0) return null;
  return Math.round((releve.envoyes / releve.possibles) * 100);
}
