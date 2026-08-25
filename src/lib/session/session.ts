/**
 * La session du joueur.
 *
 * Un cookie signé, sans état : il porte l’identifiant du compte, la version
 * de session en cours et une date d’expiration. Pas de table de sessions à
 * maintenir, et le middleware peut le lire en runtime Edge sans toucher la
 * base.
 *
 * Ce que le cookie **ne fait pas** : accorder un droit. Il dit « ce visiteur
 * est ce compte ». L’état du dossier, le bannissement et la version de
 * session sont relus en base à chaque page protégée — voir `garde.ts`. Un
 * cookie volé ne survit donc pas à un changement de mot de passe.
 */

import { decoderSigne, encoderSigne } from "@/lib/signature";

export const COOKIE_SESSION = "ravenshallow_session";

/** Durée de vie : 30 jours. Un forum se visite par à-coups, pas tous les jours. */
export const SESSION_DUREE = 60 * 60 * 24 * 30;

export type ContenuSession = {
  id: string;
  /** `sessionVersion` du compte à l’ouverture — voir `garde.ts`. */
  v: number;
  expire: number;
};

export async function creerSession(
  id: string,
  sessionVersion: number,
  dureeSecondes: number = SESSION_DUREE,
): Promise<string> {
  const contenu: ContenuSession = {
    id,
    v: sessionVersion,
    expire: Math.floor(Date.now() / 1000) + dureeSecondes,
  };
  return encoderSigne(contenu);
}

/** Signature et expiration seulement — l’état du compte se lit en base. */
export async function lireSession(
  valeur: string | undefined | null,
): Promise<ContenuSession | null> {
  const decode = await decoderSigne<ContenuSession>(valeur);
  if (!decode.valide) return null;

  const contenu = decode.contenu;
  if (
    !contenu?.id ||
    typeof contenu.v !== "number" ||
    typeof contenu.expire !== "number"
  ) {
    return null;
  }
  if (contenu.expire * 1000 < Date.now()) return null;

  return contenu;
}

/**
 * Réglages du cookie.
 *
 *   `httpOnly` — hors de portée de tout script de la page
 *   `sameSite: lax` — suit un lien venu d’un courriel, mais n’est pas joint
 *                     aux requêtes déclenchées par un autre site
 *   `secure` — en production seulement : `localhost` est en http
 */
export function optionsCookie(maxAge: number = SESSION_DUREE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
