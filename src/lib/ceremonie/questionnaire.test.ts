import { describe, expect, it } from "vitest";
import { MAISONS } from "@/lib/dossier/etats";
import {
  identifiantsDe,
  pourLAffichage,
  QUESTIONS,
  reponseDe,
} from "./questionnaire";

/**
 * Le questionnaire, et ce qui a le droit d’en sortir.
 *
 * Deux choses se vérifient ici : que le barème respecte la règle des 2 + 1
 * partout — une faute de frappe y serait invisible à l’œil — et surtout que
 * les pondérations ne franchissent jamais la frontière du navigateur.
 */

describe("la forme du questionnaire", () => {
  it("compte cinq questions de quatre réponses", () => {
    expect(QUESTIONS).toHaveLength(5);
    for (const question of QUESTIONS) {
      expect(question.reponses).toHaveLength(4);
    }
  });

  it("nomme ses réponses « qNx », sans doublon dans tout le questionnaire", () => {
    const tous: string[] = [];
    QUESTIONS.forEach((question, index) => {
      question.reponses.forEach((reponse, rang) => {
        expect(reponse.id).toBe(`q${index + 1}${"abcd"[rang]}`);
        tous.push(reponse.id);
      });
    });
    expect(new Set(tous).size).toBe(tous.length);
  });

  it("donne partout 2 points à une maison et 1 à une autre", () => {
    for (const question of QUESTIONS) {
      for (const reponse of question.reponses) {
        const entrees = Object.entries(reponse.points);

        expect(entrees, `${reponse.id} sert deux maisons`).toHaveLength(2);
        expect(
          entrees.map(([, valeur]) => valeur).sort(),
          `${reponse.id} donne 1 et 2`,
        ).toEqual([1, 2]);

        for (const [maison] of entrees) {
          expect(MAISONS, `${reponse.id} cite une maison connue`).toContain(maison);
        }
      }
    }
  });

  it("écrit ses textes avec des apostrophes typographiques", () => {
    for (const question of QUESTIONS) {
      expect(question.enonce).not.toContain("'");
      for (const reponse of question.reponses) {
        expect(reponse.texte, reponse.id).not.toContain("'");
      }
    }
  });
});

describe("les questions telles qu’elles partent au navigateur", () => {
  const melange = [
    ["q1c", "q1a", "q1d", "q1b"],
    ["q2b", "q2d", "q2a", "q2c"],
    ["q3d", "q3c", "q3b", "q3a"],
    ["q4a", "q4d", "q4c", "q4b"],
    ["q5c", "q5b", "q5d", "q5a"],
  ];

  it("suit l’ordre tiré pour cet élève", () => {
    const affichees = pourLAffichage(melange);
    affichees.forEach((question, index) => {
      expect(question.reponses.map((r) => r.id)).toEqual(melange[index]);
    });
  });

  it("porte le bon texte sous chaque identifiant", () => {
    const affichees = pourLAffichage(melange);
    affichees.forEach((question, index) => {
      for (const reponse of question.reponses) {
        expect(reponse.texte).toBe(reponseDe(index, reponse.id)?.texte);
      }
    });
  });

  /**
   * **Le test qui compte.** Si les pondérations traversaient, un joueur
   * lirait le code de la page et choisirait sa maison — la cérémonie ne
   * voudrait plus rien dire.
   */
  it("ne laisse fuir aucune pondération", () => {
    const affichees = pourLAffichage(melange);

    for (const question of affichees) {
      expect(Object.keys(question).sort()).toEqual(["enonce", "id", "reponses"]);
      for (const reponse of question.reponses) {
        expect(Object.keys(reponse).sort()).toEqual(["id", "texte"]);
      }
    }

    // Et rien non plus qui se serait glissé en profondeur.
    const expedie = JSON.stringify(affichees);
    expect(expedie).not.toContain("points");
    for (const maison of MAISONS) {
      expect(expedie).not.toContain(maison);
    }
  });

  it("retombe sur l’ordre d’écriture quand le mélange manque", () => {
    const affichees = pourLAffichage([]);
    affichees.forEach((question, index) => {
      expect(question.reponses.map((r) => r.id)).toEqual([
        ...identifiantsDe(index),
      ]);
    });
  });
});
