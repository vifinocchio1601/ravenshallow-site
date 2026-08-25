import { describe, expect, it } from "vitest";
import { MAISONS } from "@/lib/dossier/etats";
import {
  compteAuTournoi,
  maisonQuiCompte,
  totauxParMaison,
  totauxVides,
} from "./tournoi";

/**
 * Qui marque pour sa maison.
 *
 * Le lot des points n’existe pas : ces tests ne vérifient donc aucun total
 * réel. Ils verrouillent **la règle qui décidera qui compte**, posée avant
 * que le premier total soit écrit — parce qu’une fois les sommes éparpillées,
 * la poser voudrait dire les retrouver toutes.
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

describe("le compteur des quatre maisons", () => {
  it("ne compte que ceux qui marquent", () => {
    const totaux = totauxParMaison([
      { ...eleve("BRYGGELD", "FAIT"), points: 30 },
      { ...eleve("BRYGGELD", "FAIT"), points: 12 },
      { ...eleve("KALDRAFN", "FAIT"), points: 25 },
      // La directrice, ancienne Bryggeld, avec un joli score : rien de tout
      // cela ne doit atterrir dans la colonne de Bryggeld.
      { ...eleve("BRYGGELD", "SANS_OBJET"), points: 900 },
      // Un professeur venu de l’extérieur, jamais réparti.
      { ...eleve(null, "SANS_OBJET"), points: 400 },
      // Un nouvel élève, pas encore passé devant le Miroir.
      { ...eleve(null, "NON_FAIT"), points: 7 },
    ]);

    expect(totaux.BRYGGELD).toBe(42);
    expect(totaux.KALDRAFN).toBe(25);
    expect(totaux.NATTORM).toBe(0);
    expect(totaux.TIDEAL).toBe(0);

    // Et le total général ne contient ni les 900 ni les 400 ni les 7.
    const somme = MAISONS.reduce((t, m) => t + totaux[m], 0);
    expect(somme).toBe(67);
  });

  it("porte toujours les quatre maisons, même à zéro", () => {
    // Une maison qui disparaît du tableau parce qu’elle n’a rien marqué
    // rendrait le classement illisible.
    expect(Object.keys(totauxParMaison([])).sort()).toEqual([...MAISONS].sort());
    expect(Object.keys(totauxVides()).sort()).toEqual([...MAISONS].sort());
  });

  it("fait le tri lui-même, sans compter sur l’appelant", () => {
    // Ce test dit la forme voulue : on lui passe la liste BRUTE. Le jour où
    // quelqu’un préfèrera filtrer avant d’appeler, c’est le filtre du dehors
    // qu’on oubliera de corriger.
    const bruts = [
      { ...eleve("NATTORM", "FAIT"), points: 5 },
      { ...eleve("NATTORM", "SANS_OBJET"), points: 5 },
    ];
    expect(totauxParMaison(bruts).NATTORM).toBe(5);
  });
});
