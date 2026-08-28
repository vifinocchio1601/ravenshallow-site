/**
 * **Les plafonds d'une annonce**, alignés sur les contraintes `CHECK` de
 * `20260828100000_grand_hall`.
 *
 * Séparés de `schema.ts` parce que celui-ci est `server-only` : le champ de
 * saisie a besoin de connaître la longueur maximale d'un titre, et il ne peut
 * pas embarquer le nettoyeur de balisage.
 *
 * ⚠️ **Ces deux nombres valent aujourd'hui ceux d'un post, et ce n'est pas la
 * même règle.** Un titre de scène et un titre d'annonce se ressemblent ; rien
 * n'oblige à les faire bouger ensemble. Les lire dans `forum/limites.ts`
 * aurait lié deux décisions qui n'ont aucun rapport.
 */

/** Une ligne de titre, pas un paragraphe. */
export const TITRE_ANNONCE_MAX = 140;

/** Le corps **balisage compris** — c'est ce qui est stocké, donc ce que la
 * base mesure. */
export const CORPS_ANNONCE_MAX = 60000;

/** Ce que le journal du bureau montre d'une annonce, en signes. */
export const EXTRAIT_MAX = 140;
