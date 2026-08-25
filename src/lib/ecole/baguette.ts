/**
 * La baguette de Bjornstav — libellés seulement.
 *
 * Les colonnes existent en base et restent vides : la boutique n’ouvre pas
 * dans ce lot. Ces tables permettent à Ma fiche d’afficher une baguette le
 * jour où il y en aura une, sans rien changer d’autre.
 */

/**
 * **La bascule à retirer le jour où Bjornstav ouvrira, et la seule.**
 *
 * Tant qu’elle vaut `false`, l’étape de la baguette est réputée franchie :
 * sans quoi la seconde ligne de la liste des premiers pas resterait
 * verrouillée pour toujours, et personne n’atteindrait jamais le Miroir.
 *
 * Quand la boutique existera : passer à `true`, et `aChoisiSaBaguette` lira
 * la vraie colonne `baguetteChoisieLe`. Rien d’autre à changer.
 */
export const BOUTIQUE_BJORNSTAV_OUVERTE = false;

export const BOIS: Record<string, string> = {
  FRENE: "Frêne",
  IF: "If",
  SORBIER: "Sorbier",
  BOULEAU: "Bouleau",
  CHENE_DES_TEMPETES: "Chêne des tempêtes",
};

export const COEURS: Record<string, string> = {
  PLUME_DE_CORBEAU: "plume de corbeau",
  ECAILLE_ANGUILLE_ARGENTEE: "écaille d’anguille argentée",
  NERF_LOUP_DES_FJORDS: "nerf de loup des fjords",
  GRIFFE_OURS_DES_CAVERNES: "griffe d’ours des cavernes",
  CRISTAL_DE_GLACE: "cristal de glace",
};

/** « Frêne, cœur de plume de corbeau » — ou rien du tout. */
export function libelleBaguette(
  bois: string | null,
  coeur: string | null,
): string | null {
  if (!bois && !coeur) return null;
  const essence = bois ? BOIS[bois] ?? bois : null;
  const ame = coeur ? COEURS[coeur] ?? coeur : null;
  if (essence && ame) return `${essence}, cœur de ${ame}`;
  return essence ?? ame;
}
