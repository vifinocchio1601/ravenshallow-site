import { describe, expect, it } from "vitest";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import { PLANCHER_EFFECTIF } from "@/lib/points/regles";
import {
  classement,
  compteAuTournoi,
  effectifsParMaison,
  maisonQuiCompte,
  totauxVides,
} from "./tournoi";

/**
 * Qui marque pour sa maison, combien ils sont, et où ça les place.
 *
 * Le cas qui justifie le fichier entier : **une directrice garde sa maison en
 * base.** On ne l’efface pas, c’est ce qui permet de la lui rendre intacte.
 * Toute somme naïve la ramasserait donc au passage, et un professeur ferait
 * gagner son ancienne maison sans que personne s’en aperçoive.
 */

const eleve = (maison: string | null, etatMaison: "NON_FAIT" | "FAIT" | "SANS_OBJET") => ({
  maison,
  etatMaison,
});

/** Quatre nombres, sans avoir à écrire les quatre clés à chaque fois. */
const par = (partiel: Partial<Record<Maison, number>>): Record<Maison, number> => ({
  ...totauxVides(),
  ...partiel,
});

describe("qui marque pour sa maison", () => {
  it("un élève réparti marque pour la sienne", () => {
    expect(maisonQuiCompte(eleve("BRYGGELD", "FAIT"))).toBe("BRYGGELD");
    expect(compteAuTournoi(eleve("BRYGGELD", "FAIT"))).toBe(true);
  });

  it("un nouvel élève ne marque pour personne — il n’a pas de maison", () => {
    expect(maisonQuiCompte(eleve(null, "NON_FAIT"))).toBeNull();
    expect(compteAuTournoi(eleve(null, "NON_FAIT"))).toBe(false);
  });

  /** **Le test qui compte.** */
  it("un compte sans objet ne rapporte rien à son ancienne maison", () => {
    // Elle est de Tideål, la colonne le dit encore, et c’est voulu : c’est ce
    // qui lui rendra sa maison intacte le jour où elle quittera le poste.
    const directrice = eleve("TIDEAL", "SANS_OBJET");

    expect(directrice.maison).toBe("TIDEAL"); // rien n’a été effacé
    expect(maisonQuiCompte(directrice)).toBeNull();
    expect(compteAuTournoi(directrice)).toBe(false);
  });

  it("ne rend jamais une maison que la liste ne reconnaît pas", () => {
    // Une valeur écrite avant un renommage ne doit pas ouvrir une cinquième
    // colonne dans le tableau du tournoi.
    expect(maisonQuiCompte(eleve("MAISON_DISPARUE", "FAIT"))).toBeNull();
  });
});

describe("l’effectif des quatre maisons", () => {
  it("ne compte que ceux qui marquent", () => {
    const effectifs = effectifsParMaison([
      eleve("BRYGGELD", "FAIT"),
      eleve("BRYGGELD", "FAIT"),
      eleve("KALDRAFN", "FAIT"),
      // La directrice, ancienne Bryggeld : elle n’est plus une élève de
      // Bryggeld, et ne doit donc pas alourdir son diviseur.
      eleve("BRYGGELD", "SANS_OBJET"),
      // Un professeur venu de l’extérieur, jamais réparti.
      eleve(null, "SANS_OBJET"),
      // Un nouvel élève, pas encore passé devant le Miroir.
      eleve(null, "NON_FAIT"),
    ]);

    expect(effectifs.BRYGGELD).toBe(2);
    expect(effectifs.KALDRAFN).toBe(1);
    expect(effectifs.NATTORM).toBe(0);
    expect(effectifs.TIDEAL).toBe(0);
  });

  it("porte toujours les quatre maisons, même à zéro", () => {
    // Une maison qui disparaît du tableau parce qu’elle n’a encore personne
    // rendrait le classement illisible.
    expect(Object.keys(effectifsParMaison([])).sort()).toEqual([...MAISONS].sort());
    expect(Object.keys(totauxVides()).sort()).toEqual([...MAISONS].sort());
  });

  it("fait le tri lui-même, sans compter sur l’appelant", () => {
    // Ce test dit la forme voulue : on lui passe la liste BRUTE. Le jour où
    // quelqu’un préfèrera filtrer avant d’appeler, c’est le filtre du dehors
    // qu’on oubliera de corriger.
    const bruts = [eleve("NATTORM", "FAIT"), eleve("NATTORM", "SANS_OBJET")];
    expect(effectifsParMaison(bruts).NATTORM).toBe(1);
  });
});

describe("le classement, à la moyenne par élève", () => {
  it("classe à la moyenne, et non au total", () => {
    // Bryggeld a le plus de points ET le plus d’élèves. C’est exactement le
    // cas que la moyenne existe pour corriger : sans elle, la maison la plus
    // peuplée gagne mécaniquement, et le tournoi ne récompense plus que le
    // recrutement.
    const lignes = classement(
      par({ BRYGGELD: 517, KALDRAFN: 412, NATTORM: 388, TIDEAL: 274 }),
      par({ BRYGGELD: 21, KALDRAFN: 14, NATTORM: 9, TIDEAL: 8 }),
    );
    const rang = (m: Maison) => lignes.find((l) => l.maison === m)!.rang;

    // 517/21 = 24,6 — le plus gros total, et pourtant le dernier rang.
    expect(rang("BRYGGELD")).toBe(4);
    // 388/9 = 43,1 — le plus petit des quatre totaux sauf un, et la tête.
    expect(rang("NATTORM")).toBe(1);
    expect(rang("TIDEAL")).toBe(2); // 274/8 = 34,25
    expect(rang("KALDRAFN")).toBe(3); // 412/14 = 29,4
  });

  it("la maison en tête remplit son tube, les autres se mesurent à elle", () => {
    const lignes = classement(par({ NATTORM: 90, TIDEAL: 45 }), par({ NATTORM: 3, TIDEAL: 3 }));
    const part = (m: Maison) => lignes.find((l) => l.maison === m)!.part;

    // Pas d’objectif fixe à calibrer : la tête vaut 1, et le reste suit.
    expect(part("NATTORM")).toBe(1);
    expect(part("TIDEAL")).toBe(0.5);
    expect(part("KALDRAFN")).toBe(0);
  });

  /** **Le test du plancher.** */
  it("une maison à deux élèves ne double pas les autres au premier post", () => {
    // Deux élèves, dix points : sans plancher, la moyenne serait de 5 et
    // écraserait une maison de vingt élèves à 80 points (4 par tête). Le
    // plancher ramène le diviseur à 3, et la moyenne à 3,33.
    const lignes = classement(par({ TIDEAL: 10, BRYGGELD: 80 }), par({ TIDEAL: 2, BRYGGELD: 20 }));
    const ligne = (m: Maison) => lignes.find((l) => l.maison === m)!;

    expect(PLANCHER_EFFECTIF).toBe(3);
    expect(ligne("TIDEAL").moyenne).toBeCloseTo(10 / 3, 5);
    expect(ligne("BRYGGELD").moyenne).toBe(4);
    expect(ligne("BRYGGELD").rang).toBe(1);
    expect(ligne("TIDEAL").rang).toBe(2);
  });

  it("une maison sans personne ne divise pas par zéro", () => {
    // Le cas du premier jour, et celui du lendemain d’une clôture. `NaN` se
    // peindrait comme un tube vide par accident plutôt que par décision.
    const lignes = classement(par({}), par({}));
    for (const ligne of lignes) {
      expect(Number.isNaN(ligne.moyenne)).toBe(false);
      expect(ligne.moyenne).toBe(0);
      expect(ligne.part).toBe(0);
      // Toutes à égalité : les quatre sont premières, et aucune n’est
      // quatrième. Un « rang 1 » affiché sur quatre tubes vides est plus
      // honnête qu’un classement inventé.
      expect(ligne.rang).toBe(1);
    }
  });

  it("les ex æquo partagent leur rang, et la suivante ne prend pas la place", () => {
    const lignes = classement(
      par({ KALDRAFN: 30, NATTORM: 30, BRYGGELD: 10 }),
      par({ KALDRAFN: 3, NATTORM: 3, BRYGGELD: 3 }),
    );
    const rang = (m: Maison) => lignes.find((l) => l.maison === m)!.rang;

    expect(rang("KALDRAFN")).toBe(1);
    expect(rang("NATTORM")).toBe(1);
    // Troisième, et non deuxième : deux maisons la précèdent réellement.
    expect(rang("BRYGGELD")).toBe(3);
    expect(rang("TIDEAL")).toBe(4);
  });

  /** **Un tube ne descend jamais sous le fond du verre.** */
  it("une maison en dessous de zéro compte pour zéro", () => {
    // L'administration a retiré vingt points à une maison qui n'en avait
    // que cinq (art. 19.1). Le compteur dit −15, et c'est la vérité du
    // carnet ; le tournoi, lui, la compte à zéro.
    const lignes = classement(par({ NATTORM: -15, TIDEAL: 30 }), par({ NATTORM: 1, TIDEAL: 3 }));
    const ligne = (m: Maison) => lignes.find((l) => l.maison === m)!;

    expect(ligne("NATTORM").points).toBe(-15); // l'administration doit le voir
    expect(ligne("NATTORM").pointsAuTournoi).toBe(0);
    expect(ligne("NATTORM").moyenne).toBe(0);
    expect(ligne("NATTORM").part).toBe(0);
    // À égalité avec les deux maisons vides, et non derrière elles : une
    // maison punie repart de zéro, elle ne traîne pas un handicap invisible.
    expect(ligne("NATTORM").rang).toBe(2);
    expect(ligne("KALDRAFN").rang).toBe(2);
  });

  it("toutes en dessous de zéro ne peint pas de tube à l’envers", () => {
    const lignes = classement(
      par({ KALDRAFN: -5, NATTORM: -80, BRYGGELD: -1, TIDEAL: -200 }),
      par({ KALDRAFN: 4, NATTORM: 4, BRYGGELD: 4, TIDEAL: 4 }),
    );
    for (const ligne of lignes) {
      expect(ligne.pointsAuTournoi).toBe(0);
      expect(ligne.moyenne).toBe(0);
      expect(ligne.part).toBe(0);
      expect(ligne.rang).toBe(1);
    }
  });

  it("rend toujours les quatre maisons dans le même ordre", () => {
    // Trié par rang, un tube changerait de place entre deux visites : on
    // cherche le sien, il a bougé. Le rang voyage sur la ligne, pas dans
    // l’ordre du tableau.
    const lignes = classement(par({ TIDEAL: 500 }), par({ TIDEAL: 3 }));
    expect(lignes.map((l) => l.maison)).toEqual([...MAISONS]);
  });
});
