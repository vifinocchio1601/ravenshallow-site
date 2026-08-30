import { describe, expect, it } from "vitest";
import {
  validerAcces,
  validerAncre,
  validerBloc,
  validerExergue,
  validerSlug,
} from "./schema";

/**
 * `schema.ts` est la seule porte par laquelle un grimoire entre en base : le
 * dépôt et le script d'import l'appellent, si bien que personne ne peut
 * l'oublier. Ces essais figent ce qu'elle laisse passer.
 */

describe("l’adresse d’un volume", () => {
  it("prend des minuscules, des chiffres et des tirets", () => {
    expect(validerSlug("les-sorts-lies")).toEqual({
      ok: true,
      valeur: "les-sorts-lies",
    });
  });

  it("refuse les majuscules, les accents et les espaces", () => {
    for (const brut of ["Les-Sorts", "sortilèges", "les sorts", "-sorts", ""]) {
      expect(validerSlug(brut).ok).toBe(false);
    }
  });
});

describe("l’exergue", () => {
  it("est facultatif", () => {
    expect(validerExergue(null)).toEqual({ ok: true, valeur: null });
    expect(validerExergue("")).toEqual({ ok: true, valeur: null });
  });
});

describe("la condition d’accès", () => {
  it("ne connaît que deux valeurs", () => {
    expect(validerAcces("TOUS").ok).toBe(true);
    expect(validerAcces("ADMINISTRATION").ok).toBe(true);
    // Il n'existe pas de troisième valeur, et surtout pas une par année :
    // décision du joueur du 30 août 2026.
    expect(validerAcces("CINQUIEME_ANNEE").ok).toBe(false);
    expect(validerAcces("").ok).toBe(false);
  });
});

describe("une fiche de sort", () => {
  const fiche = {
    type: "FICHE_SORT",
    ancre: "sortilege-de-l-entrave",
    donnees: {
      nom: "Sortilège de l’Entrave",
      glyphes: ["ᚾ"],
      formule: "Naudhiz",
      lie: false,
      matiere: "sortileges",
      annee: 1,
      effet: "Ferme et retient une porte, un coffre, un carnet.",
      limite: "Cède à qui pousse assez fort.",
    },
  };

  it("passe entière", () => {
    const r = validerBloc(fiche);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valeur.type).toBe("FICHE_SORT");
      expect(r.valeur.ancre).toBe("sortilege-de-l-entrave");
    }
  });

  it("refuse une matière qui ne figure pas au cursus", () => {
    const r = validerBloc({
      ...fiche,
      donnees: { ...fiche.donnees, matiere: "potions" },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("potions");
  });

  it("refuse une année hors des sept", () => {
    for (const annee of [0, 8, 1.5, "3"]) {
      const r = validerBloc({
        ...fiche,
        donnees: { ...fiche.donnees, annee },
      });
      expect(r.ok).toBe(false);
    }
  });

  it("refuse trois runes : un sort en porte une, ou deux liées", () => {
    const r = validerBloc({
      ...fiche,
      donnees: { ...fiche.donnees, glyphes: ["ᚾ", "ᚢ", "ᚦ"] },
    });
    expect(r.ok).toBe(false);
  });

  it("accepte une limite absente", () => {
    const r = validerBloc({
      ...fiche,
      donnees: { ...fiche.donnees, limite: null },
    });
    expect(r.ok).toBe(true);
  });
});

describe("un paragraphe", () => {
  it("passe par la liste blanche du site", () => {
    const r = validerBloc({
      type: "PARAGRAPHE",
      donnees: { html: "<p>Une rune, un sort.<script>vol()</script></p>" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const html = (r.valeur.donnees as { html: string }).html;
      expect(html).not.toContain("script");
      expect(html).toContain("Une rune");
    }
  });

  it("refuse ce qui ne dit rien — « <p></p> » pèse sept signes", () => {
    expect(validerBloc({ type: "PARAGRAPHE", donnees: { html: "<p></p>" } }).ok).toBe(
      false,
    );
  });
});

describe("un tableau", () => {
  it("refuse une ligne qui n’a pas le bon nombre de colonnes", () => {
    const r = validerBloc({
      type: "TABLEAU",
      donnees: {
        entetes: ["Rune", "Nom", "Ce qu’elle désigne", "Sorts"],
        lignes: [["ᚠ", "Fehu", "le bétail", "2"], ["ᚢ", "Uruz"]],
      },
    });
    expect(r.ok).toBe(false);
  });
});

describe("un séparateur", () => {
  it("ne porte rien, et ce n’est pas un vide", () => {
    const r = validerBloc({ type: "SEPARATEUR", donnees: {} });
    expect(r.ok).toBe(true);
  });
});

describe("l’ancre", () => {
  it("est facultative", () => {
    expect(validerAncre(null)).toEqual({ ok: true, valeur: null });
  });

  it("refuse ce qui ne tiendrait pas dans une adresse", () => {
    expect(validerAncre("Sortilège de l’Entrave").ok).toBe(false);
  });
});

describe("un type inconnu", () => {
  it("ne passe pas", () => {
    expect(validerBloc({ type: "VIDEO", donnees: {} }).ok).toBe(false);
    expect(validerBloc(null).ok).toBe(false);
  });
});
