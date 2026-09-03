import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  clesDesQuestionnaires,
  corriger,
  enoncesDe,
  questionnaireDe,
  reponsesRecevables,
} from "./questionnaires";
import { matiereDe } from "./cursus";

/**
 * ⚠️ **Ce fichier n'est pas `server-only`, et celui qu'il éprouve l'est.**
 * Vitest tourne côté serveur, l'import passe. Ce qui ne passerait pas — et qui
 * est tout l'intérêt — c'est un composant client qui l'importerait : la
 * compilation casse. Ces essais ne remplacent pas ce filet, ils vérifient ce
 * qu'il ne peut pas voir.
 */

const CLES = clesDesQuestionnaires();
const TOUS = CLES.map((cle) => {
  const [matiere, annee, rang] = cle.split("/");
  return questionnaireDe(matiere!, Number(annee) as 1, Number(rang))!;
});

describe("les questionnaires posés", () => {
  it("sont les six de première année", () => {
    expect(CLES.sort()).toEqual(
      [
        "creatures/1/1",
        "herboristerie/1/1",
        "histoire/1/1",
        "magie_defensive/1/1",
        "runologie/1/1",
        "sortileges/1/1",
      ].sort(),
    );
  });

  it("portent un identifiant de matière qui existe au cursus", () => {
    for (const q of TOUS) {
      expect(matiereDe(q.matiereId), q.matiereId).not.toBeNull();
    }
  });

  it("ont une bonne réponse qui désigne un choix qui existe", () => {
    for (const q of TOUS) {
      for (const [i, question] of q.questions.entries()) {
        expect(question.bonne, `${q.matiereId} q${i + 1}`).toBeGreaterThanOrEqual(0);
        expect(question.bonne, `${q.matiereId} q${i + 1}`).toBeLessThan(
          question.reponses.length,
        );
      }
    }
  });

  it("n’ont ni énoncé vide, ni réponse vide, ni explication vide", () => {
    for (const q of TOUS) {
      for (const [i, question] of q.questions.entries()) {
        const ou = `${q.matiereId} q${i + 1}`;
        expect(question.enonce.trim(), ou).not.toBe("");
        expect(question.explication.trim(), ou).not.toBe("");
        expect(question.reponses.length, ou).toBeGreaterThanOrEqual(2);
        for (const r of question.reponses) expect(r.trim(), ou).not.toBe("");
      }
    }
  });

  it("ne proposent jamais deux fois la même réponse à une question", () => {
    // Deux choix identiques rendraient l'un des deux faux sans qu'aucun élève
    // puisse comprendre pourquoi.
    for (const q of TOUS) {
      for (const [i, question] of q.questions.entries()) {
        expect(new Set(question.reponses).size, `${q.matiereId} q${i + 1}`).toBe(
          question.reponses.length,
        );
      }
    }
  });

  /**
   * ⚠️ **`mots` est indexé par la NOTE.** `mots[0]` pour zéro sur cinq,
   * `mots[5]` pour cinq sur cinq : il en faut donc un de plus qu'il n'y a de
   * questions. Un de moins, et le sans-faute — le seul qu'on lira avec
   * attention — s'afficherait sans un mot.
   */
  it("ont un mot du professeur pour chaque note possible, zéro compris", () => {
    for (const q of TOUS) {
      expect(q.mots.length, q.matiereId).toBe(q.questions.length + 1);
      for (const mot of q.mots) expect(mot.trim(), q.matiereId).not.toBe("");
    }
  });
});

describe("ce qui descend dans la page", () => {
  /**
   * **Le cœur du lot.** Dans les six maquettes, `bonne` et l'explication
   * vivaient dans le JavaScript de la page. `enoncesDe` est la seule porte, et
   * elle est écrite champ par champ — jamais par une copie dont on retirerait
   * deux clés, qui laisserait passer le champ qu'on ajouterait demain.
   */
  it("ne porte ni la bonne réponse ni l’explication", () => {
    for (const q of TOUS) {
      for (const posee of enoncesDe(q)) {
        expect(Object.keys(posee).sort()).toEqual(["enonce", "reponses"]);
      }
    }
  });

  it("porte les énoncés et les choix, dans l’ordre du questionnaire", () => {
    const q = questionnaireDe("sortileges", 1, 1)!;
    const posees = enoncesDe(q);
    expect(posees.length).toBe(q.questions.length);
    expect(posees[0]!.enonce).toBe(q.questions[0]!.enonce);
    expect(posees[0]!.reponses).toEqual([...q.questions[0]!.reponses]);
  });

  /**
   * ⚠️ **Le vrai filet, et il relit le code source.** Les six pages de
   * contrôle sont servies telles quelles ; si une bonne réponse, une
   * explication ou un mot du professeur y était resté, aucun test de logique
   * ne le verrait — la page marcherait parfaitement, et l'élève aurait ses
   * cinq réponses en ouvrant le code source.
   *
   * On relit donc les six modules, comme `etancheite.test.ts` relit la zone
   * d'administration. **Éprouvé en recollant le tableau `QUESTIONS` d'origine
   * dans une page : il tombe et nomme le fichier et le texte.**
   */
  it("aucune page de contrôle ne contient de réponse ni d’explication", () => {
    const dossier = "src/contenu/cours/controles";
    const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".ts"));
    expect(fichiers.length).toBe(TOUS.length);

    for (const fichier of fichiers) {
      const source = readFileSync(`${dossier}/${fichier}`, "utf8");
      for (const q of TOUS) {
        for (const question of q.questions) {
          expect(source.includes(question.explication), `${fichier} ← explication`).toBe(false);
        }
        for (const mot of q.mots) {
          expect(source.includes(mot), `${fichier} ← mot du professeur`).toBe(false);
        }
      }
      // Et les deux formes que prenait le barème dans la maquette.
      expect(source.includes("bonne:"), `${fichier} ← bonne:`).toBe(false);
      expect(source.includes("const MOTS"), `${fichier} ← const MOTS`).toBe(false);
    }
  });

  /**
   * L'autre bout du même fil : les marques que la route remplit doivent être
   * là. Une page qui en garderait une ne s'exécuterait pas, et l'élève verrait
   * un contrôle vide sans que rien ne dise pourquoi.
   */
  it("chaque page de contrôle porte les deux marques que la route remplit", () => {
    const dossier = "src/contenu/cours/controles";
    for (const fichier of readdirSync(dossier).filter((f) => f.endsWith(".ts"))) {
      const source = readFileSync(`${dossier}/${fichier}`, "utf8");
      expect(source.includes("const QUESTIONS = __DONNEES_QUESTIONS__"), fichier).toBe(true);
      expect(source.includes("const ETAT = __DONNEES_ETAT__"), fichier).toBe(true);
    }
  });
});

describe("ce que l’élève renvoie", () => {
  const q = questionnaireDe("sortileges", 1, 1)!;
  const justes = q.questions.map((question) => question.bonne);

  it("refuse ce qui n’est pas une liste de la bonne longueur", () => {
    for (const brut of [null, undefined, "1,2,3", 5, {}, [], [0, 1]]) {
      expect(reponsesRecevables(q, brut), JSON.stringify(brut)).toBeNull();
    }
    // Une de trop, une de moins : le contrôle s'envoie complet ou pas du tout.
    expect(reponsesRecevables(q, [...justes, 0])).toBeNull();
    expect(reponsesRecevables(q, justes.slice(0, -1))).toBeNull();
  });

  it("refuse un choix qui n’existe pas, et tout ce qui n’est pas un entier", () => {
    for (const mauvais of [-1, 4, 99, 1.5, NaN, "1", null]) {
      const brut = [...justes];
      brut[0] = mauvais as number;
      expect(reponsesRecevables(q, brut), String(mauvais)).toBeNull();
    }
  });

  it("accepte une liste complète d’indices valides", () => {
    expect(reponsesRecevables(q, justes)).toEqual(justes);
    expect(reponsesRecevables(q, [0, 0, 0, 0, 0])).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("corriger", () => {
  const q = questionnaireDe("sortileges", 1, 1)!;
  const justes = q.questions.map((question) => question.bonne);

  it("compte une bonne réponse par question juste — c’est la règle du joueur", () => {
    expect(corriger(q, justes).note).toBe(5);
    const uneFausse = [...justes];
    uneFausse[2] = (justes[2]! + 1) % q.questions[2]!.reponses.length;
    expect(corriger(q, uneFausse).note).toBe(4);
  });

  it("rend zéro quand tout est faux", () => {
    const toutFaux = justes.map(
      (bonne, i) => (bonne + 1) % q.questions[i]!.reponses.length,
    );
    expect(corriger(q, toutFaux).note).toBe(0);
  });

  it("rend le mot qui va avec la note, et jamais celui d’à côté", () => {
    expect(corriger(q, justes).mot).toBe(q.mots[5]);
    const toutFaux = justes.map(
      (bonne, i) => (bonne + 1) % q.questions[i]!.reponses.length,
    );
    expect(corriger(q, toutFaux).mot).toBe(q.mots[0]);
  });

  it("rend les bonnes réponses et les explications de toutes les questions", () => {
    const c = corriger(q, justes);
    expect(c.bonnes).toEqual(justes);
    expect(c.explications.length).toBe(q.questions.length);
    expect(c.surCombien).toBe(q.questions.length);
  });

  it("ne dépasse jamais le nombre de questions, sur les six questionnaires", () => {
    for (const questionnaire of TOUS) {
      const toutes = questionnaire.questions.map((question) => question.bonne);
      const c = corriger(questionnaire, toutes);
      expect(c.note, questionnaire.matiereId).toBe(questionnaire.questions.length);
      expect(c.note, questionnaire.matiereId).toBeLessThanOrEqual(c.surCombien);
    }
  });
});
