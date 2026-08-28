import { describe, expect, it } from "vitest";
import { validerMessage } from "./schema";
import { MESSAGE_MAX } from "./limites";

/**
 * Un message de salon est du texte brut : pas de balisage, donc pas de liste
 * blanche à tenir de ce côté-ci — React l’échappe d’office.
 */
describe("un message de salon", () => {
  it("passe, débarrassé de ses espaces de bord", () => {
    expect(validerMessage("  qui vient au lac ?  ")).toEqual({
      ok: true,
      valeur: "qui vient au lac ?",
    });
  });

  it("garde les retours à la ligne", () => {
    const r = validerMessage("deux lignes\nsi je veux");
    expect(r.ok && r.valeur).toBe("deux lignes\nsi je veux");
  });

  it("refuse le vide, sous toutes ses formes", () => {
    for (const brut of ["", "   ", "\n\n", "\t \n", null, 42, undefined]) {
      expect(validerMessage(brut).ok, JSON.stringify(brut)).toBe(false);
    }
  });

  it("refuse au-delà de la borne, et accepte pile dessus", () => {
    expect(validerMessage("a".repeat(MESSAGE_MAX)).ok).toBe(true);
    expect(validerMessage("a".repeat(MESSAGE_MAX + 1)).ok).toBe(false);
  });

  /**
   * ⚠️ Rien n’est échappé ici, et c'est normal : le texte est rendu par React,
   * qui échappe de lui-même. Échapper une seconde fois afficherait
   * « &lt;b&gt; » à l’écran.
   */
  it("ne touche pas à ce qui ressemble à du balisage", () => {
    const r = validerMessage("<b>salut</b> & bonne nuit");
    expect(r.ok && r.valeur).toBe("<b>salut</b> & bonne nuit");
  });
});
