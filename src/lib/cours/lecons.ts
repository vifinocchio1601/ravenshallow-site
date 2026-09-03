import { matiereDe, type Annee } from "./cursus";

/**
 * Les leçons en ligne — **et qui a le droit de les ouvrir**.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * Deux choses : quelles leçons existent, et **si elles sont ouvertes aux
 * élèves**.
 *
 * ✅ **Les six de première année le sont, depuis le 4 septembre 2026 à 9 h** —
 * décision du joueur, qui a fixé l'heure lui-même. Elles étaient fermées
 * jusque-là pour une raison précise, et cette raison a cessé d'exister : le
 * contrôle qui suit chacune n'existait pas côté serveur, et ouvrir une leçon
 * promettait une suite qui n'arrivait pas. Il existe maintenant — la table,
 * les questionnaires `server-only`, les points.
 *
 * ⚠️ **Ce drapeau ne se met jamais à vrai par habitude.** Une leçon sans son
 * contrôle se déclare à faux, comme les six l'étaient : `lecons.test.ts` exige
 * que toute leçon ouverte ait son questionnaire, et tombe sinon en la nommant.
 *
 * ── Pourquoi un drapeau plutôt qu'une absence ──
 *
 * Parce qu'il faut pouvoir poser une leçon que le joueur relit avant qu'elle
 * ne s'ouvre. Le drapeau dit ce qu'on veut dire — « elle existe, elle n'est pas
 * encore ouverte » — là où une absence dirait « elle n'existe pas ».
 *
 * C'est le même parti pris qu'`EtatEtape` : une case vide ne dit rien, un état
 * tranche.
 *
 * ── Ce fichier est PUR ──
 *
 * Ni base, ni session, ni contenu. Il dit ce qui existe et ce qui est ouvert ;
 * la route va chercher le HTML, et la garde applique la règle.
 */

export type Lecon = {
  /**
   * L'identifiant de la matière au cursus — « sortileges », jamais son nom.
   *
   * ⚠️ **Le libellé s'affiche depuis `cours/cursus.ts`, qui est la source.**
   * Le recopier ici en ferait une seconde vérité, et c'est déjà la règle des
   * fiches de sort dans les grimoires.
   */
  matiereId: string;
  annee: Annee;
  /** Le rang dans la matière — « Leçon 1 sur 4 ». */
  rang: number;
  /** Combien la matière en compte cette année-là. */
  surCombien: number;
  titre: string;
  /**
   * Les élèves peuvent-ils l'ouvrir ?
   *
   * ⚠️ **À faux, seul le staff entre.** Ce n'est pas une permission
   * attribuable : c'est l'état de la leçon elle-même, comme une annonce
   * retirée du Grand Hall.
   *
   * ⚠️ **Une leçon ouverte doit avoir son contrôle**, et `lecons.test.ts` le
   * vérifie : sans lui, le bouton « Passer le contrôle » mène à un 404, et
   * l'élève croit que le site est cassé.
   */
  ouverteAuxEleves: boolean;
};

/**
 * ⚠️ **La clé d'une leçon est `matiere/rang`**, et l'année s'en déduit — elle
 * n'entre pas dans l'adresse. Une leçon appartient à une matière et à une
 * année à la fois ; les faire toutes deux voyager dans l'URL laisserait
 * `/cours/2/sortileges/1` désigner une leçon de première année.
 */
export const LECONS: readonly Lecon[] = [
  {
    matiereId: "sortileges",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La Torche",
    ouverteAuxEleves: true,
  },
  {
    matiereId: "runologie",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Vingt-quatre signes, vingt-quatre sons",
    ouverteAuxEleves: true,
  },
  {
    matiereId: "magie_defensive",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La garde et la distance",
    ouverteAuxEleves: true,
  },
  {
    matiereId: "herboristerie",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Reconnaître",
    ouverteAuxEleves: true,
  },
  {
    matiereId: "creatures",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Regarder",
    ouverteAuxEleves: true,
  },
  {
    matiereId: "histoire",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La côte avant l’école",
    ouverteAuxEleves: true,
  },
];

/**
 * La leçon désignée par une matière et un rang, ou `null`.
 *
 * ⚠️ **Le rang doit s'écrire en chiffres, et rien d'autre.** `Number(" 1")`
 * vaut 1, et `Number("1e3")` vaut 1000 : s'en remettre à la conversion
 * laisserait `/cours/1/sortileges/%201` mener à la même leçon que
 * `/cours/1/sortileges/1`. Une leçon joignable par deux adresses est le
 * défaut que `cleDeMaison` et l'adresse en nombre d'une année ont déjà été
 * écrits pour éviter.
 */
export function lecon(matiere: string, rang: string): Lecon | null {
  if (!/^[1-9][0-9]*$/.test(rang)) return null;
  const numero = Number(rang);
  return (
    LECONS.find((l) => l.matiereId === matiere && l.rang === numero) ?? null
  );
}

/**
 * Ce compte peut-il ouvrir cette leçon ?
 *
 * ⚠️ **Pure, et elle reçoit `staff` en paramètre** : elle ne lit ni base ni
 * pouvoirs. Même parti pris que `peutOuvrirLAnnee` et `peutLireLeLieu`.
 *
 * Trois conditions, et l'ordre n'a pas d'importance :
 *
 *   • la leçon existe ;
 *   • elle est ouverte aux élèves, **ou** c'est le staff qui regarde ;
 *   • l'année du lecteur atteint celle de la leçon — art. 14.4, « les matières
 *     accessibles à un personnage sont celles de son année en cours ». La
 *     question n'est pas reposée ici : elle s'appelle, par `peutOuvrirLAnnee`.
 */
export function peutOuvrirLaLecon(
  lecon: Lecon,
  peutOuvrirLAnnee: boolean,
  staff: boolean,
): boolean {
  if (staff) return true;
  return lecon.ouverteAuxEleves && peutOuvrirLAnnee;
}

/** Les leçons d'une matière pour une année, dans l'ordre. */
export function leconsDe(matiereId: string, annee: Annee): Lecon[] {
  return LECONS.filter(
    (l) => l.matiereId === matiereId && l.annee === annee,
  ).sort((a, b) => a.rang - b.rang);
}

/**
 * Le nom d'affichage d'une leçon, tiré du cursus.
 *
 * ⚠️ Rend `null` si la matière n'existe pas au cursus — ce qui ne devrait
 * jamais arriver, et se verrait tout de suite si cela arrivait.
 */
export function nomDeLaMatiere(lecon: Lecon): string | null {
  return matiereDe(lecon.matiereId)?.nom ?? null;
}
