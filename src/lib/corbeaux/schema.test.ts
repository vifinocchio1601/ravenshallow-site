import { describe, expect, it } from "vitest";
import {
  CORBEAU_MAX,
  nettoyerCorbeau,
  nettoyerRecherche,
  validerCorbeau,
} from "./schema";

/**
 * Ce qu’un corbeau a le droit de porter — et surtout ce qu’on ne lui retire
 * pas.
 *
 * La base porte la même limite en plus grossier ; ces tests-ci décrivent le
 * travail fin, celui que les deux côtés — le champ de saisie et la route —
 * partagent mot pour mot.
 */

describe("ce qu’on garde", () => {
  it("les retours à la ligne", () => {
    expect(nettoyerCorbeau("Bonsoir.\nOn se voit demain ?")).toBe(
      "Bonsoir.\nOn se voit demain ?",
    );
  });

  it("une ligne vide entre deux paragraphes", () => {
    expect(nettoyerCorbeau("Premier.\n\nSecond.")).toBe("Premier.\n\nSecond.");
  });

  /**
   * On ne réécrit pas ce qu’écrit un joueur. Le site met des apostrophes
   * typographiques dans SES textes ; un bout de code collé, une citation, une
   * orthographe personnelle doivent ressortir tels qu’ils sont entrés.
   */
  it("les apostrophes droites, telles quelles", () => {
    expect(nettoyerCorbeau("j'arrive")).toBe("j'arrive");
  });

  it("la ponctuation, la casse et les majuscules", () => {
    expect(nettoyerCorbeau("ATTENTION !!! (vraiment)")).toBe("ATTENTION !!! (vraiment)");
  });

  it("la tabulation, pour un texte collé qui était indenté", () => {
    expect(nettoyerCorbeau("voici :\n\tune ligne")).toBe("voici :\n\tune ligne");
  });

  /**
   * Les espaces de DÉBUT de ligne restent, ceux de FIN partent. L’écart est
   * voulu : les premiers peuvent vouloir dire quelque chose — un texte
   * indenté, un vers, une liste alignée à la main — quand les seconds sont
   * invisibles et n’ont jamais servi à personne.
   */
  it("l’indentation de début de ligne, mais pas les espaces de fin", () => {
    expect(nettoyerCorbeau("un\n  deux   \n  trois")).toBe("un\n  deux\n  trois");
  });
});

describe("ce qu’on retire", () => {
  it("les espaces autour", () => {
    expect(nettoyerCorbeau("   bonsoir   ")).toBe("bonsoir");
  });

  it("les fins de ligne de Windows, ramenées à des sauts simples", () => {
    expect(nettoyerCorbeau("un\r\ndeux\rtrois")).toBe("un\ndeux\ntrois");
  });

  it("les espaces traînant en fin de ligne, invisibles et sans usage", () => {
    expect(nettoyerCorbeau("un   \ndeux")).toBe("un\ndeux");
  });

  /**
   * Quarante lignes vides ne séparent rien : elles poussent simplement le
   * reste de la conversation hors de l’écran.
   */
  it("les lignes vides en rafale, ramenées à une seule", () => {
    expect(nettoyerCorbeau("un\n\n\n\n\n\ndeux")).toBe("un\n\ndeux");
  });

  it("les caractères de contrôle", () => {
    expect(nettoyerCorbeau(`un${String.fromCharCode(0)}deux`)).toBe("undeux");
    expect(nettoyerCorbeau(`a${String.fromCharCode(27)}b`)).toBe("ab");
  });
});

describe("ce qu’on refuse", () => {
  it("un corbeau vide", () => {
    expect(validerCorbeau("").ok).toBe(false);
  });

  /**
   * C’est le cas qui avait échappé à la première version de la contrainte en
   * base : `btrim` de Postgres ne retire que les ESPACES, jamais les retours
   * à la ligne. Un message de six lignes vides passait, et s’affichait comme
   * une bulle vide dans le fil.
   */
  it("un corbeau qui n’a que des blancs — sauts de ligne compris", () => {
    expect(validerCorbeau("   ").ok).toBe(false);
    expect(validerCorbeau("\n\n\n").ok).toBe(false);
    expect(validerCorbeau(" \n \t \n ").ok).toBe(false);
  });

  it("un corbeau trop long", () => {
    expect(validerCorbeau("x".repeat(CORBEAU_MAX + 1)).ok).toBe(false);
    expect(validerCorbeau("x".repeat(CORBEAU_MAX)).ok).toBe(true);
  });

  it("tout ce qui n’est pas du texte", () => {
    for (const rien of [null, undefined, 42, {}, []]) {
      expect(validerCorbeau(rien).ok, String(rien)).toBe(false);
    }
  });

  /**
   * Le nettoyage compte AVANT la mesure : un texte de 5 010 signes dont dix
   * sont des espaces de fin passe, et c’est voulu — la limite porte sur ce
   * qui sera réellement écrit.
   */
  it("mesure après le ménage, pas avant", () => {
    const lu = validerCorbeau(`${"x".repeat(CORBEAU_MAX)}     `);
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.corps.length).toBe(CORBEAU_MAX);
  });
});

describe("la recherche", () => {
  it("ne part pas pour une seule lettre", () => {
    expect(nettoyerRecherche("a")).toBe("");
  });

  it("part à partir de deux", () => {
    expect(nettoyerRecherche("al")).toBe("al");
  });

  it("resserre les espaces", () => {
    expect(nettoyerRecherche("  Elena   Vasska  ")).toBe("Elena Vasska");
  });

  it("borne la longueur, sans refuser la saisie", () => {
    expect(nettoyerRecherche("x".repeat(200)).length).toBe(60);
  });

  it("ne s’émeut pas de ce qui n’est pas du texte", () => {
    expect(nettoyerRecherche(null)).toBe("");
    expect(nettoyerRecherche(undefined)).toBe("");
  });
});
