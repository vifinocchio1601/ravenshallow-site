/**
 * Qui entre, et où l’on atterrit.
 *
 * **C’est le seul endroit du site qui répond à ces deux questions.** La
 * connexion, le middleware et chaque page de l’école s’y réfèrent — jamais
 * l’inverse, jamais une condition recopiée ailleurs.
 *
 * Deux axes indépendants gouvernent l’accès :
 *
 *   `statut`      — l’état du dossier d’admission (a-t-il été accepté ?)
 *   `statutAcces` — le droit d’accès courant (est-il suspendu ?)
 *
 * Un dossier accepté de longue date peut être banni sans que la candidature
 * soit rejouée : c’est pourquoi les deux ne se confondent pas.
 */

import type { StatutAcces, StatutDossier } from "@/lib/dossier/etats";
import { ENTREES_MENU, ROUTES } from "@/lib/ecole/menu";

/** Le strict nécessaire pour décider — pas la fiche entière. */
export type EtatAcces = {
  statut: StatutDossier;
  statutAcces: StatutAcces;
  banniJusquau: Date | string | null;
  /** Réservé : la répartition n’existe pas encore. */
  maison: string | null;
};

/**
 * **La condition d’entrée dans l’école.**
 *
 * Le jour où le Miroir de Brume et la boutique Bjornstav existeront, c’est
 * ici — et nulle part ailleurs — qu’on ajoutera « et réparti ». Les colonnes
 * `maison` et `baguetteBois` attendent déjà en base.
 */
export function peutEntrerDansLEcole(compte: EtatAcces): boolean {
  return compte.statut === "ACCEPTE" && compte.statutAcces === "VALIDE";
}

/** Dossier accepté, mais accès suspendu : le bureau et la fiche, rien d’autre. */
export function estBanni(compte: EtatAcces): boolean {
  return compte.statut === "ACCEPTE" && compte.statutAcces === "EN_BANNISSEMENT";
}

/**
 * Bannissement à durée déterminée (art. 8, niveau 4) ou définitif (niveau 5) ?
 * Une date absente vaut exclusion définitive.
 */
export function finDuBannissement(compte: EtatAcces): Date | null {
  if (!compte.banniJusquau) return null;
  const date = new Date(compte.banniJusquau);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Où atterrit ce compte après connexion, ou lorsqu’il vise une route
 * interdite. Une seule table de vérité, lue par la connexion comme par la
 * protection des routes.
 */
export function destinationApres(compte: EtatAcces): string {
  switch (compte.statut) {
    case "A_CORRIGER":
      return ROUTES.correction;
    case "REFUSE":
      return ROUTES.refus;
    case "BROUILLON":
      // Demande jamais envoyée : on renvoie la terminer.
      return ROUTES.inscription;
    case "ACCEPTE":
      // Le dossier est accepté ; reste l’axe de l’accès.
      return compte.statutAcces === "EN_ATTENTE" ? ROUTES.attente : ROUTES.bureau;
    case "EN_ATTENTE":
    default:
      return ROUTES.attente;
  }
}

/**
 * Ce compte peut-il ouvrir ce chemin de l’école ?
 *
 * La réponse se déduit du menu : une entrée est fermée pendant un
 * bannissement **sauf** si elle porte `pendantBannissement`. Toute entrée
 * ajoutée plus tard sera donc interdite au membre banni par défaut — ce qui
 * est le comportement voulu, et qu’on ne risque pas d’oublier.
 */
export function routeAutorisee(compte: EtatAcces, chemin: string): boolean {
  const entree = ENTREES_MENU.find(
    (e) => chemin === e.href || chemin.startsWith(`${e.href}/`),
  );
  // Chemin hors menu : on ne l’ouvre pas sur une supposition.
  if (!entree) return peutEntrerDansLEcole(compte);

  if (peutEntrerDansLEcole(compte)) return true;
  if (estBanni(compte)) return entree.pendantBannissement === true;
  return false;
}
