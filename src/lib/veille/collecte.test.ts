import { describe, expect, it } from "vitest";
import { avecDelai, executer, messageDe } from "./collecte";

describe("un collecteur qui aboutit", () => {
  it("rend ses données et ses anomalies", async () => {
    const resultat = await executer("essai", async () => ({
      donnees: { compte: 3 },
      anomalies: [],
    }));
    expect(resultat.etat).toBe("FAIT");
    if (resultat.etat !== "FAIT") return;
    expect(resultat.donnees.compte).toBe(3);
  });

  it("mesure sa durée sans lire l’horloge du système", async () => {
    let t = 1000;
    const resultat = await executer(
      "essai",
      async () => {
        t = 4500;
        return { donnees: null, anomalies: [] };
      },
      () => t,
    );
    expect(resultat.dureeMs).toBe(3500);
  });
});

describe("un collecteur qui tombe", () => {
  /** L'exigence du brief : une famille qui échoue n'emporte pas les autres. */
  it("ne lève pas, et dit pourquoi", async () => {
    const resultat = await executer("cohérence", async () => {
      throw new Error("la table a disparu");
    });
    expect(resultat.etat).toBe("TOMBE");
    if (resultat.etat !== "TOMBE") return;
    expect(resultat.raison).toBe("la table a disparu");
    expect(resultat.nom).toBe("cohérence");
  });

  it("survit à ce qui n’est pas une Error", async () => {
    const resultat = await executer("essai", async () => {
      throw "juste une chaîne";
    });
    expect(resultat.etat).toBe("TOMBE");
    if (resultat.etat !== "TOMBE") return;
    expect(resultat.raison).toBe("juste une chaîne");
  });

  it("les autres continuent", async () => {
    const resultats = await Promise.all([
      executer("a", async () => ({ donnees: 1, anomalies: [] })),
      executer("b", async () => {
        throw new Error("tombé");
      }),
      executer("c", async () => ({ donnees: 3, anomalies: [] })),
    ]);
    expect(resultats.map((r) => r.etat)).toEqual(["FAIT", "TOMBE", "FAIT"]);
  });

  /**
   * ⚠️ La pile ne doit jamais remonter : elle porte des chemins de fichiers et
   * parfois des valeurs, et le rapport part par courriel.
   */
  it("ne rapporte que le message, jamais la pile", async () => {
    const erreur = new Error("échec");
    const resultat = await executer("essai", async () => {
      throw erreur;
    });
    if (resultat.etat !== "TOMBE") throw new Error("attendu TOMBE");
    expect(resultat.raison).not.toContain("at ");
    expect(resultat.raison).not.toContain(".ts:");
  });
});

describe("le délai", () => {
  it("laisse passer ce qui répond à temps", async () => {
    await expect(avecDelai(async () => "fait", 1000, "la page")).resolves.toBe("fait");
  });

  it("coupe ce qui ne répond pas, et le dit en clair", async () => {
    await expect(
      avecDelai(
        (signal) =>
          new Promise((_, rejeter) => {
            signal.addEventListener("abort", () => rejeter(new Error("aborted")));
          }),
        20,
        "L’accueil",
      ),
    ).rejects.toThrow(/L’accueil n’a pas répondu en 0 s/);
  });

  it("laisse passer une vraie erreur sans la déguiser en délai", async () => {
    await expect(
      avecDelai(
        async () => {
          throw new Error("500 côté serveur");
        },
        1000,
        "La page",
      ),
    ).rejects.toThrow("500 côté serveur");
  });
});

describe("le message d’une erreur", () => {
  it("prend le message d’une Error", () => {
    expect(messageDe(new Error("cassé"))).toBe("cassé");
  });

  it("se débrouille du reste", () => {
    expect(messageDe(42)).toBe("42");
    expect(messageDe(null)).toBe("null");
  });
});
