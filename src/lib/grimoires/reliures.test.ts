import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLASSE_RELIURE, RELIURES } from "./reliures";

/**
 * **Une reliure acceptée doit être peinte.**
 *
 * La base connaît quatre teintes ; si l'une n'avait pas sa classe dans
 * `globals.css`, le volume s'afficherait avec un dos vide — et personne ne le
 * verrait venir avant de poser le cinquième volume. Même procédé que
 * `mise-en-forme.test.ts`, qui relit la feuille de style pour les couleurs de
 * la barre.
 */

const CSS = readFileSync("src/app/globals.css", "utf8");

describe("les reliures", () => {
  it("ont toutes une classe", () => {
    for (const reliure of RELIURES) {
      expect(CLASSE_RELIURE[reliure], reliure).toBeTruthy();
    }
  });

  it("sont toutes peintes dans la feuille de style", () => {
    for (const reliure of RELIURES) {
      const classe = CLASSE_RELIURE[reliure];
      expect(CSS, classe).toContain(`.${classe}`);
      // Et la classe pose bien la teinte que le dos lit.
      const bloc = CSS.slice(CSS.indexOf(`.${classe}`));
      expect(bloc.slice(0, 200), classe).toContain("--reliure:");
    }
  });

  it("n’en déclare pas une de plus dans la feuille que la base ne connaît", () => {
    const declarees = [...CSS.matchAll(/\.reliure--([a-z-]+)/g)].map(
      (m) => `reliure--${m[1]}`,
    );
    const connues = new Set(Object.values(CLASSE_RELIURE));
    for (const classe of declarees) {
      expect(connues.has(classe), classe).toBe(true);
    }
  });
});
