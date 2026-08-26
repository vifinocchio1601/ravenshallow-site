/**
 * **Ce qui fait dix lignes** — art. 12.2.
 *
 * Partagé **mot pour mot** entre le compteur du champ de saisie et la route
 * qui publie : deux comptages qui divergent, c’est un joueur qui voit « 10 »
 * à l’écran et se fait refuser son post. Même choix que `dossier/schema.ts`.
 *
 * ── Pourquoi le hors-RP ne compte pas ──
 *
 * L’article 12.3 autorise le hors-RP entre balises `[HRP]`, « mais ne doit pas
 * prendre le pas sur le RP lui-même ». S’il comptait dans le minimum, on
 * pourrait atteindre les dix lignes sans écrire une ligne de jeu — et la règle
 * ne dirait plus rien. Les blocs sont donc retirés **avant** de compter.
 *
 * Les lignes vides ne comptent pas non plus : dix retours à la ligne ne font
 * pas un post. C’est le même piège que `btrim` sur les corbeaux, vu de l’autre
 * côté.
 */

/** Le minimum du domaine (art. 12.2). Les autres espaces n’en ont aucun. */
export const LIGNES_MINIMUM_RP = 10;

/**
 * Les blocs hors-RP, retirés avant comptage.
 *
 * Insensible à la casse, et tolérant à un bloc jamais refermé — quelqu’un qui
 * ouvre `[HRP]` en fin de post et oublie la fermeture ne doit pas voir tout
 * son RP disparaître du compte… mais ne doit pas non plus faire compter son
 * commentaire. On coupe donc à la fin.
 */
const BLOC_HRP = /\[hrp\][\s\S]*?(?:\[\/hrp\]|$)/gi;

export function sansHorsRP(corps: string): string {
  return corps.replace(BLOC_HRP, "");
}

/**
 * Le nombre de lignes qui comptent : celles qui portent autre chose que du
 * blanc, une fois le hors-RP retiré.
 */
export function lignesUtiles(corps: string): number {
  return sansHorsRP(corps)
    .split(/\r?\n/)
    .filter((ligne) => /[^\s]/.test(ligne)).length;
}

/**
 * Le minimum est-il atteint ? `null` = aucun minimum, et tout passe — sauf le
 * vide, que la base refuse de toute façon.
 */
export function respecteLeMinimum(
  corps: string,
  minimum: number | null,
): boolean {
  if (minimum === null) return /[^\s]/.test(corps);
  return lignesUtiles(corps) >= minimum;
}

/** Ce qu’il reste à écrire. Zéro quand c’est bon — jamais un nombre négatif. */
export function lignesManquantes(
  corps: string,
  minimum: number | null,
): number {
  if (minimum === null) return 0;
  return Math.max(0, minimum - lignesUtiles(corps));
}
