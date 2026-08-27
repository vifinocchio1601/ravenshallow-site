/**
 * **Les plafonds d'un post**, alignés sur les contraintes `CHECK` de
 * `20260826120000_forum`.
 *
 * Séparés de `schema.ts` depuis que celui-ci est `server-only` : le champ de
 * saisie a besoin de connaître la longueur maximale d'un titre, et il ne peut
 * plus lire un fichier qui embarque le nettoyeur de balisage. Ce sont trois
 * nombres, et ils n'ont besoin de rien d'autre.
 */

export const TITRE_MAX = 140;

/**
 * Le corps **balisage compris** — c'est ce qui est stocké, donc ce que la
 * base mesure. Le minimum, lui, se compte en caractères réels : voir
 * `longueur.ts`.
 */
export const POST_MAX = 60000;

/** Une mention, pas une explication : « violence », « deuil ». */
export const AVERTISSEMENT_MAX = 120;
