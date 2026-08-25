import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * La note des premiers pas.
 *
 * Deux règles se vérifient ici, et elles sont du joueur, pas du code : la
 * seconde ligne reste **verrouillée** tant que la baguette n’est pas prise,
 * et la note **disparaît** une fois les deux lignes cochées.
 *
 * Le second groupe de tests simule une boutique ouverte. C’est aujourd’hui la
 * seule façon de voir ce verrou fonctionner — et le jour où Bjornstav
 * ouvrira, ce sont ces tests qui diront s’il tient toujours.
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
    baguetteChoisieLe: null,
    prenomNom: "Sigrid Vale",
    genre: "FEMININ",
    fonction: "PREMIERE_ANNEE",
    age: 13,
    ...modifications,
  };
}

describe("aujourd’hui — la boutique Bjornstav n’a pas ouvert", () => {
  it("coche la baguette d’office et ouvre le Miroir", async () => {
    const { premiersPas } = await import("./donnees");
    const pas = await premiersPas(compte());

    expect(pas).not.toBeNull();
    expect(pas).toHaveLength(2);

    const [baguette, ceremonie] = pas!;
    expect(baguette.fait).toBe(true);
    expect(baguette.verrou).toBeNull();
    // La boutique n’existe pas : rien où cliquer.
    expect(baguette.href).toBeNull();

    expect(ceremonie.fait).toBe(false);
    expect(ceremonie.verrou).toBeNull();
    expect(ceremonie.href).toBe(ROUTES.ceremonie);
  });

  it("retire le lien du Miroir une fois la répartition passée", async () => {
    const { premiersPas } = await import("./donnees");
    // Réparti mais — cas de figure impossible en vrai — la note existe encore.
    const pas = await premiersPas(compte({ maison: "TIDEAL" }));
    expect(pas).toBeNull();
  });
});

describe("le jour où Bjornstav ouvrira", () => {
  /** On rouvre le module avec la bascule à `true`. */
  async function avecBoutiqueOuverte() {
    vi.resetModules();
    vi.doMock("@/lib/ecole/baguette", async (original) => ({
      ...(await original<typeof import("@/lib/ecole/baguette")>()),
      BOUTIQUE_BJORNSTAV_OUVERTE: true,
    }));
    return import("./donnees");
  }

  it("verrouille le Miroir tant que la baguette n’est pas prise", async () => {
    const { premiersPas } = await avecBoutiqueOuverte();
    const pas = await premiersPas(compte({ baguetteChoisieLe: null }));

    expect(pas).not.toBeNull();
    const [baguette, ceremonie] = pas!;

    expect(baguette.fait).toBe(false);

    expect(ceremonie.fait).toBe(false);
    // Affichée, mais fermée — et avec sa raison, jamais un simple grisé.
    expect(ceremonie.href).toBeNull();
    expect(ceremonie.verrou).toBeTruthy();

    vi.doUnmock("@/lib/ecole/baguette");
    vi.resetModules();
  });

  it("ouvre le Miroir dès que la baguette est choisie", async () => {
    const { premiersPas } = await avecBoutiqueOuverte();
    const pas = await premiersPas(compte({ baguetteChoisieLe: new Date() }));

    const [baguette, ceremonie] = pas!;
    expect(baguette.fait).toBe(true);
    expect(ceremonie.verrou).toBeNull();
    expect(ceremonie.href).toBe(ROUTES.ceremonie);

    vi.doUnmock("@/lib/ecole/baguette");
    vi.resetModules();
  });

  it("fait disparaître la note quand les deux pas sont faits", async () => {
    const { premiersPas } = await avecBoutiqueOuverte();
    const pas = await premiersPas(
      compte({ baguetteChoisieLe: new Date(), maison: "BRYGGELD" }),
    );

    // `null`, et non une liste vide : c’est ce qui retire la note du bureau.
    expect(pas).toBeNull();

    vi.doUnmock("@/lib/ecole/baguette");
    vi.resetModules();
  });
});

describe("les panneaux qui attendent leur lot", () => {
  it("ouvre le compteur de maison à la répartition, et pas avant", async () => {
    const { progression } = await import("./donnees");

    expect((await progression(compte())).pointsMaison).toBeNull();
    expect((await progression(compte({ maison: "KALDRAFN" }))).pointsMaison).toBe(0);
  });
});
