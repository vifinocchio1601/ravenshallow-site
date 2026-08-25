/**
 * La baguette de Bjornstav — les codes et les libellés, et rien d’autre.
 *
 * **Ce fichier est lisible par le navigateur.** Il ne porte que ce qui
 * s’affiche une fois la baguette choisie : son nom, sur Ma fiche et au
 * bureau. Le récit de la boutique, les descriptions des cartes et les
 * vingt-cinq réactions vivent à part, dans `lib/bjornstav/constantes.ts`,
 * qui ne sort jamais du serveur.
 *
 * Les codes sont le miroir exact des enums Prisma `BaguetteBois` et
 * `BaguetteCoeur` : le joueur ne les voit jamais, la base ne connaît qu’eux.
 */

export const CODES_BOIS = [
  "FRENE",
  "IF",
  "SORBIER",
  "BOULEAU",
  "CHENE_DES_TEMPETES",
] as const;

export const CODES_COEUR = [
  "PLUME_DE_CORBEAU",
  "ECAILLE_ANGUILLE_ARGENTEE",
  "NERF_LOUP_DES_FJORDS",
  "GRIFFE_OURS_DES_CAVERNES",
  "CRISTAL_DE_GLACE",
] as const;

export type CodeBois = (typeof CODES_BOIS)[number];
export type CodeCoeur = (typeof CODES_COEUR)[number];

/**
 * Les noms tels qu’ils s’écrivent, et le seul endroit où ils s’écrivent.
 *
 * Les cartes de la boutique les reprennent d’ici plutôt que de les recopier :
 * un nom changé doit l’être partout d’un coup, y compris sur les fiches déjà
 * remplies.
 */
export const BOIS: Record<CodeBois, string> = {
  FRENE: "Frêne",
  IF: "If",
  SORBIER: "Sorbier",
  BOULEAU: "Bouleau",
  CHENE_DES_TEMPETES: "Chêne des tempêtes",
};

/** En minuscule : ils se lisent toujours après « cœur de ». */
export const COEURS: Record<CodeCoeur, string> = {
  PLUME_DE_CORBEAU: "plume de corbeau",
  ECAILLE_ANGUILLE_ARGENTEE: "écaille d’anguille argentée",
  NERF_LOUP_DES_FJORDS: "nerf de loup des fjords",
  GRIFFE_OURS_DES_CAVERNES: "griffe d’ours des cavernes",
  CRISTAL_DE_GLACE: "cristal de glace",
};

/**
 * Ce code vient-il bien de la liste ?
 *
 * **Le serveur repose là-dessus et sur rien d’autre** pour accepter ce qu’un
 * navigateur lui envoie : une route d’API est publique, et le formulaire de
 * la boutique n’est qu’une façon parmi d’autres de l’appeler.
 */
export function estCodeBois(valeur: unknown): valeur is CodeBois {
  return (
    typeof valeur === "string" && (CODES_BOIS as readonly string[]).includes(valeur)
  );
}

export function estCodeCoeur(valeur: unknown): valeur is CodeCoeur {
  return (
    typeof valeur === "string" && (CODES_COEUR as readonly string[]).includes(valeur)
  );
}

/**
 * « Frêne, cœur de plume de corbeau » — ou rien du tout.
 *
 * Les paramètres sont de simples chaînes, et non des codes : ils viennent de
 * la base, où une valeur écrite avant un renommage pourrait subsister. Un
 * code inconnu s’affiche alors tel quel, plutôt que de faire tomber la fiche.
 */
export function libelleBaguette(
  bois: string | null,
  coeur: string | null,
): string | null {
  if (!bois && !coeur) return null;
  const essence = bois ? (estCodeBois(bois) ? BOIS[bois] : bois) : null;
  const ame = coeur ? (estCodeCoeur(coeur) ? COEURS[coeur] : coeur) : null;
  if (essence && ame) return `${essence}, cœur de ${ame}`;
  return essence ?? ame;
}
