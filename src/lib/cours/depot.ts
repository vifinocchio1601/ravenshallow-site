import "server-only";
import { transaction } from "@/lib/base/transaction";
import { accorderLesPointsDUnControle } from "@/lib/points/depot";
import { prisma } from "@/lib/prisma";
import { aUneMaison } from "@/lib/session/acces";
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
