import { describe, expect, it } from "vitest";
import type { TypeBloc } from "./blocs";
import { pageDuBloc, paginer, type BlocAPaginer } from "./pagination";

/**
 * La pagination est **pure** : elle reçoit des hauteurs, elle rend des pages.
 * C'est ce qui permet de l'éprouver sans navigateur — et donc de figer les
 * deux règles que le joueur a demandées.
 */

const b = (hauteur: number, type: TypeBloc = "PARAGRAPHE"): BlocAPaginer => ({
  hauteur,
  type,
});

describe("remplir une page", () => {
  it("empile jusqu’à ce qu’elle soit pleine, puis passe à la suivante", () => {
    const pages = paginer([b(100), b(100), b(100), b(100)], 250, 10);
    // 100 + 10 + 100 = 210 tient ; le troisième ferait 320.
    expect(pages).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it("compte l’écart entre les blocs, jamais avant le premier", () => {
    // Sans l'écart, les trois tiendraient (300) ; avec, 320 dépasse.
    expect(paginer([b(100), b(100), b(100)], 310, 10)).toEqual([[0, 1], [2]]);
  });

  it("laisse seul sur sa page un bloc plus haut qu’elle", () => {
    const pages = paginer([b(50), b(900, "TABLEAU"), b(50)], 300, 10);
    expect(pages).toEqual([[0], [1], [2]]);
  });

  it("ne rend rien pour rien", () => {
    expect(paginer([], 300, 10)).toEqual([]);
  });

  it("rend tout d’un tenant si la page ne peut rien porter", () => {
    // Le cas d'une mesure faite avant que le décor n'ait sa taille : mieux
    // vaut tout montrer qu'une page par bloc.
    expect(paginer([b(10), b(10)], 0, 10)).toEqual([[0, 1]]);
  });
});

describe("une fiche ne se coupe jamais", () => {
  it("passe entière à la page suivante plutôt que de déborder", () => {
    const pages = paginer([b(200), b(180, "FICHE_SORT")], 300, 10);
    expect(pages).toEqual([[0], [1]]);
  });
});

describe("un titre ne finit jamais une page", () => {
  it("part avec ce qu’il annonce", () => {
    const pages = paginer(
      [b(100), b(100), b(30, "SOUS_TITRE"), b(100)],
      250,
      10,
    );
    // Le sous-titre tenait en bas de la première page ; il suit sa suite.
    expect(pages[0]).toEqual([0, 1]);
    expect(pages[1]).toEqual([2, 3]);
  });

  it("mais reste là s’il est seul sur sa page", () => {
    // Rien ne le retiendrait : le repousser en boucle serait pire.
    const pages = paginer([b(280), b(30, "SOUS_TITRE"), b(280)], 300, 10);
    expect(pages).toEqual([[0], [1], [2]]);
  });
});

describe("retrouver sa place", () => {
  const pages = [
    [0, 1],
    [2, 3],
    [4],
  ];

  it("dit sur quelle page se trouve un bloc", () => {
    expect(pageDuBloc(pages, 0)).toBe(0);
    expect(pageDuBloc(pages, 3)).toBe(1);
    expect(pageDuBloc(pages, 4)).toBe(2);
  });

  it("ouvre au début plutôt que nulle part", () => {
    expect(pageDuBloc(pages, 99)).toBe(0);
  });
});
