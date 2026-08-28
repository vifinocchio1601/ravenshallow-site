/**
 * **Les règles de langue qui se recopient mal.**
 *
 * Pas un fourre-tout : ce fichier ne porte que ce qui doit se décider **une
 * fois** parce qu'un composant qui l'improvise se trompe une fois sur deux.
 * Les autres règles françaises du site vivent là où elles servent —
 * « 0 point » au singulier dans `points/affichage.ts`, « le 1er août » dans
 * `dates.ts` — et n'ont pas à déménager ici.
 */

/** Les voyelles devant lesquelles « de » s'élide. */
const VOYELLES = "aeiouyàâäéèêëîïôöùûü";

/**
 * **« de Sigrid », mais « d'Alaric ».**
 *
 * Le site nomme quatre fondateurs, dont deux commencent par une voyelle :
 * l'écran affichait « Héritage de Alaric Nattmor » et « de Einar Tidevann »
 * avant qu'on le relise. C'est la faute qu'on ne voit plus à force de coder
 * en gabarits.
 *
 * ⚠️ **Le « h » n'est pas traité**, et c'est délibéré : muet il s'élide
 * (« d'Hel »), aspiré il ne s'élide pas (« de Hel »), et rien dans un nom ne
 * dit lequel. Aucun nom du site ne commence par un h ; le jour où il y en
 * aura un, ce sera au joueur de dire comment on le prononce.
 */
export function avecDe(nom: string): string {
  const premiere = nom.trim().charAt(0).toLowerCase();
  return VOYELLES.includes(premiere) ? `d’${nom}` : `de ${nom}`;
}
