import { describe, expect, it } from "vitest";
import {
  AVERTISSEMENT_MAX,
  TITRE_MAX,
  validerAvertissement,
  validerPost,
  validerTitre,
} from "./schema";
import { CARACTERES_PAR_LIGNE, LIGNES_MINIMUM_RP } from "./longueur";

/**
 * Un post de `n` lignes **au sens du compteur** — soit `n` fois la largeur
 * d’une ligne, en caractères réels.
 *
 * Il valait autrefois `n` courtes phrases séparées par des retours à la
 * ligne : c’était suffisant quand on comptait les sauts de ligne, et ça ne
 * l’est plus. Le remplissage se fait avec des points et non des espaces —
 * les blancs sont réduits avant comptage, et une ligne complétée d’espaces
 * ne pèserait pas ce qu’elle prétend.
 */
const post = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    `Ligne ${i + 1} — de la prose ordinaire, pour occuper toute la largeur`
      .padEnd(CARACTERES_PAR_LIGNE, ".")
      .slice(0, CARACTERES_PAR_LIGNE),
  ).join("\n");

describe("le titre d’une scène", () => {
  it("tient sur une seule ligne, quoi qu’on colle dedans", () => {
    // Un titre sur deux lignes casse l'alignement des listes, et personne ne
    // verrait pourquoi.
    const lu = validerTitre("Le vent\nsur la galerie");
    expect(lu).toEqual({ ok: true, valeur: "Le vent sur la galerie" });
  });

  it("refuse le vide, et six lignes vides aussi", () => {
    expect(validerTitre("").ok).toBe(false);
    expect(validerTitre("   \n\t\n  ").ok).toBe(false);
  });

  /**
   * **Le mode n’est pas une syntaxe.** « (RÉSERVÉ Sigrid) » est une convention
   * entre joueurs, et le site ne la vérifie pas — décision du joueur du
   * 26 août 2026. Un titre sans mention passe, un titre fantaisiste aussi.
   */
  it("ne vérifie jamais le mode de participation", () => {
    for (const titre of [
      "Le vent sur la galerie (RÉSERVÉ Sigrid)",
      "Le vent sur la galerie",
      "Le vent sur la galerie (n’importe quoi)",
      "(LIBRE)",
    ]) {
      expect(validerTitre(titre).ok, titre).toBe(true);
    }
  });

  it("s’arrête à la longueur que la base accepte", () => {
    expect(validerTitre("a".repeat(TITRE_MAX)).ok).toBe(true);
    expect(validerTitre("a".repeat(TITRE_MAX + 1)).ok).toBe(false);
  });
});

describe("le corps d’un post", () => {
  /** Le cas de la liste de recette du joueur. */
  it("huit lignes sont refusées en RP, acceptées chez les non-mages", () => {
    const huit = post(8);
    expect(validerPost(huit, LIGNES_MINIMUM_RP).ok).toBe(false);
    expect(validerPost(huit, null).ok).toBe(true);
  });

  it("le refus dit combien il en manque, pas « trop court »", () => {
    const lu = validerPost(post(7), 10);
    expect(lu.ok).toBe(false);
    if (!lu.ok) {
      expect(lu.message).toContain("3");
      expect(lu.message).toContain("10");
      // Et il rappelle pourquoi le hors-RP ne compte pas.
      expect(lu.message).toContain("[HRP]");
    }
  });

  it("le hors-RP ne fait pas le compte", () => {
    const triche = `[HRP]\n${post(12)}\n[/HRP]\nUne seule ligne de jeu.`;
    expect(validerPost(triche, 10).ok).toBe(false);
  });

  it("mais il est autorisé autour d’un vrai post", () => {
    const bon = `${post(10)}\n[HRP]\nDésolé du retard !\n[/HRP]`;
    const lu = validerPost(bon, 10);
    expect(lu.ok).toBe(true);
    // Et il est CONSERVÉ : on ne compte pas avec, on ne l'efface pas pour
    // autant. Le joueur l'a écrit, il doit le retrouver.
    if (lu.ok) expect(lu.valeur).toContain("[HRP]");
  });

  it("sans minimum, seul le vide est refusé", () => {
    expect(validerPost("   \n\t\n ", null).ok).toBe(false);
    expect(validerPost("Un mot.", null).ok).toBe(true);
  });

  it("ne réécrit ni les apostrophes, ni la ponctuation, ni la casse", () => {
    const brut = `${post(10)}\nIl m'a dit : "N'y VA PAS".`;
    const lu = validerPost(brut, 10);
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toContain(`Il m'a dit : "N'y VA PAS".`);
  });
});

describe("l’avertissement de contenu — art. 16.3", () => {
  /**
   * **Il est proposé, jamais réclamé.** Quelqu’un qui écrit une scène
   * difficile ne doit pas avoir à négocier avec un formulaire.
   */
  it.each([undefined, null, "", "   ", "\n\t"])(
    "vide ou absent rend null, jamais une erreur (%p)",
    (valeur) => {
      expect(validerAvertissement(valeur)).toEqual({ ok: true, valeur: null });
    },
  );

  it("tient sur une ligne, et reste une mention", () => {
    expect(validerAvertissement("violence")).toEqual({
      ok: true,
      valeur: "violence",
    });
    expect(validerAvertissement("a".repeat(AVERTISSEMENT_MAX + 1)).ok).toBe(false);
  });
});
