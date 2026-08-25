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
import type {
  ActionEtape,
  Etape,
  EtatEtape,
  Fonction,
  Genre,
  StatutAcces,
  StatutDossier,
} from "./etats";

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
    roleAffiche: e.roleAffiche,
    roleAffichePoseLe: e.roleAffichePoseLe?.toISOString() ?? null,
    roleAffichePosePar: e.roleAffichePosePar,
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
    etatMaison: e.etatMaison as EtatEtape,
    etatBaguette: e.etatBaguette as EtatEtape,
    banniJusquau: u.banniJusquau?.toISOString() ?? null,

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
 * Les titres déjà portés quelque part sur le site, sans doublon.
 *
 * Ils alimentent les suggestions du champ, pour qu’un même rôle ne finisse pas
 * écrit de trois façons. Ce n’est **qu’une aide** : la saisie reste libre, et
 * rien ici ne restreint ce qu’on peut écrire.
 *
 * La recherche porte sur tous les élèves et pas seulement sur les membres
 * acceptés : un titre posé sur un dossier encore en lecture compte aussi.
 */
export async function listerRolesAffiches(): Promise<string[]> {
  const lignes = await prisma.eleve.findMany({
    where: { roleAffiche: { not: null } },
    distinct: ["roleAffiche"],
    select: { roleAffiche: true },
    orderBy: { roleAffiche: "asc" },
  });
  return lignes.map((l) => l.roleAffiche!).sort((a, b) => a.localeCompare(b, "fr"));
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
  modifications: {
    age?: number;
    fonction?: Fonction;
    /**
     * Le titre au château. `null` l’efface et fait réapparaître l’année ;
     * `undefined` n’y touche pas. Décoratif : il n’ouvre aucun droit.
     */
    roleAffiche?: string | null;
    statutAcces?: StatutAcces;
    /** Fin de suspension. `null` efface la date : exclusion définitive. */
    banniJusquau?: Date | null;
  },
  note: string | null,
  /**
   * Qui écrit. « Administration » tant que la zone d’administration n’est
   * qu’un mot de passe partagé, sans comptes distincts.
   */
  parNom = "Administration",
): Promise<void> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      statutAcces: true,
      banniJusquau: true,
      eleve: { select: { id: true, age: true, fonction: true, roleAffiche: true } },
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
      parNom,
    });
    fiche.age = modifications.age;
  }

  if (modifications.fonction !== undefined && modifications.fonction !== eleve.fonction) {
    entrees.push({
      type: "FONCTION_MODIFIEE",
      valeurAvant: eleve.fonction,
      valeurApres: modifications.fonction,
      note,
      parNom,
    });
    fiche.fonction = modifications.fonction;
  }

  // Le rôle affiché distingue publiquement un membre des autres : on garde
  // qui l'a posé et quand, sur la fiche pour l'afficher, et au journal pour
  // l'historique. Les trois colonnes bougent ensemble — la base l'exige.
  if (
    modifications.roleAffiche !== undefined &&
    modifications.roleAffiche !== eleve.roleAffiche
  ) {
    entrees.push({
      type: "ROLE_AFFICHE_MODIFIE",
      valeurAvant: eleve.roleAffiche,
      valeurApres: modifications.roleAffiche,
      note,
      parNom,
    });
    fiche.roleAffiche = modifications.roleAffiche;
    fiche.roleAffichePoseLe = modifications.roleAffiche ? new Date() : null;
    fiche.roleAffichePosePar = modifications.roleAffiche ? parNom : null;
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
      parNom,
    });
  }

  // La date de fin ne vaut que pendant une suspension : lever le
  // bannissement l'efface, sans quoi elle traînerait sur un compte rétabli.
  const accesFinal = modifications.statutAcces ?? compte.statutAcces;
  const dateFinale =
    accesFinal === "EN_BANNISSEMENT" ? (modifications.banniJusquau ?? null) : null;
  const dateChange =
    (dateFinale?.getTime() ?? null) !== (compte.banniJusquau?.getTime() ?? null);

  if (entrees.length === 0 && !dateChange) return;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(fiche).length > 0) {
      await tx.eleve.update({ where: { id: eleve.id }, data: fiche });
    }
    await tx.utilisateur.update({
      where: { id },
      data: {
        ...(accesChange ? { statutAcces: modifications.statutAcces } : {}),
        ...(dateChange ? { banniJusquau: dateFinale } : {}),
        ...(entrees.length > 0 ? { journal: { create: entrees } } : {}),
      },
    });
  });
}

/**
 * Retirer une étape à un compte, ou la lui rendre.
 *
 * **Rien n’est effacé.** `RETIRER` ne touche qu’à l’état : la maison et la
 * baguette restent dans leurs colonnes, et se retrouvent intactes au
 * rétablissement — ce que la base garantit d’ailleurs pour la baguette, qu’un
 * déclencheur rend immuable.
 *
 * `RETABLIR` ne rend pas un état choisi par l’appelant : il rend **celui que
 * la valeur commande**. Une maison écrite revient à `FAIT`, une case vide à
 * `NON_FAIT` — et le compte repart au Miroir, ce qui est le sens juste pour
 * un professeur qui redevient élève sans avoir jamais été réparti. Aucun
 * état bancal ne peut sortir d’ici, et la base refuserait de toute façon.
 *
 * Les deux étapes sont indépendantes : cette fonction n’en touche qu’une, et
 * jamais le rôle affiché.
 */
export async function modifierEtatEtape(
  id: string,
  etape: Etape,
  action: ActionEtape,
  parNom = "Administration",
): Promise<void> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      eleve: {
        select: {
          id: true,
          maison: true,
          baguetteChoisieLe: true,
          etatMaison: true,
          etatBaguette: true,
        },
      },
    },
  });
  const eleve = compte?.eleve;
  if (!eleve) return;

  const avant = (
    etape === "maison" ? eleve.etatMaison : eleve.etatBaguette
  ) as EtatEtape;

  const aUneValeur =
    etape === "maison"
      ? eleve.maison !== null
      : eleve.baguetteChoisieLe !== null;

  const apres: EtatEtape =
    action === "RETIRER" ? "SANS_OBJET" : aUneValeur ? "FAIT" : "NON_FAIT";

  // Rien à dire au journal si rien ne change : un second clic sur le même
  // bouton ne doit pas allonger le fil du membre.
  if (avant === apres) return;

  await prisma.$transaction([
    prisma.eleve.update({
      where: { id: eleve.id },
      data:
        etape === "maison"
          ? { etatMaison: apres as Prisma.EleveUpdateInput["etatMaison"] }
          : { etatBaguette: apres as Prisma.EleveUpdateInput["etatBaguette"] },
    }),
    prisma.utilisateur.update({
      where: { id },
      data: {
        journal: {
          create: {
            type:
              etape === "maison" ? "ETAT_MAISON_MODIFIE" : "ETAT_BAGUETTE_MODIFIE",
            valeurAvant: avant,
            valeurApres: apres,
            parNom,
          },
        },
      },
    }),
  ]);
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
