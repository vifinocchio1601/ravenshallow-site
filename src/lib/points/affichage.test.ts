import { describe, expect, it } from "vitest";
import {
  detailDUneMaison,
  enEleves,
  enPoints,
  moyenneAffichee,
  pointsAffiches,
  pointsSignes,
} from "./affichage";

/**
 * Comment un nombre de points s’écrit à l’écran.
 *
 * Un seul fichier, et c’est tout l’intérêt : la mise en forme était recopiée
 * dans trois écrans, et chacun arrondissait pour son compte. Ces tests-ci
 * valent donc pour les trois d’un coup.
 */

describe("aucune décimale, nulle part", () => {
  it("arrondit la moyenne à l’entier", () => {
    // « 34,3 » donne un air de tableur à ce qui doit se lire d’un coup d’œil.
    expect(moyenneAffichee(34.3)).toBe("34");
    expect(moyenneAffichee(34.5)).toBe("35");
    expect(moyenneAffichee(43.111)).toBe("43");
  });

  /** **Le cas qui a motivé la demande.** */
  it("écrit « 0 » et jamais « 0,0 »", () => {
    // Quatre tubes vides affichaient « 0,0 », qui se lit comme une panne.
    expect(moyenneAffichee(0)).toBe("0");
    expect(pointsAffiches(0)).toBe("0");
  });

  it("ne rend jamais « moins zéro »", () => {
    // `Math.round(-0.4)` rend `-0`, que `String` écrit « -0 ». Personne n’a
    // jamais lu « moins zéro point ».
    expect(moyenneAffichee(-0.4)).toBe("0");
    expect(moyenneAffichee(-0)).toBe("0");
  });

  it("porte le vrai signe moins, pas le trait d’union", () => {
    // U+2212 : dans une colonne de chiffres, « -15 » et « +15 » ne se lisent
    // pas à la même hauteur.
    expect(pointsAffiches(-15)).toBe("−15");
    expect(pointsAffiches(-15)).not.toBe("-15");
  });

  it("écrit le plus dans un historique, où le sens du geste doit se voir", () => {
    expect(pointsSignes(30)).toBe("+30");
    expect(pointsSignes(-15)).toBe("−15");
    expect(pointsSignes(0)).toBe("0");
  });
});

describe("les accords", () => {
  /** **Zéro est au singulier en français**, et c’est la faute que tout le monde fait. */
  it("met zéro au singulier", () => {
    expect(enPoints(0)).toBe("0 point");
    expect(enEleves(0)).toBe("0 élève");
  });

  it("met un au singulier, et deux au pluriel", () => {
    expect(enPoints(1)).toBe("1 point");
    expect(enPoints(2)).toBe("2 points");
    expect(enEleves(1)).toBe("1 élève");
    expect(enEleves(8)).toBe("8 élèves");
  });

  it("assemble la ligne de détail d’un tube", () => {
    expect(detailDUneMaison(12, 8)).toBe("12 points · 8 élèves");
    expect(detailDUneMaison(1, 1)).toBe("1 point · 1 élève");
    expect(detailDUneMaison(0, 0)).toBe("0 point · 0 élève");
  });
});

/**
 * **Seul l’affichage est arrondi.** Le calcul garde sa précision : c’est la
 * valeur exacte qui décide de la hauteur d’un tube et du rang d’une maison.
 */
describe("l’arrondi ne touche que ce qui se lit", () => {
  it("deux moyennes voisines peuvent s’afficher pareil", () => {
    // 34,4 et 34,6 s’écrivent « 34 » et « 35 » ; 34,1 et 34,4 s’écrivent
    // toutes deux « 34 ». Les tubes, eux, resteront différents — et c’est
    // préférable à un faux ex æquo qu’un arrondi aurait fabriqué.
    expect(moyenneAffichee(34.1)).toBe(moyenneAffichee(34.4));
    expect(34.1).not.toBe(34.4);
  });
});
