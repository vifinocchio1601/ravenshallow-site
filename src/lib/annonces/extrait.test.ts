import { describe, expect, it } from "vitest";
import { extrait } from "./extrait";

/**
 * L'extrait n'est pas stocké : il se recalcule à chaque lecture, depuis le
 * corps. Ces essais figent ce qu'il en fait — c'est la seule chose que le
 * journal du bureau montre d'une annonce, dans une colonne de cent
 * soixante-dix pixels.
 */
describe("l’extrait d’une annonce", () => {
  it("rend le texte, débarrassé du balisage", () => {
    expect(extrait("<p>Les inscriptions <strong>rouvrent</strong> lundi.</p>")).toBe(
      "Les inscriptions rouvrent lundi.",
    );
  });

  /**
   * Sans cela, « <p>fin</p><p>début</p> » donnerait « findébut » — deux mots
   * soudés qui n'existent nulle part dans le texte d'origine.
   */
  it("sépare deux paragraphes par une espace", () => {
    expect(extrait("<p>Premier.</p><p>Second.</p>")).toBe("Premier. Second.");
  });

  it("sépare aussi sur un saut de ligne", () => {
    expect(extrait("Une ligne<br>Une autre")).toBe("Une ligne Une autre");
  });

  it("réduit les blancs, y compris les insécables du balisage", () => {
    expect(extrait("<p>Trop   d’espaces&nbsp;ici</p>")).toBe(
      "Trop d’espaces ici",
    );
  });

  it("décode les entités", () => {
    expect(extrait("<p>Sigrid &amp; Halvard &lt;3</p>")).toBe(
      "Sigrid & Halvard <3",
    );
  });

  /**
   * ⚠️ **L'esperluette se décode en dernier.** Dans l'autre ordre,
   * « &amp;lt; » deviendrait « &lt; » puis « < » : une balise que l'auteur
   * avait échappée réapparaîtrait dans l'extrait.
   */
  it("ne ressuscite pas une balise doublement échappée", () => {
    expect(extrait("<p>&amp;lt;script&amp;gt;</p>")).toBe("&lt;script&gt;");
  });

  it("ne coupe pas ce qui tient", () => {
    const court = "Trois mots.";
    expect(extrait(court, 40)).toBe(court);
  });

  it("coupe sur un mot, jamais au milieu", () => {
    const rendu = extrait("<p>Le corbeau part demain matin vers le nord</p>", 20);
    expect(rendu.endsWith("…")).toBe(true);
    // Ni mot tronqué, ni espace ou ponctuation collée aux points de suspension.
    expect(rendu).toBe("Le corbeau part…");
  });

  /** Un seul signe (U+2026) : trois points collés se coupent en fin de ligne. */
  it("finit par un vrai caractère de points de suspension", () => {
    expect(extrait("a".repeat(300)).at(-1)).toBe("…");
  });

  /**
   * Un mot plus long que la limite n'a aucune espace où couper : la coupe
   * franche vaut mieux qu'une phrase entière rendue telle quelle.
   */
  it("coupe franc quand il n’y a pas d’espace à portée", () => {
    expect(extrait("abcdefghijklmnop", 8)).toBe("abcdefgh…");
  });

  it("d’un corps vide de sens, ne tire rien", () => {
    expect(extrait("<p></p>")).toBe("");
  });
});
