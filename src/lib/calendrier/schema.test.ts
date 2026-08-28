import { describe, expect, it } from "vitest";
import {
  DESCRIPTION_EVENEMENT_MAX,
  TITRE_EVENEMENT_MAX,
} from "./limites";
import {
  validerDescriptionEvenement,
  validerLesDates,
  validerNature,
  validerTitreEvenement,
} from "./schema";

describe("le titre d’un événement", () => {
  it("tient sur une ligne, quoi qu’on colle dedans", () => {
    const lu = validerTitreEvenement("La veillée\ndes braises");
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toBe("La veillée des braises");
  });

  it("refuse le vide, les espaces, et ce qui n’est pas du texte", () => {
    expect(validerTitreEvenement("").ok).toBe(false);
    expect(validerTitreEvenement("   \n\t ").ok).toBe(false);
    expect(validerTitreEvenement(null).ok).toBe(false);
    expect(validerTitreEvenement(42).ok).toBe(false);
  });

  it("refuse au-delà du plafond de la base", () => {
    expect(validerTitreEvenement("a".repeat(TITRE_EVENEMENT_MAX)).ok).toBe(true);
    expect(validerTitreEvenement("a".repeat(TITRE_EVENEMENT_MAX + 1)).ok).toBe(
      false,
    );
  });
});

describe("la description d’un événement", () => {
  /**
   * **Obligatoire**, à la différence de l’entrée en vigueur d’une annonce :
   * « 12 décembre » sans un mot laisse chacun deviner ce qui se passe ce
   * jour-là.
   */
  it("est obligatoire", () => {
    expect(validerDescriptionEvenement("").ok).toBe(false);
    expect(validerDescriptionEvenement("   ").ok).toBe(false);
    expect(validerDescriptionEvenement(undefined).ok).toBe(false);
  });

  it("garde les retours à la ligne d’un texte à plusieurs paragraphes", () => {
    const lu = validerDescriptionEvenement("Première ligne.\n\nSeconde.");
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toContain("\n");
  });

  it("refuse au-delà du plafond de la base", () => {
    const limite = "a".repeat(DESCRIPTION_EVENEMENT_MAX);
    expect(validerDescriptionEvenement(limite).ok).toBe(true);
    expect(validerDescriptionEvenement(`${limite}a`).ok).toBe(false);
  });
});

describe("la nature d’un événement", () => {
  it("accepte les trois, et rien d’autre", () => {
    for (const nature of ["EPREUVE", "FETE", "SESSION"]) {
      expect(validerNature(nature).ok).toBe(true);
    }
    expect(validerNature("VACANCES").ok).toBe(false);
    expect(validerNature("epreuve").ok).toBe(false);
    expect(validerNature(null).ok).toBe(false);
  });
});

describe("les deux dates", () => {
  it("exigent un début", () => {
    expect(validerLesDates("", null).ok).toBe(false);
    expect(validerLesDates(null, null).ok).toBe(false);
    expect(validerLesDates("demain", null).ok).toBe(false);
  });

  /**
   * **Une fin absente n’est pas une erreur** : c’est le cas le plus courant.
   * Un trimestre dure des mois, une veillée un soir.
   */
  it("acceptent un événement sans fin", () => {
    for (const fin of [null, undefined, "", "   "]) {
      const lu = validerLesDates("2026-12-12", fin);
      expect(lu.ok).toBe(true);
      if (lu.ok) expect(lu.valeur.finitLe).toBeNull();
    }
  });

  it("acceptent une fin le même jour", () => {
    const lu = validerLesDates("2026-12-12", "2026-12-12");
    expect(lu.ok).toBe(true);
  });

  it("refusent une fin avant le début", () => {
    const lu = validerLesDates("2026-12-12", "2026-12-11");
    expect(lu.ok).toBe(false);
  });

  /**
   * **Les deux sont posées à midi**, et c’est ce qui rend la comparaison sûre :
   * deux jours comparés à la même heure ne peuvent pas s’inverser à cause
   * d’un fuseau.
   */
  it("posent les deux dates à midi", () => {
    const lu = validerLesDates("2026-09-01", "2026-12-15");
    expect(lu.ok).toBe(true);
    if (lu.ok) {
      expect(lu.valeur.debuteLe.getHours()).toBe(12);
      expect(lu.valeur.finitLe?.getHours()).toBe(12);
      // Et le 1er reste le 1er, jamais le 31 août au soir.
      expect(lu.valeur.debuteLe.getDate()).toBe(1);
    }
  });

  it("refusent un jour qui n’existe pas", () => {
    expect(validerLesDates("2026-02-31", null).ok).toBe(false);
    expect(validerLesDates("2026-09-01", "2026-02-30").ok).toBe(false);
  });
});
