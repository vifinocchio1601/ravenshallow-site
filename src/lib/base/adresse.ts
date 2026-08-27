/**
 * L’adresse de la base, corrigée juste avant l’ouverture de la connexion.
 *
 * Neon suspend le calcul après quelques minutes sans requête. Le réveil
 * dépasse alors le délai d’attente par défaut de Prisma — cinq secondes —
 * et la page tombe sur « Can’t reach database server ». Ce n’est pas une
 * panne, mais rien ne le distingue d’une panne pour qui la reçoit.
 *
 * Le délai se pose sur l’adresse, et nulle part ailleurs : Prisma ne
 * l’expose sous aucune autre forme. Le poser **ici** plutôt que dans chaque
 * environnement évite d’avoir à retoucher un secret — sur Vercel, la valeur
 * est en écriture seule et ne se relit plus une fois enregistrée : l’allonger
 * de quinze caractères obligerait à la retaper en entier.
 *
 * L’adresse n’est jamais réécrite, seulement **allongée** : on n’en fait pas
 * un `URL` pour la reconstruire ensuite, car un mot de passe y ressortirait
 * ré-encodé. Seule la partie après le `?` est relue, pour savoir si le délai
 * s’y trouve déjà.
 */

/** Quinze secondes : Neon se réveille en cinq à dix, avec de la marge. */
export const DELAI_DE_CONNEXION_SECONDES = 15;

const PARAMETRE = "connect_timeout";

/** Le délai est-il déjà posé sur cette adresse, quelle qu’en soit la valeur ? */
function porteDejaUnDelai(adresse: string): boolean {
  const debutRequete = adresse.indexOf("?");
  if (debutRequete === -1) return false;
  return new URLSearchParams(adresse.slice(debutRequete + 1)).has(PARAMETRE);
}

/**
 * Rend l’adresse munie de son délai de connexion.
 *
 * Une adresse qui en porte déjà un n’est **pas** touchée : celle du poste de
 * développement le porte, et une valeur choisie à la main doit gagner.
 */
export function adresseAvecDelaiDeConnexion(adresse: string): string {
  if (adresse === "" || porteDejaUnDelai(adresse)) return adresse;

  const separateur =
    adresse.indexOf("?") === -1
      ? "?"
      : adresse.endsWith("?") || adresse.endsWith("&")
        ? ""
        : "&";

  return `${adresse}${separateur}${PARAMETRE}=${DELAI_DE_CONNEXION_SECONDES}`;
}
