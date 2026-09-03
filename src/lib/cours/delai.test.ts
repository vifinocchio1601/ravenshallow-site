import { describe, expect, it } from "vitest";
import { REGLES } from "./cursus";
import { delaiEcoule, finDuDelai, joursRestants } from "./delai";

const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;

/** L'envoi, et un instant relatif à lui. */
const ENVOI = new Date("2026-09-04T09:00:00.000Z");
const apres = (ms: number) => new Date(ENVOI.getTime() + ms);

describe("le délai entre deux leçons", () => {
  it("part de l’envoi du contrôle, et dure ce que le cursus dit", () => {
    // ⚠️ Le nombre vient de `REGLES`, écrit par le joueur — jamais recopié ici.
    expect(finDuDelai(ENVOI).getTime() - ENVOI.getTime()).toBe(
      REGLES.delaiEntreLeconsJours * JOUR,
    );
  });

  it("n’est pas écoulé pendant qu’il court, et l’est à l’instant pile", () => {
    expect(delaiEcoule(ENVOI, ENVOI)).toBe(false);
    expect(delaiEcoule(ENVOI, apres(6 * JOUR + 23 * HEURE))).toBe(false);
    expect(delaiEcoule(ENVOI, apres(7 * JOUR))).toBe(true);
    expect(delaiEcoule(ENVOI, apres(30 * JOUR))).toBe(true);
  });
});

describe("les jours qui restent", () => {
  /**
   * ⚠️ **L’arrondi va dans le sens de l’ATTENTE.** Six jours et vingt-trois
   * heures s’écrivent « 7 jours » : annoncer « 6 » ferait attendre l’élève un
   * jour de plus que ce qu’on lui a dit, et c’est la seule erreur qui se
   * remarque. Même règle que le décompte des lignes qui manquent à un post.
   */
  it("arrondit vers le haut", () => {
    expect(joursRestants(ENVOI, ENVOI)).toBe(7);
    expect(joursRestants(ENVOI, apres(1 * HEURE))).toBe(7);
    expect(joursRestants(ENVOI, apres(1 * JOUR))).toBe(6);
    expect(joursRestants(ENVOI, apres(1 * JOUR + 1 * HEURE))).toBe(6);
    expect(joursRestants(ENVOI, apres(6 * JOUR))).toBe(1);
    expect(joursRestants(ENVOI, apres(6 * JOUR + 23 * HEURE))).toBe(1);
  });

  /**
   * ⚠️ **Zéro ne veut dire QU’UNE chose : il n’y a plus rien à attendre.**
   * L’écran s’en sert pour choisir entre « Prochaine leçon dans N jours » et
   * « Le délai est écoulé » ; un zéro rendu pour deux heures restantes
   * annoncerait une leçon qui ne s’ouvre pas.
   */
  it("ne rend zéro que lorsque le délai est vraiment écoulé", () => {
    expect(joursRestants(ENVOI, apres(7 * JOUR - 1))).toBe(1);
    expect(joursRestants(ENVOI, apres(7 * JOUR))).toBe(0);
    expect(joursRestants(ENVOI, apres(8 * JOUR))).toBe(0);
    // Et jamais un nombre négatif, qui s'afficherait tel quel.
    expect(joursRestants(ENVOI, apres(100 * JOUR))).toBe(0);
  });

  it("s’accorde avec `delaiEcoule` sur toute la semaine", () => {
    for (let h = 0; h <= 7 * 24 + 12; h++) {
      const instant = apres(h * HEURE);
      expect(joursRestants(ENVOI, instant) === 0, `${h} h`).toBe(
        delaiEcoule(ENVOI, instant),
      );
    }
  });

  /**
   * Le singulier a sa propre phrase — « Prochaine leçon demain » —, et il faut
   * donc qu’un seul jour puisse sortir. C’est la faute d’« Il manque 1 lignes »
   * et de « 1 matières imposées », prise d’avance.
   */
  it("passe bien par un, pour que le singulier ait sa phrase", () => {
    const vus = new Set<number>();
    for (let h = 0; h <= 7 * 24; h++) vus.add(joursRestants(ENVOI, apres(h * HEURE)));
    expect([...vus].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
