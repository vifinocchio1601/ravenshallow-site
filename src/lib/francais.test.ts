import { describe, expect, it } from "vitest";
import { avecDe } from "./francais";

describe("« de » devant un nom", () => {
  /** Les quatre fondateurs, et deux d'entre eux exigent l'élision. */
  it("s’élide devant une voyelle", () => {
    expect(avecDe("Alaric Nattmor")).toBe("d’Alaric Nattmor");
    expect(avecDe("Einar Tidevann")).toBe("d’Einar Tidevann");
  });

  it("ne s’élide pas devant une consonne", () => {
    expect(avecDe("Sigrid Kaldenor")).toBe("de Sigrid Kaldenor");
    expect(avecDe("Torvald Bryggen")).toBe("de Torvald Bryggen");
  });

  it("lit aussi les voyelles accentuées", () => {
    expect(avecDe("Éowyn")).toBe("d’Éowyn");
    expect(avecDe("Ingrid")).toBe("d’Ingrid");
  });

  /**
   * Le « h » n’est pas traité : muet il s’élide, aspiré non, et rien dans un
   * nom ne dit lequel. Le site n’en a aucun ; ce test fige le choix plutôt
   * que de le laisser se perdre.
   */
  it("laisse « de » devant un h", () => {
    expect(avecDe("Hel")).toBe("de Hel");
  });
});
