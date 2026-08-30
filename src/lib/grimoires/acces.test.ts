import { describe, expect, it } from "vitest";
import { chapitresLisibles, peutLireLeChapitre } from "./acces";

/**
 * **Le filtrage des grimoires, éprouvé avant toute interface.**
 *
 * C'est la règle la plus importante du lot : les quatre sortilèges interdits
 * (art. 13.2 et 13.3) ne descendent pas dans le navigateur d'un joueur.
 */

describe("qui lit un chapitre", () => {
  it("ouvre à tout membre ce qui n’est pas réservé", () => {
    expect(peutLireLeChapitre("TOUS", false)).toBe(true);
  });

  it("ferme au joueur ce qui est réservé à l’administration", () => {
    expect(peutLireLeChapitre("ADMINISTRATION", false)).toBe(false);
  });

  it("laisse passer le staff partout, comme sur le forum", () => {
    expect(peutLireLeChapitre("ADMINISTRATION", true)).toBe(true);
    expect(peutLireLeChapitre("TOUS", true)).toBe(true);
  });
});

describe("le sommaire", () => {
  const chapitres = [
    { slug: "le-principe", acces: "TOUS" as const },
    { slug: "les-sorts-simples", acces: "TOUS" as const },
    { slug: "les-quatre-sorts-interdits", acces: "ADMINISTRATION" as const },
  ];

  it("ne montre pas au joueur le chapitre réservé, pas même grisé", () => {
    const vus = chapitresLisibles(chapitres, false).map((c) => c.slug);
    expect(vus).toEqual(["le-principe", "les-sorts-simples"]);
  });

  it("rend tout au staff", () => {
    expect(chapitresLisibles(chapitres, true)).toHaveLength(3);
  });

  it("garde l’ordre reçu — c’est celui du volume", () => {
    const inverse = [...chapitres].reverse();
    expect(chapitresLisibles(inverse, true).map((c) => c.slug)).toEqual(
      inverse.map((c) => c.slug),
    );
  });
});

describe("l’année ne ferme rien", () => {
  /**
   * Décision du joueur, 30 août 2026. L'article 14.4 interdit de LANCER un
   * sort hors de son année, pas d'en lire la fiche — et c'est déjà le
   * principe du forum, où presque tout se lit.
   *
   * Cet essai fige la décision : le jour où quelqu'un voudrait « rétablir »
   * un verrou d'année, il faudra le faire exprès.
   */
  it("aucune fonction d’accès ne prend une année", () => {
    expect(peutLireLeChapitre.length).toBe(2);
    expect(chapitresLisibles.length).toBe(2);
  });
});
