import { describe, expect, it } from "vitest";
import {
  enJourSaisissable,
  jourEnToutesLettres,
  jourSaisi,
} from "./dates";

/**
 * **Le « 1er » est toute la raison d'être de ce fichier.**
 *
 * `toLocaleDateString("fr-FR")` rend « 1 août », et c'est faux en français.
 * Le reste du mois, en revanche, ne prend rien : « 2 août », jamais « 2e ».
 */
describe("une date en toutes lettres", () => {
  it("le premier du mois prend « 1er »", () => {
    expect(jourEnToutesLettres(new Date(2026, 7, 1))).toBe("1er août 2026");
  });

  it("les autres jours ne prennent rien", () => {
    expect(jourEnToutesLettres(new Date(2026, 7, 2))).toBe("2 août 2026");
    expect(jourEnToutesLettres(new Date(2026, 7, 27))).toBe("27 août 2026");
    expect(jourEnToutesLettres(new Date(2026, 7, 31))).toBe("31 août 2026");
  });

  it("les douze mois sont écrits en minuscules, accents compris", () => {
    expect(jourEnToutesLettres(new Date(2026, 1, 12))).toBe("12 février 2026");
    expect(jourEnToutesLettres(new Date(2026, 11, 1))).toBe("1er décembre 2026");
  });
});

describe("un jour saisi dans un champ date", () => {
  it("devient un instant posé à midi", () => {
    const lu = jourSaisi("2026-09-04");
    expect(lu?.getFullYear()).toBe(2026);
    expect(lu?.getMonth()).toBe(8);
    expect(lu?.getDate()).toBe(4);
    // **Midi, jamais minuit** : à minuit UTC, la moitié de la planète lit la
    // veille, et l'écran afficherait un jour de moins que celui qu'on a saisi.
    expect(lu?.getHours()).toBe(12);
  });

  /**
   * **Le 31 février est le piège.** `new Date(2026, 1, 31)` se lit sans
   * broncher et devient le 3 mars : poser une date que personne n'a saisie
   * est pire que la refuser.
   */
  it("refuse un jour qui n’existe pas", () => {
    expect(jourSaisi("2026-02-31")).toBeNull();
    expect(jourSaisi("2026-13-01")).toBeNull();
  });

  it("refuse ce qui n’est pas un jour", () => {
    expect(jourSaisi("")).toBeNull();
    expect(jourSaisi("   ")).toBeNull();
    expect(jourSaisi("demain")).toBeNull();
    expect(jourSaisi("04/09/2026")).toBeNull();
    expect(jourSaisi(null)).toBeNull();
    expect(jourSaisi(20260904)).toBeNull();
  });

  /**
   * L’aller-retour doit rendre le jour saisi, et non sa veille : c’est tout
   * l’intérêt de lire en heure locale plutôt qu’en UTC.
   */
  it("fait l’aller-retour sans perdre un jour", () => {
    for (const jour of ["2026-01-01", "2026-09-04", "2026-12-31"]) {
      expect(enJourSaisissable(jourSaisi(jour))).toBe(jour);
    }
  });

  it("rend une chaîne vide quand il n’y a pas de date", () => {
    expect(enJourSaisissable(null)).toBe("");
    expect(enJourSaisissable("n’importe quoi")).toBe("");
  });
});
