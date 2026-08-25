import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normaliserVisage } from "./schema";
import { ConflitDossier } from "./modele";
import type {
  ChampsFiche,
  Decision,
  Dossier,
  EvenementMembre,
  NouveauDossier,
} from "./modele";
import type { Fonction, Genre, StatutAcces, StatutDossier } from "./etats";

/**
 * Le dépôt, adossé à PostgreSQL.
 *
 * Toutes les fonctions rendent les formes à plat déclarées dans `modele.ts` :
 * la découpe compte/fiche de la base ne remonte jamais jusqu’aux pages.
 * `depot.ts` choisit entre ce module et le jeu de démonstration.
 */

// ─────────────────────────────────────────────────────────────
//  Traduction base → modèle
// ─────────────────────────────────────────────────────────────

const AVEC_TOUT = {
  eleve: true,
  journal: { orderBy: { creeLe: "desc" } },
} satisfies Prisma.UtilisateurInclude;

type UtilisateurComplet = Prisma.UtilisateurGetPayload<{
  include: typeof AVEC_TOUT;
}>;

/**
 * Un compte sans fiche ne devrait pas exister : les deux naissent dans la
 * même transaction. Si le cas se présentait malgré tout, mieux vaut l’ignorer
 * que d’afficher un dossier à moitié vide à l’administration.
 */
function versDossier(u: UtilisateurComplet): Dossier | null {
  const e = u.eleve;
  if (!e) return null;

  return {
    id: u.id,
    email: u.email,
    statut: e.statut as StatutDossier,
    statutAcces: u.statutAcces as StatutAcces,
    jetonVersion: u.jetonVersion,
    soumisLe: e.soumisLe?.toISOString() ?? null,
    noteAdmin: e.noteAdmin,

    prenomNom: e.prenomNom,
    age: e.age,
    fonction: e.fonction as Fonction,
    genre: e.genre as Genre,
    famille: e.famille,
    portraitType: e.portraitType,
    acteurNom: e.acteurNom,
    portraitUrl: e.portraitUrl,
    biographie: e.biographie,
    qualites: [e.qualite1, e.qualite2, e.qualite3],
    defauts: [e.defaut1, e.defaut2, e.defaut3],
    plusGrandePeur: e.plusGrandePeur,
    certification104Le: e.certification104Le?.toISOString() ?? null,
    limitesEcriture: u.limitesEcriture,
    limitesAutres: u.limitesAutres,

    maison: e.maison,
    baguetteBois: e.baguetteBois,
    baguetteCoeur: e.baguetteCoeur,

    journal: u.journal.map((entree) => ({
      id: entree.id,
      type: entree.type as EvenementMembre,
      valeurAvant: entree.valeurAvant,
      valeurApres: entree.valeurApres,
      note: entree.note,
      parNom: entree.parNom,
      creeLe: entree.creeLe.toISOString(),
    })),
  };
}

/** Les champs de fiche, tels que la table `eleves` les attend. */
function versColonnes(champs: ChampsFiche) {
  return {
    prenomNom: champs.prenomNom,
    genre: champs.genre as Genre,
    famille: champs.famille as Prisma.EleveCreateInput["famille"],
    portraitType: champs.portraitType as Prisma.EleveCreateInput["portraitType"],
    acteurNom: champs.acteurNom,
    portraitUrl: champs.portrait,
    biographie: champs.biographie,
    qualite1: champs.qualites[0],
    qualite2: champs.qualites[1],
    qualite3: champs.qualites[2],
    defaut1: champs.defauts[0],
    defaut2: champs.defauts[1],
    defaut3: champs.defauts[2],
    plusGrandePeur: champs.plusGrandePeur,
  };
}

// ─────────────────────────────────────────────────────────────
//  Lecture
// ─────────────────────────────────────────────────────────────

export async function listerDossiersEnAttente(): Promise<Dossier[]> {
  const lignes = await prisma.utilisateur.findMany({
    where: { eleve: { statut: "EN_ATTENTE" } },
    include: AVEC_TOUT,
    orderBy: { eleve: { soumisLe: "asc" } },
  });
  return lignes.map(versDossier).filter((d): d is Dossier => d !== null);
}

export async function listerMembres(): Promise<Dossier[]> {
  const lignes = await prisma.utilisateur.findMany({
    where: { eleve: { statut: "ACCEPTE" } },
    include: AVEC_TOUT,
    orderBy: { eleve: { prenomNom: "asc" } },
  });
  return lignes.map(versDossier).filter((d): d is Dossier => d !== null);
}

export async function lireDossier(id: string): Promise<Dossier | null> {
  const ligne = await prisma.utilisateur.findUnique({
    where: { id },
    include: AVEC_TOUT,
  });
  return ligne ? versDossier(ligne) : null;
}

/**
 * Art. 6.3 — le visage est-il déjà porté par un autre élève ?
 *
 * `saufCompteId` écarte le porteur légitime : sans lui, un joueur qui reprend
 * sa fiche sans toucher au portrait se verrait refuser son propre visage.
 */
export async function visageEstPris(
  nomNormalise: string,
  saufCompteId?: string,
): Promise<boolean> {
  const pris = await prisma.visagePris.findUnique({
    where: { nomNormalise },
    select: { eleve: { select: { utilisateurId: true } } },
  });
  if (!pris) return false;
  return saufCompteId ? pris.eleve?.utilisateurId !== saufCompteId : true;
}

// ─────────────────────────────────────────────────────────────
//  Écriture
// ─────────────────────────────────────────────────────────────

/** Version du règlement approuvée à l’inscription (préambule). */
const REGLEMENT_VERSION = "2026-08";

export async function creerDossier(
  donnees: NouveauDossier,
): Promise<{ id: string; email: string }> {
  const email = donnees.email.trim().toLowerCase();
  const maintenant = new Date();

  if (await prisma.utilisateur.findUnique({ where: { email }, select: { id: true } })) {
    throw new ConflitDossier("email");
  }

  const visage =
    donnees.portraitType === "ACTEUR" && donnees.acteurNom
      ? { nomActeur: donnees.acteurNom, nomNormalise: normaliserVisage(donnees.acteurNom) }
      : null;

  if (visage && (await visageEstPris(visage.nomNormalise))) {
    throw new ConflitDossier("acteurNom");
  }

  // Le mot de passe en clair s’arrête ici : seul son empreinte est écrite.
  // Chargé à la demande : argon2 est un binaire natif, que seules les pages
  // créant un compte ont besoin d’ouvrir.
  const { hash } = await import("@node-rs/argon2");
  const motDePasseHash = await hash(donnees.motDePasse);

  try {
    const compte = await prisma.utilisateur.create({
      data: {
        email,
        motDePasseHash,
        majeur16: donnees.majeur16,
        reglementAccepteLe: new Date(donnees.reglementAccepteLe),
        reglementVersion: REGLEMENT_VERSION,
        limitesEcriture:
          donnees.limitesEcriture as Prisma.UtilisateurCreateInput["limitesEcriture"],
        limitesAutres: donnees.limitesAutres,
        eleve: {
          create: {
            ...versColonnes(donnees),
            statut: "EN_ATTENTE",
            soumisLe: maintenant,
            certification104Le: maintenant,
            ...(visage ? { visagePris: { create: visage } } : {}),
          },
        },
        journal: {
          create: {
            type: "DOSSIER_SOUMIS",
            valeurApres: "EN_ATTENTE",
            creeLe: maintenant,
          },
        },
      },
      select: { id: true, email: true },
    });
    return compte;
  } catch (erreur) {
    // Course entre deux dépôts simultanés : l’unicité de la base tranche.
    if (estViolationUnicite(erreur, "email")) throw new ConflitDossier("email");
    if (estViolationUnicite(erreur, "nomNormalise")) {
      throw new ConflitDossier("acteurNom");
    }
    throw erreur;
  }
}

export async function modifierFiche(
  id: string,
  champs: ChampsFiche,
): Promise<void> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id },
    include: { eleve: { include: { visagePris: true } } },
  });
  const eleve = compte?.eleve;
  if (!compte || !eleve) return;

  const modifies: string[] = [];
  if (eleve.prenomNom !== champs.prenomNom) modifies.push("nom");
  if (eleve.portraitUrl !== champs.portrait) modifies.push("portrait");
  if (eleve.acteurNom !== champs.acteurNom) modifies.push("visage");
  if (eleve.biographie !== champs.biographie) modifies.push("biographie");
  if (eleve.genre !== champs.genre) modifies.push("genre");
  if (eleve.famille !== champs.famille) modifies.push("famille");
  if (eleve.plusGrandePeur !== champs.plusGrandePeur) modifies.push("peur");
  if ([eleve.qualite1, eleve.qualite2, eleve.qualite3].join("|") !== champs.qualites.join("|")) {
    modifies.push("qualités");
  }
  if ([eleve.defaut1, eleve.defaut2, eleve.defaut3].join("|") !== champs.defauts.join("|")) {
    modifies.push("défauts");
  }
  if (
    compte.limitesEcriture.join("|") !== champs.limitesEcriture.join("|") ||
    (compte.limitesAutres ?? "") !== (champs.limitesAutres ?? "")
  ) {
    modifies.push("limites d’écriture");
  }

  if (modifies.length === 0) return;

  const visage =
    champs.portraitType === "ACTEUR" && champs.acteurNom
      ? { nomActeur: champs.acteurNom, nomNormalise: normaliserVisage(champs.acteurNom) }
      : null;

  if (visage && (await visageEstPris(visage.nomNormalise, id))) {
    throw new ConflitDossier("acteurNom");
  }

  await prisma.$transaction(async (tx) => {
    await tx.utilisateur.update({
      where: { id },
      data: {
        limitesEcriture:
          champs.limitesEcriture as Prisma.UtilisateurUpdateInput["limitesEcriture"],
        limitesAutres: champs.limitesAutres,
        journal: {
          create: {
            type: "FICHE_MODIFIEE",
            valeurApres: modifies.join(", "),
          },
        },
      },
    });

    await tx.eleve.update({
      where: { id: eleve.id },
      data: versColonnes(champs),
    });

    // La réservation du visage suit la fiche : on la retire, on la déplace ou
    // on la crée, jamais on ne la laisse pointer sur l’ancien nom.
    if (eleve.visagePris && eleve.visagePris.nomNormalise !== visage?.nomNormalise) {
      await tx.visagePris.delete({ where: { id: eleve.visagePris.id } });
    }
    if (visage && eleve.visagePris?.nomNormalise !== visage.nomNormalise) {
      await tx.visagePris.create({ data: { ...visage, eleveId: eleve.id } });
    }
  });
}

/** Accepter délie aussi l’accès : c’est le seul couplage entre les deux. */
export async function deciderDossier(
  id: string,
  decision: Decision,
  note: string | null,
): Promise<void> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id },
    select: { eleve: { select: { id: true, statut: true } } },
  });
  const eleve = compte?.eleve;
  if (!eleve) return;

  const avant = eleve.statut;
  const maintenant = new Date();

  const suite = {
    ACCEPTER: {
      statut: "ACCEPTE" as const,
      acces: "VALIDE" as const,
      note: null,
      evenement: "DOSSIER_ACCEPTE" as const,
    },
    CORRIGER: {
      statut: "A_CORRIGER" as const,
      acces: null,
      note,
      evenement: "DOSSIER_RENVOYE_EN_CORRECTION" as const,
    },
    REFUSER: {
      statut: "REFUSE" as const,
      acces: "EN_ATTENTE" as const,
      note,
      evenement: "DOSSIER_REFUSE" as const,
    },
  }[decision];

  await prisma.$transaction([
    prisma.eleve.update({
      where: { id: eleve.id },
      data: { statut: suite.statut, decideLe: maintenant, noteAdmin: suite.note },
    }),
    prisma.utilisateur.update({
      where: { id },
      data: {
        ...(suite.acces ? { statutAcces: suite.acces } : {}),
        journal: {
          create: {
            type: suite.evenement,
            valeurAvant: avant,
            valeurApres: suite.statut,
            note,
            parNom: "Administration",
          },
        },
      },
    }),
  ]);
}

export async function modifierMembre(
  id: string,
  modifications: { age?: number; fonction?: Fonction; statutAcces?: StatutAcces },
  note: string | null,
): Promise<void> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      statutAcces: true,
      eleve: { select: { id: true, age: true, fonction: true } },
    },
  });
  const eleve = compte?.eleve;
  if (!compte || !eleve) return;

  const entrees: Prisma.JournalMembreCreateWithoutUtilisateurInput[] = [];
  const fiche: Prisma.EleveUpdateInput = {};

  if (modifications.age !== undefined && modifications.age !== eleve.age) {
    entrees.push({
      type: "AGE_MODIFIE",
      valeurAvant: String(eleve.age),
      valeurApres: String(modifications.age),
      note,
      parNom: "Administration",
    });
    fiche.age = modifications.age;
  }

  if (modifications.fonction !== undefined && modifications.fonction !== eleve.fonction) {
    entrees.push({
      type: "FONCTION_MODIFIEE",
      valeurAvant: eleve.fonction,
      valeurApres: modifications.fonction,
      note,
      parNom: "Administration",
    });
    fiche.fonction = modifications.fonction;
  }

  const accesChange =
    modifications.statutAcces !== undefined &&
    modifications.statutAcces !== compte.statutAcces;

  if (accesChange) {
    entrees.push({
      type: "ACCES_MODIFIE",
      valeurAvant: compte.statutAcces,
      valeurApres: modifications.statutAcces!,
      note,
      parNom: "Administration",
    });
  }

  if (entrees.length === 0) return;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(fiche).length > 0) {
      await tx.eleve.update({ where: { id: eleve.id }, data: fiche });
    }
    await tx.utilisateur.update({
      where: { id },
      data: {
        ...(accesChange ? { statutAcces: modifications.statutAcces } : {}),
        journal: { create: entrees },
      },
    });
  });
}

/**
 * Suppression d’un membre : le compte emporte la fiche, le journal et la
 * réservation du visage, par cascade déclarée dans le schéma.
 */
export async function supprimerMembre(id: string): Promise<boolean> {
  try {
    await prisma.utilisateur.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function journaliserCourriel(
  id: string,
  resultat: { envoye: boolean; raison?: string; detail?: string },
): Promise<void> {
  await prisma.journalMembre.create({
    data: {
      utilisateurId: id,
      type: "COURRIEL_CONFIRMATION",
      valeurApres: resultat.envoye ? "envoyé" : "échec",
      note: resultat.envoye
        ? null
        : [resultat.raison, resultat.detail].filter(Boolean).join(" — ") || null,
      parNom: "Ravenshallow",
    },
  });
}

// ─────────────────────────────────────────────────────────────

/** P2002 : contrainte d’unicité violée, sur telle colonne. */
function estViolationUnicite(erreur: unknown, colonne: string): boolean {
  if (typeof erreur !== "object" || erreur === null) return false;
  const e = erreur as { code?: string; meta?: { target?: unknown } };
  if (e.code !== "P2002") return false;
  const cible = e.meta?.target;
  return Array.isArray(cible)
    ? cible.includes(colonne)
    : String(cible ?? "").includes(colonne);
}
