import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Ce que la route de la boutique accepte, et surtout ce qu’elle refuse.
 *
 * Les gardes sont refaites ici en entier, sans se reposer sur la page : une
 * route d’API est publique, et rien n’oblige un joueur à passer par
 * `/bjornstav` avant de l’appeler. Ces tests l’appellent d’ailleurs
 * directement, sans page.
 *
 * La session et l’écriture en base sont les deux seules choses simulées.
 * L’assemblage de la réaction, lui, est le vrai — c’est ce qu’on vérifie.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  inscrireBaguette: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/bjornstav/depot", () => ({
  inscrireBaguette: simule.inscrireBaguette,
}));

const { POST } = await import("./route");
const { MAIN_SELON_LE_BOIS, PIECE_SELON_LE_COEUR, VARIANTES } = await import(
  "@/lib/bjornstav/constantes"
);

/** Un compte accepté, non suspendu, qui n’est pas encore passé à Kaldvik. */
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
    // L'élève type de ce fichier : la boutique l'attend.
    etatMaison: "NON_FAIT",
    etatBaguette: "NON_FAIT",
    baguetteBois: null,
    baguetteCoeur: null,
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
    new Request("http://localhost/api/bjornstav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof corps === "string" ? corps : JSON.stringify(corps),
    }),
  );
  return { statut: reponse.status, corps: await reponse.json() };
}

const FRENE_CORBEAU = { bois: "FRENE", coeur: "PLUME_DE_CORBEAU" };

beforeEach(() => {
  simule.compteConnecte.mockReset();
  simule.inscrireBaguette.mockReset();
  simule.compteConnecte.mockResolvedValue(compte());
  simule.inscrireBaguette.mockResolvedValue({ inscrite: true });
});

describe("la baguette s’inscrit", () => {
  it("écrit les deux codes et rend le dénouement", async () => {
    const { statut, corps } = await envoyer(FRENE_CORBEAU);

    expect(statut).toBe(200);
    expect(simule.inscrireBaguette).toHaveBeenCalledWith(
      "eleve-1",
      "FRENE",
      "PLUME_DE_CORBEAU",
    );

    expect(corps.libelle).toBe("Frêne, cœur de plume de corbeau");
    expect(corps.apresPhoto[0].texte).toBe(MAIN_SELON_LE_BOIS.FRENE);
    expect(corps.apresPhoto[1].texte).toBe(
      PIECE_SELON_LE_COEUR.PLUME_DE_CORBEAU,
    );
  });

  it("sort la variante du mariage, pas le fragment ordinaire", async () => {
    const { corps } = await envoyer({ bois: "IF", coeur: "PLUME_DE_CORBEAU" });

    const textes = corps.apresPhoto.map((p: { texte: string }) => p.texte);
    expect(textes[1]).toBe(VARIANTES["IF|PLUME_DE_CORBEAU"]![0].texte);
    expect(textes).not.toContain(PIECE_SELON_LE_COEUR.PLUME_DE_CORBEAU);
  });

  /**
   * **Le point qui compte le plus.** Les vingt-quatre autres réactions ne
   * doivent jamais traverser : c’est ce qui rend le choix irréversible ET
   * aveugle. Une réponse qui les emporterait toutes les rendrait lisibles.
   */
  it("n’emporte aucune autre réaction que la sienne", async () => {
    const { corps } = await envoyer(FRENE_CORBEAU);
    const tout = JSON.stringify(corps);

    for (const [code, fragment] of Object.entries(MAIN_SELON_LE_BOIS)) {
      expect(tout.includes(fragment), `main : ${code}`).toBe(code === "FRENE");
    }
    for (const [code, fragment] of Object.entries(PIECE_SELON_LE_COEUR)) {
      expect(tout.includes(fragment), `pièce : ${code}`).toBe(
        code === "PLUME_DE_CORBEAU",
      );
    }
    for (const [mariage, fragments] of Object.entries(VARIANTES)) {
      for (const fragment of fragments!) {
        expect(tout.includes(fragment.texte), `variante : ${mariage}`).toBe(false);
      }
    }
  });
});

describe("ce que la route refuse", () => {
  it("401 sans session", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    const { statut } = await envoyer(FRENE_CORBEAU);
    expect(statut).toBe(401);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  it.each([
    ["un dossier en attente", { statut: "EN_ATTENTE", statutAcces: "EN_ATTENTE" }],
    ["un dossier refusé", { statut: "REFUSE" }],
    ["un dossier à corriger", { statut: "A_CORRIGER" }],
    ["un membre suspendu", { statutAcces: "EN_BANNISSEMENT" }],
    ["un compte sans fiche", { eleveId: null }],
  ])("403 pour %s", async (_cas, modifications) => {
    simule.compteConnecte.mockResolvedValue(compte(modifications));
    const { statut } = await envoyer(FRENE_CORBEAU);
    expect(statut).toBe(403);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  /**
   * **Un compte que la boutique ne concerne pas.**
   *
   * 403 et non 409 : « votre baguette est déjà choisie » serait faux pour
   * quelqu'un qui n'en aura jamais.
   */
  it("403 pour un compte sans objet, et n'inscrit rien", async () => {
    simule.compteConnecte.mockResolvedValue(
      compte({ etatBaguette: "SANS_OBJET" }),
    );
    const { statut, corps } = await envoyer({
      bois: "IF",
      coeur: "CRISTAL_DE_GLACE",
    });

    expect(statut).toBe(403);
    expect(corps.destination).toBe(ROUTES.bureau);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  it("403 même pour un compte sans objet qui garde sa baguette au chaud", async () => {
    simule.compteConnecte.mockResolvedValue(
      compte({
        baguetteBois: "FRENE",
        baguetteCoeur: "PLUME_DE_CORBEAU",
        baguetteChoisieLe: new Date(),
        etatBaguette: "SANS_OBJET",
      }),
    );
    const { statut } = await envoyer({ bois: "IF", coeur: "CRISTAL_DE_GLACE" });

    expect(statut).toBe(403);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  /** Le choix est définitif : on ne repasse pas chez Bjornstav. */
  it("409 quand une baguette est déjà posée, et renvoie au bureau", async () => {
    simule.compteConnecte.mockResolvedValue(
      compte({ baguetteChoisieLe: new Date(), etatBaguette: "FAIT" }),
    );
    const { statut, corps } = await envoyer({ bois: "IF", coeur: "CRISTAL_DE_GLACE" });

    expect(statut).toBe(409);
    expect(corps.destination).toBe(ROUTES.bureau);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  /**
   * La course de deux onglets : la session disait « pas de baguette », mais
   * la base a refusé l’écriture entre-temps. On ne raconte rien.
   */
  it("409 quand la base refuse l’écriture, sans rien raconter", async () => {
    simule.inscrireBaguette.mockResolvedValue({ inscrite: false });
    const { statut, corps } = await envoyer(FRENE_CORBEAU);

    expect(statut).toBe(409);
    expect(corps.destination).toBe(ROUTES.bureau);
    expect(corps.apresPhoto).toBeUndefined();
    expect(corps.libelle).toBeUndefined();
  });

  it.each([
    ["un bois inventé", { bois: "SAULE", coeur: "PLUME_DE_CORBEAU" }, "bois-inconnu"],
    ["le code du brief", { bois: "CHENE_TEMPETES", coeur: "PLUME_DE_CORBEAU" }, "bois-inconnu"],
    ["un cœur inventé", { bois: "FRENE", coeur: "PLUME_DE_MOUETTE" }, "coeur-inconnu"],
    ["le code court du brief", { bois: "FRENE", coeur: "CORBEAU" }, "coeur-inconnu"],
    ["deux cœurs", { bois: "CRISTAL_DE_GLACE", coeur: "CRISTAL_DE_GLACE" }, "bois-inconnu"],
    ["rien du tout", {}, "bois-inconnu"],
    ["un objet à la place d’un code", { bois: { code: "FRENE" }, coeur: "CRISTAL_DE_GLACE" }, "bois-inconnu"],
  ])("422 pour %s", async (_cas, corpsEnvoye, raison) => {
    const { statut, corps } = await envoyer(corpsEnvoye);
    expect(statut).toBe(422);
    expect(corps.raison).toBe(raison);
    // Rien n’a été inscrit : on refuse AVANT d’écrire.
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });

  it("400 sur une requête illisible", async () => {
    const { statut } = await envoyer("{ ceci n’est pas du JSON");
    expect(statut).toBe(400);
    expect(simule.inscrireBaguette).not.toHaveBeenCalled();
  });
});
