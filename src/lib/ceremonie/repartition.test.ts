import { describe, expect, it } from "vitest";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import { identifiantsDe, QUESTIONS } from "./questionnaire";
import { calculerRepartition, lireMelange, tirerMelange } from "./repartition";

/**
 * Le calcul du Miroir.
 *
 * Le questionnaire n’offre que 4⁵ = 1024 chemins : on les parcourt tous
 * plutôt que d’en échantillonner quelques-uns. C’est ce qui permet d’affirmer
 * — et non d’espérer — que les quatre maisons sont atteignables et qu’aucune
 * combinaison ne reste sans départage.
 */

/** Les 1024 façons de répondre. */
function toutesLesCombinaisons(): string[][] {
  let combinaisons: string[][] = [[]];
  for (const question of QUESTIONS) {
    const suivantes: string[][] = [];
    for (const debut of combinaisons) {
      for (const reponse of question.reponses) {
        suivantes.push([...debut, reponse.id]);
      }
    }
    combinaisons = suivantes;
  }
  return combinaisons;
}

/** Le calcul, quand on sait déjà qu’il doit réussir. */
function repartir(reponses: string[]) {
  const resultat = calculerRepartition(reponses);
  if (!resultat.valide) {
    throw new Error(`refusé alors qu’il ne devait pas : ${reponses.join(" ")}`);
  }
  return resultat.repartition;
}

describe("toutes les combinaisons possibles", () => {
  const combinaisons = toutesLesCombinaisons();

  it("en compte bien 1024", () => {
    expect(combinaisons).toHaveLength(4 ** 5);
  });

  it("donne une maison à chacune, sans jamais échouer", () => {
    for (const reponses of combinaisons) {
      const resultat = calculerRepartition(reponses);
      expect(resultat.valide, reponses.join(" ")).toBe(true);
    }
  });

  it("rend les quatre maisons atteignables", () => {
    const atteintes = new Set(combinaisons.map((r) => repartir(r).maison));
    expect([...atteintes].sort()).toEqual([...MAISONS].sort());
  });

  it("distribue toujours quinze points — cinq réponses à 2 + 1", () => {
    for (const reponses of combinaisons) {
      const { points } = repartir(reponses);
      const total = MAISONS.reduce((somme, maison) => somme + points[maison], 0);
      expect(total, reponses.join(" ")).toBe(15);
    }
  });

  it("désigne toujours une maison arrivée au sommet du compte", () => {
    for (const reponses of combinaisons) {
      const { maison, points } = repartir(reponses);
      const sommet = Math.max(...MAISONS.map((m) => points[m]));
      expect(points[maison], reponses.join(" ")).toBe(sommet);
    }
  });

  /** Aucune égalité ne reste pendante : il n’y a pas de quatrième cas. */
  it("nomme toujours la règle qui a tranché", () => {
    for (const reponses of combinaisons) {
      expect(repartir(reponses).departage.regle).toMatch(
        /^(aucun|question5|premiereMarque)$/,
      );
    }
  });

  /** Reproductible : c’est ce qui permet de répondre à un joueur qui conteste. */
  it("rend deux fois le même résultat pour les mêmes réponses", () => {
    for (const reponses of combinaisons) {
      expect(repartir(reponses)).toEqual(repartir([...reponses]));
    }
  });
});

describe("le départage", () => {
  it("ne se déclenche pas quand une maison mène seule", () => {
    // BRYGGELD 6, TIDEAL 5, le reste à 2.
    const resultat = repartir(["q1a", "q2a", "q3a", "q4a", "q5b"]);
    expect(resultat.maison).toBe("BRYGGELD");
    expect(resultat.departage).toEqual({ regle: "aucun" });
  });

  it("laisse la cinquième réponse trancher quand elle désigne une prétendante", () => {
    // NATTORM, BRYGGELD et TIDEAL à 4 ; q5a ne sert que NATTORM.
    const resultat = repartir(["q1a", "q2a", "q3a", "q4a", "q5a"]);
    expect(resultat.points).toEqual({
      KALDRAFN: 3,
      NATTORM: 4,
      BRYGGELD: 4,
      TIDEAL: 4,
    });
    expect(resultat.departage).toEqual({
      regle: "question5",
      exAequo: ["NATTORM", "BRYGGELD", "TIDEAL"],
    });
    expect(resultat.maison).toBe("NATTORM");
  });

  it("donne la victoire au plus fort quand la cinquième en désigne deux", () => {
    // KALDRAFN et NATTORM à 5 ; q5c donne 2 à KALDRAFN et 1 à NATTORM.
    const resultat = repartir(["q1a", "q2a", "q3a", "q4d", "q5c"]);
    expect(resultat.points.KALDRAFN).toBe(5);
    expect(resultat.points.NATTORM).toBe(5);
    expect(resultat.departage).toEqual({
      regle: "question5",
      exAequo: ["KALDRAFN", "NATTORM"],
    });
    expect(resultat.maison).toBe("KALDRAFN");
  });

  it("revient à la première maison à avoir marqué quand la cinquième est muette", () => {
    // KALDRAFN et NATTORM à 5 ; q5b ne sert ni l’une ni l’autre.
    // KALDRAFN a marqué dès la question 1, NATTORM seulement à la 2.
    const resultat = repartir(["q1a", "q2b", "q3a", "q4d", "q5b"]);
    expect(resultat.points.KALDRAFN).toBe(5);
    expect(resultat.points.NATTORM).toBe(5);
    expect(resultat.departage).toEqual({
      regle: "premiereMarque",
      exAequo: ["KALDRAFN", "NATTORM"],
    });
    expect(resultat.maison).toBe("KALDRAFN");
  });

  /**
   * Le cas que la règle écrite ne couvrait pas tout à fait : les deux
   * prétendantes ont marqué pour la première fois sur **la même** réponse.
   * L’une y a pris 2 points, l’autre 1 — ce qui suffit à trancher sans
   * tirage au sort. Deux des 1024 combinaisons tombent ici.
   */
  it("départage par le gain quand les deux ont marqué sur la même réponse", () => {
    // q1d sert NATTORM (2) et KALDRAFN (1) : toutes deux marquent en question 1.
    const resultat = repartir(["q1d", "q2b", "q3b", "q4d", "q5b"]);
    expect(resultat.points.KALDRAFN).toBe(5);
    expect(resultat.points.NATTORM).toBe(5);
    expect(resultat.departage).toEqual({
      regle: "premiereMarque",
      exAequo: ["KALDRAFN", "NATTORM"],
    });
    expect(resultat.maison).toBe("NATTORM");
  });

  it("ne laisse jamais le hasard décider", () => {
    // Cent passages sur un cas d’égalité : le même vainqueur, cent fois.
    const egalite = ["q1d", "q2b", "q3b", "q4d", "q5d"];
    const maisons = new Set(
      Array.from({ length: 100 }, () => repartir(egalite).maison),
    );
    expect(maisons.size).toBe(1);
  });
});

describe("ce que le calcul refuse", () => {
  const valides = ["q1a", "q2a", "q3a", "q4a", "q5a"];

  it("refuse un identifiant inconnu", () => {
    expect(calculerRepartition(["q1z", "q2a", "q3a", "q4a", "q5a"])).toEqual({
      valide: false,
      raison: "identifiant",
    });
  });

  /** La garantie qu’un mélange décalé ne peut pas fausser le compte. */
  it("refuse un identifiant qui appartient à une autre question", () => {
    expect(calculerRepartition(["q2a", "q2a", "q3a", "q4a", "q5a"])).toEqual({
      valide: false,
      raison: "identifiant",
    });
    expect(calculerRepartition(["q1a", "q2a", "q3a", "q4a", "q1a"])).toEqual({
      valide: false,
      raison: "identifiant",
    });
  });

  it("refuse une réponse qui n’est pas une chaîne", () => {
    for (const intrus of [null, undefined, 0, 2, {}, ["q1a"], true]) {
      expect(
        calculerRepartition([intrus, "q2a", "q3a", "q4a", "q5a"]),
      ).toEqual({ valide: false, raison: "identifiant" });
    }
  });

  it("refuse un compte de réponses qui n’est pas cinq", () => {
    expect(calculerRepartition([])).toEqual({ valide: false, raison: "nombre" });
    expect(calculerRepartition(valides.slice(0, 4))).toEqual({
      valide: false,
      raison: "nombre",
    });
    expect(calculerRepartition([...valides, "q5b"])).toEqual({
      valide: false,
      raison: "nombre",
    });
  });
});

describe("l’ordre d’affichage des réponses", () => {
  it("tire une permutation complète pour chacune des cinq questions", () => {
    for (let essai = 0; essai < 50; essai += 1) {
      const melange = tirerMelange();
      expect(melange).toHaveLength(5);

      melange.forEach((ligne, question) => {
        const ids = ligne.split(" ");
        expect(ids.length).toBe(4);
        expect(new Set(ids).size).toBe(4);
        expect(ids.slice().sort()).toEqual([...identifiantsDe(question)].sort());
      });
    }
  });

  it("ne rend pas le même ordre à tous les élèves", () => {
    const tirages = new Set(
      Array.from({ length: 40 }, () => tirerMelange().join("|")),
    );
    expect(tirages.size).toBeGreaterThan(1);
  });

  /** Un rechargement de page relit la ligne : il ne rebat pas les cartes. */
  it("se relit à l’identique depuis la base", () => {
    for (let essai = 0; essai < 20; essai += 1) {
      const range = tirerMelange();
      const relu = lireMelange(range);
      expect(relu).not.toBeNull();
      expect(relu?.map((ids) => ids.join(" "))).toEqual(range);
    }
  });

  it("refuse un mélange qui ne colle plus au questionnaire", () => {
    const bon = tirerMelange();

    expect(lireMelange(null)).toBeNull();
    expect(lireMelange(undefined)).toBeNull();
    expect(lireMelange([])).toBeNull();
    expect(lireMelange(bon.slice(0, 4)), "trop peu de questions").toBeNull();
    expect(lireMelange([...bon, "q1a q1b q1c q1d"]), "trop de questions").toBeNull();
    expect(
      lireMelange(["q1a q1b q1c", ...bon.slice(1)]),
      "une réponse manquante",
    ).toBeNull();
    expect(
      lireMelange(["q1a q1a q1c q1d", ...bon.slice(1)]),
      "un doublon",
    ).toBeNull();
    expect(
      lireMelange(["q1a q1b q1c q1z", ...bon.slice(1)]),
      "un identifiant inconnu",
    ).toBeNull();
    expect(
      lireMelange(["q2a q2b q2c q2d", ...bon.slice(1)]),
      "les réponses d’une autre question",
    ).toBeNull();
  });

  it("rend un ordre utilisable directement par le calcul", () => {
    const melange = lireMelange(tirerMelange());
    expect(melange).not.toBeNull();

    // Le premier de chaque liste mélangée forme une réponse valide.
    const premieres = melange!.map((ids) => ids[0]) as string[];
    const resultat = calculerRepartition(premieres);
    expect(resultat.valide).toBe(true);
    if (resultat.valide) {
      expect(MAISONS).toContain(resultat.repartition.maison as Maison);
    }
  });
});
