import { describe, expect, it } from "vitest";
import { jourEnToutesLettres } from "./dates";

/**
 * **Le « 1er » est toute la raison d'être de ce fichier.**
 *
 * `toLocaleDateString("fr-FR")` rend « 1 août », et c'est faux en français.
 * Le reste du mois, en revanche, ne prend rien : « 2 août », jamais « 2e ».
 */
describe("une date en toutes lettres", () => {
  it("le premier du mois prend « 1er »", () => {
    expect(jourEnToutesLettres(new Date(2026, 7, 1))).toBe("1er août 2026");
  });

  it("les autres jours ne prennent rien", () => {
    expect(jourEnToutesLettres(new Date(2026, 7, 2))).toBe("2 août 2026");
    expect(jourEnToutesLettres(new Date(2026, 7, 27))).toBe("27 août 2026");
    expect(jourEnToutesLettres(new Date(2026, 7, 31))).toBe("31 août 2026");
  });

  it("les douze mois sont écrits en minuscules, accents compris", () => {
    expect(jourEnToutesLettres(new Date(2026, 1, 12))).toBe("12 février 2026");
    expect(jourEnToutesLettres(new Date(2026, 11, 1))).toBe("1er décembre 2026");
  });
});
