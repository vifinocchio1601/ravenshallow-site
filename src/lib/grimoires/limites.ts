/**
 * **Les plafonds d'un grimoire**, alignés sur les contraintes `CHECK` de
 * `20260830140000_grimoires`.
 *
 * Séparés de `schema.ts` parce que celui-ci est `server-only` : un champ de
 * saisie a besoin de connaître une longueur maximale, et il ne peut pas
 * embarquer le nettoyeur de balisage. Même partage que pour les annonces.
 */

export const SLUG_MAX = 80;
export const TITRE_GRIMOIRE_MAX = 120;
export const EXERGUE_MAX = 200;
export const DESCRIPTION_GRIMOIRE_MAX = 300;
export const TITRE_CHAPITRE_MAX = 120;
export const ANCRE_MAX = 120;

/** Un sous-titre est une ligne, jamais un paragraphe. */
export const SOUS_TITRE_MAX = 140;

/** Le balisage d'un paragraphe, tel qu'il est stocké. */
export const PARAGRAPHE_MAX = 20000;

/** Le nom d'un sort, sa formule, son verbe. */
export const NOM_SORT_MAX = 120;

/** Ce qu'un sort fait, et ce qu'il ne fait pas. */
export const EFFET_MAX = 1000;

/**
 * Deux runes au plus : une pour un sort simple, deux pour un sort lié. Le
 * grimoire des Sortilèges n'en connaît pas d'autre forme.
 */
export const GLYPHES_MAX = 2;

/** Le tableau des vingt-quatre runes en a quatre. */
export const COLONNES_MAX = 8;
export const LIGNES_TABLEAU_MAX = 200;

/**
 * Les rubriques d'une fiche interdite : « Ce qu'il fait », « Le prix payé »,
 * « La trace visible », « Ce qu'un joueur peut en faire ». Quatre au
 * document ; le plafond laisse de la marge sans laisser passer un roman.
 */
export const RUBRIQUES_MAX = 8;
