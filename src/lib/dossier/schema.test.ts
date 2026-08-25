import { describe, expect, it } from "vitest";
import {
  champsManquants,
  normaliserVisage,
  pourValidation,
  REGEX_PRENOM_NOM,
  REGLES_MOT_DE_PASSE,
  schemaDossier,
} from "./schema";
import {
  AGE_MINIMUM_JOUEUR,
  BIOGRAPHIE_MINIMUM,
  MESSAGES,
} from "./constantes";

/** Un dossier complet et valide, dont chaque test ne dégrade qu’un champ. */
function dossierValide(modifications: Record<string, unknown> = {}) {
  return {
    email: "sigrid@kaldvik.no",
    ageReel: 27,
    motDePasse: "Brume2026",
    confirmation: "Brume2026",
    limitesEcriture: [],
    limitesAutres: "",
    prenomNom: "Elena V. Blackwood",
    genre: "FEMININ",
    famille: "MIXTE",
    portraitType: "IA_ILLUSTRATION",
    acteurNom: "",
    portrait: "data:image/jpeg;base64,AAAA",
    biographie: "n".repeat(BIOGRAPHIE_MINIMUM),
    qualites: ["Observatrice", "Tenace", "Loyale"],
    defauts: ["Rancunière", "Secrète", "Impatiente"],
    plusGrandePeur: "Que la mer reprenne ce qu’elle a laissé",
    certification104: true,
    reglementAccepteLe: "2026-08-25T09:00:00.000Z",
    ...modifications,
  };
}

/** Messages d’erreur remontés pour un champ donné. */
function erreursDe(valeurs: Record<string, unknown>, champ: string): string[] {
  const resultat = schemaDossier.safeParse(valeurs);
  if (resultat.success) return [];
  return resultat.error.issues
    .filter((probleme) => probleme.path[0] === champ)
    .map((probleme) => probleme.message);
}

describe("le dossier de référence", () => {
  it("passe la validation", () => {
    expect(schemaDossier.safeParse(dossierValide()).success).toBe(true);
  });
});

describe("format du prénom et du nom", () => {
  it.each([
    "Elena Blackwood",
    "Elena V. Blackwood",
    "Éléonore Kaldenor",
    "Sigrid Ødegård",
  ])("accepte « %s »", (nom) => {
    expect(REGEX_PRENOM_NOM.test(nom)).toBe(true);
  });

  it.each([
    ["elena blackwood", "sans majuscules"],
    ["Elena", "un seul mot"],
    ["ELENA BLACKWOOD", "tout en capitales"],
    ["Elena de la Fontaine", "avec une particule"],
    ["Elena V Blackwood", "initiale sans point"],
    ["E. Blackwood", "prénom réduit à une initiale"],
    ["Elena  Blackwood", "double espace"],
    ["Elena Blackwood ", "espace final"],
  ])("refuse « %s » (%s)", (nom) => {
    expect(REGEX_PRENOM_NOM.test(nom)).toBe(false);
  });

  it("renvoie le message attendu", () => {
    expect(erreursDe(dossierValide({ prenomNom: "elena" }), "prenomNom")).toContain(
      MESSAGES.prenomNom,
    );
  });

  /**
   * Limite connue du format imposé : une majuscule au milieu d’un mot n’est
   * pas prévue. Les prénoms composés et les noms à apostrophe sont donc
   * refusés. Ces cas sont figés ici pour que la limite soit visible, et pour
   * que le jour où le format évoluera, ces tests le signalent.
   */
  it.each([
    "Jean-Luc Blackwood",
    "Marie-Claire Nattmor",
    "Anne-Sophie Kern",
    "Elena O’Brien",
  ])("refuse « %s » — majuscule interne, limite du format", (nom) => {
    expect(REGEX_PRENOM_NOM.test(nom)).toBe(false);
  });

  it("tolère les espaces autour, que le schéma retire avant de vérifier", () => {
    expect(
      schemaDossier.safeParse(dossierValide({ prenomNom: "  Elena Blackwood  " }))
        .success,
    ).toBe(true);
  });
});

describe("biographie — minimum de 700 signes", () => {
  it("refuse 699 signes", () => {
    const valeurs = dossierValide({
      biographie: "n".repeat(BIOGRAPHIE_MINIMUM - 1),
    });
    expect(erreursDe(valeurs, "biographie")).toContain(MESSAGES.biographie);
  });

  it("accepte 700 signes tout juste", () => {
    const valeurs = dossierValide({
      biographie: "n".repeat(BIOGRAPHIE_MINIMUM),
    });
    expect(erreursDe(valeurs, "biographie")).toHaveLength(0);
  });

  it("ne se laisse pas remplir d’espaces", () => {
    const valeurs = dossierValide({
      biographie: "n".repeat(50) + " ".repeat(BIOGRAPHIE_MINIMUM),
    });
    expect(erreursDe(valeurs, "biographie")).toContain(MESSAGES.biographie);
  });
});

describe("âge réel — 16 ans minimum", () => {
  it("refuse 15 ans", () => {
    expect(erreursDe(dossierValide({ ageReel: 15 }), "ageReel")).toContain(
      MESSAGES.ageReel,
    );
  });

  it("accepte 16 ans", () => {
    expect(erreursDe(dossierValide({ ageReel: AGE_MINIMUM_JOUEUR }), "ageReel"))
      .toHaveLength(0);
  });

  it("refuse un champ vide", () => {
    const valeurs = pourValidation(
      { ...dossierValide(), ageReel: "" },
      "2026-08-25T09:00:00.000Z",
    );
    expect(erreursDe(valeurs, "ageReel").length).toBeGreaterThan(0);
  });

  it("refuse un âge décimal", () => {
    expect(erreursDe(dossierValide({ ageReel: 16.5 }), "ageReel").length)
      .toBeGreaterThan(0);
  });

  it("n’expose aucun champ où stocker l’âge : seul le booléen survit", () => {
    const resultat = schemaDossier.safeParse(dossierValide({ ageReel: 42 }));
    expect(resultat.success).toBe(true);
    // Le schéma transporte l’âge, la route n’en dérive qu’un booléen.
    if (resultat.success) {
      expect(resultat.data.ageReel >= AGE_MINIMUM_JOUEUR).toBe(true);
    }
  });
});

describe("règles du mot de passe", () => {
  it.each([
    ["Brume2026", true, true, true],
    ["brume2026", true, false, true],
    ["BrumeBrume", true, true, false],
    ["Brum20", false, true, true],
  ])(
    "« %s » — longueur %s, majuscule %s, chiffre %s",
    (valeur, longueur, majuscule, chiffre) => {
      expect(REGLES_MOT_DE_PASSE.longueur(valeur as string)).toBe(longueur);
      expect(REGLES_MOT_DE_PASSE.majuscule(valeur as string)).toBe(majuscule);
      expect(REGLES_MOT_DE_PASSE.chiffre(valeur as string)).toBe(chiffre);
    },
  );

  it("refuse un mot de passe auquel il manque une règle", () => {
    for (const mauvais of ["brume2026", "BrumeBrume", "Brum20"]) {
      const valeurs = dossierValide({
        motDePasse: mauvais,
        confirmation: mauvais,
      });
      expect(erreursDe(valeurs, "motDePasse")).toContain(MESSAGES.motDePasse);
    }
  });

  it("accepte une majuscule accentuée", () => {
    const valeurs = dossierValide({
      motDePasse: "Étoile2026",
      confirmation: "Étoile2026",
    });
    expect(erreursDe(valeurs, "motDePasse")).toHaveLength(0);
  });

  it("exige que la confirmation corresponde", () => {
    const valeurs = dossierValide({ confirmation: "Brume2027" });
    expect(erreursDe(valeurs, "confirmation")).toContain(MESSAGES.confirmation);
  });
});

describe("registre des visages", () => {
  it.each([
    ["Anya Taylor-Joy", "anya taylor joy"],
    ["  ANYA   TAYLOR-JOY  ", "anya taylor joy"],
    ["Timothée Chalamet", "timothee chalamet"],
    ["Saoirse Ronan", "saoirse ronan"],
    ["Éléonore d’Ürsé", "eleonore d urse"],
  ])("normalise « %s » en « %s »", (saisi, attendu) => {
    expect(normaliserVisage(saisi)).toBe(attendu);
  });

  it("fait converger deux graphies du même visage", () => {
    expect(normaliserVisage("Anya Taylor-Joy")).toBe(
      normaliserVisage("anya  taylor joy"),
    );
  });

  it("exige le nom de l’acteur quand le portrait est une photographie", () => {
    const valeurs = dossierValide({ portraitType: "ACTEUR", acteurNom: "" });
    expect(erreursDe(valeurs, "acteurNom")).toContain(MESSAGES.acteurRequis);
  });

  it("ne le réclame pas pour une illustration", () => {
    const valeurs = dossierValide({
      portraitType: "IA_ILLUSTRATION",
      acteurNom: "",
    });
    expect(schemaDossier.safeParse(valeurs).success).toBe(true);
  });
});

describe("blocage de l’envoi — champs manquants", () => {
  it("ne signale rien quand le dossier est complet", () => {
    expect(champsManquants(dossierValide())).toEqual([]);
  });

  it.each([
    ["e-mail", { email: "pas-un-email" }],
    ["âge réel", { ageReel: 15 }],
    ["nom de l’élève", { prenomNom: "elena" }],
    ["biographie", { biographie: "trop court" }],
    ["portrait", { portrait: "" }],
    ["peur", { plusGrandePeur: "" }],
    ["certification 10.4", { certification104: false }],
  ])("signale « %s »", (attendu, degradation) => {
    expect(champsManquants(dossierValide(degradation))).toContain(attendu);
  });

  it("signale les qualités et les défauts en bloc, pas champ par champ", () => {
    const valeurs = dossierValide({
      qualites: ["Observatrice", "", "Loyale"],
      defauts: ["", "", ""],
    });
    const manquants = champsManquants(valeurs);
    expect(manquants).toContain("qualités");
    expect(manquants).toContain("défauts");
    expect(manquants.filter((n) => n === "défauts")).toHaveLength(1);
  });

  it("signale la confirmation même si un autre champ est déjà invalide", () => {
    // Zod n’exécute ses `.refine()` qu’une fois le reste valide : sans le
    // contrôle explicite, la confirmation passerait inaperçue.
    const valeurs = dossierValide({
      email: "pas-un-email",
      confirmation: "autre-chose",
    });
    expect(champsManquants(valeurs)).toContain("confirmation");
  });

  it("signale le nom de l’acteur même si un autre champ est déjà invalide", () => {
    const valeurs = dossierValide({
      email: "pas-un-email",
      portraitType: "ACTEUR",
      acteurNom: "",
    });
    expect(champsManquants(valeurs)).toContain("nom de l’acteur");
  });

  it("bloque l’envoi quand le visage est déjà pris, dossier complet par ailleurs", () => {
    const valeurs = dossierValide({
      portraitType: "ACTEUR",
      acteurNom: "Anya Taylor-Joy",
    });
    expect(champsManquants(valeurs)).toEqual([]);
    expect(champsManquants(valeurs, { visagePris: true })).toEqual([
      "nom de l’acteur",
    ]);
  });

  it("exige l’acceptation du règlement", () => {
    const valeurs = pourValidation({ ...dossierValide(), ageReel: "27" }, null);
    expect(schemaDossier.safeParse(valeurs).success).toBe(false);
  });
});

describe("pourValidation", () => {
  it("transforme l’âge saisi en nombre", () => {
    const sortie = pourValidation({ ageReel: "27" }, "2026-08-25T09:00:00.000Z");
    expect(sortie.ageReel).toBe(27);
  });

  it("transforme un âge vide en NaN, pas en zéro", () => {
    const sortie = pourValidation({ ageReel: "" }, null);
    expect(Number.isNaN(sortie.ageReel)).toBe(true);
  });
});
