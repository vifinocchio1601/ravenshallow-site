import { describe, expect, it } from "vitest";
import { orchestrer, type Famille } from "./orchestration";
import type { Anomalie } from "./anomalies";

const ANOMALIE: Anomalie = {
  cle: "essai:quelque-chose",
  gravite: "PANNE",
  quoi: "Quelque chose ne va pas.",
  ou: "/quelque-part",
};

/** Une famille qui aboutit. */
const bonne = (nom: string, anomalies: Anomalie[] = []): Famille => ({
  nom,
  faire: async () => ({ donnees: { nom }, anomalies }),
});

/** Une famille qui tombe. */
const mauvaise = (nom: string, raison: string): Famille => ({
  nom,
  faire: async () => {
    throw new Error(raison);
  },
});

/** Du temps à revendre. */
const large = () => 600_000;

describe("une famille qui tombe", () => {
  /**
   * L'exigence du brief, et le cœur de la robustesse : « si le contrôle de
   * cohérence échoue, les autres continuent et le rapport signale la partie
   * manquante ».
   */
  it("n’emporte pas les autres", async () => {
    const resultat = await orchestrer(
      [
        bonne("la disponibilité"),
        mauvaise("la cohérence", "la table a disparu"),
        bonne("ce qui attend"),
        bonne("la vie du site"),
      ],
      { resteMs: large },
    );

    expect([...resultat.recoltes.keys()]).toEqual([
      "la disponibilité",
      "ce qui attend",
      "la vie du site",
    ]);
    expect(resultat.manquants).toEqual([
      { nom: "la cohérence", raison: "la table a disparu" },
    ]);
  });

  it("est NOMMÉE dans ce qui manque, jamais tue", async () => {
    const resultat = await orchestrer([mauvaise("les erreurs", "base fermée")], {
      resteMs: large,
    });
    // ⚠️ Un trou silencieux se lirait comme « rien à signaler ».
    expect(resultat.manquants[0].nom).toBe("les erreurs");
    expect(resultat.manquants[0].raison).toBe("base fermée");
  });

  it("même quand toutes tombent, la ronde rend un résultat", async () => {
    const resultat = await orchestrer(
      [mauvaise("a", "x"), mauvaise("b", "y"), mauvaise("c", "z")],
      { resteMs: large },
    );
    expect(resultat.recoltes.size).toBe(0);
    expect(resultat.manquants).toHaveLength(3);
    expect(resultat.ecourtee).toBe(false);
  });

  it("les anomalies des familles qui ont abouti sont gardées", async () => {
    const resultat = await orchestrer(
      [bonne("a", [ANOMALIE]), mauvaise("b", "tombée"), bonne("c", [ANOMALIE])],
      { resteMs: large },
    );
    expect(resultat.anomalies).toHaveLength(2);
  });
});

describe("la borne de durée", () => {
  /**
   * ⚠️ Elle arrête le reste et laisse ENVOYER ce qu'on a. Une ronde qui irait
   * au bout coûte que coûte serait tuée par le délai du workflow, et rien ne
   * partirait — c'est-à-dire le silence, le jour précis où quelque chose ne va
   * pas.
   */
  it("arrête ce qui reste et le dit", async () => {
    let reste = 5_000;
    const resultat = await orchestrer(
      [bonne("la disponibilité"), bonne("la cohérence"), bonne("le parcours")],
      {
        // Le temps s'épuise après la première famille.
        resteMs: () => {
          const valeur = reste;
          reste = -1;
          return valeur;
        },
      },
    );

    expect([...resultat.recoltes.keys()]).toEqual(["la disponibilité"]);
    expect(resultat.ecourtee).toBe(true);
    expect(resultat.manquants.map((m) => m.nom)).toEqual([
      "la cohérence",
      "le parcours",
    ]);
    expect(resultat.manquants[0].raison).toContain("durée maximale");
  });

  it("ne se déclenche pas quand il reste du temps", async () => {
    const resultat = await orchestrer([bonne("a"), bonne("b")], { resteMs: large });
    expect(resultat.ecourtee).toBe(false);
    expect(resultat.manquants).toHaveLength(0);
  });
});

describe("ce que la ronde dit à l’écran", () => {
  /**
   * ⚠️ **Le dépôt est public, donc les journaux d'exécution le sont.** La
   * ronde ne dit que « vu » ou « pas abouti » — jamais un chiffre, jamais une
   * raison, jamais un contenu.
   */
  it("ne dit rien d’autre que l’état de chaque famille", async () => {
    const dites: string[] = [];
    await orchestrer(
      [bonne("la vie du site", [ANOMALIE]), mauvaise("la cohérence", "base fermée")],
      { resteMs: large, dire: (l) => dites.push(l) },
    );

    expect(dites).toEqual([
      "  la vie du site : vu",
      "  la cohérence : pas abouti",
    ]);
    // La raison de l'échec n'est PAS écrite à l'écran — elle part par courriel.
    expect(dites.join("\n")).not.toContain("base fermée");
    // Ni le contenu d'une anomalie.
    expect(dites.join("\n")).not.toContain("/quelque-part");
  });

  it("est muette par défaut", async () => {
    // Sans `dire`, rien ne doit être écrit nulle part : c'est le réglage
    // qu'une ronde en production doit pouvoir prendre sans y penser.
    await expect(
      orchestrer([bonne("a")], { resteMs: large }),
    ).resolves.toBeDefined();
  });
});
