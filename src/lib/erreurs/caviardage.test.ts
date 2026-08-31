import { describe, expect, it } from "vitest";
import { caviarder, MASQUE, porteUneAdresse } from "./caviardage";

describe("le caviardage des adresses", () => {
  it("masque une adresse ordinaire", () => {
    expect(caviarder("envoi raté vers sigrid@exemple.fr")).toBe(
      `envoi raté vers ${MASQUE}`,
    );
  });

  it("masque les formes qui sortent de l’ordinaire", () => {
    // Ce sont celles auxquelles on ne pense pas, donc celles qui passent.
    for (const adresse of [
      "prenom.nom@sous.domaine.co.uk",
      "untel+etiquette@gmail.com",
      "a@b.io",
      "TRÈS.Majuscule@Exemple.FR",
      "veille@ravenshallow.invalid",
    ]) {
      expect(caviarder(`vers ${adresse} !`), adresse).toBe(`vers ${MASQUE} !`);
    }
  });

  it("masque plusieurs adresses dans le même message", () => {
    expect(caviarder("de a@b.fr à c@d.fr")).toBe(`de ${MASQUE} à ${MASQUE}`);
  });

  it("masque une adresse collée à de la ponctuation", () => {
    expect(caviarder("« a@b.fr », refusé")).toContain(MASQUE);
    expect(caviarder("(a@b.fr)")).toBe(`(${MASQUE})`);
    expect(caviarder("to=<a@b.fr>")).toContain(MASQUE);
  });

  /**
   * ⚠️ Le filet doit rester ÉTROIT : un caviardage trop large rendrait les
   * messages d'erreur illisibles, et un rapport illisible ne sert à rien.
   */
  it("ne touche pas à ce qui n’est pas une adresse", () => {
    for (const texte of [
      "P2028 — Transaction not found",
      "Can’t reach database server at ep-polished-dew.neon.tech:5432",
      "/api/corbeaux/blocages a répondu 500",
      "ECONNREFUSED 127.0.0.1:3000",
      "TypeError: Cannot read properties of null",
    ]) {
      expect(caviarder(texte), texte).toBe(texte);
    }
  });

  it("laisse un texte sans adresse intact", () => {
    expect(caviarder("")).toBe("");
    expect(caviarder("rien à signaler")).toBe("rien à signaler");
  });
});

describe("la détection, pour refuser un rapport", () => {
  it("reconnaît une adresse", () => {
    expect(porteUneAdresse("bonjour a@b.fr")).toBe(true);
  });

  it("ne se trompe pas sur un texte propre", () => {
    expect(porteUneAdresse("3 dossiers attendent une lecture")).toBe(false);
  });

  /**
   * ⚠️ Le défaut classique d'une expression régulière globale : `test` avance
   * `lastIndex`, et un appel sur deux répond faux. C'est exactement le genre
   * de bogue qui laisserait passer un rapport sur deux.
   */
  it("répond pareil au deuxième appel", () => {
    const texte = "vers a@b.fr";
    expect(porteUneAdresse(texte)).toBe(true);
    expect(porteUneAdresse(texte)).toBe(true);
    expect(porteUneAdresse(texte)).toBe(true);
  });

  it("un texte caviardé ne porte plus d’adresse", () => {
    expect(porteUneAdresse(caviarder("de a@b.fr à c@d.fr"))).toBe(false);
  });
});
