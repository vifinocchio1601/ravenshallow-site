import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { describe, expect, it } from "vitest";
import type { EtatAcces } from "@/lib/session/acces";
import { liensVisibles, menuVisible, routeAutorisee } from "@/lib/session/acces";
import {
  ENTREES_MENU,
  MENU,
  PREFIXES_ECOLE,
  ROUTES,
  ROUTES_HORS_MENU,
  compteDe,
  estUnGroupe,
  type EntreeMenu,
  type GroupeMenu,
} from "./menu";

/**
 * Le menu regroupé : l’arbre, ses feuilles, et ce qui remonte dessus.
 *
 * Tout ce qui décide vit ici et dans `session/acces.ts` ; le bandeau ne fait
 * que rendre ce qu’on lui donne. C’est ce qui rend ce lot testable sans DOM.
 */

// ─────────────────────────────────────────────────────────────
//  L’arbre et ses feuilles
// ─────────────────────────────────────────────────────────────

describe("l’arbre du parchemin", () => {
  it("porte cinq entrées, dont trois groupes", () => {
    expect(MENU).toHaveLength(5);
    expect(MENU.filter(estUnGroupe)).toHaveLength(3);
  });

  /**
   * **Le bandeau porte un libellé court, la page le nom complet** — le procédé
   * de la Tour aux Corbeaux (« Les Corbeaux » / « La Tour aux Corbeaux »).
   * « Le monde des non-mages » en toutes lettres cassait l’entrée en quatre
   * lignes et poussait la déconnexion hors du parchemin.
   */
  it("« Les non‑mages » porte un trait d’union insécable", () => {
    const entree = ENTREES_MENU.find((l) => l.href === ROUTES.nonMages);
    // U+2011, et non le tiret ordinaire : sans lui, le bandeau coupe
    // « NON- / MAGES » et l’entrée tombe sur trois lignes.
    expect(entree?.libelle).toContain("\u2011");
    expect(entree?.libelle).not.toContain("-");
  });

  it("les groupes sont ceux qui ont été décidés, dans l’ordre", () => {
    expect(MENU.map((e) => (estUnGroupe(e) ? e.libelle : e.libelle))).toEqual([
      "Mon bureau",
      "Mon personnage",
      "Le domaine",
      "Les non‑mages",
      TEXTES_ANNONCES.nomBandeau,
    ]);
  });

  it("un groupe n’a pas d’adresse : on ne clique pas dessus, on l’ouvre", () => {
    for (const groupe of MENU.filter(estUnGroupe)) {
      expect(groupe, groupe.libelle).not.toHaveProperty("href");
    }
  });

  it("aucun groupe n’est vide", () => {
    for (const groupe of MENU.filter(estUnGroupe)) {
      expect(groupe.liens.length, groupe.libelle).toBeGreaterThan(0);
    }
  });

  /**
   * La liste plate se déduit de l’arbre. Deux listes tenues à la main
   * finiraient par diverger, et l’entrée oubliée dans la seconde serait une
   * route sans garde.
   */
  it("les feuilles sont exactement celles de l’arbre, dans l’ordre", () => {
    const attendues = MENU.flatMap((e) => (estUnGroupe(e) ? e.liens : [e]));
    expect(ENTREES_MENU).toEqual(attendues);
  });

  it("aucune adresse en double", () => {
    const adresses = ENTREES_MENU.map((e) => e.href);
    expect(new Set(adresses).size).toBe(adresses.length);
  });

  it("toute feuille est gardée par le middleware", () => {
    for (const feuille of ENTREES_MENU) {
      expect(PREFIXES_ECOLE, feuille.href).toContain(feuille.href);
    }
    for (const route of ROUTES_HORS_MENU) {
      expect(PREFIXES_ECOLE, route.href).toContain(route.href);
    }
  });

  it("« Le domaine » porte l’école, les maisons, les cours et les alentours", () => {
    const domaine = MENU.find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === "Le domaine",
    );
    expect(domaine?.liens.map((l) => l.href)).toEqual([
      ROUTES.ecole,
      ROUTES.maisons,
      ROUTES.cours,
      ROUTES.alentours,
    ]);
  });

  it("le Grand Hall reste extensible — le calendrier et les résultats y viendront", () => {
    const grandHall = MENU.find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === TEXTES_ANNONCES.nomBandeau,
    );
    expect(grandHall?.liens.map((l) => l.href)).toEqual([
      ROUTES.annonces,
      ROUTES.archivesReglement,
      ROUTES.archivesHistoire,
    ]);
  });

  /**
   * **« Le Grand Hall », et jamais « La Grande Salle ».** La bible (§12) et le
   * préambule du règlement distinguent les deux et demandent que « toute
   * interface, tout menu et toute annonce respectent cette séparation sans
   * exception ». Un libellé qui glisserait de l’un à l’autre ferait dire au
   * bandeau le contraire du règlement qu’il dessert.
   */
  it("aucun libellé ne dit « Grande Salle »", () => {
    for (const entree of MENU) {
      expect(entree.libelle).not.toMatch(/grande\s+salle/i);
      if (estUnGroupe(entree)) {
        for (const lien of entree.liens) {
          expect(lien.libelle).not.toMatch(/grande\s+salle/i);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────
//  La pastille qui remonte
// ─────────────────────────────────────────────────────────────

describe("le compte remonte sur le groupe", () => {
  const monPersonnage = MENU.find(
    (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === "Mon personnage",
  )!;

  /**
   * **C’est tout l’objet du lot.** Sans la remontée, un corbeau reçu se cache
   * derrière un sous-menu fermé, et on le rate.
   */
  it("« Mon personnage » porte les non-lus des Corbeaux", () => {
    expect(compteDe(monPersonnage, { [ROUTES.corbeaux]: 3 })).toBe(3);
  });

  it("la feuille garde le sien : on voit le groupe, puis où c’est", () => {
    const corbeaux = monPersonnage.liens.find((l) => l.href === ROUTES.corbeaux)!;
    expect(compteDe(corbeaux, { [ROUTES.corbeaux]: 3 })).toBe(3);
  });

  it("les feuilles sans compteur n’ajoutent rien", () => {
    // Un chiffre pour une adresse qui n'affiche pas de pastille ne doit pas
    // remonter : le bandeau reçoit un dictionnaire, pas une promesse.
    expect(
      compteDe(monPersonnage, { [ROUTES.fiche]: 7, [ROUTES.corbeaux]: 2 }),
    ).toBe(2);
  });

  it("un groupe sans rien à annoncer compte zéro", () => {
    const domaine = MENU.find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === "Le domaine",
    )!;
    expect(compteDe(domaine, { [ROUTES.corbeaux]: 5 })).toBe(0);
  });

  it("une entrée directe compte pour elle-même, et zéro sans chiffre", () => {
    const bureau = MENU.find(
      (e): e is Exclude<EntreeMenu, GroupeMenu> => !estUnGroupe(e),
    )!;
    expect(compteDe(bureau, {})).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
//  Ce que chaque compte voit
// ─────────────────────────────────────────────────────────────

const BASE: EtatAcces = {
  statut: "ACCEPTE",
  statutAcces: "VALIDE",
  banniJusquau: null,
  maison: "KALDRAFN",
  baguetteChoisieLe: new Date(),
  etatMaison: "FAIT",
  etatBaguette: "FAIT",
};

const REPARTI = BASE;
const NOUVEL_ARRIVANT: EtatAcces = {
  ...BASE,
  maison: null,
  baguetteChoisieLe: null,
  etatMaison: "NON_FAIT",
  etatBaguette: "NON_FAIT",
};
/** Une directrice : ni Miroir ni boutique, mais tout le reste ouvert. */
const DIRECTRICE: EtatAcces = {
  ...BASE,
  etatMaison: "SANS_OBJET",
  etatBaguette: "SANS_OBJET",
};
const SUSPENDUE: EtatAcces = { ...BASE, statutAcces: "EN_BANNISSEMENT" };

/** Les libellés de l’arbre visible, groupes compris. */
function libelles(arbre: readonly EntreeMenu[]): string[] {
  return arbre.map((e) => e.libelle);
}

describe("l’élève réparti voit tout", () => {
  it("les cinq entrées", () => {
    expect(libelles(menuVisible(REPARTI))).toEqual([
      "Mon bureau",
      "Mon personnage",
      "Le domaine",
      "Les non‑mages",
      TEXTES_ANNONCES.nomBandeau,
    ]);
  });

  it("et « Ma maison » avec les autres", () => {
    expect(liensVisibles(REPARTI).map((l) => l.href)).toContain(ROUTES.maison);
  });
});

describe("« Ma maison » n’apparaît qu’à qui en a une", () => {
  /**
   * Deux comptes sans maison, pour deux raisons opposées — et le même
   * résultat : l’entrée n’a aucun sens, elle disparaît. Elle ne se grise pas.
   */
  it("le nouvel arrivant ne l’a pas : le Miroir ne l’a pas encore lu", () => {
    expect(liensVisibles(NOUVEL_ARRIVANT).map((l) => l.href)).not.toContain(
      ROUTES.maison,
    );
  });

  it("la directrice ne l’a pas non plus : la répartition ne la concerne pas", () => {
    expect(liensVisibles(DIRECTRICE).map((l) => l.href)).not.toContain(
      ROUTES.maison,
    );
  });

  it("la directrice garde tout le reste, elle n’est pas enfermée", () => {
    expect(libelles(menuVisible(DIRECTRICE))).toEqual([
      "Mon bureau",
      "Mon personnage",
      "Le domaine",
      "Les non‑mages",
      TEXTES_ANNONCES.nomBandeau,
    ]);
    const personnage = menuVisible(DIRECTRICE).find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === "Mon personnage",
    );
    expect(personnage?.liens.map((l) => l.href)).toEqual([
      ROUTES.fiche,
      ROUTES.registre,
      ROUTES.corbeaux,
    ]);
  });

  /**
   * ⚠️ **Le piège d'adressage du 28 août 2026**, et il ne se voit pas en
   * lisant : « /maisons » commence par « /maison ».
   *
   * S'il en héritait, la page des quatre maisons se refermerait sur une
   * directrice — exactement ce qu'elle est là pour ouvrir. Elle n'en hérite
   * pas parce que la garde compare `chemin === href` ou `href + "/"`, jamais
   * un simple préfixe. Ce test fige ce détail, qu'un jour de refactorisation
   * pourrait défaire sans que rien d'autre ne tombe.
   */
  it("« Les maisons » ne se referme pas sur qui n’a pas de maison", () => {
    expect(routeAutorisee(DIRECTRICE, ROUTES.maison)).toBe(false);
    expect(routeAutorisee(DIRECTRICE, ROUTES.maisons)).toBe(true);
    expect(routeAutorisee(DIRECTRICE, `${ROUTES.maisons}/kaldrafn`)).toBe(true);
  });

  it("l’adresse elle-même se referme, pas seulement l’entrée", () => {
    // Une adresse de page se contourne en la tapant : la fermer au bandeau
    // sans la fermer à la garde ne fermerait rien du tout.
    expect(menuVisible(DIRECTRICE)).toBeDefined();
    expect(liensVisibles(DIRECTRICE).some((l) => l.href === ROUTES.maison)).toBe(
      false,
    );
  });
});

describe("le nouvel arrivant n’a que ses quatre portes", () => {
  /**
   * Quatre, et la quatrième est le Grand Hall — l’adresse des annonces, pas
   * le groupe entier. Le journal du bureau y renvoie, et le bureau est
   * précisément ce qu’un nouvel arrivant garde : la fermer lui donnerait des
   * liens morts sur sa propre page d’accueil.
   */
  it("le bureau, sa fiche, les corbeaux et les annonces", () => {
    expect(liensVisibles(NOUVEL_ARRIVANT).map((l) => l.href)).toEqual([
      ROUTES.bureau,
      ROUTES.fiche,
      ROUTES.corbeaux,
      ROUTES.annonces,
    ]);
  });

  /** Un groupe dont toutes les feuilles sont fermées **disparaît**. */
  it("« Le domaine » ne s’affiche pas du tout", () => {
    expect(libelles(menuVisible(NOUVEL_ARRIVANT))).toEqual([
      "Mon bureau",
      "Mon personnage",
      TEXTES_ANNONCES.nomBandeau,
    ]);
  });

  /** Le groupe paraît, mais réduit à sa seule feuille ouverte. */
  it("« Le Grand Hall » ne montre que les annonces", () => {
    const grandHall = menuVisible(NOUVEL_ARRIVANT).find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === TEXTES_ANNONCES.nomBandeau,
    );
    expect(grandHall?.liens.map((l) => l.href)).toEqual([ROUTES.annonces]);
  });

  it("« Mon personnage » ne montre que ce qui s’ouvre", () => {
    const personnage = menuVisible(NOUVEL_ARRIVANT).find(
      (e): e is GroupeMenu => estUnGroupe(e) && e.libelle === "Mon personnage",
    );
    expect(personnage?.liens.map((l) => l.href)).toEqual([
      ROUTES.fiche,
      ROUTES.corbeaux,
    ]);
  });
});

describe("le membre suspendu garde son bureau, sa fiche, les corbeaux et les annonces", () => {
  /**
   * **Deux exceptions à « le bureau et la fiche, rien d’autre », et toutes
   * deux sont écrites dans le règlement.**
   *
   * La Tour aux Corbeaux, parce que l’article 8.5 donne quinze jours pour
   * contester une sanction par message privé — la fermer supprimerait ce
   * recours pour la seule personne à qui il sert.
   *
   * Le Grand Hall, parce que le préambule y fait entrer en vigueur toute
   * modification du règlement et ajoute qu’« il appartient à chaque membre
   * d’en prendre connaissance ». Un membre suspendu reste tenu par un
   * règlement qui change ; c’est même lui qui a le plus besoin de le lire.
   */
  it("et rien d’autre — y compris les entrées créées par ce lot", () => {
    expect(liensVisibles(SUSPENDUE).map((l) => l.href)).toEqual([
      ROUTES.bureau,
      ROUTES.fiche,
      ROUTES.corbeaux,
      ROUTES.annonces,
    ]);
  });

  it("le reste du Grand Hall lui est fermé : le règlement reste public sans compte", () => {
    expect(liensVisibles(SUSPENDUE).map((l) => l.href)).not.toContain(
      ROUTES.archivesReglement,
    );
    expect(liensVisibles(SUSPENDUE).map((l) => l.href)).not.toContain(
      ROUTES.archivesHistoire,
    );
  });

  it("son arbre se réduit à trois entrées", () => {
    expect(libelles(menuVisible(SUSPENDUE))).toEqual([
      "Mon bureau",
      "Mon personnage",
      TEXTES_ANNONCES.nomBandeau,
    ]);
  });
});

describe("un groupe vide ne s’affiche jamais", () => {
  /**
   * Un chapeau qui n’ouvre sur rien est pire qu’une absence : on clique, il se
   * déplie, et il n’y a rien dedans.
   */
  it.each([
    ["le nouvel arrivant", NOUVEL_ARRIVANT],
    ["la directrice", DIRECTRICE],
    ["le membre suspendu", SUSPENDUE],
    ["l’élève réparti", REPARTI],
  ])("aucun groupe vide pour %s", (_qui, compte) => {
    for (const entree of menuVisible(compte)) {
      if (estUnGroupe(entree)) {
        expect(entree.liens.length, entree.libelle).toBeGreaterThan(0);
      }
    }
  });
});
