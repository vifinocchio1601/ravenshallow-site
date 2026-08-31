import { describe, expect, it } from "vitest";
import { ecart, memoriserLaVie, type Vie } from "./vie";
import { memoireVide, type Memoire } from "../anomalies";
import { CHIFFRES_DE_VIE } from "../constantes";

describe("l’écart à la moyenne", () => {
  it("se calcule en pourcentage arrondi", () => {
    expect(ecart(50, 100)).toBe(-50);
    expect(ecart(150, 100)).toBe(50);
    expect(ecart(100, 100)).toBe(0);
  });

  it("est nul quand il n’y a pas encore de moyenne", () => {
    expect(ecart(12, null)).toBeNull();
  });

  /**
   * ⚠️ Le plancher, et la raison d'être de ce test : sur un forum qui démarre,
   * passer de 1 post à 3 est une hausse de 200 % qui n'apprend rien. Sans le
   * plancher, le rapport crierait tous les matins — et l'on cesserait de le
   * lire, ce qui est le seul vrai risque de tout ce dispositif.
   */
  it("se tait sur les tout petits nombres", () => {
    expect(ecart(3, 1)).toBeNull();
    expect(ecart(0, 2)).toBeNull();
    expect(ecart(4, 4)).toBeNull();
  });

  it("mais parle dès que l’un des deux compte vraiment", () => {
    // 40 en moyenne, 2 aujourd'hui : ça, il faut le dire.
    expect(ecart(2, 40)).toBe(-95);
    // 1 en moyenne, 30 aujourd'hui : une envolée réelle.
    expect(ecart(30, 1)).toBe(2900);
  });

  it("ne divise jamais par zéro", () => {
    expect(ecart(12, 0)).toBeNull();
  });
});

describe("la mémoire des chiffres", () => {
  const vieDu = (jour: string, posts: number): Vie => ({
    jour,
    historique: 0,
    chiffres: CHIFFRES_DE_VIE.map(({ cle, nom }) => ({
      cle,
      nom,
      aujourdhui: cle === "posts" ? posts : 0,
      hier: null,
      moyenne: null,
      ecartPourcent: null,
    })),
  });

  it("range les chiffres du jour", () => {
    const memoire = memoriserLaVie(memoireVide(), vieDu("2026-09-01", 12));
    expect(memoire.vie).toHaveLength(1);
    expect(memoire.vie[0].chiffres.posts).toBe(12);
  });

  it("remplace le jour au lieu de l’ajouter deux fois", () => {
    let memoire: Memoire = memoriserLaVie(memoireVide(), vieDu("2026-09-01", 12));
    memoire = memoriserLaVie(memoire, vieDu("2026-09-01", 15));
    expect(memoire.vie).toHaveLength(1);
    expect(memoire.vie[0].chiffres.posts).toBe(15);
  });

  it("ne garde pas un historique sans fin", () => {
    let memoire = memoireVide();
    for (let jour = 1; jour <= 40; jour += 1) {
      const cle = `2026-09-${String(jour).padStart(2, "0")}`;
      memoire = memoriserLaVie(memoire, vieDu(cle, jour));
    }
    expect(memoire.vie.length).toBeLessThanOrEqual(10);
    // C'est bien la fin qu'on garde, pas le début : une mémoire qui garderait
    // les dix premiers jours calculerait éternellement la moyenne de septembre.
    expect(memoire.vie.at(-1)?.chiffres.posts).toBe(40);
    expect(memoire.vie[0].chiffres.posts).toBeGreaterThan(30);
  });

  it("garde les anomalies en place", () => {
    const avec: Memoire = {
      anomalies: { "x:y": { depuis: "2026-09-01", dernier: "2026-09-01", jours: 1 } },
      vie: [],
    };
    expect(memoriserLaVie(avec, vieDu("2026-09-02", 3)).anomalies).toEqual(avec.anomalies);
  });
});
