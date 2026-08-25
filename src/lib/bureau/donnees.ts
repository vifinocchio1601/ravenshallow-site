import "server-only";
import { libelleBaguette } from "@/lib/ecole/baguette";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import {
  aChoisiSaBaguette,
  aFiniLesPremiersPas,
  estReparti,
} from "@/lib/session/acces";
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
  /**
   * « Chêne des tempêtes, cœur de griffe d’ours des cavernes », ou `null`
   * tant que l’élève n’est pas passé à Kaldvik. La ligne reste alors masquée :
   * la note des premiers pas dit déjà ce qu’il lui reste à faire, et
   * l’annoncer deux fois ne l’aiderait pas.
   */
  baguette: string | null;
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
    baguette: libelleBaguette(compte.baguetteBois, compte.baguetteCoeur),
    prochainesEpreuves: null,
  };
}

/** Lot « Grand Hall » — table à créer. */
export async function annonces(): Promise<Annonce[]> {
  return [];
}

// ─────────────────────────────────────────────────────────────
//  Les premiers pas du nouvel arrivant
// ─────────────────────────────────────────────────────────────

export type PremierPas = {
  id: string;
  libelle: string;
  fait: boolean;
  /** Nul quand la ligne n’est pas cliquable : déjà faite, ou verrouillée. */
  href: string | null;
  /** La raison du verrou, en clair. Nulle si la ligne est ouverte. */
  verrou: string | null;
};

/**
 * La liste des premiers pas, ou `null` quand il n’y a plus rien à faire.
 *
 * Rendre `null` plutôt qu’une liste vide est ce qui fait **disparaître** la
 * note du bureau une fois les deux lignes cochées : elle n’a pas vocation à
 * rester là comme un panneau de plus.
 *
 * L’ordre compte : la baguette d’abord, le Miroir ensuite. La seconde ligne
 * reste verrouillée tant que la première n’est pas faite — affichée, mais
 * avec sa raison écrite à côté plutôt qu’un simple grisé.
 */
export async function premiersPas(
  compte: CompteConnecte,
): Promise<PremierPas[] | null> {
  if (aFiniLesPremiersPas(compte)) return null;

  const t = TEXTES_ECOLE.bureau.premiersPas;
  const baguette = aChoisiSaBaguette(compte);
  const reparti = estReparti(compte);

  return [
    {
      id: "baguette",
      libelle: t.baguette,
      fait: baguette,
      // Le premier pas n’est jamais verrouillé : rien ne le précède.
      href: baguette ? null : ROUTES.bjornstav,
      verrou: null,
    },
    {
      id: "ceremonie",
      libelle: t.ceremonie,
      fait: reparti,
      href: baguette && !reparti ? ROUTES.ceremonie : null,
      verrou: baguette ? null : t.verrou,
    },
  ];
}
