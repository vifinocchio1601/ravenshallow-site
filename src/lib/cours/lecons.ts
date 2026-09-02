import { matiereDe, type Annee } from "./cursus";

/**
 * Les leçons en ligne — **et qui a le droit de les ouvrir**.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * Deux choses, et la seconde est la seule qui compte aujourd'hui : quelles
 * leçons existent, et **si elles sont ouvertes aux élèves**.
 *
 * ⚠️ **Aucune ne l'est pour l'instant.** Décision du joueur du 1er septembre
 * 2026, reconduite le 2 : les leçons sont posées pour qu'il les voie dans le
 * site, pas pour qu'on les joue. Le contrôle qui suit chacune n'existe pas
 * encore côté serveur — et tant qu'il n'existe pas, ouvrir une leçon
 * promettrait une suite qui n'arrive pas.
 *
 * ── Pourquoi un drapeau plutôt qu'une absence ──
 *
 * On aurait pu ne déclarer aucune des deux. Mais alors le joueur ne pourrait
 * pas les regarder en ligne, et c'est précisément ce qu'il demande. Le drapeau
 * dit ce qu'on veut dire — « elle existe, elle n'est pas encore ouverte » — là
 * où une absence dirait « elle n'existe pas ».
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
   * retirée du Grand Hall. Le jour où le contrôle fonctionnera côté serveur,
   * ce drapeau passera à vrai — et ce sera une décision du joueur, pas un
   * effet de bord.
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
    ouverteAuxEleves: false,
  },
  {
    matiereId: "runologie",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Vingt-quatre signes, vingt-quatre sons",
    ouverteAuxEleves: false,
  },
  {
    matiereId: "magie_defensive",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La garde et la distance",
    ouverteAuxEleves: false,
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
