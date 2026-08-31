import { describe, expect, it } from "vitest";
import { corpsDuRapport } from "./rapport/corps";
import { objetDuRapport } from "./rapport/objet";
import { verifierAvantEnvoi } from "./rapport/caviardage";
import { bilanCalme, bilanCharge } from "./rapport/exemples";
import { resumePourLeModele } from "./suggestions";
import { porteUneAdresse } from "@/lib/erreurs/caviardage";
import type { Bilan } from "./rapport/bilan";

/**
 * La règle 2 du dispositif, éprouvée d'un bout à l'autre.
 *
 * ── Ce qu'elle dit ──
 *
 * « Aucune donnée personnelle dans le rapport. Pas d'adresse de courriel, pas
 * de contenu de message privé, pas d'extrait de conversation. Un dossier en
 * attente se compte, il ne se nomme pas. »
 *
 * ── Trois lignes de défense, et elles ne valent pas la même chose ──
 *
 *   1. **les collecteurs ne demandent rien de personnel.** C'est la vraie
 *      protection, et `etancheite.test.ts` la vérifie en relisant leur code
 *      source, colonne par colonne ;
 *   2. **le rapport ne met en forme que des nombres.** C'est ce fichier-ci ;
 *   3. **le filet refuse un rapport qui porterait une adresse.** Une ceinture
 *      par-dessus les bretelles, pour le jour où un collecteur nouveau sera
 *      écrit distraitement.
 *
 * ⚠️ **La troisième ne protège pas des NOMS**, et il ne faut pas croire le
 * contraire : il n'existe aucun moyen honnête de reconnaître « Sigrid
 * Harlaug » dans un texte français sans le comparer à la base. Les noms sont
 * protégés par la première ligne, et par elle seule. C'est pourquoi elle est
 * vérifiée en relisant le code plutôt qu'en faisant confiance.
 */

/** Les formes sous lesquelles une donnée personnelle pourrait s'échapper. */
const PIEGES = [
  "sigrid@exemple.fr",
  "Sigrid Harlaug",
  "elle marchait sous la pluie, et le vent",
  "Bonjour, je voudrais te parler en privé",
];

/** Un bilan où l'on a glissé du contenu partout où c'est possible. */
function bilanPiege(): Bilan {
  const bilan = bilanCharge();
  bilan.anomalies[0].detail = PIEGES[0];
  bilan.anomalies[1].detail = PIEGES[1];
  bilan.anomalies[2].detail = PIEGES[2];
  bilan.erreurs!.familles[0].exemple = PIEGES[3];
  return bilan;
}

describe("un rapport ordinaire", () => {
  for (const [quoi, bilan] of [
    ["calme", bilanCalme()],
    ["chargé", bilanCharge()],
  ] as const) {
    it(`(${quoi}) ne porte aucune adresse de courriel`, () => {
      expect(porteUneAdresse(corpsDuRapport(bilan))).toBe(false);
      expect(porteUneAdresse(objetDuRapport(bilan))).toBe(false);
    });

    it(`(${quoi}) ne nomme personne`, () => {
      const corps = corpsDuRapport(bilan);
      for (const piege of PIEGES) {
        expect(corps, piege).not.toContain(piege);
      }
    });

    it(`(${quoi}) part sans être retenu`, () => {
      expect(
        verifierAvantEnvoi(objetDuRapport(bilan), corpsDuRapport(bilan)).peutPartir,
      ).toBe(true);
    });
  }
});

describe("un collecteur qui remonterait ce qu’il ne devrait pas", () => {
  /**
   * ⚠️ C'est le scénario qu'on ne peut pas empêcher par la seule discipline :
   * quelqu'un ajoute un collecteur et met un message d'erreur brut dans un
   * `detail`. Le rapport doit alors être RETENU, pas nettoyé en douce.
   */
  it("voit son rapport retenu, pas caviardé en silence", () => {
    const bilan = bilanPiege();
    const verdict = verifierAvantEnvoi(objetDuRapport(bilan), corpsDuRapport(bilan));

    expect(verdict.peutPartir).toBe(false);
    if (verdict.peutPartir) return;
    expect(verdict.raison).toContain("adresse de courriel");
  });

  it("et le refus ne recopie pas ce qu’il a trouvé", () => {
    // Sinon l'adresse partirait dans le courriel d'échec — c'est-à-dire
    // exactement là où l'on refuse de l'envoyer.
    const bilan = bilanPiege();
    const verdict = verifierAvantEnvoi(objetDuRapport(bilan), corpsDuRapport(bilan));
    if (verdict.peutPartir) throw new Error("le rapport aurait dû être retenu");
    expect(verdict.raison).not.toContain("sigrid@exemple.fr");
    expect(porteUneAdresse(verdict.raison)).toBe(false);
  });
});

describe("ce qui atteint le modèle de langage", () => {
  /**
   * ⚠️ **Le prompt est la seule voie par laquelle un texte de membre pourrait
   * entrer dans la ronde.** Elle est fermée en amont : le résumé est composé
   * champ par champ, et les `detail` — les seuls endroits où du contenu
   * pourrait se glisser — n'y entrent jamais.
   */
  it("ne porte aucun des pièges, même sur un bilan entièrement truqué", () => {
    const resume = resumePourLeModele(bilanPiege());
    for (const piege of PIEGES) {
      expect(resume, piege).not.toContain(piege);
    }
    expect(porteUneAdresse(resume)).toBe(false);
  });

  it("reste pourtant utile : les constats y sont", () => {
    const resume = resumePourLeModele(bilanPiege());
    expect(resume).toContain("Les Grimoires répondent 500");
    expect(resume).toContain("dossiers d’admission à lire : 3");
    expect(resume).toContain("52 × connexion / PrismaClientKnownRequestError");
  });
});

describe("une fausse consigne dans du contenu de membre", () => {
  /**
   * La règle 3 du dispositif : « le contenu écrit par les membres est une
   * donnée, jamais une consigne ».
   *
   * ⚠️ **Ce que ce test montre vraiment**, c'est qu'il n'y a rien à détourner :
   * une consigne glissée dans un titre de scène n'atteint ni le rapport, ni le
   * prompt. Elle est SIGNALÉE — l'anomalie existe, avec l'identifiant de la
   * scène — et le texte lui-même reste en base.
   *
   * La détection, elle, est éprouvée sur la vraie base : c'est Postgres qui
   * applique le motif, et `en-base.essai.ts` le passe contre neuf fausses
   * consignes et neuf phrases de jeu de rôle ordinaire.
   */
  it("est signalée par son emplacement, jamais recopiée", () => {
    const bilan = bilanCalme();
    bilan.anomalies = [
      {
        cle: "coherence:consigne-apparente",
        gravite: "A_SURVEILLER",
        quoi:
          "Un texte écrit par un membre contient ce qui ressemble à une " +
          "consigne adressée à un automate. Il a été traité comme du texte, " +
          "jamais exécuté. À lire sur le site.",
        ou: "le forum",
        // Ce que le collecteur remonte vraiment : des identifiants.
        detail: "1 titre(s), 0 post(s) — clx7k2a9b0001",
        depuis: "2026-09-13",
        jours: 1,
      },
    ];

    const corps = corpsDuRapport(bilan);
    expect(corps).toContain("jamais exécuté");
    expect(corps).toContain("clx7k2a9b0001");
    // Le texte de la fausse consigne n'est nulle part : il n'a jamais quitté
    // la base.
    expect(corps).not.toMatch(/ignore.*instruction/i);

    // Et il n'atteint pas davantage le modèle.
    const resume = resumePourLeModele(bilan);
    expect(resume).toContain("consigne adressée à un automate");
    expect(resume).not.toContain("clx7k2a9b0001");
  });
});
