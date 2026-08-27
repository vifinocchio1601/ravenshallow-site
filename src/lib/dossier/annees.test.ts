import { describe, expect, it } from "vitest";
import {
  anneeSuivante,
  atteintLAnnee,
  FONCTIONS,
  libelleAnnee,
  rangAnnee,
} from "./etats";

/**
 * L’ordre des sept années — et le passage de l’une à l’autre (art. 18.4).
 *
 * Ce fichier est **le seul endroit du site qui connaisse cet ordre** :
 * `rangAnnee`, `atteintLAnnee` et `anneeSuivante` s’appuient tous les trois
 * sur la même liste. Une seconde liste tenue ailleurs finirait par diverger,
 * et un élève passerait de troisième en cinquième sans que personne le voie.
 */

describe("l’année suivante", () => {
  it("avance d’un cran, et d’un seul", () => {
    expect(anneeSuivante("PREMIERE_ANNEE")).toBe("DEUXIEME_ANNEE");
    expect(anneeSuivante("TROISIEME_ANNEE")).toBe("QUATRIEME_ANNEE");
    expect(anneeSuivante("SIXIEME_ANNEE")).toBe("SEPTIEME_ANNEE");
  });

  /** **Le cas qui justifie le `null`.** */
  it("s’arrête à la septième — c’est la fin des études", () => {
    // Pas une erreur : le règlement ne dit pas ce que devient un septième
    // année, et l'écran de clôture n'affiche donc aucune case pour lui.
    expect(anneeSuivante("SEPTIEME_ANNEE")).toBeNull();
  });

  it("ne rend rien pour une valeur que la liste ne reconnaît pas", () => {
    // `PROFESSEUR` et `DIRECTION` ont été retirés de l'enum mais restent
    // gravés dans d'anciennes entrées de journal. Ils ne doivent surtout pas
    // ouvrir un passage vers la première année.
    expect(anneeSuivante("PROFESSEUR" as never)).toBeNull();
    expect(anneeSuivante("DIRECTION" as never)).toBeNull();
  });

  it("parcourt les sept années sans en sauter ni en répéter", () => {
    const parcourues = [FONCTIONS[0]!];
    for (let i = 0; i < 10; i += 1) {
      const suivante = anneeSuivante(parcourues.at(-1)!);
      if (!suivante) break;
      parcourues.push(suivante);
    }
    expect(parcourues).toEqual(FONCTIONS);
  });

  it("accorde le rang et le libellé au passage", () => {
    const apres = anneeSuivante("TROISIEME_ANNEE")!;
    expect(rangAnnee(apres)).toBe(rangAnnee("TROISIEME_ANNEE") + 1);
    expect(libelleAnnee(apres)).toBe("4e année");
    // Le redoublant ne perd rien : son année ne bouge pas, donc son rang non
    // plus, et les lieux qui lui étaient ouverts le restent (art. 18.5).
    expect(atteintLAnnee("TROISIEME_ANNEE", "TROISIEME_ANNEE")).toBe(true);
    expect(atteintLAnnee("TROISIEME_ANNEE", apres)).toBe(false);
  });
});
