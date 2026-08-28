import reglages from "@/config/salon.json";

/**
 * **Les plafonds d'un message de salon**, alignés sur les contraintes `CHECK`
 * de `20260828140000_salon_de_maison`.
 *
 * Séparés de `schema.ts` parce que le champ de saisie en a besoin, et qu'il
 * vit dans le navigateur.
 */

/** Mille signes. Un salon n'est ni une scène ni une annonce. */
export const MESSAGE_MAX = 1000;

/** Combien la pièce en montre. Le reste dort en base : rien n'est effacé. */
export const MESSAGES_AFFICHES: number = reglages.messagesAffiches;

/** Le pas d'interrogation. Le direct n'existe pas sur cette architecture. */
export const RAFRAICHISSEMENT_MS: number = reglages.rafraichissementMs;
