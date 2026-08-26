import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Bloquer, débloquer, et la liste de ceux qu’on a bloqués.
 *
 * **Le test qui compte est le dernier** : la route ne rend, et ne rendra
 * jamais, la liste de ceux qui ont bloqué le demandeur. Cette question-là n’a
 * de réponse nulle part sur ce site — c’est ce qui fait tenir tout le reste
 * du dispositif.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  bloquer: vi.fn(),
  debloquer: vi.fn(),
  listerBlocages: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/corbeaux/depot", () => ({
  bloquer: simule.bloquer,
  debloquer: simule.debloquer,
  listerBlocages: simule.listerBlocages,
}));

const { GET, POST } = await import("./route");

function compte(modifications: Record<string, unknown> = {}) {
  return {
    id: "alice",
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    ...modifications,
  };
}

function commande(corps: unknown) {
  return new Request("http://localhost/api/corbeaux/blocages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  simule.listerBlocages.mockResolvedValue([]);
  simule.bloquer.mockResolvedValue("FAIT");
  simule.debloquer.mockResolvedValue("FAIT");
});

describe("qui a le droit de bloquer", () => {
  it("sans session : 401", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    expect((await POST(commande({ membreId: "bob" }))).status).toBe(401);
    expect((await GET()).status).toBe(401);
    expect(simule.bloquer).not.toHaveBeenCalled();
  });

  it("un dossier non accepté ne lit pas la liste", async () => {
    simule.compteConnecte.mockResolvedValue(compte({ statut: "EN_ATTENTE" }));
    expect((await GET()).status).toBe(403);
    expect(simule.listerBlocages).not.toHaveBeenCalled();
  });

  it("sans membre visé : 403, et rien n’est écrit", async () => {
    simule.compteConnecte.mockResolvedValue(compte());
    expect((await POST(commande({}))).status).toBe(403);
    expect(simule.bloquer).not.toHaveBeenCalled();
  });

  it("une requête illisible : 400", async () => {
    simule.compteConnecte.mockResolvedValue(compte());
    const reponse = await POST(
      new Request("http://localhost/api/corbeaux/blocages", {
        method: "POST",
        body: "pas du JSON",
      }),
    );
    expect(reponse.status).toBe(400);
  });
});

describe("les deux commandes", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  it("bloque par défaut", async () => {
    await POST(commande({ membreId: "bob" }));
    expect(simule.bloquer).toHaveBeenCalledWith(expect.anything(), "bob");
    expect(simule.debloquer).not.toHaveBeenCalled();
  });

  it("débloque quand on le demande", async () => {
    await POST(commande({ membreId: "bob", action: "DEBLOQUER" }));
    expect(simule.debloquer).toHaveBeenCalledWith(expect.anything(), "bob");
    expect(simule.bloquer).not.toHaveBeenCalled();
  });

  /**
   * Un double clic, un rechargement : l’état voulu est déjà celui qu’on a.
   * Répondre par une erreur ferait croire à un échec là où tout va bien.
   */
  it("un blocage déjà posé se répond comme un blocage neuf", async () => {
    simule.bloquer.mockResolvedValue("DEJA");
    const reponse = await POST(commande({ membreId: "bob" }));
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ bloque: true });
  });

  it("un refus du dépôt : 403", async () => {
    simule.bloquer.mockResolvedValue("REFUSE");
    expect((await POST(commande({ membreId: "bob" }))).status).toBe(403);
  });
});

describe("la liste ne va que dans un sens", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  it("rend ceux que J’AI bloqués", async () => {
    simule.listerBlocages.mockResolvedValue([
      {
        id: "bob",
        prenomNom: "Bob Essai",
        maison: null,
        etatMaison: "NON_FAIT",
        bloqueeLe: "2026-08-26T10:00:00.000Z",
      },
    ]);

    const reponse = await GET();
    const lu = (await reponse.json()) as { bloquees: unknown[] };
    expect(lu.bloquees).toHaveLength(1);
    expect(simule.listerBlocages).toHaveBeenCalledWith(
      expect.objectContaining({ id: "alice" }),
    );
  });

  /**
   * ⚠️ **Le test qui garde le dispositif.**
   *
   * Aucune route, aucune fonction du dépôt ne répond à « qui m’a bloqué ? ».
   * Le jour où quelqu’un en ajouterait une — par symétrie, par commodité —,
   * ce test tombe. Une seule requête suffirait alors à défaire tout ce que le
   * reste du lot s’emploie à protéger.
   */
  it("n’expose nulle part ceux qui m’ont bloqué", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("src/lib/corbeaux/depot.ts", "utf8"),
    );

    // Une lecture des blocages qui partirait de `bloqueId` — « qui m'a
    // bloqué ? » — plutôt que de `bloqueurId`.
    const requetes = [...source.matchAll(/prisma\.blocage\.findMany\(\{[\s\S]{0,220}?\}\)/g)]
      .map((m) => m[0])
      .filter((r) => !r.includes("bloqueurId"));

    // La seule requête qui lit les deux sens est `blocagesEntre`, et elle
    // nomme `bloqueurId` dans ses deux branches : elle ne peut donc pas
    // figurer ici.
    expect(requetes).toEqual([]);
  });
});
