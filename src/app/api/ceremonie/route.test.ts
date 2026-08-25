import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Ce que la route du Miroir accepte, et surtout ce qu’elle refuse.
 *
 * Les gardes sont refaites ici en entier, sans se reposer sur la page : une
 * route d’API est publique, et rien n’oblige un joueur à passer par
 * `/ceremonie` avant de l’appeler. Ces tests l’appellent d’ailleurs
 * directement, sans page.
 *
 * La session et l’écriture en base sont les deux seules choses simulées. Le
 * calcul de la maison, lui, est le vrai : c’est le cœur de ce qu’on vérifie.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  enregistrerRepartition: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/ceremonie/depot", () => ({
  enregistrerRepartition: simule.enregistrerRepartition,
}));

const { POST } = await import("./route");

/** Un compte accepté, non suspendu, que le Miroir n’a pas encore lu. */
function compte(modifications: Record<string, unknown> = {}) {
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
    baguetteChoisieLe: null,
    prenomNom: "Sigrid Vale",
    genre: "FEMININ",
    fonction: "PREMIERE_ANNEE",
    age: 13,
    ...modifications,
  };
}

async function envoyer(corps: unknown) {
  const reponse = await POST(
    new Request("http://localhost/api/ceremonie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof corps === "string" ? corps : JSON.stringify(corps),
    }),
  );
  return { statut: reponse.status, corps: await reponse.json() };
}

/** Cinq réponses valides, qui mènent à Bryggeld sans aucune égalité. */
const VERS_BRYGGELD = ["q1a", "q2a", "q3a", "q4a", "q5b"];

beforeEach(() => {
  simule.compteConnecte.mockReset();
  simule.enregistrerRepartition.mockReset();
  simule.compteConnecte.mockResolvedValue(compte());
  simule.enregistrerRepartition.mockResolvedValue({ enregistree: true });
});

describe("qui a le droit de consulter le Miroir", () => {
  it("refuse un visiteur sans session", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    const { statut } = await envoyer({ reponses: VERS_BRYGGELD });
    expect(statut).toBe(401);
    expect(simule.enregistrerRepartition).not.toHaveBeenCalled();
  });

  it("refuse un dossier qui n’est pas accepté", async () => {
    simule.compteConnecte.mockResolvedValue(
      compte({ statut: "EN_ATTENTE", statutAcces: "EN_ATTENTE" }),
    );
    const { statut } = await envoyer({ reponses: VERS_BRYGGELD });
    expect(statut).toBe(403);
    expect(simule.enregistrerRepartition).not.toHaveBeenCalled();
  });

  it("refuse un membre suspendu", async () => {
    simule.compteConnecte.mockResolvedValue(
      compte({ statutAcces: "EN_BANNISSEMENT" }),
    );
    const { statut } = await envoyer({ reponses: VERS_BRYGGELD });
    expect(statut).toBe(403);
    expect(simule.enregistrerRepartition).not.toHaveBeenCalled();
  });

  it("refuse un compte sans fiche", async () => {
    simule.compteConnecte.mockResolvedValue(compte({ eleveId: null }));
    const { statut } = await envoyer({ reponses: VERS_BRYGGELD });
    expect(statut).toBe(403);
  });
});

describe("la cérémonie ne se rejoue pas", () => {
  it("renvoie un élève déjà réparti à son bureau, sans rien recalculer", async () => {
    simule.compteConnecte.mockResolvedValue(compte({ maison: "KALDRAFN" }));

    const { statut, corps } = await envoyer({ reponses: VERS_BRYGGELD });

    expect(statut).toBe(409);
    expect(corps.destination).toBe(ROUTES.bureau);
    expect(corps.maison).toBeUndefined();
    expect(simule.enregistrerRepartition).not.toHaveBeenCalled();
  });

  /**
   * Le verrou qui compte : la base refuse d’écrire sur une ligne qui porte
   * déjà une maison. Deux requêtes lancées ensemble ne peuvent donc pas se
   * succéder — et la seconde ne doit surtout pas afficher la maison qu’elle
   * venait de calculer, puisque ce n’est pas celle qui a été retenue.
   */
  it("n’annonce aucune maison quand la base refuse l’écriture", async () => {
    simule.enregistrerRepartition.mockResolvedValue({ enregistree: false });

    const { statut, corps } = await envoyer({ reponses: VERS_BRYGGELD });

    expect(statut).toBe(409);
    expect(corps.destination).toBe(ROUTES.bureau);
    expect(corps.maison).toBeUndefined();
  });
});

describe("ce que la route refuse de compter", () => {
  it("refuse un corps illisible", async () => {
    const { statut } = await envoyer("ceci n’est pas du JSON");
    expect(statut).toBe(400);
  });

  it.each([
    ["aucune réponse", []],
    ["quatre réponses", VERS_BRYGGELD.slice(0, 4)],
    ["six réponses", [...VERS_BRYGGELD, "q5a"]],
  ])("refuse %s", async (_cas, reponses) => {
    const { statut, corps } = await envoyer({ reponses });
    expect(statut).toBe(422);
    expect(corps.raison).toBe("nombre");
  });

  it("refuse un identifiant inconnu", async () => {
    const { statut, corps } = await envoyer({
      reponses: ["q1z", "q2a", "q3a", "q4a", "q5b"],
    });
    expect(statut).toBe(422);
    expect(corps.raison).toBe("identifiant");
    expect(simule.enregistrerRepartition).not.toHaveBeenCalled();
  });

  /** La garantie qu’un mélange décalé ne fausse jamais le compte. */
  it("refuse une réponse qui appartient à une autre question", async () => {
    const { statut, corps } = await envoyer({
      reponses: ["q2a", "q2a", "q3a", "q4a", "q5b"],
    });
    expect(statut).toBe(422);
    expect(corps.raison).toBe("identifiant");
  });

  it("refuse ce qui n’est pas une liste de chaînes", async () => {
    for (const intrus of [null, "q1a", 5, { 0: "q1a" }]) {
      const { statut } = await envoyer({ reponses: intrus });
      expect(statut).toBe(422);
    }
    const { statut } = await envoyer({ reponses: [1, 2, 3, 4, 5] });
    expect(statut).toBe(422);
  });
});

describe("ce que le Miroir répond", () => {
  it("calcule la maison côté serveur et l’enregistre", async () => {
    const { statut, corps } = await envoyer({ reponses: VERS_BRYGGELD });

    expect(statut).toBe(200);
    expect(corps.maison).toBe("BRYGGELD");

    expect(simule.enregistrerRepartition).toHaveBeenCalledTimes(1);
    const [eleveId, reponses, repartition] =
      simule.enregistrerRepartition.mock.calls[0];

    expect(eleveId).toBe("eleve-1");
    expect(reponses).toEqual(VERS_BRYGGELD);
    expect(repartition.maison).toBe("BRYGGELD");
    // La trace part complète en base, même si elle ne revient pas au joueur.
    expect(repartition.points).toEqual({
      KALDRAFN: 2,
      NATTORM: 2,
      BRYGGELD: 6,
      TIDEAL: 5,
    });
  });

  /**
   * **Le test qui compte.** Renvoyer les points ou la règle de départage
   * permettrait de reconstituer le barème en rejouant la cérémonie sur
   * plusieurs comptes — et de choisir sa maison.
   */
  it("ne renvoie que la maison, jamais le compte des points", async () => {
    const { corps } = await envoyer({ reponses: VERS_BRYGGELD });

    expect(Object.keys(corps)).toEqual(["maison"]);
    const expedie = JSON.stringify(corps);
    expect(expedie).not.toContain("points");
    expect(expedie).not.toContain("departage");
  });

  it("mène chaque maison jusqu’à l’enregistrement", async () => {
    const chemins = {
      KALDRAFN: ["q1a", "q2a", "q3a", "q4c", "q5a"],
      NATTORM: ["q1a", "q2a", "q3a", "q4d", "q5a"],
      BRYGGELD: VERS_BRYGGELD,
      TIDEAL: ["q1a", "q2a", "q3a", "q4a", "q5d"],
    };

    for (const [attendue, reponses] of Object.entries(chemins)) {
      const { statut, corps } = await envoyer({ reponses });
      expect(statut, attendue).toBe(200);
      expect(corps.maison).toBe(attendue);
    }
  });
});
