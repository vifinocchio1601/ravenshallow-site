import { describe, expect, it } from "vitest";
import { ENTREES_MENU, PREFIXES_ECOLE, ROUTES, ROUTES_HORS_MENU } from "@/lib/ecole/menu";
import {
  aChoisiSaBaguette,
  aFiniLesPremiersPas,
  destinationApres,
  entreesVisibles,
  estBanni,
  estReparti,
  peutEntrerDansLEcole,
  routeAutorisee,
  type EtatAcces,
} from "./acces";

/**
 * Qui entre, et jusqu’où.
 *
 * L’accès se joue à deux étages — le dossier d’abord, les premiers pas
 * ensuite — et deux états restreignent la circulation pour des raisons
 * opposées : le membre suspendu, à qui l’on a fermé les portes, et le nouvel
 * arrivant, qui ne les a pas encore ouvertes.
 *
 * Les derniers tests de ce fichier ne vérifient pas un cas mais **une
 * propriété** : qu’une entrée sans drapeau reste fermée. Ils porteront donc
 * sur les entrées qui n’existent pas encore.
 */

function compte(modifications: Partial<EtatAcces> = {}): EtatAcces {
  return {
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    banniJusquau: null,
    maison: null,
    baguetteChoisieLe: null,
    ...modifications,
  };
}

const NOUVEL_ARRIVANT = compte();
const REPARTI = compte({ maison: "NATTORM" });
const BANNI = compte({ statutAcces: "EN_BANNISSEMENT" });
const BANNI_REPARTI = compte({ statutAcces: "EN_BANNISSEMENT", maison: "TIDEAL" });
const EN_ATTENTE = compte({ statut: "EN_ATTENTE", statutAcces: "EN_ATTENTE" });

describe("les deux étages de l’accès", () => {
  it("ouvre le château au dossier accepté et non suspendu", () => {
    expect(peutEntrerDansLEcole(NOUVEL_ARRIVANT)).toBe(true);
    expect(peutEntrerDansLEcole(REPARTI)).toBe(true);
    expect(peutEntrerDansLEcole(BANNI)).toBe(false);
    expect(peutEntrerDansLEcole(EN_ATTENTE)).toBe(false);
    expect(peutEntrerDansLEcole(compte({ statut: "REFUSE" }))).toBe(false);
    expect(peutEntrerDansLEcole(compte({ statut: "A_CORRIGER" }))).toBe(false);
  });

  /**
   * La condition d’entrée ne dit **pas** « et réparti », et c’est délibéré :
   * l’y ajouter fermerait le bureau au nouvel arrivant, donc la note qui l’y
   * envoie, donc le Miroir. Ce test fige cette décision.
   */
  it("laisse entrer un élève que le Miroir n’a pas encore lu", () => {
    expect(peutEntrerDansLEcole(NOUVEL_ARRIVANT)).toBe(true);
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.bureau)).toBe(true);
  });

  it("ne compte les premiers pas finis qu’une fois la maison connue", () => {
    expect(estReparti(NOUVEL_ARRIVANT)).toBe(false);
    expect(estReparti(REPARTI)).toBe(true);
    expect(aFiniLesPremiersPas(NOUVEL_ARRIVANT)).toBe(false);
    expect(aFiniLesPremiersPas(REPARTI)).toBe(true);
  });

  /** Tant que la boutique n’existe pas, l’étape est réputée franchie. */
  it("tient la baguette pour acquise pendant que Bjornstav est fermée", () => {
    expect(aChoisiSaBaguette(NOUVEL_ARRIVANT)).toBe(true);
    expect(aChoisiSaBaguette(compte({ baguetteChoisieLe: new Date() }))).toBe(true);
  });

  it("reconnaît le bannissement, dossier accepté seulement", () => {
    expect(estBanni(BANNI)).toBe(true);
    expect(estBanni(NOUVEL_ARRIVANT)).toBe(false);
    expect(estBanni(compte({ statut: "EN_ATTENTE", statutAcces: "EN_BANNISSEMENT" }))).toBe(false);
  });
});

describe("où atterrit chaque compte", () => {
  it.each([
    ["un dossier à corriger", compte({ statut: "A_CORRIGER" }), ROUTES.correction],
    ["un dossier refusé", compte({ statut: "REFUSE" }), ROUTES.refus],
    ["un brouillon jamais envoyé", compte({ statut: "BROUILLON" }), ROUTES.inscription],
    ["un dossier en lecture", EN_ATTENTE, ROUTES.attente],
    ["un accepté dont l’accès n’est pas ouvert", compte({ statutAcces: "EN_ATTENTE" }), ROUTES.attente],
    ["un nouvel arrivant", NOUVEL_ARRIVANT, ROUTES.bureau],
    ["un élève réparti", REPARTI, ROUTES.bureau],
    ["un membre banni", BANNI, ROUTES.bureau],
  ])("envoie %s au bon endroit", (_cas, etat, attendu) => {
    expect(destinationApres(etat)).toBe(attendu);
  });
});

describe("le nouvel arrivant", () => {
  it("n’a que son bureau et sa fiche au bandeau", () => {
    expect(entreesVisibles(NOUVEL_ARRIVANT).map((e) => e.href)).toEqual([
      ROUTES.bureau,
      ROUTES.fiche,
    ]);
  });

  it("peut se présenter devant le Miroir", () => {
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.ceremonie)).toBe(true);
  });

  it("ne peut ouvrir ni les cours ni l’école", () => {
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.cours)).toBe(false);
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.ecole)).toBe(false);
  });
});

describe("l’élève réparti", () => {
  it("voit tout le bandeau", () => {
    expect(entreesVisibles(REPARTI).map((e) => e.href)).toEqual(
      ENTREES_MENU.map((e) => e.href),
    );
  });

  it("ouvre les cours et l’école", () => {
    expect(routeAutorisee(REPARTI, ROUTES.cours)).toBe(true);
    expect(routeAutorisee(REPARTI, ROUTES.ecole)).toBe(true);
  });

  /**
   * **L’accès direct par URL une fois réparti.** La route reste autorisée —
   * il a tous les droits — mais la page le renvoie au bureau sur `estReparti`.
   * C’est bien ce prédicat-là qui referme la cérémonie derrière lui, et non
   * une fermeture de route qui produirait une redirection en boucle.
   */
  it("ne rejoue pas la cérémonie : la page se referme sur estReparti", () => {
    expect(routeAutorisee(REPARTI, ROUTES.ceremonie)).toBe(true);
    expect(estReparti(REPARTI)).toBe(true);
  });
});

describe("le membre banni", () => {
  it("garde son bureau et sa fiche, réparti ou non", () => {
    for (const etat of [BANNI, BANNI_REPARTI]) {
      expect(entreesVisibles(etat).map((e) => e.href)).toEqual([
        ROUTES.bureau,
        ROUTES.fiche,
      ]);
    }
  });

  it("n’atteint jamais le Miroir, même sans maison", () => {
    expect(routeAutorisee(BANNI, ROUTES.ceremonie)).toBe(false);
  });

  it("n’ouvre ni les cours ni l’école", () => {
    expect(routeAutorisee(BANNI_REPARTI, ROUTES.cours)).toBe(false);
    expect(routeAutorisee(BANNI_REPARTI, ROUTES.ecole)).toBe(false);
  });
});

describe("le dossier non accepté", () => {
  it("n’ouvre rien du tout", () => {
    for (const chemin of Object.values(ROUTES)) {
      expect(routeAutorisee(EN_ATTENTE, chemin), chemin).toBe(false);
    }
    expect(entreesVisibles(EN_ATTENTE)).toHaveLength(0);
  });
});

describe("les propriétés que le jour d’après ne doit pas casser", () => {
  /**
   * Ces deux tests portent sur les entrées **qui n’existent pas encore**.
   * Ajouter la messagerie ou les scènes sans y penser les rangera derrière la
   * note et derrière le bannissement, ce qui est la règle voulue. Les écrire
   * ouvertes est un choix, et il faudra le poser explicitement.
   */
  it("ferme au nouvel arrivant toute entrée sans « avantPremiersPas »", () => {
    for (const entree of [...ENTREES_MENU, ...ROUTES_HORS_MENU]) {
      expect(routeAutorisee(NOUVEL_ARRIVANT, entree.href), entree.href).toBe(
        entree.avantPremiersPas === true,
      );
    }
  });

  it("ferme au membre banni toute entrée sans « pendantBannissement »", () => {
    for (const entree of [...ENTREES_MENU, ...ROUTES_HORS_MENU]) {
      expect(routeAutorisee(BANNI, entree.href), entree.href).toBe(
        entree.pendantBannissement === true,
      );
    }
  });

  it("refuse un chemin qu’aucune des deux listes ne connaît", () => {
    for (const etat of [NOUVEL_ARRIVANT, BANNI, EN_ATTENTE]) {
      expect(routeAutorisee(etat, "/salle-sur-mesure")).toBe(false);
    }
    // Seul l’élève au bout de ses premiers pas passe sur un chemin inconnu.
    expect(routeAutorisee(REPARTI, "/salle-sur-mesure")).toBe(true);
  });

  /** La cérémonie est gardée par le middleware sans figurer au bandeau. */
  it("garde la cérémonie sans jamais l’afficher au menu", () => {
    expect(PREFIXES_ECOLE).toContain(ROUTES.ceremonie);
    expect(ENTREES_MENU.map((e) => e.href)).not.toContain(ROUTES.ceremonie);

    for (const etat of [NOUVEL_ARRIVANT, REPARTI, BANNI]) {
      expect(entreesVisibles(etat).map((e) => e.href)).not.toContain(
        ROUTES.ceremonie,
      );
    }
  });

  it("garde tous les chemins des deux listes", () => {
    for (const entree of [...ENTREES_MENU, ...ROUTES_HORS_MENU]) {
      expect(PREFIXES_ECOLE, entree.href).toContain(entree.href);
    }
  });

  /** Une sous-route hérite de la garde de son entrée. */
  it("applique la même règle aux sous-chemins", () => {
    expect(routeAutorisee(NOUVEL_ARRIVANT, `${ROUTES.cours}/sortileges`)).toBe(false);
    expect(routeAutorisee(REPARTI, `${ROUTES.cours}/sortileges`)).toBe(true);
    expect(routeAutorisee(BANNI, `${ROUTES.fiche}/limites`)).toBe(true);
  });
});
