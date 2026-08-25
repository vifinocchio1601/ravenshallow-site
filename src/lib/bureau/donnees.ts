import "server-only";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * Ce que Mon bureau affiche.
 *
 * Les scènes, la messagerie, les points et les annonces n’existent pas
 * encore. Plutôt que de laisser chaque panneau deviner quoi faire d’une
 * source absente, tout passe par ici : les fonctions rendent aujourd’hui des
 * listes vides, et chaque lot à venir en remplacera **une seule**, sans
 * toucher aux panneaux.
 *
 * Aucune ne lève d’exception. Un bureau qui s’effondre parce que la
 * messagerie n’est pas construite serait le pire des accueils.
 */

export type SceneEnCours = {
  id: string;
  titre: string;
  lieu: string;
  dernierMessageLe: string;
  auteurDernierMessage: string;
};

export type MessageNonLu = {
  id: string;
  expediteur: string;
  sujet: string;
  recuLe: string;
};

export type Progression = {
  pointsPersonnels: number;
  /** Nul tant que l’élève n’a pas de maison — le compteur reste masqué. */
  pointsMaison: number | null;
  fonction: string;
  genre: string;
  prochainesEpreuves: string | null;
};

export type Annonce = {
  id: string;
  titre: string;
  publieeLe: string;
  extrait: string;
};

/** Lot « scènes » — table à créer. */
export async function scenesEnCours(
  _compte: CompteConnecte,
): Promise<SceneEnCours[]> {
  return [];
}

/** Lot « messagerie » — table à créer. */
export async function courrierNonLu(
  _compte: CompteConnecte,
): Promise<MessageNonLu[]> {
  return [];
}

/**
 * Lot « points et épreuves » — colonnes à créer.
 *
 * Seule l’année est déjà connue : elle vit sur la fiche depuis le dossier
 * d’admission. Le reste est annoncé comme vide, jamais inventé.
 */
export async function progression(compte: CompteConnecte): Promise<Progression> {
  return {
    pointsPersonnels: 0,
    pointsMaison: compte.maison ? 0 : null,
    fonction: compte.fonction,
    genre: compte.genre,
    prochainesEpreuves: null,
  };
}

/** Lot « Grand Hall » — table à créer. */
export async function annonces(): Promise<Annonce[]> {
  return [];
}
