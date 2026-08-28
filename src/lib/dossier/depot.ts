import "server-only";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as base from "./depot-base";
import type {
  ChampsFiche,
  Decision,
  Dossier,
  EvenementMembre,
  NouveauDossier,
} from "./modele";
import type {
  ActionEtape,
  Etape,
  EtatEtape,
  Fonction,
  StatutAcces,
} from "./etats";

/**
 * Accès aux dossiers et aux membres.
 *
 * C’est **la seule couture** entre l’interface et le stockage : quand la base
 * arrivera, seul ce fichier change — les pages, elles, ne bougent pas.
 *
 * Tant que `DATABASE_URL` est absent, les dossiers vivent en mémoire et sont
 * recopiés dans `.donnees/dossiers.json` après chaque écriture, afin qu’ils
 * survivent au redémarrage du serveur. C’est un échafaudage, pas une base :
 * ni transactions, ni index, ni accès concurrent — mais on ne perd plus ce
 * qu’un joueur a envoyé.
 */

export type {
  ChampsFiche,
  Decision,
  Dossier,
  EntreeJournal,
  EvenementMembre,
  NouveauDossier,
} from "./modele";
export { ConflitDossier } from "./modele";

// ─────────────────────────────────────────────────────────────
//  Jeu de démonstration
// ─────────────────────────────────────────────────────────────

/**
 * Identifiants aléatoires, et non un compteur : celui-ci vivrait dans le
 * module, donc en double exemplaire (composants serveur / Server Actions), et
 * deux dossiers finiraient par porter le même identifiant.
 */
const identifiant = () => `demo-${crypto.randomUUID().slice(0, 8)}`;

function dossierDemo(partiel: Partial<Dossier> & { prenomNom: string }): Dossier {
  const id = identifiant();
  return {
    id,
    email: `${partiel.prenomNom.toLowerCase().replace(/\s+/g, ".")}@exemple.fr`,
    statut: "EN_ATTENTE",
    statutAcces: "EN_ATTENTE",
    jetonVersion: 0,
    soumisLe: null,
    noteAdmin: null,
    age: 13,
    fonction: "PREMIERE_ANNEE",
    roleAffiche: null,
    roleAffichePoseLe: null,
    roleAffichePosePar: null,
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
    maison: null,
    baguetteBois: null,
    baguetteCoeur: null,
    etatMaison: "NON_FAIT",
    etatBaguette: "NON_FAIT",
    banniJusquau: null,
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

/**
 * Recopie sur disque, hors dépôt Git : `globalThis` ne survit pas au
 * redémarrage du serveur, et un dossier envoyé par un joueur ne peut pas
 * disparaître parce qu’un fichier a été enregistré pendant le développement.
 */
const FICHIER_DONNEES = join(process.cwd(), ".donnees", "dossiers.json");

/** Les tests travaillent en mémoire : ils ne doivent rien écrire. */
const persistanceActive = process.env.NODE_ENV !== "test";

function charger(): Dossier[] | null {
  if (!persistanceActive || !existsSync(FICHIER_DONNEES)) return null;
  try {
    const lu: unknown = JSON.parse(readFileSync(FICHIER_DONNEES, "utf8"));
    return Array.isArray(lu) ? (lu as Dossier[]) : null;
  } catch (erreur) {
    // Fichier illisible : on repart du jeu de démonstration plutôt que de
    // laisser le site refuser de démarrer.
    console.error("[depot] fichier illisible, jeu de démonstration repris", erreur);
    return null;
  }
}

/**
 * Écriture atomique : fichier temporaire puis renommage, pour qu’une coupure
 * en plein enregistrement ne laisse pas un JSON tronqué.
 */
function enregistrer(): void {
  const magasin = (globalThis as GlobalDemo)[CLE_DEMO];
  if (!persistanceActive || !magasin) return;
  try {
    mkdirSync(dirname(FICHIER_DONNEES), { recursive: true });
    const temporaire = `${FICHIER_DONNEES}.tmp`;
    writeFileSync(temporaire, JSON.stringify(magasin, null, 2), "utf8");
    renameSync(temporaire, FICHIER_DONNEES);
  } catch (erreur) {
    console.error("[depot] enregistrement impossible", erreur);
  }
}

function demo(): Dossier[] {
  const global = globalThis as GlobalDemo;
  if (!global[CLE_DEMO]) {
    const repris = charger();
    global[CLE_DEMO] = repris ?? creerJeuDemo();
    // Premier démarrage : on fige tout de suite les identifiants du jeu de
    // démonstration, sinon ils changeraient à chaque relance.
    if (!repris) enregistrer();
  }
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
  parNom: string | null = "Administration",
) {
  dossier.journal = [
    {
      id: identifiant(),
      type,
      valeurAvant,
      valeurApres,
      note,
      parNom,
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
  return base.listerDossiersEnAttente();
}

/** Le compte des dossiers à lire, pour la pastille du tableau de bord. */
export async function compterDossiersEnAttente(): Promise<number> {
  if (baseAbsente()) {
    return demo().filter((d) => d.statut === "EN_ATTENTE").length;
  }
  return base.compterDossiersEnAttente();
}

export async function listerMembres(): Promise<Dossier[]> {
  if (baseAbsente()) {
    return demo().filter((d) => d.statut === "ACCEPTE").sort((a, b) =>
      a.prenomNom.localeCompare(b.prenomNom, "fr"),
    );
  }
  return base.listerMembres();
}

export async function lireDossier(id: string): Promise<Dossier | null> {
  if (baseAbsente()) return demo().find((d) => d.id === id) ?? null;
  return base.lireDossier(id);
}

/**
 * Les titres déjà portés, sans doublon — les suggestions du champ de saisie.
 * Ce n’est qu’une aide : toute autre valeur reste acceptable.
 */
export async function listerRolesAffiches(): Promise<string[]> {
  if (baseAbsente()) {
    const vus = new Set(
      demo()
        .map((d) => d.roleAffiche)
        .filter((r): r is string => r !== null && r !== ""),
    );
    return [...vus].sort((a, b) => a.localeCompare(b, "fr"));
  }
  return base.listerRolesAffiches();
}

// ─────────────────────────────────────────────────────────────
//  Écriture
// ─────────────────────────────────────────────────────────────

/** Dépôt d’un dossier : le compte et la fiche naissent ensemble. */
export async function creerDossier(
  donnees: NouveauDossier,
): Promise<{ id: string; email: string }> {
  if (!baseAbsente()) return base.creerDossier(donnees);

  const maintenant = new Date().toISOString();

  const dossier = dossierDemo({
    prenomNom: donnees.prenomNom,
    email: donnees.email,
    genre: donnees.genre,
    famille: donnees.famille,
    portraitType: donnees.portraitType,
    acteurNom: donnees.acteurNom,
    // La fiche transporte l’image ; le modèle stocke une adresse. Sans Blob,
    // la data URL en tient lieu.
    portraitUrl: donnees.portrait,
    biographie: donnees.biographie,
    qualites: donnees.qualites,
    defauts: donnees.defauts,
    plusGrandePeur: donnees.plusGrandePeur,
    limitesEcriture: donnees.limitesEcriture,
    limitesAutres: donnees.limitesAutres,
    statut: "EN_ATTENTE",
    statutAcces: "EN_ATTENTE",
    soumisLe: maintenant,
    certification104Le: maintenant,
  });
  void donnees.majeur16; // l’âge réel s’arrête ici : seul le booléen compte
  void donnees.motDePasse; // sans base, aucun compte n’est créé

  dossier.journal = [
    {
      id: identifiant(),
      type: "DOSSIER_SOUMIS",
      valeurAvant: null,
      valeurApres: "EN_ATTENTE",
      note: null,
      parNom: null,
      creeLe: maintenant,
    },
  ];

  demo().push(dossier);
  enregistrer();
  return { id: dossier.id, email: dossier.email };
}

/**
 * Reprise de la fiche par le joueur lui-même.
 * Chaque champ modifié laisse sa trace : après acceptation, un changement de
 * nom ou de portrait se voit dans les scènes des autres.
 */
export async function modifierFiche(
  id: string,
  champs: ChampsFiche,
): Promise<void> {
  if (!baseAbsente()) return base.modifierFiche(id, champs);

  const dossier = demo().find((d) => d.id === id);
  if (!dossier) return;

  const modifies: string[] = [];
  if (dossier.prenomNom !== champs.prenomNom) modifies.push("nom");
  if (dossier.portraitUrl !== champs.portrait) modifies.push("portrait");
  if (dossier.acteurNom !== champs.acteurNom) modifies.push("visage");
  if (dossier.biographie !== champs.biographie) modifies.push("biographie");
  if (dossier.genre !== champs.genre) modifies.push("genre");
  if (dossier.famille !== champs.famille) modifies.push("famille");
  if (dossier.plusGrandePeur !== champs.plusGrandePeur) modifies.push("peur");
  if (dossier.qualites.join("|") !== champs.qualites.join("|")) {
    modifies.push("qualités");
  }
  if (dossier.defauts.join("|") !== champs.defauts.join("|")) {
    modifies.push("défauts");
  }
  if (
    dossier.limitesEcriture.join("|") !== champs.limitesEcriture.join("|") ||
    (dossier.limitesAutres ?? "") !== (champs.limitesAutres ?? "")
  ) {
    modifies.push("limites d’écriture");
  }

  if (modifies.length === 0) return;

  const { portrait, ...reste } = champs;
  Object.assign(dossier, reste, { portraitUrl: portrait });

  journaliser(dossier, "FICHE_MODIFIEE", null, modifies.join(", "), null, null);
  enregistrer();
}

/** Accepter délie aussi l’accès : c’est le seul couplage entre les deux. */
export async function deciderDossier(
  id: string,
  decision: Decision,
  note: string | null,
): Promise<void> {
  if (!baseAbsente()) return base.deciderDossier(id, decision, note);

  const dossier = demo().find((d) => d.id === id);
  if (!dossier) return;

  const avant = dossier.statut;

  if (decision === "ACCEPTER") {
    dossier.statut = "ACCEPTE";
    dossier.statutAcces = "VALIDE";
    dossier.noteAdmin = null;
    journaliser(dossier, "DOSSIER_ACCEPTE", avant, "ACCEPTE", note);
    enregistrer();
    return;
  }

  if (decision === "CORRIGER") {
    dossier.statut = "A_CORRIGER";
    dossier.noteAdmin = note;
    journaliser(dossier, "DOSSIER_RENVOYE_EN_CORRECTION", avant, "A_CORRIGER", note);
    enregistrer();
    return;
  }

  dossier.statut = "REFUSE";
  dossier.statutAcces = "EN_ATTENTE";
  dossier.noteAdmin = note;
  journaliser(dossier, "DOSSIER_REFUSE", avant, "REFUSE", note);
  enregistrer();
}

/**
 * Modification d’un membre depuis la liste. Chaque changement laisse une
 * trace : sans elle, un bannissement ne serait ni explicable (art. 8.2) ni
 * contestable (art. 8.5).
 */
export async function modifierMembre(
  id: string,
  modifications: {
    age?: number;
    fonction?: Fonction;
    /**
     * Le titre au château. `null` l’efface et fait réapparaître l’année ;
     * `undefined` n’y touche pas. Décoratif : il n’ouvre aucun droit.
     */
    roleAffiche?: string | null;
    statutAcces?: StatutAcces;
    banniJusquau?: Date | null;
  },
  note: string | null,
  parNom = "Administration",
): Promise<void> {
  if (!baseAbsente()) return base.modifierMembre(id, modifications, note, parNom);

  const membre = demo().find((d) => d.id === id);
  if (!membre) return;

  if (modifications.age !== undefined && modifications.age !== membre.age) {
    journaliser(membre, "AGE_MODIFIE", String(membre.age), String(modifications.age), note, parNom);
    membre.age = modifications.age;
  }

  if (modifications.fonction !== undefined && modifications.fonction !== membre.fonction) {
    journaliser(membre, "FONCTION_MODIFIEE", membre.fonction, modifications.fonction, note, parNom);
    membre.fonction = modifications.fonction;
  }

  // Le titre distingue publiquement un membre : sa provenance s'écrit avec
  // lui, et le changement passe au journal comme les autres.
  if (
    modifications.roleAffiche !== undefined &&
    modifications.roleAffiche !== membre.roleAffiche
  ) {
    journaliser(
      membre,
      "ROLE_AFFICHE_MODIFIE",
      membre.roleAffiche,
      modifications.roleAffiche,
      note,
      parNom,
    );
    membre.roleAffiche = modifications.roleAffiche;
    membre.roleAffichePoseLe = modifications.roleAffiche
      ? new Date().toISOString()
      : null;
    membre.roleAffichePosePar = modifications.roleAffiche ? parNom : null;
  }

  if (
    modifications.statutAcces !== undefined &&
    modifications.statutAcces !== membre.statutAcces
  ) {
    journaliser(membre, "ACCES_MODIFIE", membre.statutAcces, modifications.statutAcces, note, parNom);
    membre.statutAcces = modifications.statutAcces;
  }

  if (modifications.banniJusquau !== undefined) {
    membre.banniJusquau =
      membre.statutAcces === "EN_BANNISSEMENT"
        ? modifications.banniJusquau?.toISOString() ?? null
        : null;
  }

  enregistrer();
}

/**
 * Retirer une étape à un compte, ou la lui rendre. Voir `depot-base.ts` :
 * même règle, même refus d’effacer quoi que ce soit.
 */
export async function modifierEtatEtape(
  id: string,
  etape: Etape,
  action: ActionEtape,
  parNom = "Administration",
): Promise<void> {
  if (!baseAbsente()) return base.modifierEtatEtape(id, etape, action, parNom);

  const membre = demo().find((d) => d.id === id);
  if (!membre) return;

  const avant = etape === "maison" ? membre.etatMaison : membre.etatBaguette;
  const aUneValeur =
    etape === "maison" ? membre.maison !== null : membre.baguetteCoeur !== null;

  const apres: EtatEtape =
    action === "RETIRER" ? "SANS_OBJET" : aUneValeur ? "FAIT" : "NON_FAIT";

  if (avant === apres) return;

  journaliser(
    membre,
    etape === "maison" ? "ETAT_MAISON_MODIFIE" : "ETAT_BAGUETTE_MODIFIE",
    avant,
    apres,
    null,
    parNom,
  );

  if (etape === "maison") membre.etatMaison = apres;
  else membre.etatBaguette = apres;

  enregistrer();
}

/**
 * Suppression d’un membre.
 *
 * Emporte la fiche, le journal et la réservation du visage. Art. 2.4 : le jour
 * où des scènes partagées existeront, il faudra détacher les écrits plutôt que
 * de les emporter — pour l’instant il n’y en a aucune.
 */
export async function supprimerMembre(id: string): Promise<boolean> {
  if (!baseAbsente()) return base.supprimerMembre(id);

  const magasin = demo();
  const index = magasin.findIndex((d) => d.id === id);
  if (index === -1) return false;

  magasin.splice(index, 1);
  enregistrer();
  return true;
}

/**
 * Trace l’accusé de réception : parti ou non, et pourquoi.
 *
 * Un envoi raté ne fait jamais échouer le dépôt du dossier — mais il ne doit
 * pas non plus disparaître sans laisser de trace, sans quoi l’administration
 * croit qu’un joueur a reçu un courriel qui n’est jamais parti.
 */
export async function journaliserCourriel(
  id: string,
  resultat: { envoye: boolean; raison?: string; detail?: string },
): Promise<void> {
  if (!baseAbsente()) return base.journaliserCourriel(id, resultat);

  const dossier = demo().find((d) => d.id === id);
  if (!dossier) return;

  journaliser(
    dossier,
    "COURRIEL_CONFIRMATION",
    null,
    resultat.envoye ? "envoyé" : "échec",
    // En cas d’échec, la raison est la seule chose qui permette de le réparer.
    resultat.envoye
      ? null
      : [resultat.raison, resultat.detail].filter(Boolean).join(" — ") || null,
    "Ravenshallow",
  );
  enregistrer();
}

/** Signale aux écrans qu’ils travaillent sur des données de démonstration. */
export function modeDemonstration(): boolean {
  return baseAbsente();
}
