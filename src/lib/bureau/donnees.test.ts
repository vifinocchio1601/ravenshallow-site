import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/ecole/menu";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * **`npm test` ne touche JAMAIS la base.**
 *
 * Depuis le lot des points, `progression` va y lire les points personnels de
 * l’élève. On remplace donc le dépôt des points — et lui seul : ce qui
 * s’éprouve ici, ce sont les règles du bureau, pas la lecture d’une colonne.
 */
vi.mock("@/lib/points/depot", () => ({
  pointsPersonnelsDe: async () => 0,
  lireLeTournoi: async () => null,
}));

/**
 * Même raison pour le calendrier : depuis le 28 août 2026, `progression` va y
 * chercher la prochaine épreuve. On remplace le dépôt, pas la règle — celle
 * qui compte ici est « seules les épreuves montent au bureau », et elle vit
 * dans la requête, qu'un essai en base éprouve pour de bon.
 */
vi.mock("@/lib/calendrier/depot", () => ({
  prochaineEpreuve: async () => null,
}));

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
    const pas = await premiersPas(
      compte({ baguetteChoisieLe: new Date(), etatBaguette: "FAIT" }),
    );

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
      compte({
        baguetteChoisieLe: new Date(),
        etatBaguette: "FAIT",
        maison: "BRYGGELD",
        etatMaison: "FAIT",
      }),
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
    const pas = await premiersPas(
      compte({ maison: "TIDEAL", etatMaison: "FAIT" }),
    );

    expect(pas).not.toBeNull();
    const [baguette, ceremonie] = pas!;
    expect(baguette.fait).toBe(false);
    expect(baguette.href).toBe(ROUTES.bjornstav);
    expect(ceremonie.fait).toBe(true);
    expect(ceremonie.href).toBeNull();
  });
});

describe("les deux compteurs ne se confondent pas", () => {
  /**
   * La progression ne porte plus QUE les points personnels.
   *
   * Le compteur de la maison a quitté ce panneau au lot des points : il vit
   * dans les tubes, en tête du bureau, et son plancher comme sa moyenne se
   * décident dans `ecole/tournoi.ts`. Deux affichages du même nombre
   * finiraient par se contredire — et surtout, ce ne sont pas les mêmes
   * nombres : un ajustement de l’administration (art. 19.1) touche la maison
   * et jamais l’élève.
   */
  it("la progression ne porte plus le compteur de la maison", async () => {
    const { progression } = await import("./donnees");
    const avancee = await progression(
      compte({ maison: "KALDRAFN", etatMaison: "FAIT" }),
    );

    expect(avancee).not.toHaveProperty("pointsMaison");
    expect(avancee.pointsPersonnels).toBe(0);
  });
});

describe("la baguette, une fois prise", () => {
  it("paraît sur le bureau, et pas avant", async () => {
    const { progression } = await import("./donnees");

    // Rien tant que l’élève n’est pas passé à Kaldvik : la note des premiers
    // pas l’y envoie déjà.
    expect((await progression(compte())).baguette).toBeNull();

    const baguette = {
      baguetteBois: "CHENE_DES_TEMPETES",
      baguetteCoeur: "GRIFFE_OURS_DES_CAVERNES",
      baguetteChoisieLe: new Date(),
    };

    const avec = await progression(
      compte({ ...baguette, etatBaguette: "FAIT" }),
    );
    expect(avec.baguette).toBe(
      "Chêne des tempêtes, cœur de griffe d’ours des cavernes",
    );

    // Un compte que la boutique ne concerne pas garde sa baguette en base et
    // ne l’affiche pas — sans texte de remplacement, qui ferait croire à un
    // manque.
    const sansObjet = await progression(
      compte({ ...baguette, etatBaguette: "SANS_OBJET" }),
    );
    expect(sansObjet.baguette).toBeNull();
  });
});
