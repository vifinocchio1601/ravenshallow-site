import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * La note des premiers pas.
 *
 * Trois règles se vérifient ici, et elles sont du joueur, pas du code :
 * l’ordre — **la baguette d’abord, le Miroir ensuite** —, le verrou de la
 * seconde ligne tant que la première n’est pas faite, et la disparition de la
 * note une fois les deux cochées.
 *
 * Ces tests ont d’abord été écrits contre une boutique qui n’existait pas,
 * en simulant son ouverture. Elle existe : ils décrivent maintenant ce qui
 * se passe pour de bon.
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

describe("l’ordre des premiers pas", () => {
  it("envoie d’abord chez Bjornstav, et verrouille le Miroir", async () => {
    const { premiersPas } = await import("./donnees");
    const pas = await premiersPas(compte());

    expect(pas).not.toBeNull();
    expect(pas).toHaveLength(2);

    const [baguette, ceremonie] = pas!;

    // Premier pas : rien ne le précède, il est donc toujours ouvert.
    expect(baguette.id).toBe("baguette");
    expect(baguette.fait).toBe(false);
    expect(baguette.verrou).toBeNull();
    expect(baguette.href).toBe(ROUTES.bjornstav);

    // Second pas : affiché, mais fermé — et avec sa raison écrite en clair,
    // jamais un simple grisé.
    expect(ceremonie.id).toBe("ceremonie");
    expect(ceremonie.fait).toBe(false);
    expect(ceremonie.href).toBeNull();
    expect(ceremonie.verrou).toBeTruthy();
  });

  it("ouvre le Miroir dès que la baguette est prise, et ferme la boutique", async () => {
    const { premiersPas } = await import("./donnees");
    const pas = await premiersPas(compte({ baguetteChoisieLe: new Date() }));

    const [baguette, ceremonie] = pas!;

    // La baguette est définitive : plus rien où cliquer.
    expect(baguette.fait).toBe(true);
    expect(baguette.href).toBeNull();

    expect(ceremonie.verrou).toBeNull();
    expect(ceremonie.href).toBe(ROUTES.ceremonie);
  });

  it("fait disparaître la note quand les deux pas sont faits", async () => {
    const { premiersPas } = await import("./donnees");
    const pas = await premiersPas(
      compte({ baguetteChoisieLe: new Date(), maison: "BRYGGELD" }),
    );

    // `null`, et non une liste vide : c’est ce qui retire la note du bureau.
    expect(pas).toBeNull();
  });

  /**
   * Une maison sans baguette ne peut pas arriver — le Miroir se refuse à qui
   * n’est pas passé chez Bjornstav. Si le cas survenait malgré tout, la note
   * doit rester, et rester lisible.
   */
  it("garde la note si la maison est là sans la baguette", async () => {
    const { premiersPas } = await import("./donnees");
    const pas = await premiersPas(compte({ maison: "TIDEAL" }));

    expect(pas).not.toBeNull();
    const [baguette, ceremonie] = pas!;
    expect(baguette.fait).toBe(false);
    expect(baguette.href).toBe(ROUTES.bjornstav);
    expect(ceremonie.fait).toBe(true);
    expect(ceremonie.href).toBeNull();
  });
});

describe("les panneaux qui attendent leur lot", () => {
  it("ouvre le compteur de maison à la répartition, et pas avant", async () => {
    const { progression } = await import("./donnees");

    expect((await progression(compte())).pointsMaison).toBeNull();
    expect((await progression(compte({ maison: "KALDRAFN" }))).pointsMaison).toBe(0);
  });
});

describe("la baguette, une fois prise", () => {
  it("paraît sur le bureau, et pas avant", async () => {
    const { progression } = await import("./donnees");

    // Rien tant que l’élève n’est pas passé à Kaldvik : la note des premiers
    // pas l’y envoie déjà.
    expect((await progression(compte())).baguette).toBeNull();

    const avec = await progression(
      compte({
        baguetteBois: "CHENE_DES_TEMPETES",
        baguetteCoeur: "GRIFFE_OURS_DES_CAVERNES",
        baguetteChoisieLe: new Date(),
      }),
    );
    expect(avec.baguette).toBe(
      "Chêne des tempêtes, cœur de griffe d’ours des cavernes",
    );
  });
});
