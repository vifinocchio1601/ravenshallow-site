import { describe, expect, it } from "vitest";
import {
  daterLesAnomalies,
  estPersistante,
  jourDe,
  memoireVide,
  parGravite,
  trier,
  type Anomalie,
  type AnomalieDatee,
} from "./anomalies";

const PANNE: Anomalie = {
  cle: "disponibilite:/grimoires:500",
  gravite: "PANNE",
  quoi: "La page répond 500",
  ou: "/grimoires",
};

const DEGAT: Anomalie = {
  cle: "coherence:compteur-maison:NATTORM",
  gravite: "DEGAT",
  quoi: "Le compteur ne correspond pas au carnet",
  ou: "compteurs_maison",
};

/** Cinq heures du matin à Bruxelles, en hiver puis en été. */
const matin = (jour: string) =>
  new Date(`${jour}T${jour < "2026-03-29" || jour > "2026-10-25" ? "04" : "03"}:00:00Z`);

describe("le jour d’un instant", () => {
  it("est celui de Bruxelles, pas celui d’UTC", () => {
    // 23 h 30 UTC le 14 : il est déjà le 15 à Bruxelles.
    expect(jourDe(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-15");
  });

  it("tient l’heure d’été", () => {
    expect(jourDe(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-15");
  });
});

describe("dater une anomalie", () => {
  it("une anomalie neuve date d’aujourd’hui, et dure un jour", () => {
    const { datees } = daterLesAnomalies([PANNE], memoireVide(), matin("2026-09-01"));
    expect(datees[0].depuis).toBe("2026-09-01");
    expect(datees[0].jours).toBe(1);
    expect(estPersistante(datees[0])).toBe(false);
  });

  /** L'exigence même du brief : « présente deux jours de suite ». */
  it("revue le lendemain, elle est signalée comme persistante", () => {
    const jour1 = daterLesAnomalies([PANNE], memoireVide(), matin("2026-09-01"));
    const jour2 = daterLesAnomalies([PANNE], jour1.memoire, matin("2026-09-02"));

    expect(jour2.datees[0].jours).toBe(2);
    expect(jour2.datees[0].depuis).toBe("2026-09-01");
    expect(estPersistante(jour2.datees[0])).toBe(true);
  });

  it("quatre jours de suite se comptent quatre", () => {
    let memoire = memoireVide();
    for (const jour of ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) {
      ({ memoire } = daterLesAnomalies([PANNE], memoire, matin(jour)));
    }
    const { datees } = daterLesAnomalies([PANNE], memoire, matin("2026-09-05"));
    expect(datees[0].jours).toBe(5);
    expect(datees[0].depuis).toBe("2026-09-01");
  });

  /**
   * ⚠️ Le défaut que `dernier` existe pour éviter : une ronde manuelle lancée
   * l'après-midi ne doit pas vieillir l'anomalie d'un jour.
   */
  it("deux rondes le même jour ne comptent pas double", () => {
    const aube = daterLesAnomalies([PANNE], memoireVide(), matin("2026-09-01"));
    const midi = daterLesAnomalies(
      [PANNE],
      aube.memoire,
      new Date("2026-09-01T10:00:00Z"),
    );
    expect(midi.datees[0].jours).toBe(1);
  });

  it("réparée puis revenue, elle repart de zéro", () => {
    const jour1 = daterLesAnomalies([PANNE], memoireVide(), matin("2026-09-01"));
    const jour2 = daterLesAnomalies([PANNE], jour1.memoire, matin("2026-09-02"));
    // Le 3, tout va bien : rien à dater.
    const jour3 = daterLesAnomalies([], jour2.memoire, matin("2026-09-03"));
    expect(Object.keys(jour3.memoire.anomalies)).toHaveLength(0);
    // Le 4, elle revient : c’est une anomalie neuve, pas une vieille de trois jours.
    const jour4 = daterLesAnomalies([PANNE], jour3.memoire, matin("2026-09-04"));
    expect(jour4.datees[0].jours).toBe(1);
    expect(jour4.datees[0].depuis).toBe("2026-09-04");
  });

  it("le détail chiffré peut bouger sans rajeunir l’anomalie", () => {
    const lent = { ...PANNE, detail: "4,2 s" };
    const jour1 = daterLesAnomalies([lent], memoireVide(), matin("2026-09-01"));
    const plusLent = { ...PANNE, detail: "9,8 s" };
    const jour2 = daterLesAnomalies([plusLent], jour1.memoire, matin("2026-09-02"));
    expect(jour2.datees[0].jours).toBe(2);
    expect(jour2.datees[0].detail).toBe("9,8 s");
  });

  it("ne garde en mémoire que ce qu’elle vient de voir", () => {
    const jour1 = daterLesAnomalies([PANNE, DEGAT], memoireVide(), matin("2026-09-01"));
    expect(Object.keys(jour1.memoire.anomalies)).toHaveLength(2);
    const jour2 = daterLesAnomalies([DEGAT], jour1.memoire, matin("2026-09-02"));
    expect(Object.keys(jour2.memoire.anomalies)).toEqual([DEGAT.cle]);
  });
});

describe("l’ordre du rapport", () => {
  const datee = (
    cle: string,
    gravite: AnomalieDatee["gravite"],
    jours: number,
  ): AnomalieDatee => ({
    cle,
    gravite,
    quoi: "x",
    ou: "y",
    depuis: "2026-09-01",
    jours,
  });

  it("met les plus graves d’abord", () => {
    const range = trier([
      datee("c", "A_SURVEILLER", 1),
      datee("a", "PANNE", 1),
      datee("b", "DEGAT", 1),
    ]);
    expect(range.map((a) => a.gravite)).toEqual(["PANNE", "DEGAT", "A_SURVEILLER"]);
  });

  it("à gravité égale, les plus anciennes passent devant", () => {
    const range = trier([datee("a", "PANNE", 1), datee("b", "PANNE", 6)]);
    expect(range.map((a) => a.jours)).toEqual([6, 1]);
  });

  it("à tout égal, l’alphabet départage — sinon l’ordre change entre deux rondes", () => {
    const range = trier([datee("b", "PANNE", 1), datee("a", "PANNE", 1)]);
    expect(range.map((a) => a.cle)).toEqual(["a", "b"]);
  });

  it("compte les trois gravités, même à zéro", () => {
    expect(parGravite([datee("a", "PANNE", 1)])).toEqual({
      PANNE: 1,
      DEGAT: 0,
      A_SURVEILLER: 0,
    });
  });
});
