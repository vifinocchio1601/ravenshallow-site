import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";
import {
  aFiniLesPremiersPas,
  doitPasserAKaldvik,
  doitPasserAuMiroir,
  routeAutorisee,
} from "@/lib/session/acces";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * Les comptes que les premiers pas ne concernent pas.
 *
 * Tout ce lot tient dans une distinction que le site ne savait pas faire :
 * une case vide voulait dire « pas encore » pour un élève et « sans objet »
 * pour une directrice, et il fallait faire l’inverse dans les deux cas.
 *
 * Ces tests décrivent donc systématiquement **trois** comptes là où il n’y en
 * avait que deux — et le troisième est celui qu’on aurait oublié.
 */

function compte(modifications: Partial<CompteConnecte> = {}): CompteConnecte {
  return {
    id: "compte-1",
    eleveId: "eleve-1",
    email: "brume@ravenshallow.invalid",
    sessionVersion: 0,
    jetonVersion: 0,
    noteAdmin: null,
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    banniJusquau: null,
    maison: null,
    etatMaison: "NON_FAIT",
    etatBaguette: "NON_FAIT",
    baguetteBois: null,
    baguetteCoeur: null,
    baguetteChoisieLe: null,
    prenomNom: "Sigrid Vale",
    genre: "FEMININ",
    fonction: "PREMIERE_ANNEE",
    roleAffiche: null,
    age: 13,
    ...modifications,
  };
}

/** Une joueuse de Tideål nommée directrice : elle garde tout, au chaud. */
const DIRECTRICE = compte({
  roleAffiche: "Directrice de Ravenshallow",
  maison: "TIDEAL",
  etatMaison: "SANS_OBJET",
  baguetteBois: "IF",
  baguetteCoeur: "CRISTAL_DE_GLACE",
  baguetteChoisieLe: new Date("2026-06-01T10:00:00.000Z"),
  etatBaguette: "SANS_OBJET",
});

/** Le nouvel élève accepté, qui doit continuer à passer partout. */
const NOUVEL_ELEVE = compte();

// ─────────────────────────────────────────────────────────────
//  La note de bienvenue
// ─────────────────────────────────────────────────────────────

describe("la note des premiers pas", () => {
  it("disparaît entièrement pour un compte que rien ne concerne", async () => {
    const { premiersPas } = await import("@/lib/bureau/donnees");
    // `null`, et non une liste vide : c’est ce qui retire la note du bureau.
    expect(await premiersPas(DIRECTRICE)).toBeNull();
  });

  it("reste entière pour un nouvel élève", async () => {
    const { premiersPas } = await import("@/lib/bureau/donnees");
    const pas = await premiersPas(NOUVEL_ELEVE);

    expect(pas).toHaveLength(2);
    expect(pas![0].href).toBe(ROUTES.bjornstav);
    expect(pas![1].verrou).toBeTruthy();
  });

  it("n’affiche pas une étape sans objet comme une case cochée", async () => {
    const { premiersPas } = await import("@/lib/bureau/donnees");

    // Une case cochée dit « c’est fait ». Pour ce compte, il n’y a jamais rien
    // eu à faire : la ligne n’existe pas, elle n’est pas cochée.
    const sansBaguette = await premiersPas(
      compte({ etatBaguette: "SANS_OBJET" }),
    );
    expect(sansBaguette).toHaveLength(1);
    expect(sansBaguette![0].id).toBe("ceremonie");

    // Et le Miroir n’est pas verrouillé « en attendant la boutique » : elle
    // ne viendra jamais.
    expect(sansBaguette![0].verrou).toBeNull();
    expect(sansBaguette![0].href).toBe(ROUTES.ceremonie);
  });

  it("garde la boutique seule quand la répartition ne concerne pas le compte", async () => {
    const { premiersPas } = await import("@/lib/bureau/donnees");
    const pas = await premiersPas(compte({ etatMaison: "SANS_OBJET" }));

    expect(pas).toHaveLength(1);
    expect(pas![0].id).toBe("baguette");
    expect(pas![0].href).toBe(ROUTES.bjornstav);
  });
});

// ─────────────────────────────────────────────────────────────
//  La circulation
// ─────────────────────────────────────────────────────────────

describe("où l’on peut aller", () => {
  it("n’envoie plus un compte sans objet ni au Miroir ni à Kaldvik", () => {
    expect(doitPasserAuMiroir(DIRECTRICE)).toBe(false);
    expect(doitPasserAKaldvik(DIRECTRICE)).toBe(false);
  });

  /**
   * **Le piège du lot.** « Fini » veut dire « plus rien à faire », et non
   * « fait ». Sans cette lecture, la directrice se retrouve au régime exact
   * d’un membre suspendu : son bureau, sa fiche, et rien d’autre.
   */
  it("ouvre le château en entier à un compte qui n’a rien à faire", () => {
    expect(aFiniLesPremiersPas(DIRECTRICE)).toBe(true);
    for (const chemin of [ROUTES.cours, ROUTES.ecole, ROUTES.bureau, ROUTES.fiche]) {
      expect(routeAutorisee(DIRECTRICE, chemin), chemin).toBe(true);
    }
  });

  it("laisse le nouvel élève passer partout où il doit passer", () => {
    // Rien de ce lot ne doit gêner le chemin ordinaire.
    expect(doitPasserAuMiroir(NOUVEL_ELEVE)).toBe(true);
    expect(doitPasserAKaldvik(NOUVEL_ELEVE)).toBe(true);
    expect(routeAutorisee(NOUVEL_ELEVE, ROUTES.bjornstav)).toBe(true);
    expect(routeAutorisee(NOUVEL_ELEVE, ROUTES.ceremonie)).toBe(true);
    // Et le reste du château lui reste fermé, comme avant.
    expect(routeAutorisee(NOUVEL_ELEVE, ROUTES.cours)).toBe(false);
  });

  it("ne change rien au membre suspendu, quel que soit son état d’étape", () => {
    const suspendue = compte({
      ...DIRECTRICE,
      statutAcces: "EN_BANNISSEMENT",
    });
    expect(routeAutorisee(suspendue, ROUTES.bureau)).toBe(true);
    expect(routeAutorisee(suspendue, ROUTES.fiche)).toBe(true);
    expect(routeAutorisee(suspendue, ROUTES.cours)).toBe(false);
    expect(routeAutorisee(suspendue, ROUTES.ecole)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
//  Retirer, puis rendre
// ─────────────────────────────────────────────────────────────

describe("retirer une étape, puis la rendre", () => {
  beforeEach(() => {
    // Sans `DATABASE_URL`, le dépôt travaille en mémoire : ces tests
    // n’approchent jamais la vraie base.
    vi.stubEnv("DATABASE_URL", "");
  });

  /** Le magasin de démonstration, pour poser un état de départ crédible. */
  async function membreRepartie() {
    const depot = await import("@/lib/dossier/depot");
    const [membre] = await depot.listerMembres();
    const magasin = (globalThis as never as Record<symbol, unknown[]>)[
      Symbol.for("ravenshallow.depot.demonstration")
    ] as Record<string, unknown>[];
    Object.assign(
      magasin.find((d) => d.id === membre.id)!,
      {
        maison: "BRYGGELD",
        etatMaison: "FAIT",
        baguetteBois: "SORBIER",
        baguetteCoeur: "CRISTAL_DE_GLACE",
        etatBaguette: "FAIT",
      },
    );
    return { depot, id: membre.id };
  }

  it("conserve la valeur, et la rend exactement telle quelle", async () => {
    const { depot, id } = await membreRepartie();

    await depot.modifierEtatEtape(id, "maison", "RETIRER");
    const retiree = (await depot.lireDossier(id))!;

    expect(retiree.etatMaison).toBe("SANS_OBJET");
    // **Rien n’est effacé.** C’est toute la promesse du lot.
    expect(retiree.maison).toBe("BRYGGELD");

    await depot.modifierEtatEtape(id, "maison", "RETABLIR");
    const rendue = (await depot.lireDossier(id))!;

    expect(rendue.etatMaison).toBe("FAIT");
    expect(rendue.maison).toBe("BRYGGELD");
    // Et la maison remarque de nouveau pour Bryggeld.
    const { maisonQuiCompte } = await import("./tournoi");
    expect(maisonQuiCompte(rendue)).toBe("BRYGGELD");
  });

  it("renvoie au Miroir un compte qui n’a jamais été réparti", async () => {
    const { depot, id } = await membreRepartie();
    const magasin = (globalThis as never as Record<symbol, unknown[]>)[
      Symbol.for("ravenshallow.depot.demonstration")
    ] as Record<string, unknown>[];
    Object.assign(magasin.find((d) => d.id === id)!, {
      maison: null,
      etatMaison: "SANS_OBJET",
    });

    // Rétablir ne rend pas un état choisi : il rend celui que la valeur
    // commande. Sans maison écrite, c’est le Miroir qui reprend la main.
    await depot.modifierEtatEtape(id, "maison", "RETABLIR");
    expect((await depot.lireDossier(id))!.etatMaison).toBe("NON_FAIT");
  });

  it("laisse les deux commandes et le rôle parfaitement indépendants", async () => {
    const { depot, id } = await membreRepartie();
    await depot.modifierMembre(id, { roleAffiche: "Directrice" }, null);

    await depot.modifierEtatEtape(id, "maison", "RETIRER");
    const apres = (await depot.lireDossier(id))!;

    // La maison est retirée ; la baguette et le rôle n’ont pas bougé.
    expect(apres.etatMaison).toBe("SANS_OBJET");
    expect(apres.etatBaguette).toBe("FAIT");
    expect(apres.roleAffiche).toBe("Directrice");
    expect(apres.baguetteBois).toBe("SORBIER");
  });

  it("écrit qui a fait quoi, et quand", async () => {
    const { depot, id } = await membreRepartie();
    await depot.modifierEtatEtape(id, "baguette", "RETIRER");

    const trace = (await depot.lireDossier(id))!.journal[0];
    expect(trace.type).toBe("ETAT_BAGUETTE_MODIFIE");
    expect(trace.valeurAvant).toBe("FAIT");
    expect(trace.valeurApres).toBe("SANS_OBJET");
    expect(trace.parNom).toBe("Administration");
    expect(new Date(trace.creeLe).getTime()).toBeGreaterThan(0);
  });

  it("n’allonge pas le journal quand rien ne change", async () => {
    const { depot, id } = await membreRepartie();
    await depot.modifierEtatEtape(id, "maison", "RETIRER");
    const avant = (await depot.lireDossier(id))!.journal.length;

    await depot.modifierEtatEtape(id, "maison", "RETIRER");
    expect((await depot.lireDossier(id))!.journal.length).toBe(avant);
  });
});
