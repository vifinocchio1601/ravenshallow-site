import type { PrismaClient } from "@prisma/client";
import type { Recolte } from "../collecte";
import { REGLEMENT } from "../constantes";

/**
 * Ce qui attend le joueur — et qui n'est pas un défaut.
 *
 * ── La différence avec les anomalies ──
 *
 * Trois dossiers en attente de lecture, ce n'est pas une panne : c'est du
 * travail. Les mêler aux anomalies ferait de chaque matin une alerte, et l'on
 * cesserait de lire le rapport — ce qui est le seul vrai risque de tout ce
 * dispositif.
 *
 * Ce collecteur ne lève donc **presque jamais d'anomalie**. Il compte.
 *
 * ── Des nombres, jamais des noms ──
 *
 * ⚠️ **C'est la règle la plus stricte de toute la ronde**, et c'est ici
 * qu'elle est le plus tentante à enfreindre : « Sigrid attend depuis six
 * jours » serait tellement plus commode que « 1 dossier attend ». Mais un
 * dossier en attente porte une candidature, parfois un refus à venir, et cela
 * ne voyage pas dans un courriel. On compte, on ne nomme pas.
 *
 * Aucune requête de ce fichier ne demande `prenomNom`, ni `email`, ni un
 * corps de message. `rapport/caviardage.ts` le vérifie une seconde fois avant
 * l'envoi, et `veille/vie-privee.test.ts` une troisième.
 */

export type CeQuiAttend = {
  /** Dossiers d'admission jamais lus. */
  dossiers: number;
  /** Dossiers renvoyés en correction, en attente du joueur. */
  dossiersACorriger: number;
  /** Signalements non traités (art. 8.6). */
  signalements: number;
  /** Courrier du château sans réponse. */
  courrier: number;
  /** Demandes de partenariat sans suite. */
  partenariats: number;
  /** Art. 17.2 — scènes sans réponse depuis plus d'un mois. */
  scenesMuettes: number;
  /** Art. 7.2 — un mois sans connexion, sans absence signalée. */
  comptesInactifs: number;
  /** Art. 7.3 — trois mois : le compte peut être archivé. */
  comptesArchivables: number;
  /** Art. 19.3 — posts masqués dont les sept jours sont écoulés. */
  correctionsEnRetard: number;
};

export type Options = { base: PrismaClient; instant: Date };

const JOUR = 24 * 60 * 60 * 1000;
const ilYA = (instant: Date, jours: number) =>
  new Date(instant.getTime() - jours * JOUR);

export async function collecterCeQuiAttend({
  base,
  instant,
}: Options): Promise<Recolte<CeQuiAttend>> {
  const [
    dossiers,
    dossiersACorriger,
    signalements,
    partenariats,
    scenesMuettes,
    comptesInactifs,
    comptesArchivables,
    correctionsEnRetard,
    courrier,
  ] = await Promise.all([
    base.eleve.count({ where: { statut: "EN_ATTENTE" } }),
    base.eleve.count({ where: { statut: "A_CORRIGER" } }),
    base.signalement.count({ where: { statut: "EN_ATTENTE" } }),
    base.demandePartenariat.count({ where: { suite: "EN_ATTENTE" } }),

    // Art. 17.2 — « une scène sans réponse depuis un mois peut être clôturée ».
    // Closes et supprimées exclues : elles n'attendent plus personne.
    base.sujet.count({
      where: {
        supprimeLe: null,
        closLe: null,
        dernierPostLe: { lt: ilYA(instant, REGLEMENT.sceneMuetteJours) },
      },
    }),

    // Art. 7.2 — un mois sans activité. ⚠️ Une date NULLE ne vaut pas une
    // absence : la colonne n'existe que depuis le 27 août 2026, et tous les
    // comptes d'avant sont à `null` sans s'être absentés un seul jour. C'est
    // le piège déjà payé par `/admin/absences`.
    base.utilisateur.count({
      where: {
        compteDeService: false,
        archiveLe: null,
        eleve: { statut: "ACCEPTE" },
        derniereConnexionLe: { lt: ilYA(instant, REGLEMENT.inactiviteJours) },
      },
    }),

    // Art. 7.3 — trois mois. Les déjà archivés ne sont plus à archiver.
    base.utilisateur.count({
      where: {
        compteDeService: false,
        archiveLe: null,
        eleve: { statut: "ACCEPTE" },
        derniereConnexionLe: { lt: ilYA(instant, REGLEMENT.archivageJours) },
      },
    }),

    // Art. 19.3 — sept jours pour corriger. Passé le délai, c'est au staff de
    // reprendre la main : le post est toujours masqué, et personne ne l'a
    // rouvert.
    base.post.count({
      where: {
        masqueLe: { not: null },
        retireLe: null,
        corrigerAvantLe: { lt: instant },
      },
    }),

    // Le courrier du château dont le dernier corbeau vient du membre : c'est
    // une question sans réponse. ⚠️ **Aucun contenu n'est lu** — on compte des
    // fils, on n'ouvre rien.
    courrierSansReponse(base),
  ]);

  return {
    donnees: {
      dossiers,
      dossiersACorriger,
      signalements,
      courrier,
      partenariats,
      scenesMuettes,
      comptesInactifs,
      comptesArchivables,
      correctionsEnRetard,
    },
    // Rien ici n'est une anomalie : c'est du travail, pas un défaut. Les deux
    // exceptions sont ailleurs, dans `coherence.ts`, où un dégât se cache.
    anomalies: [],
  };
}

/**
 * Les fils de courrier dont le dernier mot vient du membre.
 *
 * ⚠️ **`AVEC_ADMINISTRATION` est écrit en toutes lettres**, jamais tiré d'une
 * constante — c'est la règle du courrier du château, et la sortir du `where`
 * la rendrait invisible. Un `SELECT COUNT` qui l'oublierait compterait les
 * conversations privées entre joueurs.
 *
 * ⚠️ **Rien n'est lu du corps des messages.** On compte des fils.
 */
async function courrierSansReponse(base: PrismaClient): Promise<number> {
  const lignes = await base.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*)::bigint AS n
       FROM "conversations" c
      WHERE c."type" = 'AVEC_ADMINISTRATION'
        AND EXISTS (
          SELECT 1 FROM "messages" m
           WHERE m."conversationId" = c."id"
             AND m."auteurId" IS NOT NULL
             AND m."envoyeLe" = (
               SELECT MAX(m2."envoyeLe") FROM "messages" m2
                WHERE m2."conversationId" = c."id"
             )
        )`,
  );
  return Number(lignes[0]?.n ?? 0);
}
