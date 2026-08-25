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
import { BOUTIQUE_BJORNSTAV_OUVERTE } from "@/lib/ecole/baguette";
import {
  ENTREES_MENU,
  ROUTES,
  ROUTES_HORS_MENU,
  type EntreeMenu,
} from "@/lib/ecole/menu";

/** Le strict nécessaire pour décider — pas la fiche entière. */
export type EtatAcces = {
  statut: StatutDossier;
  statutAcces: StatutAcces;
  banniJusquau: Date | string | null;
  /** La maison, ou `null` tant que le Miroir n’a pas parlé. */
  maison: string | null;
  /** Nulle tant que la baguette n’a pas été choisie chez Bjornstav. */
  baguetteChoisieLe: Date | string | null;
};

/**
 * **La condition d’entrée dans l’école.**
 *
 * Elle ne dit pas « réparti », et c’est délibéré : l’accès se joue à deux
 * étages. Celui-ci ouvre la porte du château à tout dossier accepté et non
 * suspendu — le nouvel arrivant y trouve son bureau, et sur ce bureau la
 * liste de ce qu’il lui reste à faire. Le second étage, `estReparti`, décide
 * ensuite jusqu’où il va.
 *
 * Ajouter « et réparti » ici fermerait le bureau au nouvel arrivant, donc la
 * liste qui l’envoie devant le Miroir : il ne pourrait plus jamais y aller.
 */
export function peutEntrerDansLEcole(compte: EtatAcces): boolean {
  return compte.statut === "ACCEPTE" && compte.statutAcces === "VALIDE";
}

/** Dossier accepté, mais accès suspendu : le bureau et la fiche, rien d’autre. */
export function estBanni(compte: EtatAcces): boolean {
  return compte.statut === "ACCEPTE" && compte.statutAcces === "EN_BANNISSEMENT";
}

/**
 * Le Miroir a-t-il parlé ?
 *
 * C’est la maison qui fait foi, et non `repartiLe` : elle est ce que le site
 * affiche partout, et une date sans maison ne voudrait rien dire. La
 * répartition est définitive (art. 11.2) — une fois vraie, cette réponse ne
 * redevient jamais fausse.
 */
export function estReparti(compte: EtatAcces): boolean {
  return compte.maison !== null;
}

/**
 * La baguette est-elle choisie ?
 *
 * Tant que la boutique n’existe pas, la réponse est oui pour tout le monde —
 * voir `BOUTIQUE_BJORNSTAV_OUVERTE`, la seule bascule à retirer le jour où
 * elle ouvrira.
 */
export function aChoisiSaBaguette(compte: EtatAcces): boolean {
  if (!BOUTIQUE_BJORNSTAV_OUVERTE) return true;
  return compte.baguetteChoisieLe !== null;
}

/**
 * **Le second étage de l’accès.**
 *
 * `peutEntrerDansLEcole` ouvre la porte du château ; celui-ci décide jusqu’où
 * l’on va. Le nouvel arrivant a son bureau et sa fiche, et rien d’autre, tant
 * qu’il n’a pas franchi ses deux premiers pas : la baguette, puis le Miroir.
 */
export function aFiniLesPremiersPas(compte: EtatAcces): boolean {
  return aChoisiSaBaguette(compte) && estReparti(compte);
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
 * Deux états restreignent l’accès, pour des raisons opposées : le membre
 * suspendu, à qui l’on a fermé les portes, et le nouvel arrivant, qui ne les
 * a pas encore ouvertes. Les deux se déclarent de la même façon — par un
 * drapeau sur l’entrée — et **leur absence vaut fermeture** dans les deux
 * cas. Une entrée ajoutée plus tard sera donc interdite à l’un comme à
 * l’autre par défaut, ce qui est la règle voulue et qu’on ne risque pas
 * d’oublier.
 */
export function routeAutorisee(compte: EtatAcces, chemin: string): boolean {
  const entree = [...ENTREES_MENU, ...ROUTES_HORS_MENU].find(
    (e) => chemin === e.href || chemin.startsWith(`${e.href}/`),
  );

  // Chemin inconnu des deux listes : on ne l’ouvre pas sur une supposition.
  if (!entree) {
    return peutEntrerDansLEcole(compte) && aFiniLesPremiersPas(compte);
  }

  // Le bannissement passe avant tout le reste : un membre suspendu garde son
  // bureau et sa fiche, réparti ou non.
  if (estBanni(compte)) return entree.pendantBannissement === true;

  if (!peutEntrerDansLEcole(compte)) return false;
  if (aFiniLesPremiersPas(compte)) return true;
  return entree.avantPremiersPas === true;
}

/** Les entrées du bandeau que ce compte peut réellement ouvrir. */
export function entreesVisibles(compte: EtatAcces): readonly EntreeMenu[] {
  return ENTREES_MENU.filter((entree) => routeAutorisee(compte, entree.href));
}
