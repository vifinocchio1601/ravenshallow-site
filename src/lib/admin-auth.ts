/**
 * Authentification de la zone d'administration.
 *
 * Volontairement minimal — un seul mot de passe, pour un usage personnel.
 * `ADMIN_PASSWORD` n'est lu que côté serveur (route API et middleware) et
 * n'est jamais envoyé au client : le cookie ne contient pas le mot de passe
 * mais un HMAC-SHA256 dérivé de celui-ci. Changer le mot de passe invalide
 * donc automatiquement toutes les sessions ouvertes.
 *
 * L'implémentation passe par la Web Crypto API plutôt que par `node:crypto`,
 * afin de fonctionner à la fois dans la route API (runtime Node) et dans le
 * middleware (runtime Edge).
 */

export const ADMIN_COOKIE = "admin_session";

/** Durée de vie de la session : 7 jours, en secondes. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Message signé par le HMAC — le changer invalide les sessions existantes. */
const TOKEN_PAYLOAD = "ravenshallow-admin-session-v1";

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparaison à temps constant : ne révèle pas où deux chaînes divergent. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Le mot de passe soumis correspond-il à `ADMIN_PASSWORD` ? */
export function passwordMatches(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  // Sans mot de passe configuré, l'accès est refusé — jamais ouvert.
  if (!expected || !submitted) return false;
  return safeEqual(submitted, expected);
}

/** Valeur à poser dans le cookie de session. */
export async function createSessionToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return hmacHex(password, TOKEN_PAYLOAD);
}

/** Le cookie présenté correspond-il au mot de passe courant ? */
export async function isValidSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;

  const expected = await createSessionToken();
  if (!expected) return false;

  return safeEqual(token, expected);
}
