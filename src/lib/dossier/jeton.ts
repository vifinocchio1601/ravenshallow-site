/**
 * Jeton d’accès au dossier.
 *
 * Envoyé par courriel à la soumission, il permet au joueur de revenir
 * corriger sa fiche sans avoir à se connecter. Signé par HMAC-SHA256 avec
 * `AUTH_SECRET` : il porte l’identifiant du compte et sa date d’expiration,
 * et rien d’autre — pas de contenu confidentiel.
 *
 * Web Crypto plutôt que `node:crypto`, pour rester utilisable en runtime Edge
 * comme en Node — même choix que `admin-auth.ts`.
 */

/** Durée de validité : 30 jours, en secondes. */
export const JETON_DUREE = 60 * 60 * 24 * 30;

export type ContenuJeton = {
  id: string;
  expire: number;
  /** Version des liens au moment de l’émission — voir `jetonVersion`. */
  v: number;
};

export type VerificationJeton =
  | { valide: true; contenu: ContenuJeton }
  | { valide: false; raison: "absent" | "malforme" | "signature" | "expire" };

function base64url(octets: Uint8Array): string {
  let binaire = "";
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function depuisBase64url(valeur: string): Uint8Array {
  const complet = valeur.replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(complet + "=".repeat((4 - (complet.length % 4)) % 4));
  return Uint8Array.from(binaire, (c) => c.charCodeAt(0));
}

async function signer(charge: string): Promise<string> {
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
  const signature = await crypto.subtle.sign(
    "HMAC",
    cle,
    encodeur.encode(charge),
  );
  return base64url(new Uint8Array(signature));
}

/** Comparaison à temps constant. */
function egales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let ecart = 0;
  for (let i = 0; i < a.length; i += 1) ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ecart === 0;
}

export async function creerJeton(
  id: string,
  version = 0,
  dureeSecondes: number = JETON_DUREE,
): Promise<string> {
  const contenu: ContenuJeton = {
    id,
    expire: Math.floor(Date.now() / 1000) + dureeSecondes,
    v: version,
  };
  const charge = base64url(new TextEncoder().encode(JSON.stringify(contenu)));
  return `${charge}.${await signer(charge)}`;
}

export async function verifierJeton(
  jeton: string | undefined | null,
): Promise<VerificationJeton> {
  if (!jeton) return { valide: false, raison: "absent" };

  const separateur = jeton.lastIndexOf(".");
  if (separateur <= 0) return { valide: false, raison: "malforme" };

  const charge = jeton.slice(0, separateur);
  const signature = jeton.slice(separateur + 1);

  let attendue: string;
  try {
    attendue = await signer(charge);
  } catch {
    return { valide: false, raison: "signature" };
  }
  if (!egales(signature, attendue)) {
    return { valide: false, raison: "signature" };
  }

  let contenu: ContenuJeton;
  try {
    contenu = JSON.parse(new TextDecoder().decode(depuisBase64url(charge)));
  } catch {
    return { valide: false, raison: "malforme" };
  }
  if (
    !contenu?.id ||
    typeof contenu.expire !== "number" ||
    typeof contenu.v !== "number"
  ) {
    return { valide: false, raison: "malforme" };
  }
  if (contenu.expire * 1000 < Date.now()) {
    return { valide: false, raison: "expire" };
  }

  return { valide: true, contenu };
}

/** Adresse complète du dossier, pour le lien envoyé par courriel. */
export function lienDossier(jeton: string, base: string): string {
  return `${base.replace(/\/$/, "")}/dossier/${jeton}`;
}
