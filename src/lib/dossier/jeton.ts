/**
 * Jeton d’accès au dossier.
 *
 * Envoyé par courriel à la soumission, il permet au joueur de revenir
 * corriger sa fiche sans avoir à se connecter. Il porte l’identifiant du
 * compte, sa date d’expiration et la version des liens — et rien d’autre :
 * pas de contenu confidentiel dans une charge simplement signée.
 *
 * Les primitives de signature vivent dans `@/lib/signature`, partagées avec
 * la session et la réinitialisation du mot de passe.
 */

import { decoderSigne, encoderSigne } from "@/lib/signature";

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
  return encoderSigne(contenu);
}

export async function verifierJeton(
  jeton: string | undefined | null,
): Promise<VerificationJeton> {
  const decode = await decoderSigne<ContenuJeton>(jeton);
  if (!decode.valide) return decode;

  const contenu = decode.contenu;
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
