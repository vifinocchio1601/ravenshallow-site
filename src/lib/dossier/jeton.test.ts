import { beforeEach, describe, expect, it } from "vitest";
import { creerJeton, lienDossier, verifierJeton } from "./jeton";

beforeEach(() => {
  process.env.AUTH_SECRET = "secret-de-test-ravenshallow";
});

describe("jeton d’accès au dossier", () => {
  it("se relit lui-même", async () => {
    const jeton = await creerJeton("compte-1");
    const resultat = await verifierJeton(jeton);
    expect(resultat.valide).toBe(true);
    if (resultat.valide) expect(resultat.contenu.id).toBe("compte-1");
  });

  it("refuse un jeton absent", async () => {
    expect(await verifierJeton(undefined)).toEqual({
      valide: false,
      raison: "absent",
    });
  });

  it("refuse un jeton malformé", async () => {
    expect((await verifierJeton("nimportequoi")).valide).toBe(false);
  });

  it("refuse une charge modifiée", async () => {
    const jeton = await creerJeton("compte-1");
    const [charge, signature] = jeton.split(".");
    const autre = await creerJeton("compte-2");
    const chargeAutre = autre.split(".")[0];

    // On garde la signature d’origine sur une charge qui n’est pas la sienne.
    const falsifie = `${chargeAutre}.${signature}`;
    expect(falsifie).not.toBe(jeton);
    expect(await verifierJeton(falsifie)).toEqual({
      valide: false,
      raison: "signature",
    });
    expect(charge).toBeTruthy();
  });

  it("refuse une signature modifiée", async () => {
    const jeton = await creerJeton("compte-1");
    const falsifie = jeton.slice(0, -2) + (jeton.endsWith("aa") ? "bb" : "aa");
    expect((await verifierJeton(falsifie)).valide).toBe(false);
  });

  it("refuse un jeton expiré", async () => {
    const jeton = await creerJeton("compte-1", 0, -1);
    expect(await verifierJeton(jeton)).toEqual({
      valide: false,
      raison: "expire",
    });
  });

  it("refuse tout jeton si le secret change", async () => {
    const jeton = await creerJeton("compte-1");
    process.env.AUTH_SECRET = "un-autre-secret";
    expect((await verifierJeton(jeton)).valide).toBe(false);
  });

  it("ne met aucune donnée personnelle dans le jeton", async () => {
    const jeton = await creerJeton("compte-1");
    const charge = Buffer.from(jeton.split(".")[0], "base64url").toString();
    expect(charge).not.toMatch(/@/);
    expect(Object.keys(JSON.parse(charge)).sort()).toEqual([
      "expire",
      "id",
      "v",
    ]);
  });

  it("transporte la version des liens, pour pouvoir les périmer", async () => {
    const jeton = await creerJeton("compte-1", 3);
    const resultat = await verifierJeton(jeton);
    expect(resultat.valide).toBe(true);
    // La vérification de la version se fait au chargement du dossier : le
    // jeton la transporte, il ne la juge pas.
    if (resultat.valide) expect(resultat.contenu.v).toBe(3);
  });

  it("construit un lien propre quelle que soit la base", async () => {
    const jeton = await creerJeton("compte-1");
    expect(lienDossier(jeton, "https://ravenshallow.fr/")).toBe(
      `https://ravenshallow.fr/dossier/${jeton}`,
    );
  });
});
