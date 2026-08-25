/**
 * Formes échangées entre l’interface et le stockage.
 *
 * Volontairement à plat, et volontairement indépendantes de Prisma : les
 * pages ne connaissent que ces types, si bien qu’un changement de base ne
 * remonte jamais jusqu’à elles. `depot.ts` en est la seule couture.
 */

import type { Fonction, Genre, StatutAcces, StatutDossier } from "./etats";

export type EvenementMembre =
  | "DOSSIER_SOUMIS"
  | "FICHE_MODIFIEE"
  | "DOSSIER_ACCEPTE"
  | "DOSSIER_RENVOYE_EN_CORRECTION"
  | "DOSSIER_REFUSE"
  | "AGE_MODIFIE"
  | "FONCTION_MODIFIEE"
  | "ACCES_MODIFIE"
  | "COURRIEL_CONFIRMATION";

export type EntreeJournal = {
  id: string;
  type: EvenementMembre;
  valeurAvant: string | null;
  valeurApres: string | null;
  note: string | null;
  parNom: string | null;
  creeLe: string;
};

export type Dossier = {
  id: string;
  email: string;
  statut: StatutDossier;
  statutAcces: StatutAcces;
  /** Voir `jetonVersion` : incrémentée, elle périme tous les liens émis. */
  jetonVersion: number;
  soumisLe: string | null;
  noteAdmin: string | null;

  prenomNom: string;
  age: number;
  fonction: Fonction;
  genre: Genre;
  famille: string;
  portraitType: string;
  acteurNom: string | null;
  portraitUrl: string | null;
  biographie: string;
  qualites: [string, string, string];
  defauts: [string, string, string];
  plusGrandePeur: string;
  certification104Le: string | null;
  limitesEcriture: string[];
  limitesAutres: string | null;

  journal: EntreeJournal[];
};

/** Ce que le joueur peut reprendre après coup : la partie II, et elle seule. */
export type ChampsFiche = {
  limitesEcriture: string[];
  limitesAutres: string | null;
  prenomNom: string;
  genre: Genre;
  famille: string;
  portraitType: string;
  acteurNom: string | null;
  portrait: string;
  biographie: string;
  qualites: [string, string, string];
  defauts: [string, string, string];
  plusGrandePeur: string;
};

/** Le dépôt initial : le compte et la fiche naissent ensemble. */
export type NouveauDossier = ChampsFiche & {
  email: string;
  motDePasse: string;
  majeur16: boolean;
  reglementAccepteLe: string;
};

export type Decision = "ACCEPTER" | "CORRIGER" | "REFUSER";

/**
 * Deux dossiers se disputent la même chose : une adresse déjà inscrite, ou un
 * visage déjà porté. Distingué d’une panne, parce que la réponse à donner au
 * joueur n’est pas la même — l’une se corrige, l’autre se réessaie.
 */
export class ConflitDossier extends Error {
  constructor(public readonly champ: "email" | "acteurNom") {
    super(`conflit sur ${champ}`);
    this.name = "ConflitDossier";
  }
}
