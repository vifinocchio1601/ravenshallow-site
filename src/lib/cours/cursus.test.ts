import { describe, expect, it } from "vitest";
import { FONCTIONS } from "@/lib/dossier/etats";
import {
  ANNEES,
  auChoix,
  chargeDe,
  CYCLES,
  cycleDe,
  MATIERES,
  anneeDuCursus,
  estUneAnnee,
  obligatoires,
  peutOuvrirLAnnee,
  REGLES,
  statutDe,
} from "./cursus";

/**
 * **Le cursus est du joueur ; ces essais ne le jugent pas, ils le figent.**
 *
 * Ce qu’ils vérifient, ce sont les invariants qu’il a lui-même écrits en
 * commentaire — la charge de chaque année, les huit matières des grandes
 * épreuves — et le fait que la table reste cohérente le jour où l’on y
 * touchera : sept statuts par matière, trois cycles qui couvrent les sept
 * années sans trou, des prérequis qui existent.
 */

describe("la table des matières tient debout", () => {
  it("chaque matière porte exactement sept statuts", () => {
    for (const matiere of MATIERES) {
      expect(matiere.statuts).toHaveLength(7);
    }
  });

  it("les identifiants sont uniques", () => {
    const ids = MATIERES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tout prérequis désigne une matière qui existe", () => {
    const ids = new Set(MATIERES.map((m) => m.id));
    for (const matiere of MATIERES) {
      for (const requis of matiere.prerequis) {
        expect(ids.has(requis)).toBe(true);
      }
    }
  });

  /**
   * **Une matière ne se rouvre pas après s’être tue.** Elle commence une
   * année et ne s’interrompt plus : l’Alchimie ouvre en deuxième, le Duel en
   * quatrième, et aucune ne saute une année au milieu. Sans quoi « avoir
   * suivi la matière » cesserait de vouloir dire quelque chose.
   */
  it("aucune matière ne s’interrompt puis reprend", () => {
    for (const matiere of MATIERES) {
      const enseignee = matiere.statuts.map((s) => s !== null);
      const debut = enseignee.indexOf(true);
      expect(debut).toBeGreaterThanOrEqual(0);
      expect(enseignee.slice(debut).every(Boolean)).toBe(true);
    }
  });
});

describe("les trois cycles", () => {
  it("couvrent les sept années, sans trou ni recouvrement", () => {
    const couvertes = CYCLES.flatMap((c) => c.annees).sort((a, b) => a - b);
    expect(couvertes).toEqual(ANNEES);
  });

  it("rendent le bon cycle pour chaque année", () => {
    expect(cycleDe(1).id).toBe("SEUIL");
    expect(cycleDe(3).id).toBe("SEUIL");
    expect(cycleDe(4).id).toBe("MAREE");
    expect(cycleDe(5).id).toBe("MAREE");
    expect(cycleDe(6).id).toBe("VEILLE");
    expect(cycleDe(7).id).toBe("VEILLE");
  });

  /** Le Seuil n’offre aucun choix : les trois premières années sont imposées. */
  it("n’ouvrent le choix qu’à partir de la Marée", () => {
    expect(cycleDe(3).choixParAnnee).toBe(0);
    expect(cycleDe(4).choixParAnnee).toBe(3);
    expect(cycleDe(6).choixParAnnee).toBe(4);
  });

  it("proposent toujours plus de matières qu’il n’en faut choisir", () => {
    for (const annee of ANNEES) {
      expect(auChoix(annee).length).toBeGreaterThanOrEqual(
        cycleDe(annee).choixParAnnee,
      );
    }
  });
});

describe("la charge de chaque année", () => {
  /** Les sept nombres que le joueur a écrits en commentaire de son cursus. */
  it("vaut 6, 7, 8, 6, 6, 5, 5", () => {
    expect(ANNEES.map(chargeDe)).toEqual([6, 7, 8, 6, 6, 5, 5]);
  });

  it("compte les obligatoires plus les choix du cycle", () => {
    for (const annee of ANNEES) {
      expect(chargeDe(annee)).toBe(
        obligatoires(annee).length + cycleDe(annee).choixParAnnee,
      );
    }
  });
});

describe("ce que les grandes épreuves recouvrent", () => {
  /**
   * **Huit matières, et non neuf** : le Duel n’ouvre qu’en quatrième année.
   * Le commentaire du cursus le dit ; on le vérifie plutôt que de le croire.
   */
  it("porte sur les huit matières du Seuil", () => {
    const enseignees = MATIERES.filter((m) =>
      REGLES.grandesEpreuves.porteeAnnees.some(
        (annee) => m.statuts[annee - 1] !== null,
      ),
    );
    expect(enseignees).toHaveLength(8);
    expect(enseignees.map((m) => m.id)).not.toContain("duel");
  });
});

describe("le pont avec l’année du compte", () => {
  it("range les sept fonctions sur les sept années", () => {
    expect(FONCTIONS.map(anneeDuCursus)).toEqual(ANNEES);
  });

  it("ne reconnaît que 1 à 7 dans une adresse", () => {
    expect(estUneAnnee("1")).toBe(true);
    expect(estUneAnnee("7")).toBe(true);
    expect(estUneAnnee("0")).toBe(false);
    expect(estUneAnnee("8")).toBe(false);
    expect(estUneAnnee("3.5")).toBe(false);
    expect(estUneAnnee("trois")).toBe(false);
    expect(estUneAnnee("")).toBe(false);
    expect(estUneAnnee(null)).toBe(false);
  });
});

describe("qui ouvre quelle année — art. 14.4", () => {
  /**
   * « Les matières accessibles à un personnage sont celles de son année en
   * cours. » Un septième année revoit le programme de première ; un première
   * année n’a rien à faire dans celui de septième.
   */
  it("ouvre jusqu’à son année, jamais au-delà", () => {
    expect(peutOuvrirLAnnee("PREMIERE_ANNEE", 1, false)).toBe(true);
    expect(peutOuvrirLAnnee("PREMIERE_ANNEE", 2, false)).toBe(false);
    expect(peutOuvrirLAnnee("SEPTIEME_ANNEE", 1, false)).toBe(true);
    expect(peutOuvrirLAnnee("SEPTIEME_ANNEE", 7, false)).toBe(true);
    expect(peutOuvrirLAnnee("QUATRIEME_ANNEE", 5, false)).toBe(false);
  });

  it("laisse le staff passer partout, comme sur le forum", () => {
    for (const annee of ANNEES) {
      expect(peutOuvrirLAnnee("PREMIERE_ANNEE", annee, true)).toBe(true);
    }
  });
});

describe("le statut d’une matière", () => {
  it("dit ce que le cursus dit", () => {
    expect(statutDe("sortileges", 7)).toBe("OBLIGATOIRE");
    expect(statutDe("duel", 3)).toBeNull();
    expect(statutDe("duel", 4)).toBe("OBLIGATOIRE");
    expect(statutDe("duel", 6)).toBe("HAUTE_ETUDE");
    expect(statutDe("runologie", 4)).toBe("OPTION");
  });

  it("rend nul pour une matière qui n’existe pas", () => {
    expect(statutDe("potions_interdites", 1)).toBeNull();
  });
});
