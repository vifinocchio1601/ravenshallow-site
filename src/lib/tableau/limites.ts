/**
 * **Les plafonds d'un mot du tableau**, alignés sur les contraintes `CHECK`
 * de `20260828120000_tableau_de_maison`.
 *
 * Séparés de `schema.ts` parce que le champ de saisie a besoin de connaître
 * la longueur maximale, et qu'il vit dans le navigateur.
 */

/**
 * Cinq cents signes : la mesure d'un **mot**, pas d'un article.
 *
 * Le mur n'a pas la place, et c'est délibéré : ce qui demande davantage est
 * une annonce du Grand Hall, ou une scène. À revoir après avoir vu de vrais
 * mots — comme la largeur d'une ligne de post.
 */
export const MOT_MAX = 500;

/** Combien de mots le tableau montre à la fois. Les plus anciens sortent. */
export const MOTS_AFFICHES = 10;
