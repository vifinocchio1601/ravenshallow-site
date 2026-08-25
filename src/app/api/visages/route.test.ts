import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { normaliserVisage } from "@/lib/dossier/schema";

/** Interroge le registre comme le fait le formulaire, nom déjà normalisé. */
async function interroger(nom: string) {
  const url = `http://localhost/api/visages?nom=${encodeURIComponent(
    normaliserVisage(nom),
  )}`;
  const reponse = await GET(new Request(url));
  return { statut: reponse.status, corps: await reponse.json() };
}

const environnementInitial = { ...process.env };

afterEach(() => {
  process.env = { ...environnementInitial };
});

describe("registre des visages", () => {
  it("signale un visage déjà porté", async () => {
    const { statut, corps } = await interroger("Anya Taylor-Joy");
    expect(statut).toBe(200);
    expect(corps.pris).toBe(true);
  });

  it("reconnaît le même visage quelle que soit la graphie", async () => {
    for (const graphie of ["ANYA TAYLOR-JOY", "anya  taylor joy"]) {
      const { corps } = await interroger(graphie);
      expect(corps.pris).toBe(true);
    }
  });

  it("laisse passer un visage libre", async () => {
    const { corps } = await interroger("Saoirse Ronan");
    expect(corps.pris).toBe(false);
  });

  it("ne bloque pas sur un nom vide", async () => {
    const reponse = await GET(new Request("http://localhost/api/visages"));
    expect(reponse.status).toBe(200);
    expect((await reponse.json()).pris).toBe(false);
  });

  it("refuse de répondre en production sans base, plutôt que de dire « libre »", async () => {
    // Un registre injoignable qui répondrait « disponible » laisserait passer
    // des doublons : il doit échouer fermé.
    process.env = { ...environnementInitial, NODE_ENV: "production" };
    delete process.env.DATABASE_URL;

    const { statut, corps } = await interroger("N’importe Qui");
    expect(statut).toBe(503);
    expect(corps.pris).toBeUndefined();
  });
});
