import type { Bilan } from "./bilan";
import { CHIFFRES_DE_VIE } from "../constantes";

/**
 * Deux bilans de démonstration — un matin calme, un mauvais matin.
 *
 * ── Pourquoi ils ne vivent pas dans le fichier d'essai ──
 *
 * Parce qu'ils servent deux fois : aux essais du rapport, et à `npm run
 * veille:exemple`, qui montre à quoi ressemble un rapport chargé sans attendre
 * qu'il arrive un vrai mauvais matin. Un fichier `.test.ts` ne s'importe pas
 * hors de Vitest — il enregistre des `describe` au chargement et tombe.
 *
 * ⚠️ **Ce sont des données inventées.** Elles ne viennent d'aucune base, et
 * aucun chiffre n'y est réel : ce sont des formes à mettre en page.
 */

/** Un matin calme : rien à signaler, rien qui attend. */
export function bilanCalme(): Bilan {
  return {
    instant: new Date("2026-09-13T03:00:00Z"),
    anomalies: [],
    attente: {
      dossiers: 0,
      dossiersACorriger: 0,
      signalements: 0,
      courrier: 0,
      partenariats: 0,
      scenesMuettes: 0,
      comptesInactifs: 0,
      comptesArchivables: 0,
      correctionsEnRetard: 0,
    },
    vie: {
      jour: "2026-09-13",
      historique: 7,
      chiffres: CHIFFRES_DE_VIE.map(({ cle, nom }) => ({
        cle,
        nom,
        aujourdhui: 10,
        hier: 9,
        moyenne: 9.5,
        ecartPourcent: 5,
      })),
    },
    erreurs: { total: 0, familles: [], nonDetaillees: 0 },
    disponibilite: null,
    parcours: null,
    coherence: null,
    manquants: [],
    suggestions: [],
    dureeMs: 42_000,
    ecourtee: false,
  };
}

/** Un mauvais matin : trois anomalies, du travail en attente, une chute. */
export function bilanCharge(): Bilan {
  return {
    ...bilanCalme(),
    instant: new Date("2026-09-12T03:00:00Z"),
    anomalies: [
      {
        cle: "disponibilite:code-500:/grimoires",
        gravite: "PANNE",
        quoi: "Les Grimoires répondent 500 au lieu de 200.",
        ou: "/grimoires",
        depuis: "2026-09-09",
        jours: 4,
      },
      {
        cle: "coherence:compteur-derive:NATTORM",
        gravite: "DEGAT",
        quoi:
          "Le compteur de la maison ne correspond pas au carnet. Un recalcul " +
          "depuis /admin/points remettrait les quatre d’aplomb.",
        ou: "compteurs_maison — NATTORM",
        detail: "compteur 34, carnet 31",
        depuis: "2026-09-12",
        jours: 1,
      },
      {
        cle: "vie:posts:baisse",
        gravite: "A_SURVEILLER",
        quoi: "Les posts publiés sont bien en dessous de la moyenne.",
        ou: "la vie du site",
        detail: "2 aujourd’hui, 18,4 en moyenne (−89 %)",
        depuis: "2026-09-11",
        jours: 2,
      },
    ],
    attente: {
      dossiers: 3,
      dossiersACorriger: 1,
      signalements: 2,
      courrier: 1,
      partenariats: 0,
      scenesMuettes: 5,
      comptesInactifs: 4,
      comptesArchivables: 1,
      correctionsEnRetard: 1,
    },
    erreurs: {
      total: 57,
      familles: [
        {
          portee: "connexion",
          type: "PrismaClientKnownRequestError",
          code: "P2028",
          nombre: 52,
          exemple: "Transaction not found",
          derniere: new Date("2026-09-12T02:14:00Z"),
        },
        {
          portee: "courriel",
          type: "Error",
          code: null,
          nombre: 5,
          exemple: "Invalid login",
          derniere: new Date("2026-09-11T22:03:00Z"),
        },
      ],
      nonDetaillees: 2,
    },
    suggestions: [
      "La chute des posts et le 500 des Grimoires sont apparus le même jour : regarder le déploiement du 9 septembre avant de chercher ailleurs.",
      "Les 52 P2028 en connexion ressemblent au réveil de la base ; vérifier que l’endormissement est bien désactivé dans la console Neon.",
    ],
    manquants: [
      { nom: "le parcours au navigateur", raison: "Chromium n’a pas pu démarrer." },
    ],
  };
}

