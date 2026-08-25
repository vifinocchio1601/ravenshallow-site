import "server-only";
import type {
  Fonction,
  Genre,
  StatutAcces,
  StatutDossier,
} from "./etats";

/**
 * Accès aux dossiers et aux membres.
 *
 * C’est **la seule couture** entre l’interface et le stockage : quand la base
 * arrivera, seul ce fichier change — les pages, elles, ne bougent pas.
 *
 * Tant que `DATABASE_URL` est absent, un jeu de démonstration en mémoire
 * permet de parcourir et de tester les écrans. Il se réinitialise à chaque
 * redémarrage du serveur : c’est un échafaudage, pas un stockage.
 */

export type EvenementMembre =
  | "DOSSIER_SOUMIS"
  | "DOSSIER_ACCEPTE"
  | "DOSSIER_RENVOYE_EN_CORRECTION"
  | "DOSSIER_REFUSE"
  | "AGE_MODIFIE"
  | "FONCTION_MODIFIEE"
  | "ACCES_MODIFIE";

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

// ─────────────────────────────────────────────────────────────
//  Jeu de démonstration
// ─────────────────────────────────────────────────────────────

let compteur = 0;
const identifiant = () => `demo-${++compteur}`;

function dossierDemo(partiel: Partial<Dossier> & { prenomNom: string }): Dossier {
  const id = identifiant();
  return {
    id,
    email: `${partiel.prenomNom.toLowerCase().replace(/\s+/g, ".")}@exemple.fr`,
    statut: "EN_ATTENTE",
    statutAcces: "EN_ATTENTE",
    soumisLe: null,
    noteAdmin: null,
    age: 13,
    fonction: "PREMIERE_ANNEE",
    genre: "FEMININ",
    famille: "MIXTE",
    portraitType: "IA_ILLUSTRATION",
    acteurNom: null,
    portraitUrl: null,
    biographie: "",
    qualites: ["", "", ""],
    defauts: ["", "", ""],
    plusGrandePeur: "",
    certification104Le: null,
    limitesEcriture: [],
    limitesAutres: null,
    journal: [],
    ...partiel,
  };
}

const BIO_DEMO =
  "Le vent de la baie de Kaldvik sentait le sel et la tourbe le matin où la lettre est arrivée. Personne, à la maison, n’a semblé surpris — et c’est précisément ce qui l’a inquiétée. Sa grand-mère a posé la théière, essuyé ses mains sur son tablier, et dit qu’il faudrait prévenir le passeur avant la marée. Comme si tout était réglé depuis longtemps, comme si on avait attendu ce jour sans jamais le nommer devant elle. Elle a passé l’après-midi sur les rochers à regarder la mer changer de couleur, à retourner la question dans tous les sens sans trouver par où la prendre. Le soir, sa grand-mère lui a tendu un paquet enveloppé de toile cirée, sans un mot d’explication, et lui a demandé de ne l’ouvrir qu’une fois passée la falaise.";

function creerJeuDemo(): Dossier[] {
  return [
  dossierDemo({
    prenomNom: "Elena V. Blackwood",
    email: "elena@exemple.fr",
    statut: "EN_ATTENTE",
    soumisLe: "2026-08-22T09:14:00.000Z",
    genre: "FEMININ",
    famille: "MIXTE",
    biographie: BIO_DEMO,
    qualites: ["Observatrice", "Tenace", "Loyale"],
    defauts: ["Rancunière", "Secrète", "Impatiente"],
    plusGrandePeur: "Que la mer reprenne ce qu’elle a laissé",
    certification104Le: "2026-08-22T09:14:00.000Z",
    limitesEcriture: ["NOYADE", "EMPRISE_MENTALE"],
    journal: [
      {
        id: "j1",
        type: "DOSSIER_SOUMIS",
        valeurAvant: null,
        valeurApres: "EN_ATTENTE",
        note: null,
        parNom: null,
        creeLe: "2026-08-22T09:14:00.000Z",
      },
    ],
  }),
  dossierDemo({
    prenomNom: "Tobias Kern",
    email: "tobias@exemple.fr",
    statut: "EN_ATTENTE",
    soumisLe: "2026-08-24T17:02:00.000Z",
    genre: "MASCULIN",
    famille: "PREMIER_LIGNEE",
    portraitType: "ACTEUR",
    acteurNom: "Saoirse Ronan",
    biographie: BIO_DEMO,
    qualites: ["Courageux", "Curieux", "Généreux"],
    defauts: ["Trop généreux", "Trop curieux", "Trop courageux"],
    plusGrandePeur: "Le noir sous les arbres",
    certification104Le: "2026-08-24T17:02:00.000Z",
    journal: [
      {
        id: "j2",
        type: "DOSSIER_SOUMIS",
        valeurAvant: null,
        valeurApres: "EN_ATTENTE",
        note: null,
        parNom: null,
        creeLe: "2026-08-24T17:02:00.000Z",
      },
    ],
  }),
  dossierDemo({
    prenomNom: "Sigrid Harlaug",
    email: "sigrid@exemple.fr",
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    soumisLe: "2026-06-02T11:00:00.000Z",
    age: 16,
    fonction: "QUATRIEME_ANNEE",
    genre: "FEMININ",
    famille: "SORCIERS",
    biographie: BIO_DEMO,
    qualites: ["Méthodique", "Patiente", "Franche"],
    defauts: ["Cassante", "Orgueilleuse", "Solitaire"],
    plusGrandePeur: "Se tromper devant témoin",
    certification104Le: "2026-06-02T11:00:00.000Z",
    journal: [
      {
        id: "j3",
        type: "DOSSIER_ACCEPTE",
        valeurAvant: "EN_ATTENTE",
        valeurApres: "ACCEPTE",
        note: null,
        parNom: "Administration",
        creeLe: "2026-06-03T08:30:00.000Z",
      },
    ],
  }),
  ];
}

/**
 * Next charge ce module **deux fois** : une fois dans le graphe des
 * composants serveur, une fois dans celui des Server Actions. Un simple
 * `const DEMO = [...]` donnerait donc deux magasins distincts, et une
 * décision prise par une action resterait invisible de la page.
 *
 * On range le jeu de démonstration sur `globalThis`, seul espace commun aux
 * deux graphes — le même idiome que le client Prisma en développement.
 * Rien de tout cela ne survivra au branchement de la base.
 */
const CLE_DEMO = Symbol.for("ravenshallow.depot.demonstration");

type GlobalDemo = typeof globalThis & { [CLE_DEMO]?: Dossier[] };

function demo(): Dossier[] {
  const global = globalThis as GlobalDemo;
  global[CLE_DEMO] ??= creerJeuDemo();
  return global[CLE_DEMO];
}

function baseAbsente(): boolean {
  return !process.env.DATABASE_URL;
}

function journaliser(
  dossier: Dossier,
  type: EvenementMembre,
  valeurAvant: string | null,
  valeurApres: string | null,
  note: string | null,
) {
  dossier.journal = [
    {
      id: identifiant(),
      type,
      valeurAvant,
      valeurApres,
      note,
      parNom: "Administration",
      creeLe: new Date().toISOString(),
    },
    ...dossier.journal,
  ];
}

// ─────────────────────────────────────────────────────────────
//  Lecture
// ─────────────────────────────────────────────────────────────

export async function listerDossiersEnAttente(): Promise<Dossier[]> {
  if (baseAbsente()) {
    return demo().filter((d) => d.statut === "EN_ATTENTE").sort((a, b) =>
      (a.soumisLe ?? "").localeCompare(b.soumisLe ?? ""),
    );
  }
  // TODO (lot base) : prisma.eleve.findMany({ where: { statut: "EN_ATTENTE" } })
  return [];
}

export async function listerMembres(): Promise<Dossier[]> {
  if (baseAbsente()) {
    return demo().filter((d) => d.statut === "ACCEPTE").sort((a, b) =>
      a.prenomNom.localeCompare(b.prenomNom, "fr"),
    );
  }
  // TODO (lot base) : prisma.eleve.findMany({ where: { statut: "ACCEPTE" } })
  return [];
}

export async function lireDossier(id: string): Promise<Dossier | null> {
  if (baseAbsente()) return demo().find((d) => d.id === id) ?? null;
  // TODO (lot base) : prisma.eleve.findUnique({ where: { id } })
  return null;
}

// ─────────────────────────────────────────────────────────────
//  Écriture
// ─────────────────────────────────────────────────────────────

export type Decision = "ACCEPTER" | "CORRIGER" | "REFUSER";

/** Accepter délie aussi l’accès : c’est le seul couplage entre les deux. */
export async function deciderDossier(
  id: string,
  decision: Decision,
  note: string | null,
): Promise<void> {
  if (!baseAbsente()) return; // TODO (lot base)

  const dossier = demo().find((d) => d.id === id);
  if (!dossier) return;

  const avant = dossier.statut;

  if (decision === "ACCEPTER") {
    dossier.statut = "ACCEPTE";
    dossier.statutAcces = "VALIDE";
    dossier.noteAdmin = null;
    journaliser(dossier, "DOSSIER_ACCEPTE", avant, "ACCEPTE", note);
    return;
  }

  if (decision === "CORRIGER") {
    dossier.statut = "A_CORRIGER";
    dossier.noteAdmin = note;
    journaliser(dossier, "DOSSIER_RENVOYE_EN_CORRECTION", avant, "A_CORRIGER", note);
    return;
  }

  dossier.statut = "REFUSE";
  dossier.statutAcces = "EN_ATTENTE";
  dossier.noteAdmin = note;
  journaliser(dossier, "DOSSIER_REFUSE", avant, "REFUSE", note);
}

/**
 * Modification d’un membre depuis la liste. Chaque changement laisse une
 * trace : sans elle, un bannissement ne serait ni explicable (art. 8.2) ni
 * contestable (art. 8.5).
 */
export async function modifierMembre(
  id: string,
  modifications: { age?: number; fonction?: Fonction; statutAcces?: StatutAcces },
  note: string | null,
): Promise<void> {
  if (!baseAbsente()) return; // TODO (lot base)

  const membre = demo().find((d) => d.id === id);
  if (!membre) return;

  if (modifications.age !== undefined && modifications.age !== membre.age) {
    journaliser(
      membre,
      "AGE_MODIFIE",
      String(membre.age),
      String(modifications.age),
      note,
    );
    membre.age = modifications.age;
  }

  if (
    modifications.fonction !== undefined &&
    modifications.fonction !== membre.fonction
  ) {
    journaliser(
      membre,
      "FONCTION_MODIFIEE",
      membre.fonction,
      modifications.fonction,
      note,
    );
    membre.fonction = modifications.fonction;
  }

  if (
    modifications.statutAcces !== undefined &&
    modifications.statutAcces !== membre.statutAcces
  ) {
    journaliser(
      membre,
      "ACCES_MODIFIE",
      membre.statutAcces,
      modifications.statutAcces,
      note,
    );
    membre.statutAcces = modifications.statutAcces;
  }
}

/** Signale aux écrans qu’ils travaillent sur des données de démonstration. */
export function modeDemonstration(): boolean {
  return baseAbsente();
}
