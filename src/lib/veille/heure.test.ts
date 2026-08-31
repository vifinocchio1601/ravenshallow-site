import { describe, expect, it } from "vitest";
import {
  HEURE_DE_LA_RONDE,
  heureABruxelles,
  verdictDeLaRonde,
} from "./heure";

/**
 * ⚠️ **Ces dates sont écrites en UTC exprès, avec le `Z` final.** Sans lui,
 * `new Date("2026-01-15T04:00:00")` serait lue dans le fuseau de la machine —
 * et l'essai passerait à Bruxelles pour échouer sur le serveur de GitHub, qui
 * vit en UTC. C'est exactement le défaut que ce fichier est censé attraper.
 */
describe("l’heure à Bruxelles", () => {
  it("suit l’heure d’hiver — UTC+1", () => {
    expect(heureABruxelles(new Date("2026-01-15T03:00:00Z"))).toBe(4);
    expect(heureABruxelles(new Date("2026-01-15T04:00:00Z"))).toBe(5);
  });

  it("suit l’heure d’été — UTC+2", () => {
    expect(heureABruxelles(new Date("2026-07-15T03:00:00Z"))).toBe(5);
    expect(heureABruxelles(new Date("2026-07-15T04:00:00Z"))).toBe(6);
  });

  it("suit les deux bascules de l’année", () => {
    // Dernier dimanche de mars 2026 : le 29. On passe à UTC+2 à 1 h UTC.
    expect(heureABruxelles(new Date("2026-03-29T00:30:00Z"))).toBe(1);
    expect(heureABruxelles(new Date("2026-03-29T01:30:00Z"))).toBe(3);
    // Dernier dimanche d’octobre 2026 : le 25. On revient à UTC+1 à 1 h UTC.
    expect(heureABruxelles(new Date("2026-10-25T00:30:00Z"))).toBe(2);
    expect(heureABruxelles(new Date("2026-10-25T01:30:00Z"))).toBe(2);
  });

  it("ramène minuit à zéro, jamais à vingt-quatre", () => {
    expect(heureABruxelles(new Date("2026-01-14T23:00:00Z"))).toBe(0);
  });
});

describe("le verdict de la ronde, aux deux saisons", () => {
  /**
   * Le cœur du dispositif : sur les quatre départs possibles de l'année,
   * **exactement deux travaillent** — un par saison.
   */
  const DEPARTS = [
    { quand: "2026-01-15T03:00:00Z", saison: "hiver", cron: "3 h UTC", attendu: false },
    { quand: "2026-01-15T04:00:00Z", saison: "hiver", cron: "4 h UTC", attendu: true },
    { quand: "2026-07-15T03:00:00Z", saison: "été", cron: "3 h UTC", attendu: true },
    { quand: "2026-07-15T04:00:00Z", saison: "été", cron: "4 h UTC", attendu: false },
  ];

  for (const { quand, saison, cron, attendu } of DEPARTS) {
    it(`${saison}, départ de ${cron} : ${attendu ? "travaille" : "sort"}`, () => {
      expect(verdictDeLaRonde(new Date(quand)).travaille).toBe(attendu);
    });
  }

  it("une seule des deux exécutions travaille, chaque saison", () => {
    for (const jour of ["2026-01-15", "2026-07-15", "2026-04-01", "2026-11-01"]) {
      const travaillent = ["03", "04"].filter(
        (h) => verdictDeLaRonde(new Date(`${jour}T${h}:00:00Z`)).travaille,
      );
      expect(travaillent, `le ${jour}`).toHaveLength(1);
    }
  });

  it("dit pourquoi elle sort, en clair", () => {
    const verdict = verdictDeLaRonde(new Date("2026-01-15T03:00:00Z"));
    expect(verdict.travaille).toBe(false);
    if (verdict.travaille) return;
    expect(verdict.raison).toContain("04 h");
    expect(verdict.raison).toContain("l’autre exécution");
  });

  /**
   * ⚠️ Un retard du planificateur ne doit PAS faire sauter la ronde. GitHub
   * part parfois plusieurs minutes après l'heure quand la plateforme est
   * chargée — c'est normal, et resserrer la garde perdrait la ronde du jour.
   */
  it("tolère le retard du planificateur, jusqu’au bout de l’heure", () => {
    for (const minute of ["00", "08", "31", "59"]) {
      expect(
        verdictDeLaRonde(new Date(`2026-01-15T04:${minute}:00Z`)).travaille,
        `à 04:${minute} UTC`,
      ).toBe(true);
    }
  });

  it("mais pas au-delà : une heure de retard, et c’est l’autre qui a travaillé", () => {
    expect(verdictDeLaRonde(new Date("2026-01-15T05:00:00Z")).travaille).toBe(false);
  });

  it("le déclenchement manuel passe outre, à n’importe quelle heure", () => {
    for (const heure of ["00", "09", "14", "23"]) {
      expect(
        verdictDeLaRonde(new Date(`2026-07-15T${heure}:00:00Z`), true).travaille,
        `à ${heure} h UTC`,
      ).toBe(true);
    }
  });

  it("rend toujours l’heure locale, qu’elle travaille ou non", () => {
    expect(verdictDeLaRonde(new Date("2026-07-15T03:00:00Z")).heureLocale).toBe(
      HEURE_DE_LA_RONDE,
    );
    expect(verdictDeLaRonde(new Date("2026-07-15T04:00:00Z")).heureLocale).toBe(6);
  });
});
