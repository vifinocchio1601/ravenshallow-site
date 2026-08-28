import { describe, expect, it } from "vitest";
import { validerMot } from "./schema";
import { MOT_MAX } from "./limites";

/**
 * Un mot du tableau est du **texte brut** : pas de balisage, donc pas de
 * liste blanche à tenir de ce côté-ci — React l’échappe d’office. Ce qui
 * reste à vérifier est court, et c'est tout l’intérêt du choix.
 */
describe("un mot du tableau", () => {
  it("passe, débarrassé de ses espaces de bord", () => {
    expect(validerMot("  Rendez-vous samedi.  ")).toEqual({
      ok: true,
      valeur: "Rendez-vous samedi.",
    });
  });

  /** Un mot peut tenir en deux lignes : les retours restent. */
  it("garde les retours à la ligne", () => {
    const r = validerMot("Deux lignes\nsur le mur");
    expect(r.ok && r.valeur).toBe("Deux lignes\nsur le mur");
  });

  /**
   * `btrim` de Postgres ne retire que les ESPACES : un mot de six lignes vides
   * passait la contrainte de base sur les corbeaux. Ici c'est `trim` de
   * JavaScript, qui compte les retours — et la base a de toute façon la forme
   * `~ '[^[:space:]]'`.
   */
  it("refuse le vide, sous toutes ses formes", () => {
    for (const brut of ["", "   ", "\n\n\n", "\t \n", null, 42, undefined]) {
      expect(validerMot(brut).ok, JSON.stringify(brut)).toBe(false);
    }
  });

  it("refuse au-delà de la borne, et accepte pile dessus", () => {
    expect(validerMot("a".repeat(MOT_MAX)).ok).toBe(true);
    expect(validerMot("a".repeat(MOT_MAX + 1)).ok).toBe(false);
  });

  /** Le ménage des caractères de contrôle est celui des corbeaux. */
  it("retire les caractères de contrôle", () => {
    const r = validerMot("Un mot\u0007propre");
    expect(r.ok && r.valeur).toBe("Un motpropre");
  });

  /**
   * ⚠️ **Rien n’est échappé ici, et c'est normal.** Le texte est rendu par
   * React, qui échappe de lui-même ; échapper une seconde fois afficherait
   * « &lt;b&gt; » à l’écran. Ce test fige le fait que le mot ressort **tel
   * quel** — c'est ce qui rend le choix du texte brut sûr.
   */
  it("ne touche pas à ce qui ressemble à du balisage", () => {
    const r = validerMot("<b>Bravo</b> à Sigrid & Halvard");
    expect(r.ok && r.valeur).toBe("<b>Bravo</b> à Sigrid & Halvard");
  });
});
