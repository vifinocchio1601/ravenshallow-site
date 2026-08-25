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

import type { EtatEtape, StatutAcces, StatutDossier } from "@/lib/dossier/etats";
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
  /**
   * La maison, ou `null`. **Elle ne dit pas où en est le compte** : c’est
   * `etatMaison` qui le dit, et une maison écrite peut très bien accompagner
   * un état `SANS_OBJET` — c’est ainsi qu’une directrice garde la sienne.
   */
  maison: string | null;
  /** Même remarque : la date n’est plus la question, l’état l’est. */
  baguetteChoisieLe: Date | string | null;

  /**
   * **Où en est chacune des deux étapes.** Toute la circulation en découle,
   * et rien d’autre : ni la maison ni la date de baguette ne décident plus de
   * quoi que ce soit.
   */
  etatMaison: EtatEtape;
  etatBaguette: EtatEtape;
};

/**
 * **Les six questions qu’on a le droit de poser sur une étape.**
 *
 * Trois par étape, une par état — et c’est ici, et nulle part ailleurs, qu’on
 * compare un état à une valeur. Une page qui écrirait
 * `etatMaison === "SANS_OBJET"` dans son coin recopierait la règle, et c’est
 * la copie qu’on oublierait de corriger le jour où elle bouge.
 *
 * Elles ne prennent que la case dont elles ont besoin : la fiche d’un membre
 * comme le compte connecté y répondent, sans qu’on ait à convertir l’un en
 * l’autre.
 */

/** La maison s’affiche-t-elle ? `FAIT`, et rien d’autre. */
export function aUneMaison(compte: { etatMaison: EtatEtape }): boolean {
  return compte.etatMaison === "FAIT";
}

/** Même règle pour la baguette. */
export function aUneBaguette(compte: { etatBaguette: EtatEtape }): boolean {
  return compte.etatBaguette === "FAIT";
}

/**
 * La répartition concerne-t-elle ce compte, d’une manière ou d’une autre ?
 *
 * Vraie pour un élève réparti comme pour celui qu’on attend ; fausse pour une
 * directrice. C’est cette question-là — et non « a-t-il une maison ? » — qui
 * décide si l’on montre un compteur, une promesse de compteur, ou rien.
 */
export function estConcerneParLeMiroir(compte: {
  etatMaison: EtatEtape;
}): boolean {
  return compte.etatMaison !== "SANS_OBJET";
}

/** Même question pour la boutique. */
export function estConcerneParLaBoutique(compte: {
  etatBaguette: EtatEtape;
}): boolean {
  return compte.etatBaguette !== "SANS_OBJET";
}

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
 * **Le Miroir attend-il ce compte ?**
 *
 * `NON_FAIT` et rien d’autre. C’est la question que se posent la to-do du
 * bureau, la page de la cérémonie et sa route d’API — et c’est la seule des
 * trois formulations qui distingue les deux situations que le site
 * confondait :
 *
 *   NON_FAIT   — un élève accepté : on l’envoie au Miroir
 *   FAIT       — c’est passé, et cela ne se rejoue pas (art. 11.2)
 *   SANS_OBJET — une directrice : on ne l’y envoie **surtout pas**
 *
 * Remplacer `estReparti`, dont le nom ne savait répondre que par oui ou non,
 * était le point de tout ce lot : la question à trois réponses ne pouvait pas
 * s’écrire avec un prédicat qui en avait deux.
 */
export function doitPasserAuMiroir(compte: { etatMaison: EtatEtape }): boolean {
  return compte.etatMaison === "NON_FAIT";
}

/** Même question pour la boutique de Kaldvik. */
export function doitPasserAKaldvik(compte: {
  etatBaguette: EtatEtape;
}): boolean {
  return compte.etatBaguette === "NON_FAIT";
}

/**
 * **Le second étage de l’accès.**
 *
 * `peutEntrerDansLEcole` ouvre la porte du château ; celui-ci décide jusqu’où
 * l’on va. Le nouvel arrivant a son bureau et sa fiche, et rien d’autre, tant
 * qu’il n’a pas franchi ses deux premiers pas.
 *
 * **« Fini » veut dire « plus rien à faire », et non « fait ».** Une étape
 * sans objet est finie elle aussi : sans cela, la directrice resterait
 * enfermée dans son bureau, au régime exact d’un membre suspendu, faute
 * d’une cérémonie qu’elle n’a pas à passer.
 */
export function aFiniLesPremiersPas(compte: EtatAcces): boolean {
  return !doitPasserAKaldvik(compte) && !doitPasserAuMiroir(compte);
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
