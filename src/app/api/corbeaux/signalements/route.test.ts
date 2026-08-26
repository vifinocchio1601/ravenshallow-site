import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";

/**
 * Signaler un corbeau.
 *
 * Deux exigences se croisent ici, et elles tirent dans des sens opposés :
 *
 *   • **signaler doit rester un clic** — le motif est facultatif, un champ
 *     vide n’est jamais une faute ;
 *   • **la réponse ne doit rien apprendre** — ni sur ce que la modération
 *     verra, ni sur l’existence d’un corbeau qu’on n’a pas le droit de voir.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  signaler: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/corbeaux/depot", () => ({ signaler: simule.signaler }));

const { POST } = await import("./route");

function compte(modifications: Record<string, unknown> = {}) {
  return { id: "alice", statut: "ACCEPTE", statutAcces: "VALIDE", ...modifications };
}

function signalement(corps: unknown) {
  return new Request("http://localhost/api/corbeaux/signalements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  simule.signaler.mockResolvedValue({ signale: true });
});

describe("qui peut signaler", () => {
  it("sans session : 401", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    expect((await POST(signalement({ messageId: "m1" }))).status).toBe(401);
    expect(simule.signaler).not.toHaveBeenCalled();
  });

  it("sans corbeau visé : 403, et rien n’est écrit", async () => {
    simule.compteConnecte.mockResolvedValue(compte());
    expect((await POST(signalement({}))).status).toBe(403);
    expect(simule.signaler).not.toHaveBeenCalled();
  });

  it("une requête illisible : 400", async () => {
    simule.compteConnecte.mockResolvedValue(compte());
    const reponse = await POST(
      new Request("http://localhost/api/corbeaux/signalements", {
        method: "POST",
        body: "pas du JSON",
      }),
    );
    expect(reponse.status).toBe(400);
  });
});

describe("le motif reste facultatif", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  /**
   * Quelqu’un qui subit des messages pénibles n’a pas à rédiger un dossier
   * pour être entendu. Un motif absent, vide ou fait d’espaces vaut `null` —
   * jamais une erreur qui renverrait le signalant au formulaire.
   */
  it.each([
    ["absent", undefined],
    ["vide", ""],
    ["fait d’espaces", "   \n  "],
    ["d’un autre type", 42],
  ])("un motif %s passe, et vaut null", async (_cas, motif) => {
    const reponse = await POST(signalement({ messageId: "m1", motif }));
    expect(reponse.status).toBe(200);
    expect(simule.signaler).toHaveBeenCalledWith(expect.anything(), "m1", null);
  });

  it("un motif écrit arrive rogné", async () => {
    await POST(signalement({ messageId: "m1", motif: "  Il insiste.  " }));
    expect(simule.signaler).toHaveBeenCalledWith(
      expect.anything(),
      "m1",
      "Il insiste.",
    );
  });

  it("un motif démesuré : 422, et rien n’est écrit", async () => {
    const reponse = await POST(
      signalement({ messageId: "m1", motif: "x".repeat(1001) }),
    );
    expect(reponse.status).toBe(422);
    expect(simule.signaler).not.toHaveBeenCalled();
  });
});

describe("ce que la réponse ne dit pas", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  /**
   * ⚠️ Un accusé de réception, et rien de plus.
   *
   * Ni identifiant de signalement, ni date, ni état : tout ce qui reviendrait
   * au joueur serait autant de matière pour deviner ce que la modération voit
   * — ou pour qu’un tiers le devine, en lisant par-dessus son épaule.
   */
  it("ne rend rien du signalement créé", async () => {
    const reponse = await POST(signalement({ messageId: "m1" }));
    expect(await reponse.json()).toEqual({ signale: true });
  });

  /**
   * « Introuvable » couvre trois cas — le corbeau n’existe pas, il est dans
   * un fil qui ne concerne pas ce compte, ou il est masqué pour lui. Les
   * trois répondent à l’identique : distinguer permettrait, en essayant des
   * identifiants, de savoir lesquels sont réels.
   */
  it("un corbeau qu’on n’a pas le droit de voir répond comme un corbeau absent", async () => {
    simule.signaler.mockResolvedValue({ signale: false, raison: "INTROUVABLE" });
    const reponse = await POST(signalement({ messageId: "inconnu" }));

    expect(reponse.status).toBe(403);
    expect(await reponse.json()).toEqual({
      erreur: TEXTES_CORBEAUX.erreurs.introuvable,
    });
  });

  it("on ne signale pas le staff au staff", async () => {
    simule.signaler.mockResolvedValue({
      signale: false,
      raison: "ADMINISTRATION",
    });
    const reponse = await POST(signalement({ messageId: "m1" }));

    expect(reponse.status).toBe(403);
    expect(await reponse.json()).toEqual({
      erreur: TEXTES_CORBEAUX.signaler.pasIci,
    });
  });
});
