import { describe, expect, it } from "vitest";
import { ENTREES_MENU, PREFIXES_ECOLE, ROUTES, ROUTES_HORS_MENU } from "@/lib/ecole/menu";
import {
  aFiniLesPremiersPas,
  destinationApres,
  liensVisibles,
  estBanni,
  doitPasserAKaldvik,
  doitPasserAuMiroir,
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
    etatMaison: "NON_FAIT",
    etatBaguette: "NON_FAIT",
    ...modifications,
  };
}

const LA_BAGUETTE = new Date("2026-08-25T18:00:00.000Z");

/** Ni baguette ni maison : il arrive, et les deux pas lui restent. */
const NOUVEL_ARRIVANT = compte();
/** Le premier pas est fait, le Miroir l’attend. */
const AVEC_BAGUETTE = compte({
  baguetteChoisieLe: LA_BAGUETTE,
  etatBaguette: "FAIT",
});
/** Les deux pas faits — c’est ce qui ouvre le reste du château. */
const REPARTI = compte({
  baguetteChoisieLe: LA_BAGUETTE,
  etatBaguette: "FAIT",
  maison: "NATTORM",
  etatMaison: "FAIT",
});
/**
 * Ni l’un ni l’autre ne la concerne : elle n’a rien à faire, et le château
 * doit pourtant s’ouvrir en entier. C’est le cas que le site confondait avec
 * le nouvel arrivant.
 */
const DIRECTRICE = compte({
  maison: "TIDEAL",
  etatMaison: "SANS_OBJET",
  baguetteChoisieLe: LA_BAGUETTE,
  etatBaguette: "SANS_OBJET",
});
const BANNI = compte({ statutAcces: "EN_BANNISSEMENT" });
const BANNI_REPARTI = compte({
  statutAcces: "EN_BANNISSEMENT",
  baguetteChoisieLe: LA_BAGUETTE,
  etatBaguette: "FAIT",
  maison: "TIDEAL",
  etatMaison: "FAIT",
});
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

  /**
   * **Les deux pas comptent, et il en faut deux.** Ni la baguette seule ni la
   * maison seule ne suffisent : ce test interdit qu’on en oublie un en
   * réécrivant un jour la condition.
   */
  it("n’ouvre le reste du château qu’une fois les deux pas faits", () => {
    expect(aFiniLesPremiersPas(NOUVEL_ARRIVANT)).toBe(false);
    expect(aFiniLesPremiersPas(AVEC_BAGUETTE)).toBe(false);
    expect(
      aFiniLesPremiersPas(compte({ maison: "NATTORM", etatMaison: "FAIT" })),
    ).toBe(false);
    expect(aFiniLesPremiersPas(REPARTI)).toBe(true);
  });

  /**
   * **Le piège du lot.** « Fini » veut dire « plus rien à faire », et non
   * « fait ». Sans cette lecture, la directrice reste enfermée dans son
   * bureau, au régime exact d’un membre suspendu — faute d’une cérémonie
   * qu’elle n’a pas à passer.
   */
  it("tient pour finie une étape qui ne concerne pas le compte", () => {
    expect(aFiniLesPremiersPas(DIRECTRICE)).toBe(true);
    expect(routeAutorisee(DIRECTRICE, ROUTES.cours)).toBe(true);
    expect(routeAutorisee(DIRECTRICE, ROUTES.ecole)).toBe(true);
  });

  it("distingue « le Miroir l’attend » de « il n’est pas concerné »", () => {
    expect(doitPasserAuMiroir(NOUVEL_ARRIVANT)).toBe(true);
    expect(doitPasserAuMiroir(AVEC_BAGUETTE)).toBe(true);
    // Réparti : c’est fait.
    expect(doitPasserAuMiroir(REPARTI)).toBe(false);
    // Sans objet : ce n’est pas fait, et cela ne le sera jamais — la question
    // « a-t-il une maison ? » rendait ces deux-là identiques.
    expect(doitPasserAuMiroir(DIRECTRICE)).toBe(false);
  });

  it("distingue de même pour la boutique", () => {
    expect(doitPasserAKaldvik(NOUVEL_ARRIVANT)).toBe(true);
    expect(doitPasserAKaldvik(AVEC_BAGUETTE)).toBe(false);
    expect(doitPasserAKaldvik(REPARTI)).toBe(false);
    expect(doitPasserAKaldvik(DIRECTRICE)).toBe(false);
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
  /**
   * Trois entrées, et non deux : la Tour aux Corbeaux s’ouvre dès le premier
   * jour. C’est un choix du joueur, et il se tient — le moment où l’on a le
   * plus besoin d’écrire à quelqu’un, c’est celui où l’on ne connaît encore
   * personne et où l’on ne sait pas comment le forum fonctionne.
   *
   * Les cours et l’école, eux, restent fermés : ils demandent une baguette et
   * une maison.
   */
  it("a son bureau, sa fiche et les corbeaux — rien d’autre", () => {
    expect(liensVisibles(NOUVEL_ARRIVANT).map((e) => e.href)).toEqual([
      ROUTES.bureau,
      ROUTES.fiche,
      ROUTES.corbeaux,
    ]);
  });

  it("peut pousser la porte de Bjornstav", () => {
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.bjornstav)).toBe(true);
  });

  it("peut se présenter devant le Miroir une fois sa baguette prise", () => {
    expect(routeAutorisee(AVEC_BAGUETTE, ROUTES.ceremonie)).toBe(true);
  });

  it("ne peut ouvrir ni les cours ni l’école", () => {
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.cours)).toBe(false);
    expect(routeAutorisee(NOUVEL_ARRIVANT, ROUTES.ecole)).toBe(false);
  });
});

describe("l’élève réparti", () => {
  it("voit tout le bandeau", () => {
    expect(liensVisibles(REPARTI).map((e) => e.href)).toEqual(
      ENTREES_MENU.map((e) => e.href),
    );
  });

  it("ouvre les cours et l’école", () => {
    expect(routeAutorisee(REPARTI, ROUTES.cours)).toBe(true);
    expect(routeAutorisee(REPARTI, ROUTES.ecole)).toBe(true);
  });

  /**
   * **L’accès direct par URL une fois réparti.** La route reste autorisée —
   * il a tous les droits — mais la page le renvoie au bureau sur
   * `doitPasserAuMiroir`. C’est bien ce prédicat-là qui referme la cérémonie
   * derrière lui, et non une fermeture de route qui produirait une
   * redirection en boucle.
   */
  it("ne rejoue pas la cérémonie : la page se referme sur doitPasserAuMiroir", () => {
    expect(routeAutorisee(REPARTI, ROUTES.ceremonie)).toBe(true);
    expect(doitPasserAuMiroir(REPARTI)).toBe(false);
  });

  /** Même mécanique pour la boutique. */
  it("ne repasse pas chez Bjornstav : la page se referme sur doitPasserAKaldvik", () => {
    expect(routeAutorisee(REPARTI, ROUTES.bjornstav)).toBe(true);
    expect(doitPasserAKaldvik(REPARTI)).toBe(false);
  });

  /**
   * Et la même mécanique referme les deux adresses devant la directrice —
   * par le même prédicat, sans qu’aucune route ait été fermée.
   */
  it("referme les deux adresses devant un compte non concerné", () => {
    expect(doitPasserAuMiroir(DIRECTRICE)).toBe(false);
    expect(doitPasserAKaldvik(DIRECTRICE)).toBe(false);
  });
});

describe("le membre banni", () => {
  /**
   * L’entrée des corbeaux reste au bandeau pendant une suspension, et c’est
   * une exception raisonnée à « le bureau et la fiche, rien d’autre » :
   * l’article 8.5 donne quinze jours pour contester une sanction, par message
   * privé à un administrateur. Fermer la Tour supprimerait ce recours pour la
   * seule personne à qui il sert.
   *
   * Ce qu’il y trouve — le fil de l’administration, et lui seul — ne se décide
   * pas ici : c’est `lib/corbeaux/droits.ts` qui en répond, et ses propres
   * tests le vérifient. Un drapeau de menu ne sait dire qu’ouvert ou fermé.
   */
  it("garde son bureau, sa fiche et la voie de recours, réparti ou non", () => {
    for (const etat of [BANNI, BANNI_REPARTI]) {
      expect(liensVisibles(etat).map((e) => e.href)).toEqual([
        ROUTES.bureau,
        ROUTES.fiche,
        ROUTES.corbeaux,
      ]);
    }
  });

  it("n’atteint ni la boutique ni le Miroir, même sans baguette ni maison", () => {
    expect(routeAutorisee(BANNI, ROUTES.bjornstav)).toBe(false);
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
    expect(liensVisibles(EN_ATTENTE)).toHaveLength(0);
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

  /**
   * La boutique et la cérémonie sont gardées par le middleware sans figurer
   * au bandeau. Les oublier dans `ROUTES_HORS_MENU`, ce serait les laisser
   * sans garde du tout.
   */
  it.each([
    ["la boutique", ROUTES.bjornstav],
    ["la cérémonie", ROUTES.ceremonie],
  ])("garde %s sans jamais l’afficher au menu", (_cas, chemin) => {
    expect(PREFIXES_ECOLE).toContain(chemin);
    expect(ENTREES_MENU.map((e) => e.href)).not.toContain(chemin);

    for (const etat of [NOUVEL_ARRIVANT, AVEC_BAGUETTE, REPARTI, BANNI]) {
      expect(liensVisibles(etat).map((e) => e.href)).not.toContain(chemin);
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
