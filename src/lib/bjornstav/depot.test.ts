import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Le verrou qui empêche de choisir deux fois.
 *
 * Ce fichier ne vérifie pas que la base fonctionne — elle fonctionne. Il
 * vérifie **la forme de la requête**, et une seule chose y compte : que
 * l’écriture reste un `updateMany` conditionné à une baguette encore vide.
 *
 * C’est un test de structure, et il est là pour un cas précis : le jour où
 * quelqu’un trouvera plus simple d’écrire `update({ where: { id } })`. Ça
 * marcherait, les pages continueraient de s’afficher, et le verrou serait
 * parti sans bruit.
 *
 * Le second verrou, lui, est dans la base — contrainte et déclencheur, posés
 * par `20260825200000_baguette_definitive`. Aucun test JavaScript ne peut
 * l’attester : il a été éprouvé contre la vraie base.
 */

const simule = vi.hoisted(() => ({ updateMany: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { eleve: { updateMany: simule.updateMany } },
}));

const { inscrireBaguette } = await import("./depot");

beforeEach(() => {
  simule.updateMany.mockReset();
  simule.updateMany.mockResolvedValue({ count: 1 });
});

describe("l’inscription de la baguette", () => {
  it("n’écrit que si la baguette est encore vide", async () => {
    await inscrireBaguette("eleve-1", "IF", "CRISTAL_DE_GLACE");

    const requete = simule.updateMany.mock.calls[0][0];

    // La condition qui porte tout : sans elle, une seconde requête écraserait
    // la première et le choix cesserait d’être définitif.
    //
    // Elle porte sur l’ÉTAT, et non sur la case vide. La différence n’est pas
    // cosmétique : un compte que la boutique ne concerne pas a lui aussi les
    // colonnes vides, et l’ancienne condition l’aurait laissé écrire.
    expect(requete.where).toEqual({ id: "eleve-1", etatBaguette: "NON_FAIT" });
  });

  it("écrit les trois colonnes ensemble", async () => {
    await inscrireBaguette("eleve-1", "SORBIER", "NERF_LOUP_DES_FJORDS");

    const { data } = simule.updateMany.mock.calls[0][0];

    expect(data.baguetteBois).toBe("SORBIER");
    expect(data.baguetteCoeur).toBe("NERF_LOUP_DES_FJORDS");
    // Une baguette à moitié écrite n’existe pas, et la base la refuserait.
    expect(data.baguetteChoisieLe).toBeInstanceOf(Date);
    // L’état part dans la même écriture : la base refuse une baguette posée
    // sous un état « attendu », et une seconde requête n’aurait pas de sens.
    expect(data.etatBaguette).toBe("FAIT");
    expect(Object.keys(data).sort()).toEqual([
      "baguetteBois",
      "baguetteChoisieLe",
      "baguetteCoeur",
      "etatBaguette",
    ]);
  });

  it("dit oui quand la ligne a été touchée", async () => {
    simule.updateMany.mockResolvedValue({ count: 1 });
    expect(await inscrireBaguette("eleve-1", "FRENE", "PLUME_DE_CORBEAU")).toEqual({
      inscrite: true,
    });
  });

  /** La course de deux onglets : l’autre a écrit, celui-ci repart bredouille. */
  it("dit non quand aucune ligne n’a bougé", async () => {
    simule.updateMany.mockResolvedValue({ count: 0 });
    expect(await inscrireBaguette("eleve-1", "FRENE", "PLUME_DE_CORBEAU")).toEqual({
      inscrite: false,
    });
  });

  it("dit non plutôt qu’oui si la base en touchait plusieurs", async () => {
    // Ne devrait jamais arriver — `id` est la clé primaire. Mais « une seule
    // ligne » est la condition qu’on veut, pas « au moins une ».
    simule.updateMany.mockResolvedValue({ count: 2 });
    expect(await inscrireBaguette("eleve-1", "FRENE", "PLUME_DE_CORBEAU")).toEqual({
      inscrite: false,
    });
  });
});
