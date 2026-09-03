import { describe, expect, it } from "vitest";
import { obligatoires } from "./cursus";
import { LECONS } from "./lecons";
import {
  partDesControlesPasses,
  relevePour,
  type ControleAuReleve,
} from "./releve";

/**
 * ⚠️ **Aucun essai ne lit l'horloge.** L'instant arrive en paramètre, et l'on
 * éprouve donc la veille et le lendemain de l'ouverture sans attendre.
 */
const OUVERTURE = LECONS[0]!.ouverteAuxElevesLe!;
const AVANT = new Date(OUVERTURE.getTime() - 60_000);
const APRES = new Date(OUVERTURE.getTime() + 60_000);

function controle(
  matiereId: string,
  note: number,
  rang = 1,
  annee = 1,
): ControleAuReleve {
  return {
    matiereId,
    annee,
    rang,
    note,
    surCombien: 5,
    envoyeLe: APRES,
  };
}

describe("le relevé d’un première année", () => {
  it("porte les six matières imposées, et rien d’autre", () => {
    const releve = relevePour(1, [], APRES);
    expect(releve.annees).toHaveLength(1);
    expect(releve.annees[0]!.annee).toBe(1);
    expect(releve.annees[0]!.matieres.map((m) => m.matiereId).sort()).toEqual(
      obligatoires(1)
        .map((m) => m.id)
        .sort(),
    );
  });

  /**
   * ⚠️ **Les années sans aucune leçon en ligne ne figurent pas au relevé.**
   * Afficher six années vides sous la première ne dirait rien d'autre que
   * « ce n'est pas encore écrit », et noierait la seule qui porte quelque
   * chose. Elles apparaîtront d'elles-mêmes le jour où une leçon s'y posera.
   */
  it("n’affiche pas les années qui n’ont encore aucune leçon", () => {
    const septieme = relevePour(7, [], APRES);
    expect(septieme.annees.map((a) => a.annee)).toEqual([1]);
  });

  /**
   * Art. 14.4 — on ne va jamais au-delà de son année. Un professeur qui
   * consulte le relevé d'un première année n'y voit pas le programme de
   * septième : ce n'est pas le sien, et cela ne dit rien de son avancement.
   */
  it("ne montre jamais une année que l’élève n’a pas atteinte", () => {
    for (const annee of [1, 2, 3, 4, 5, 6, 7] as const) {
      const releve = relevePour(annee, [], APRES);
      for (const a of releve.annees) {
        expect(a.annee, `année ${annee}`).toBeLessThanOrEqual(annee);
      }
    }
  });
});

describe("l’avancement", () => {
  const six = obligatoires(1).map((m) => m.id);

  it("compte les leçons ouvertes, et les contrôles passés parmi elles", () => {
    const releve = relevePour(
      1,
      [controle("sortileges", 4), controle("runologie", 5)],
      APRES,
    );
    expect(releve.possibles).toBe(six.length);
    expect(releve.envoyes).toBe(2);
    expect(releve.points).toBe(9);
    expect(releve.surCombien).toBe(10);
  });

  /**
   * ⚠️ **Une leçon fermée ne compte pas contre l'élève.** « 0 sur 24 » à la
   * rentrée serait faux et décourageant : le dénominateur est ce qui lui est
   * OUVERT, pas ce qui existera un jour.
   */
  it("ne compte aucune leçon avant l’heure d’ouverture", () => {
    const releve = relevePour(1, [], AVANT);
    expect(releve.possibles).toBe(0);
    expect(releve.envoyes).toBe(0);
    expect(partDesControlesPasses(releve)).toBeNull();
  });

  /**
   * ⚠️ **Un contrôle passé avant l'heure s'affiche quand même** — le staff
   * peut le faire —, mais il ne gonfle pas le dénominateur. Sans quoi le
   * relevé annoncerait « 1 sur 0 ».
   */
  it("affiche un contrôle passé sur une leçon encore fermée, sans fausser le compte", () => {
    const releve = relevePour(1, [controle("sortileges", 5)], AVANT);
    expect(releve.possibles).toBe(0);
    expect(releve.envoyes).toBe(0);
    // La note, elle, est bien là.
    expect(releve.points).toBe(5);
    const sortileges = releve.annees[0]!.matieres.find(
      (m) => m.matiereId === "sortileges",
    )!;
    expect(sortileges.lecons[0]!.controle?.note).toBe(5);
    expect(sortileges.lecons[0]!.ouverte).toBe(false);
  });

  it("va jusqu’au sans-faute sur toutes les matières", () => {
    const releve = relevePour(
      1,
      six.map((id) => controle(id, 5)),
      APRES,
    );
    expect(releve.envoyes).toBe(six.length);
    expect(releve.possibles).toBe(six.length);
    expect(partDesControlesPasses(releve)).toBe(100);
    expect(releve.points).toBe(5 * six.length);
  });

  it("rend un pourcentage entier, jamais une décimale", () => {
    const releve = relevePour(1, [controle("sortileges", 3)], APRES);
    const part = partDesControlesPasses(releve)!;
    expect(Number.isInteger(part)).toBe(true);
    expect(part).toBe(Math.round((1 / six.length) * 100));
  });
});

describe("ce qui est rattaché à la bonne leçon", () => {
  it("n’attribue pas le contrôle d’une matière à une autre", () => {
    const releve = relevePour(1, [controle("runologie", 5)], APRES);
    const parMatiere = new Map(
      releve.annees[0]!.matieres.map((m) => [
        m.matiereId,
        m.lecons[0]!.controle,
      ]),
    );
    expect(parMatiere.get("runologie")?.note).toBe(5);
    expect(parMatiere.get("sortileges")).toBeNull();
  });

  /**
   * La clé porte la matière, l'année ET le rang. Un contrôle de deuxième
   * année ne doit pas se coller sur la leçon 1 de première : les deux
   * existeront le jour où la deuxième année sera écrite.
   */
  it("ne colle pas un contrôle d’une autre année sur la leçon de celle-ci", () => {
    const releve = relevePour(1, [controle("sortileges", 5, 1, 2)], APRES);
    expect(releve.annees[0]!.matieres[0]!.lecons[0]!.controle).toBeNull();
    expect(releve.envoyes).toBe(0);
  });

  it("ne colle pas un contrôle d’un autre rang sur la leçon 1", () => {
    const releve = relevePour(1, [controle("sortileges", 5, 2)], APRES);
    const sortileges = releve.annees[0]!.matieres.find(
      (m) => m.matiereId === "sortileges",
    )!;
    expect(sortileges.lecons[0]!.controle).toBeNull();
  });
});

describe("le relevé ne porte aucune copie", () => {
  /**
   * ⚠️ **C'est ce que la permission ouvre, et rien de plus.** Un relevé porte
   * des notes. Le jour où il faudra les copies, ce sera une décision du
   * joueur — et ce test tombera pour qu'on vienne la relire.
   */
  it("ne rend jamais les réponses d’un élève", () => {
    const releve = relevePour(1, [controle("sortileges", 4)], APRES);
    const trouve = releve.annees[0]!.matieres[0]!.lecons[0]!.controle!;
    expect(Object.keys(trouve).sort()).toEqual([
      "annee",
      "envoyeLe",
      "matiereId",
      "note",
      "rang",
      "surCombien",
    ]);
  });
});
