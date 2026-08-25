/**
 * Signature des jetons du site — lien de dossier, session, réinitialisation.
 *
 * Tout passe par HMAC-SHA256 avec `AUTH_SECRET`, en **Web Crypto** plutôt
 * qu'en `node:crypto` : le middleware tourne en runtime Edge, où `node:crypto`
 * n'existe pas, et il doit pouvoir lire un cookie de session sans appeler la
 * base.
 *
 * Un jeton signé prouve son intégrité, rien de plus. Il ne chiffre rien :
 * n'y mettre que ce qui pourrait s'afficher en clair — un identifiant, une
 * date d'expiration, un numéro de version. Jamais un mot de passe, jamais un
 * droit qu'on ne revérifierait pas côté serveur.
 */

export function base64url(octets: Uint8Array): string {
  let binaire = "";
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function depuisBase64url(valeur: string): Uint8Array {
  const complet = valeur.replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(complet + "=".repeat((4 - (complet.length % 4)) % 4));
  return Uint8Array.from(binaire, (c) => c.charCodeAt(0));
}

export async function signer(charge: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant");

  const encodeur = new TextEncoder();
  const cle = await crypto.subtle.importKey(
    "raw",
    encodeur.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cle, encodeur.encode(charge));
  return base64url(new Uint8Array(signature));
}

/**
 * Comparaison à temps constant : le temps de réponse ne dit pas à quel
 * caractère deux chaînes divergent, ce qui interdit de reconstruire une
 * signature valide essai après essai.
 */
export function egales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let ecart = 0;
  for (let i = 0; i < a.length; i += 1) ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ecart === 0;
}

/** Empreinte SHA-256, en hexadécimal. */
export async function empreinte(valeur: string): Promise<string> {
  const octets = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(valeur),
  );
  return Array.from(new Uint8Array(octets))
    .map((o) => o.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Empreinte HMAC : comme `empreinte`, mais dérivée du secret du site. Sert à
 * ranger une donnée personnelle — une adresse, une IP — sans la conserver :
 * on peut retrouver la ligne d'une valeur connue, jamais la valeur d'une ligne.
 */
export async function empreinteSecrete(valeur: string): Promise<string> {
  return signer(`empreinte:${valeur}`);
}

// ─────────────────────────────────────────────────────────────
//  Charge signée : « contenu.signature », en base64url
// ─────────────────────────────────────────────────────────────

export async function encoderSigne(contenu: unknown): Promise<string> {
  const charge = base64url(new TextEncoder().encode(JSON.stringify(contenu)));
  return `${charge}.${await signer(charge)}`;
}

export type Decodage<T> =
  | { valide: true; contenu: T }
  | { valide: false; raison: "absent" | "malforme" | "signature" };

export async function decoderSigne<T>(
  jeton: string | undefined | null,
): Promise<Decodage<T>> {
  if (!jeton) return { valide: false, raison: "absent" };

  const separateur = jeton.lastIndexOf(".");
  if (separateur <= 0) return { valide: false, raison: "malforme" };

  const charge = jeton.slice(0, separateur);
  const signature = jeton.slice(separateur + 1);

  let attendue: string;
  try {
    attendue = await signer(charge);
  } catch {
    // `AUTH_SECRET` absent : on refuse, on n'ouvre jamais par défaut.
    return { valide: false, raison: "signature" };
  }
  if (!egales(signature, attendue)) return { valide: false, raison: "signature" };

  try {
    return {
      valide: true,
      contenu: JSON.parse(new TextDecoder().decode(depuisBase64url(charge))) as T,
    };
  } catch {
    return { valide: false, raison: "malforme" };
  }
}
