/**
 * Formes échangées entre l’interface et le stockage.
 *
 * Volontairement à plat, et volontairement indépendantes de Prisma : les
 * pages ne connaissent que ces types, si bien qu’un changement de base ne
 * remonte jamais jusqu’à elles. `depot.ts` en est la seule couture.
 */

import type { EtatEtape, Fonction, Genre, StatutAcces, StatutDossier } from "./etats";

export type EvenementMembre =
  | "DOSSIER_SOUMIS"
  | "FICHE_MODIFIEE"
  | "DOSSIER_ACCEPTE"
  | "DOSSIER_RENVOYE_EN_CORRECTION"
  | "DOSSIER_REFUSE"
  | "AGE_MODIFIE"
  | "FONCTION_MODIFIEE"
  | "ROLE_AFFICHE_MODIFIE"
  | "ETAT_MAISON_MODIFIE"
  | "ETAT_BAGUETTE_MODIFIE"
  | "ACCES_MODIFIE"
  | "COURRIEL_CONFIRMATION"
  // Les pouvoirs. `ROLE_MODIFIE` est distinct de `ACCES_MODIFIE` : suspendre
  // un compte et le faire modérateur ne se lisent pas de la même façon.
  | "ROLE_MODIFIE"
  | "PERMISSION_ACCORDEE"
  | "PERMISSION_RETIREE"
  | "PREFET_NOMME"
  | "PREFET_DEMIS";

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

  /**
   * Le titre au château, ou `null` pour un élève ordinaire. Il **remplace**
   * l’année partout où elle s’affiche — `libellePlace` est le seul endroit
   * qui tranche — et n’ouvre aucun droit, nulle part.
   *
   * Sa provenance l’accompagne : ce champ distingue publiquement un membre
   * des autres, on doit pouvoir dire d’où il vient. Les trois vont ensemble
   * ou pas du tout, garanti par la base.
   */
  roleAffiche: string | null;
  roleAffichePoseLe: string | null;
  roleAffichePosePar: string | null;

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

  /**
   * Réservés au Miroir de Brume et à la boutique Bjornstav. Nuls tant que ces
   * deux étapes n’existent pas — la fiche affiche alors une attente, pas un
   * vide.
   */
  maison: string | null;
  baguetteBois: string | null;
  baguetteCoeur: string | null;

  /**
   * **Où en est chaque étape — et c’est cela qui fait foi**, jamais la
   * présence de la valeur au-dessus. Une maison absente ne dit pas la même
   * chose selon l’état : `NON_FAIT` envoie au Miroir, `SANS_OBJET` n’y envoie
   * surtout pas.
   *
   * `SANS_OBJET` n’efface rien : la maison et la baguette restent écrites, et
   * se rétablissent intactes.
   */
  etatMaison: EtatEtape;
  etatBaguette: EtatEtape;

  /**
   * Fin de la suspension. Nulle pendant un bannissement, c’est une exclusion
   * définitive (art. 8, niveau 5) ; renseignée, une suspension (niveau 4).
   */
  banniJusquau: string | null;

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
