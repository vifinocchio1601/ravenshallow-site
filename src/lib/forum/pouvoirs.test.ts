import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAISONS } from "@/lib/dossier/etats";
import type { EtatAcces } from "@/lib/session/acces";
import {
  AUCUN_POUVOIR,
  PERMISSIONS,
  PERMISSIONS_DE_MAISON,
  detientQuelqueChose,
  estStaff,
  peutCloreUneScene,
  peutEcrireLesAnnoncesDe,
  peutEpinglerUnSujet,
  peutLireLesEspacesDe,
  peutParlerDansLeSalonDe,
  peutVerrouillerUneSection,
  peutVisiterLaMaison,
  porteSurUneMaison,
  type Permission,
  type Pouvoirs,
} from "./pouvoirs";

/** Un membre ordinaire, qu’on habille au cas par cas. */
function membre(partiel: Partial<Pouvoirs> = {}): Pouvoirs {
  return { ...AUCUN_POUVOIR, ...partiel };
}

// ─────────────────────────────────────────────────────────────
//  La liste elle-même
// ─────────────────────────────────────────────────────────────

describe("les cinq permissions, et pas une de plus", () => {
  /**
   * Ce test n’interdit pas d’en ajouter une : il interdit de le faire sans
   * s’en apercevoir. Le jour où une sixième arrive, c’est ici qu’on relit la
   * règle du joueur avant de la laisser passer.
   */
  it("la liste est exactement celle qui a été décidée", () => {
    expect([...PERMISSIONS]).toEqual([
      "ANNONCES_MAISON",
      "LIRE_ESPACES_MAISON",
      "CLORE_SCENE",
      "EPINGLER_SUJET",
      "VERROUILLER_SECTION",
    ]);
  });

  /**
   * **Aucune permission n’expose la Tour aux Corbeaux.**
   *
   * Personne ne lit les conversations privées, quel que soit son rôle. Une
   * permission qui s’en approcherait, même désactivée, même « pour plus tard »,
   * tombe ici.
   */
  it("aucune ne nomme la messagerie, de près ou de loin", () => {
    const interdits = /CORBEAU|MESSAGE|CONVERSATION|PRIVE|PRIVEE|TOUR|BOITE/;
    for (const permission of PERMISSIONS) {
      expect(permission, permission).not.toMatch(interdits);
    }
  });

  it("deux permissions portent sur une maison, trois sur tout le forum", () => {
    expect([...PERMISSIONS_DE_MAISON]).toEqual([
      "ANNONCES_MAISON",
      "LIRE_ESPACES_MAISON",
    ]);
    const globales = PERMISSIONS.filter((p) => !porteSurUneMaison(p));
    expect(globales).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────
//  Ce que chaque permission ouvre — et surtout ce qu’elle n’ouvre pas
// ─────────────────────────────────────────────────────────────

describe("un membre sans rien n’a rien", () => {
  it.each([
    ["clore une scène", peutCloreUneScene],
    ["épingler un sujet", peutEpinglerUnSujet],
    ["verrouiller une section", peutVerrouillerUneSection],
  ])("ne peut pas %s", (_nom, question) => {
    expect(question(AUCUN_POUVOIR)).toBe(false);
  });

  it("ne peut écrire les annonces d’aucune maison", () => {
    expect(peutEcrireLesAnnoncesDe(AUCUN_POUVOIR, "KALDRAFN")).toBe(false);
    expect(peutEcrireLesAnnoncesDe(AUCUN_POUVOIR, "NATTORM")).toBe(false);
  });

  it("ne détient rien du tout", () => {
    expect(detientQuelqueChose(AUCUN_POUVOIR)).toBe(false);
  });
});

describe("une permission d’annonce sur Kaldrafn ne donne rien sur Nattorm", () => {
  const surKaldrafn = membre({
    permissions: [{ permission: "ANNONCES_MAISON", maison: "KALDRAFN" }],
  });

  it("ouvre Kaldrafn", () => {
    expect(peutEcrireLesAnnoncesDe(surKaldrafn, "KALDRAFN")).toBe(true);
  });

  it("n’ouvre aucune des trois autres", () => {
    for (const maison of ["NATTORM", "BRYGGELD", "TIDEAL"] as const) {
      expect(peutEcrireLesAnnoncesDe(surKaldrafn, maison), maison).toBe(false);
    }
  });

  it("n’ouvre pas la lecture des espaces réservés, même sur Kaldrafn", () => {
    // Deux permissions distinctes : écrire les annonces n’est pas lire le
    // dortoir. Les confondre donnerait bien plus que ce qui a été accordé.
    expect(peutLireLesEspacesDe(surKaldrafn, "KALDRAFN")).toBe(false);
  });

  it("n’ouvre rien sur tout le forum", () => {
    expect(peutCloreUneScene(surKaldrafn)).toBe(false);
    expect(peutEpinglerUnSujet(surKaldrafn)).toBe(false);
    expect(peutVerrouillerUneSection(surKaldrafn)).toBe(false);
  });
});

describe("les quatre maisons, c’est quatre lignes", () => {
  const partout = membre({
    permissions: (["KALDRAFN", "NATTORM", "BRYGGELD", "TIDEAL"] as const).map(
      (maison) => ({ permission: "ANNONCES_MAISON" as const, maison }),
    ),
  });

  it("ouvre les quatre", () => {
    for (const maison of ["KALDRAFN", "NATTORM", "BRYGGELD", "TIDEAL"] as const) {
      expect(peutEcrireLesAnnoncesDe(partout, maison), maison).toBe(true);
    }
  });
});

describe("les préfets", () => {
  const prefetDeNattorm = membre({ prefetDe: ["NATTORM"] });

  it("écrit les annonces de sa maison sans qu’aucune permission lui soit accordée", () => {
    expect(prefetDeNattorm.permissions).toHaveLength(0);
    expect(peutEcrireLesAnnoncesDe(prefetDeNattorm, "NATTORM")).toBe(true);
  });

  it("et rien sur les trois autres", () => {
    for (const maison of ["KALDRAFN", "BRYGGELD", "TIDEAL"] as const) {
      expect(peutEcrireLesAnnoncesDe(prefetDeNattorm, maison), maison).toBe(false);
    }
  });

  it("ne lit pas pour autant les espaces réservés de sa maison", () => {
    expect(peutLireLesEspacesDe(prefetDeNattorm, "NATTORM")).toBe(false);
  });

  /**
   * Le droit **dérive** de la nomination : le démettre suffit à le reprendre
   * (art. 13.5). Si nommer un préfet créait une ligne de permission, celle-ci
   * lui survivrait — et personne ne verrait pourquoi il écrit encore.
   */
  it("perd tout dès qu’il est démis, sans qu’on ait à retirer quoi que ce soit", () => {
    const demis = membre({ prefetDe: [] });
    expect(peutEcrireLesAnnoncesDe(demis, "NATTORM")).toBe(false);
  });

  it("plusieurs maisons pour un même membre, si on l’a voulu", () => {
    const deDeux = membre({ prefetDe: ["NATTORM", "TIDEAL"] });
    expect(peutEcrireLesAnnoncesDe(deDeux, "NATTORM")).toBe(true);
    expect(peutEcrireLesAnnoncesDe(deDeux, "TIDEAL")).toBe(true);
    expect(peutEcrireLesAnnoncesDe(deDeux, "BRYGGELD")).toBe(false);
  });
});

describe("le staff intervient partout", () => {
  it.each(["MODERATEUR", "ADMIN"] as const)("%s passe sans permission", (role) => {
    const staff = membre({ role });
    expect(estStaff(staff)).toBe(true);
    expect(peutCloreUneScene(staff)).toBe(true);
    expect(peutEpinglerUnSujet(staff)).toBe(true);
    expect(peutVerrouillerUneSection(staff)).toBe(true);
    for (const maison of ["KALDRAFN", "NATTORM", "BRYGGELD", "TIDEAL"] as const) {
      expect(peutEcrireLesAnnoncesDe(staff, maison), maison).toBe(true);
      expect(peutLireLesEspacesDe(staff, maison), maison).toBe(true);
    }
  });

  it("un joueur n’est pas du staff", () => {
    expect(estStaff(membre({ role: "JOUEUR" }))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
//  Les garde-fous de structure — ils relisent le code source
// ─────────────────────────────────────────────────────────────

function fichiersDe(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiersDe(chemin);
    return chemin.endsWith(".ts") || chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

describe("aucune permission n’expose la Tour aux Corbeaux", () => {
  const FICHIERS_CORBEAUX = fichiersDe("src/lib/corbeaux");

  it("trouve bien la Tour", () => {
    // Sans quoi un renommage de dossier rendrait le test suivant vert en ne
    // lisant plus rien du tout.
    expect(FICHIERS_CORBEAUX.length).toBeGreaterThan(5);
  });

  /**
   * **La messagerie ne sait pas ce qu’est une permission, et c’est le
   * dispositif.** Ce n’est pas une requête qu’on s’interdirait d’écrire : il
   * n’existe aucun chemin des pouvoirs vers une conversation privée.
   */
  it.each([
    "forum/pouvoirs",
    "depot-pouvoirs",
    "permissionAccordee",
    "prefet",
    "Prefet",
  ])("aucun fichier de la Tour ne connaît %s", (symbole) => {
    const coupables = FICHIERS_CORBEAUX.filter((f) =>
      readFileSync(f, "utf8").includes(symbole),
    );
    expect(coupables).toEqual([]);
  });
});

describe("aucune permission ne permet d’en attribuer", () => {
  /**
   * Seule la zone d’administration accorde et retire. Sans ce test, il
   * suffirait d’un jour de commodité pour qu’un professeur se promeuve
   * lui-même, ou promeuve un ami.
   */
  const HORS_ADMIN = fichiersDe("src/app").filter(
    (f) => !f.startsWith(join("src", "app", "admin")),
  );

  it("trouve bien des fichiers hors administration", () => {
    expect(HORS_ADMIN.length).toBeGreaterThan(20);
  });

  it.each([
    "accorderPermission",
    "retirerPermission",
    "accorderSurToutesLesMaisons",
    "nommerPrefet",
    "demettrePrefet",
    "modifierRole",
  ])("rien hors de /admin n’appelle %s", (fonction) => {
    const coupables = HORS_ADMIN.filter((f) =>
      readFileSync(f, "utf8").includes(fonction),
    );
    expect(coupables).toEqual([]);
  });
});

describe("un pouvoir n’est pas un libellé, et un libellé n’ouvre rien", () => {
  it("le fichier qui décide des pouvoirs ne connaît pas le rôle affiché", () => {
    const source = readFileSync("src/lib/forum/pouvoirs.ts", "utf8");
    // Le commentaire du fichier le mentionne pour l'écarter ; le code, jamais.
    const code = source
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toContain("roleAffiche");
  });

  it("le type qui décide de l’accès à l’école ne porte pas les pouvoirs", () => {
    // @ts-expect-error — `EtatAcces` ne connaît pas `permissions`, et ne doit
    // jamais les connaître : une permission de forum n’ouvre pas une route de
    // l’école. Le jour où quelqu’un l’y ajoute, cette ligne cesse d’être une
    // erreur, et la compilation s’arrête sur cette directive.
    const jamais: EtatAcces["permissions"] = undefined;
    expect(jamais).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
//  Entrer dans une maison, et y parler
// ─────────────────────────────────────────────────────────────

/**
 * **Ces deux questions comblent un trou trouvé par le joueur**, le 28 août
 * 2026 : `peutEcrireLesAnnoncesDe` accordait au staff le tableau des quatre
 * maisons, mais la seule adresse qui y menait exigeait d'en avoir une. Sa
 * directrice avait donc un pouvoir sans chemin.
 */
describe("entrer dans une maison", () => {
  it("chez soi, toujours — même sans le moindre pouvoir", () => {
    expect(peutVisiterLaMaison(AUCUN_POUVOIR, "KALDRAFN", "KALDRAFN")).toBe(true);
  });

  it("ailleurs, non", () => {
    expect(peutVisiterLaMaison(AUCUN_POUVOIR, "KALDRAFN", "NATTORM")).toBe(false);
  });

  /** Le cas de la directrice : aucune maison à elle, et les quatre ouvertes. */
  it("le staff entre partout, sans maison à lui", () => {
    const staff = membre({ role: "ADMIN" });
    for (const maison of MAISONS) {
      expect(peutVisiterLaMaison(staff, null, maison), maison).toBe(true);
    }
  });

  it("sans maison et sans pouvoir, aucune porte ne s’ouvre", () => {
    for (const maison of MAISONS) {
      expect(peutVisiterLaMaison(AUCUN_POUVOIR, null, maison), maison).toBe(false);
    }
  });

  it("la lecture d’un dortoir ouvre CETTE maison, et pas une autre", () => {
    const lecteur = membre({
      permissions: [{ permission: "LIRE_ESPACES_MAISON", maison: "NATTORM" }],
    });
    expect(peutVisiterLaMaison(lecteur, "KALDRAFN", "NATTORM")).toBe(true);
    expect(peutVisiterLaMaison(lecteur, "KALDRAFN", "BRYGGELD")).toBe(false);
  });
});

describe("parler au salon d’une maison", () => {
  it("chez soi, toujours", () => {
    expect(peutParlerDansLeSalonDe(AUCUN_POUVOIR, "TIDEAL", "TIDEAL")).toBe(true);
  });

  it("le staff s’adresse à n’importe quelle maison", () => {
    const staff = membre({ role: "MODERATEUR" });
    for (const maison of MAISONS) {
      expect(peutParlerDansLeSalonDe(staff, null, maison), maison).toBe(true);
    }
  });

  /**
   * ⚠️ **Lire n'est pas écrire, et le nom de la permission le dit.** Un
   * professeur à qui l'on donne la lecture d'un dortoir ne doit pas se
   * retrouver à y bavarder sans que personne l'ait voulu.
   */
  it("la lecture d’un dortoir ne donne pas la parole", () => {
    const lecteur = membre({
      permissions: [{ permission: "LIRE_ESPACES_MAISON", maison: "NATTORM" }],
    });
    expect(peutVisiterLaMaison(lecteur, "KALDRAFN", "NATTORM")).toBe(true);
    expect(peutParlerDansLeSalonDe(lecteur, "KALDRAFN", "NATTORM")).toBe(false);
  });

  /** Écrire les annonces d’une maison n’est pas non plus y parler. */
  it("la permission d’annonce ne donne pas la parole au salon", () => {
    const annonceur = membre({
      permissions: [{ permission: "ANNONCES_MAISON", maison: "NATTORM" }],
    });
    expect(peutParlerDansLeSalonDe(annonceur, "KALDRAFN", "NATTORM")).toBe(false);
  });

  it("un préfet ne parle pas dans la maison qu’il ne partage pas", () => {
    const prefet = membre({ prefetDe: ["NATTORM"] });
    expect(peutParlerDansLeSalonDe(prefet, "KALDRAFN", "NATTORM")).toBe(false);
  });
});
