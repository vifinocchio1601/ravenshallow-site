import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/ecole/menu";
import type { Fonction, Genre, StatutAcces, StatutDossier } from "@/lib/dossier/etats";
import { destinationApres, routeAutorisee, type EtatAcces } from "./acces";
import { COOKIE_SESSION, lireSession } from "./session";

/**
 * La garde des pages protégées.
 *
 * Le cookie dit qui c’est ; **la base dit ce qu’il a le droit de faire**. Les
 * deux lectures sont séparées à dessein : un dossier renvoyé en correction,
 * un bannissement ou un changement de mot de passe prennent effet à la page
 * suivante, sans attendre l’expiration du cookie.
 *
 * Le middleware ne peut pas faire ce travail : il tourne en runtime Edge, où
 * Prisma n’a pas sa place. Il ne fait qu’un premier tri sur la signature du
 * cookie ; la vérité est ici, côté serveur, dans le gabarit de chaque page.
 */

export type CompteConnecte = EtatAcces & {
  id: string;
  /**
   * L’identifiant de la **fiche**, distinct de celui du compte. Nul si le
   * compte n’a pas de fiche — un cas qui ne devrait pas exister.
   */
  eleveId: string | null;
  email: string;
  sessionVersion: number;
  jetonVersion: number;
  /** Le mot laissé par l’administration : motif de refus, ou correction. */
  noteAdmin: string | null;
  /**
   * La baguette, pour l’afficher — l’accès, lui, ne regarde que la date, et
   * c’est `EtatAcces` qui la porte. Nuls tant que l’élève n’est pas passé à
   * Kaldvik ; la base garantit que les trois vont ensemble.
   */
  baguetteBois: string | null;
  baguetteCoeur: string | null;
  prenomNom: string;
  genre: Genre;
  fonction: Fonction;
  age: number;
};

export async function compteConnecte(): Promise<CompteConnecte | null> {
  const contenu = await lireSession(cookies().get(COOKIE_SESSION)?.value);
  if (!contenu) return null;

  const compte = await prisma.utilisateur.findUnique({
    where: { id: contenu.id },
    select: {
      id: true,
      email: true,
      sessionVersion: true,
      jetonVersion: true,
      statutAcces: true,
      banniJusquau: true,
      eleve: {
        select: {
          id: true,
          statut: true,
          noteAdmin: true,
          prenomNom: true,
          genre: true,
          fonction: true,
          age: true,
          maison: true,
          baguetteBois: true,
          baguetteCoeur: true,
          baguetteChoisieLe: true,
        },
      },
    },
  });
  if (!compte) return null;

  // Mot de passe changé depuis : toutes les sessions antérieures tombent.
  if (compte.sessionVersion !== contenu.v) return null;

  const eleve = compte.eleve;

  return {
    id: compte.id,
    eleveId: eleve?.id ?? null,
    email: compte.email,
    sessionVersion: compte.sessionVersion,
    jetonVersion: compte.jetonVersion,
    noteAdmin: eleve?.noteAdmin ?? null,
    statutAcces: compte.statutAcces as StatutAcces,
    banniJusquau: compte.banniJusquau,
    // Un compte sans fiche ne devrait pas exister ; s’il en apparaissait un,
    // il est traité comme une demande jamais envoyée plutôt qu’ouvert.
    statut: (eleve?.statut ?? "BROUILLON") as StatutDossier,
    maison: eleve?.maison ?? null,
    baguetteBois: eleve?.baguetteBois ?? null,
    baguetteCoeur: eleve?.baguetteCoeur ?? null,
    baguetteChoisieLe: eleve?.baguetteChoisieLe ?? null,
    prenomNom: eleve?.prenomNom ?? "",
    genre: (eleve?.genre ?? "AUTRE") as Genre,
    fonction: (eleve?.fonction ?? "PREMIERE_ANNEE") as Fonction,
    age: eleve?.age ?? 13,
  };
}

/** Connecté, quel que soit l’état du dossier. Sinon : la page de connexion. */
export async function exigerConnexion(): Promise<CompteConnecte> {
  const compte = await compteConnecte();
  if (!compte) redirect(ROUTES.connexion);
  return compte;
}

/**
 * Garde des trois écrans d’état.
 *
 * Chaque page annonce le chemin qu’elle occupe ; si ce n’est pas celui que
 * l’état du compte lui réserve, elle renvoie où il faut. C’est la même table
 * de vérité que la connexion — aucune condition n’est réécrite ici.
 */
export async function exigerEtat(chemin: string): Promise<CompteConnecte> {
  const compte = await exigerConnexion();
  const attendue = destinationApres(compte);
  if (attendue !== chemin) redirect(attendue);
  return compte;
}

/**
 * Connecté **et** autorisé sur ce chemin. Sinon, renvoi vers la destination
 * que lui réserve son état — la même que celle calculée à la connexion.
 */
export async function exigerAcces(chemin: string): Promise<CompteConnecte> {
  const compte = await exigerConnexion();
  if (!routeAutorisee(compte, chemin)) redirect(destinationApres(compte));
  return compte;
}
