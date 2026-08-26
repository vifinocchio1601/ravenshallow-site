import { describe, expect, it } from "vitest";
import {
  LIGNES_MINIMUM_RP,
  lignesManquantes,
  lignesUtiles,
  respecteLeMinimum,
  sansHorsRP,
} from "./longueur";
import { auDelaDuRepere, reperDeScenes } from "./scenes";

/** Un post de `n` lignes qui portent du texte. */
function post(n: number): string {
  return Array.from({ length: n }, (_, i) => `Ligne ${i + 1}.`).join("\n");
}

describe("dix lignes au minimum dans le domaine — art. 12.2", () => {
  it("le minimum est bien dix", () => {
    expect(LIGNES_MINIMUM_RP).toBe(10);
  });

  /** Le cas de la liste de recette du joueur. */
  it("un post de huit lignes est refusé en RP, accepté chez les non-mages", () => {
    const huit = post(8);
    expect(respecteLeMinimum(huit, LIGNES_MINIMUM_RP)).toBe(false);
    // Chez les non-mages, aucun minimum : `null`.
    expect(respecteLeMinimum(huit, null)).toBe(true);
  });

  it("dix lignes passent, neuf non", () => {
    expect(respecteLeMinimum(post(10), 10)).toBe(true);
    expect(respecteLeMinimum(post(9), 10)).toBe(false);
  });

  it("dit combien il en manque, et jamais un nombre négatif", () => {
    expect(lignesManquantes(post(8), 10)).toBe(2);
    expect(lignesManquantes(post(15), 10)).toBe(0);
    expect(lignesManquantes(post(3), null)).toBe(0);
  });
});

describe("les lignes vides ne comptent pas", () => {
  it("dix retours à la ligne ne font pas un post", () => {
    expect(lignesUtiles("\n".repeat(10))).toBe(0);
    expect(respecteLeMinimum("\n".repeat(20), 10)).toBe(false);
  });

  it("ni dix lignes d’espaces et de tabulations", () => {
    // Le piège de `btrim`, déjà rencontré sur les corbeaux, vu de l'autre côté.
    expect(lignesUtiles("   \n\t\n  \t  \n".repeat(4))).toBe(0);
  });

  it("les lignes vides entre deux paragraphes ne pénalisent pas non plus", () => {
    const aere = post(10).split("\n").join("\n\n");
    expect(lignesUtiles(aere)).toBe(10);
  });

  it("sans minimum, seul le vide est refusé", () => {
    expect(respecteLeMinimum("   \n\t\n ", null)).toBe(false);
    expect(respecteLeMinimum("Un mot.", null)).toBe(true);
  });
});

describe("le hors-RP ne compte pas — art. 12.3", () => {
  /**
   * « Le hors-RP ne doit pas prendre le pas sur le RP lui-même. » S’il comptait
   * dans le minimum, on atteindrait les dix lignes sans écrire une ligne de
   * jeu, et la règle ne dirait plus rien.
   */
  it("un commentaire de douze lignes ne fait pas un post de douze lignes", () => {
    const corps = `[HRP]\n${post(12)}\n[/HRP]\nUne seule ligne de jeu.`;
    expect(lignesUtiles(corps)).toBe(1);
    expect(respecteLeMinimum(corps, 10)).toBe(false);
  });

  it("le RP autour du bloc compte, lui", () => {
    const corps = `${post(10)}\n[HRP]\nDésolé du retard !\n[/HRP]`;
    expect(lignesUtiles(corps)).toBe(10);
    expect(respecteLeMinimum(corps, 10)).toBe(true);
  });

  it("la balise s’écrit comme on veut", () => {
    expect(sansHorsRP("a\n[hrp]bruit[/hrp]\nb").trim()).toBe("a\n\nb");
    expect(sansHorsRP("a\n[HrP]bruit[/HrP]\nb").trim()).toBe("a\n\nb");
  });

  it("un bloc jamais refermé est retiré jusqu’à la fin", () => {
    // Quelqu'un ouvre `[HRP]` en fin de post et oublie la fermeture : son
    // commentaire ne doit pas se mettre à compter.
    const corps = `${post(4)}\n[HRP]\n${post(20)}`;
    expect(lignesUtiles(corps)).toBe(4);
  });

  it("plusieurs blocs sont retirés, pas seulement le premier", () => {
    const corps = "[HRP]a[/HRP]\nRP.\n[HRP]b[/HRP]\nRP encore.";
    expect(lignesUtiles(corps)).toBe(2);
  });
});

describe("les scènes simultanées — art. 17.3, et rien qu’un repère", () => {
  it("trois avant la troisième année, cinq à partir de là", () => {
    expect(reperDeScenes("PREMIERE_ANNEE")).toBe(3);
    expect(reperDeScenes("DEUXIEME_ANNEE")).toBe(3);
    expect(reperDeScenes("TROISIEME_ANNEE")).toBe(5);
    expect(reperDeScenes("SEPTIEME_ANNEE")).toBe(5);
  });

  /**
   * **Le compte n’oppose rien.** Le joueur a tranché : la limite est un
   * principe de confiance. Ce test fige que la fonction ne sait que constater —
   * si un jour quelqu’un s’en sert pour refuser une ouverture, c’est ici qu’il
   * faudra relire la décision.
   */
  it("dire qu’on est au-delà n’est pas refuser", () => {
    expect(auDelaDuRepere("PREMIERE_ANNEE", 3)).toBe(false);
    expect(auDelaDuRepere("PREMIERE_ANNEE", 4)).toBe(true);
    expect(auDelaDuRepere("TROISIEME_ANNEE", 4)).toBe(false);
    expect(auDelaDuRepere("TROISIEME_ANNEE", 6)).toBe(true);
  });
});
