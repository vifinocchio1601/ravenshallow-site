import "server-only";
import { transaction } from "@/lib/base/transaction";
import { accorderLesPointsDUnControle } from "@/lib/points/depot";
import { prisma } from "@/lib/prisma";
import { aUneMaison } from "@/lib/session/acces";
import { libellePlace, rangAnnee, type Fonction } from "@/lib/dossier/etats";
import type { ControleAuReleve } from "./releve";
import type { Annee } from "./cursus";
import {
  corriger,
  questionnaireDe,
  reponsesRecevables,
  type Correction,
} from "./questionnaires";

/**
 * L’accès aux contrôles de leçon.
 *
 * **Le seul endroit qui compose une requête sur `controles_envoyes`.** Même
 * parti pris que les corbeaux, le salon et le tableau d’affichage : une
 * seconde requête écrite ailleurs finirait par oublier une condition, et c’est
 * celle-là qu’un élève trouverait.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * L’enchaînement d’un envoi : corriger, écrire la note, accorder les points —
 * **dans une seule transaction**. Les trois doivent aller ensemble ou pas du
 * tout. Une note écrite sans ses points laisserait un élève avec un contrôle
 * réussi et rien au compteur, et le geste ne se rejoue pas : l’envoi est
 * définitif.
 *
 * ⚠️ **Le double envoi n’est pas écarté par une lecture avant écriture.** Deux
 * clics simultanés liraient tous les deux « rien d’envoyé » et écriraient tous
 * les deux. C’est **l’index unique** de la table qui refuse le second, et la
 * transaction annulée qui emporte les points avec elle. La lecture qu’on fait
 * quand même sert à répondre proprement, pas à garantir quoi que ce soit.
 */

/** Un contrôle déjà envoyé, tel qu’on le relit. */
export type ControleEnvoye = {
  reponses: number[];
  note: number;
  surCombien: number;
  envoyeLe: Date;
};

/** Le contrôle qu’un élève a envoyé pour cette leçon, ou `null`. */
export async function controleEnvoye(
  eleveId: string,
  matiereId: string,
  annee: Annee,
  rang: number,
): Promise<ControleEnvoye | null> {
  const ligne = await prisma.controleEnvoye.findFirst({
    where: { eleveId, matiereId, annee, rang },
    select: { reponses: true, note: true, surCombien: true, envoyeLe: true },
  });
  return ligne ?? null;
}

/**
 * Tous les contrôles qu’un élève a envoyés, par clé « matiere/rang ».
 *
 * Sert la page d’une année, qui affiche « contrôle envoyé · 4 sur 5 » en face
 * de chaque leçon. Une requête pour toute la page, jamais une par leçon.
 */
export async function controlesEnvoyesDe(
  eleveId: string,
): Promise<Map<string, ControleEnvoye>> {
  const lignes = await prisma.controleEnvoye.findMany({
    where: { eleveId },
    select: {
      matiereId: true,
      rang: true,
      reponses: true,
      note: true,
      surCombien: true,
      envoyeLe: true,
    },
  });
  return new Map(
    lignes.map((l) => [`${l.matiereId}/${l.rang}`, l as ControleEnvoye]),
  );
}

// ─────────────────────────────────────────────────────────────
//  Le registre des professeurs — art. rien, décision du joueur
// ─────────────────────────────────────────────────────────────

/** Une ligne du registre : qui, quoi, quelle note. */
export type ControleVu = {
  id: string;
  /** Nul quand le compte a été supprimé : la ligne reste, elle. */
  prenomNom: string | null;
  /**
   * **La maison, si elle s'affiche** — `aUneMaison`, jamais la colonne brute.
   * Nulle pour une directrice ou un professeur, dont la maison reste écrite en
   * base sous `SANS_OBJET`.
   */
  maison: string | null;
  matiereId: string;
  annee: number;
  rang: number;
  note: number;
  surCombien: number;
  envoyeLe: Date;
};

/**
 * **Tous les contrôles envoyés**, pour qui a le droit de les voir.
 *
 * ⚠️ **Ce dépôt ne décide d’aucun droit — il les reçoit.** L’appelant a déjà
 * demandé `peutVoirLesControles` ; recopier la question ici en ferait une
 * seconde source, qui divergerait le jour où l’on toucherait aux pouvoirs.
 * C’est le parti pris du tableau d’affichage d’une maison.
 *
 * ⚠️ **On ne rend AUCUNE réponse d’élève.** La colonne `reponses` existe, et
 * elle reste au chaud : un professeur a besoin d’une note, pas d’une copie.
 * Le moins qu’une permission ouvre, le mieux elle se relit — et le jour où
 * il faudra les copies, ce sera une décision du joueur, pas un `select` de
 * plus glissé dans un lot.
 *
 * ⚠️ **Ni portrait ni biographie**, pour la même raison que le Registre : un
 * portrait pèse deux cents kilo-octets en base, et une requête de liste ne
 * doit jamais en ramener.
 *
 * Rendus du plus récent au plus ancien : c’est ce qu’un professeur vient
 * voir — qui a passé quelque chose depuis sa dernière visite.
 */
export async function listerLesControles(): Promise<ControleVu[]> {
  const lignes = await prisma.controleEnvoye.findMany({
    select: {
      id: true,
      matiereId: true,
      annee: true,
      rang: true,
      note: true,
      surCombien: true,
      envoyeLe: true,
      eleve: { select: { prenomNom: true, maison: true, etatMaison: true } },
    },
    orderBy: { envoyeLe: "desc" },
  });

  return lignes.map((l) => ({
    id: l.id,
    prenomNom: l.eleve?.prenomNom ?? null,
    // ⚠️ **La colonne `maison` est TOUJOURS écrite, et ne dit rien à elle
    // seule.** Une directrice garde la sienne au chaud sous `SANS_OBJET`, et
    // la rendre telle quelle l'afficherait comme une élève de Tideål. C'est
    // `aUneMaison` qui tranche — ici, et jamais en comparant l'état dans un
    // composant. Constaté à l'écran le 4 septembre 2026.
    maison:
      l.eleve && aUneMaison({ etatMaison: l.eleve.etatMaison })
        ? l.eleve.maison
        : null,
    matiereId: l.matiereId,
    annee: l.annee,
    rang: l.rang,
    note: l.note,
    surCombien: l.surCombien,
    envoyeLe: l.envoyeLe,
  }));
}

/** Un membre, tel que la salle des professeurs le liste. */
export type MembreDeLaSalle = {
  eleveId: string;
  prenomNom: string;
  /** L’année, **ou le titre au château qui la remplace** — `libellePlace`. */
  place: string;
  /** L’année du cursus, pour le tri et pour le regroupement. */
  annee: number;
  /** La maison **si elle s’affiche**, jamais la colonne brute. */
  maison: string | null;
  /** Combien de contrôles il a envoyés, toutes matières confondues. */
  controlesEnvoyes: number;
};

/**
 * **Tous les membres, pour la salle des professeurs.**
 *
 * ⚠️ **Le compte de service n’y figure pas** — celui de La Veille, qui se
 * connecte chaque matin. La condition est écrite en toutes lettres ici, jamais
 * factorisée : la sortir du `where` la rendrait invisible. C’est le procédé du
 * courrier du château et du Registre.
 *
 * ⚠️ **Les professeurs et la directrice y figurent**, et il ne faut pas
 * essayer de les écarter : il n’existe aucune colonne « n’est pas un élève »,
 * et `roleAffiche` est décoratif — le lire pour décider d’un affichage est
 * précisément ce que la règle du joueur interdit. `libellePlace` met leur
 * titre à la place de l’année, et cela suffit à les reconnaître. Même choix
 * que la liste des passages d’année.
 *
 * ⚠️ **Aucun portrait.** Deux cents kilo-octets par fiche en base : une
 * requête de liste n’en ramène jamais. Piège payé sur le Registre.
 */
export async function listerLesMembresDeLaSalle(): Promise<MembreDeLaSalle[]> {
  const fiches = await prisma.eleve.findMany({
    where: { statut: "ACCEPTE", utilisateur: { compteDeService: false } },
    select: {
      id: true,
      prenomNom: true,
      fonction: true,
      roleAffiche: true,
      maison: true,
      etatMaison: true,
    },
  });

  // Un seul aller-retour pour tous les comptes, plutôt qu’une requête par
  // ligne : la salle en affichera trente le jour où l’école sera pleine.
  const comptes = await prisma.controleEnvoye.groupBy({
    by: ["eleveId"],
    _count: { _all: true },
  });
  const parEleve = new Map(
    comptes.map((c) => [c.eleveId, c._count._all] as const),
  );

  return fiches
    .map((f) => ({
      eleveId: f.id,
      prenomNom: f.prenomNom,
      place: libellePlace(f.fonction as Fonction, f.roleAffiche),
      annee: rangAnnee(f.fonction as Fonction),
      maison: aUneMaison({ etatMaison: f.etatMaison }) ? f.maison : null,
      controlesEnvoyes: parEleve.get(f.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        a.annee - b.annee || a.prenomNom.localeCompare(b.prenomNom, "fr"),
    );
}

/** Une fiche, et ce qu’elle a passé. */
export type FichePourLeReleve = {
  eleveId: string;
  prenomNom: string;
  place: string;
  annee: number;
  maison: string | null;
  controles: ControleAuReleve[];
};

/**
 * **Une fiche et tous ses contrôles**, pour composer son relevé.
 *
 * Rend `null` pour une fiche qui n’existe pas, dont le dossier n’est pas
 * accepté, ou qui est un compte de service — les trois se lisent de la même
 * façon à l’écran : « Ce couloir ne mène nulle part ». Distinguer les cas se
 * lirait comme une confirmation.
 *
 * ⚠️ **`reponses` n’est pas demandé**, et ne doit jamais l’être ici : un relevé
 * porte des notes. Le jour où il faudra les copies, ce sera une décision du
 * joueur, pas un champ de plus dans ce `select`.
 */
export async function fichePourLeReleve(
  eleveId: string,
): Promise<FichePourLeReleve | null> {
  const f = await prisma.eleve.findFirst({
    where: {
      id: eleveId,
      statut: "ACCEPTE",
      utilisateur: { compteDeService: false },
    },
    select: {
      id: true,
      prenomNom: true,
      fonction: true,
      roleAffiche: true,
      maison: true,
      etatMaison: true,
      controlesEnvoyes: {
        select: {
          matiereId: true,
          annee: true,
          rang: true,
          note: true,
          surCombien: true,
          envoyeLe: true,
        },
        orderBy: { envoyeLe: "desc" },
      },
    },
  });
  if (!f) return null;

  return {
    eleveId: f.id,
    prenomNom: f.prenomNom,
    place: libellePlace(f.fonction as Fonction, f.roleAffiche),
    annee: rangAnnee(f.fonction as Fonction),
    maison: aUneMaison({ etatMaison: f.etatMaison }) ? f.maison : null,
    controles: f.controlesEnvoyes,
  };
}

// ─────────────────────────────────────────────────────────────
//  L’envoi — définitif, et il n’y en a qu’un
// ─────────────────────────────────────────────────────────────

export type ResultatEnvoi =
  | {
      etat: "ENVOYE";
      correction: Correction;
      /** Les réponses NETTOYÉES, jamais celles reçues : l'appelant les renvoie
       * telles quelles à la page, et ne doit pas relire ce qui est arrivé. */
      reponses: number[];
      points: number;
      envoyeLe: Date;
    }
  /** Le questionnaire n’existe pas, ou les réponses ne sont pas recevables. */
  | { etat: "REFUSE" }
  /** Il a déjà été envoyé. La page montre le résultat, elle ne le repasse pas. */
  | { etat: "DEJA_ENVOYE" };

/**
 * **Envoyer un contrôle.** Une fois, et pour toujours.
 *
 * ⚠️ **La note est calculée ici, jamais reçue.** Ce qui arrive du navigateur
 * est une liste d’indices, et rien d’autre : les bonnes réponses ne sont
 * jamais descendues, elles ne peuvent donc pas remonter.
 *
 * ⚠️ **Les points sont accordés dans la même transaction que la ligne.** C’est
 * ce qui rend l’index unique suffisant : si le second envoi est refusé, ses
 * points le sont avec lui.
 */
export async function envoyerLeControle(
  auteur: {
    eleveId: string;
    maison: string | null;
    etatMaison: "NON_FAIT" | "FAIT" | "SANS_OBJET";
  },
  matiereId: string,
  annee: Annee,
  rang: number,
  brut: unknown,
): Promise<ResultatEnvoi> {
  const questionnaire = questionnaireDe(matiereId, annee, rang);
  if (!questionnaire) return { etat: "REFUSE" };

  const reponses = reponsesRecevables(questionnaire, brut);
  if (!reponses) return { etat: "REFUSE" };

  const correction = corriger(questionnaire, reponses);

  try {
    return await transaction(async (tx) => {
      const ligne = await tx.controleEnvoye.create({
        data: {
          eleveId: auteur.eleveId,
          matiereId,
          annee,
          rang,
          reponses,
          note: correction.note,
          surCombien: correction.surCombien,
        },
        select: { envoyeLe: true },
      });

      const points = await accorderLesPointsDUnControle(
        tx,
        auteur,
        correction.note,
      );

      return {
        etat: "ENVOYE" as const,
        correction,
        reponses,
        points,
        envoyeLe: ligne.envoyeLe,
      };
    });
  } catch (erreur) {
    // P2002 : l’index unique a parlé. C’est le cas nominal d’un second clic,
    // pas une panne — on le traduit, on ne le laisse pas remonter en 500.
    if (
      typeof erreur === "object" &&
      erreur !== null &&
      "code" in erreur &&
      (erreur as { code?: string }).code === "P2002"
    ) {
      return { etat: "DEJA_ENVOYE" };
    }
    throw erreur;
  }
}
