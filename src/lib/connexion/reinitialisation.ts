import "server-only";
import { prisma } from "@/lib/prisma";
import { base64url, empreinte } from "@/lib/signature";

/**
 * Liens de réinitialisation du mot de passe.
 *
 * Le jeton est tiré au hasard sur 32 octets — pas signé comme celui du
 * dossier, parce qu’une signature ne se révoque pas. Ici il faut pouvoir dire
 * « celui-ci a déjà servi », donc il faut une ligne en base.
 *
 * Ce qu’on y range est l’**empreinte** du jeton, jamais le jeton : une base
 * dérobée ne permet de réinitialiser aucun compte. SHA-256 suffit — 32 octets
 * de hasard n’ont rien de la faible entropie d’un mot de passe humain, qui
 * exige argon2 et son coût calculé.
 */

/** Un lien vit une heure. Assez pour relever son courrier, pas pour traîner. */
export const REINITIALISATION_DUREE_MS = 60 * 60 * 1000;

/** Durée affichée dans le courriel et sur les écrans. */
export const REINITIALISATION_DUREE_TEXTE = "une heure";

function tirerJeton(): string {
  const octets = new Uint8Array(32);
  crypto.getRandomValues(octets);
  return base64url(octets);
}

/**
 * Émet un lien pour ce compte, et **consomme les précédents** : demander un
 * nouveau lien doit rendre l’ancien inutile, sans quoi un lien intercepté
 * resterait valable une heure de plus à chaque demande.
 */
export async function creerLienReinitialisation(
  utilisateurId: string,
): Promise<string> {
  const jeton = tirerJeton();

  await prisma.$transaction([
    prisma.jetonReinitialisation.deleteMany({
      where: { utilisateurId, utiliseLe: null },
    }),
    prisma.jetonReinitialisation.create({
      data: {
        utilisateurId,
        jetonHash: await empreinte(jeton),
        expireLe: new Date(Date.now() + REINITIALISATION_DUREE_MS),
      },
    }),
  ]);

  return jeton;
}

export type LectureJeton =
  | { valide: true; utilisateurId: string; jetonId: string }
  | { valide: false };

/** Le jeton est-il encore utilisable ? Sans le consommer. */
export async function lireJetonReinitialisation(
  jeton: string | undefined | null,
): Promise<LectureJeton> {
  if (!jeton) return { valide: false };

  const ligne = await prisma.jetonReinitialisation.findUnique({
    where: { jetonHash: await empreinte(jeton) },
    select: { id: true, utilisateurId: true, expireLe: true, utiliseLe: true },
  });

  if (!ligne || ligne.utiliseLe || ligne.expireLe.getTime() < Date.now()) {
    return { valide: false };
  }
  return { valide: true, utilisateurId: ligne.utilisateurId, jetonId: ligne.id };
}

/**
 * Change le mot de passe et referme tout derrière lui.
 *
 * Dans une seule transaction : le jeton est marqué comme servi, les autres
 * liens du compte sont effacés, l’empreinte du mot de passe est remplacée, et
 * les deux compteurs de version sautent — `sessionVersion` ferme toutes les
 * sessions ouvertes, `jetonVersion` périme les liens « modifier ma fiche »
 * déjà envoyés. Si quelqu’un s’était introduit, il perd tout d’un coup.
 */
export async function appliquerNouveauMotDePasse(
  jetonId: string,
  utilisateurId: string,
  motDePasseHash: string,
): Promise<{ email: string }> {
  const [, , compte] = await prisma.$transaction([
    prisma.jetonReinitialisation.update({
      where: { id: jetonId },
      data: { utiliseLe: new Date() },
    }),
    prisma.jetonReinitialisation.deleteMany({
      where: { utilisateurId, utiliseLe: null },
    }),
    prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        motDePasseHash,
        sessionVersion: { increment: 1 },
        jetonVersion: { increment: 1 },
      },
      select: { email: true },
    }),
  ]);

  return compte;
}

/** Adresse complète du lien envoyé par courriel. */
export function lienReinitialisation(jeton: string, base: string): string {
  return `${base.replace(/\/$/, "")}/reinitialisation/${jeton}`;
}
