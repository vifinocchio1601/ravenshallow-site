import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Retirer de sa vue — un corbeau, ou un fil entier.
 *
 * **Une seule route pour les deux**, et un `POST` : un `DELETE` promettrait
 * une suppression et mentirait sur ce qui se passe. Rien n'est effacé ; la
 * copie du correspondant reste intacte, et c'est ce qui protège un membre
 * harcelé dont l'agresseur voudrait faire disparaître ses traces.
 *
 * Le retrait d'un fil entier existait côté serveur depuis l'ouverture de la
 * Tour, **sans qu'aucun écran l'appelle**. Ces essais fixent le contrat que
 * l'interface emprunte désormais.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  retirerDeMaVue: vi.fn(),
  retirerLeFilDeMaVue: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/corbeaux/depot", () => ({
  retirerDeMaVue: simule.retirerDeMaVue,
  retirerLeFilDeMaVue: simule.retirerLeFilDeMaVue,
}));

const { POST } = await import("./route");

const compte = { id: "alice", statut: "ACCEPTE", statutAcces: "VALIDE" };

function commande(corps: unknown) {
  return new Request("http://localhost/api/corbeaux/masquages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  simule.compteConnecte.mockResolvedValue(compte);
  simule.retirerDeMaVue.mockResolvedValue(true);
  simule.retirerLeFilDeMaVue.mockResolvedValue(true);
});

describe("retirer un fil entier", () => {
  it("accepte un identifiant de conversation et retire le fil", async () => {
    const reponse = await POST(commande({ conversationId: "fil-1" }));

    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ retire: true });
    expect(simule.retirerLeFilDeMaVue).toHaveBeenCalledWith(compte, "fil-1");
    expect(simule.retirerDeMaVue).not.toHaveBeenCalled();
  });

  it("répond 403 quand le fil n’est pas le sien", async () => {
    simule.retirerLeFilDeMaVue.mockResolvedValue(false);
    const reponse = await POST(commande({ conversationId: "fil-des-autres" }));
    expect(reponse.status).toBe(403);
  });
});

describe("retirer un seul corbeau", () => {
  it("reste servi par la même route", async () => {
    const reponse = await POST(commande({ messageId: "corbeau-1" }));

    expect(reponse.status).toBe(200);
    expect(simule.retirerDeMaVue).toHaveBeenCalledWith(compte, "corbeau-1");
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });

  /**
   * Les deux à la fois n'a aucun sens, mais la route doit trancher plutôt
   * que de faire les deux : le corbeau gagne, et le fil n'est pas touché.
   */
  it("ne fait qu’une chose quand on lui demande les deux", async () => {
    await POST(commande({ messageId: "corbeau-1", conversationId: "fil-1" }));
    expect(simule.retirerDeMaVue).toHaveBeenCalledOnce();
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });
});

describe("ce que la route refuse", () => {
  it("sans session, rien ne bouge", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    const reponse = await POST(commande({ conversationId: "fil-1" }));

    expect(reponse.status).toBe(401);
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });

  it("sans identifiant, elle ne devine pas", async () => {
    const reponse = await POST(commande({}));
    expect(reponse.status).toBe(403);
    expect(simule.retirerDeMaVue).not.toHaveBeenCalled();
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });

  it("refuse une chaîne vide comme un identifiant absent", async () => {
    const reponse = await POST(commande({ conversationId: "" }));
    expect(reponse.status).toBe(403);
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });

  it("refuse ce qui n’est pas une chaîne", async () => {
    for (const forge of [{ conversationId: 12 }, { conversationId: ["a"] }]) {
      const reponse = await POST(commande(forge));
      expect(reponse.status).toBe(403);
    }
    expect(simule.retirerLeFilDeMaVue).not.toHaveBeenCalled();
  });

  it("refuse un corps illisible", async () => {
    const reponse = await POST(
      new Request("http://localhost/api/corbeaux/masquages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ pas du JSON",
      }),
    );
    expect(reponse.status).toBe(400);
  });
});
