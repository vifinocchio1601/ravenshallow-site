import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { BIOGRAPHIE_MINIMUM, MESSAGES } from "@/lib/dossier/constantes";

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

async function envoyer(corps: unknown) {
  const reponse = await POST(
    new Request("http://localhost/api/dossier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof corps === "string" ? corps : JSON.stringify(corps),
    }),
  );
  return { statut: reponse.status, corps: await reponse.json() };
}

function champsEnErreur(details: { champ: string }[]) {
  return details.map((d) => d.champ.split(".")[0]);
}

describe("envoi du dossier — revalidation côté serveur", () => {
  it("refuse un corps illisible", async () => {
    const { statut } = await envoyer("ceci n’est pas du JSON");
    expect(statut).toBe(400);
  });

  it("refuse un dossier vide", async () => {
    const { statut } = await envoyer({});
    expect(statut).toBe(422);
  });

  it.each([
    ["un âge de 15 ans", { ageReel: 15 }, "ageReel"],
    ["un nom mal formé", { prenomNom: "elena" }, "prenomNom"],
    ["une biographie trop courte", { biographie: "trop court" }, "biographie"],
    ["un mot de passe sans chiffre", { motDePasse: "BrumeBrume", confirmation: "BrumeBrume" }, "motDePasse"],
    ["un portrait absent", { portrait: "" }, "portrait"],
    ["la certification 10.4 décochée", { certification104: false }, "certification104"],
    ["un défaut vide", { defauts: ["Rancunière", "", "Impatiente"] }, "defauts"],
  ])("rejette %s", async (_cas, degradation, champAttendu) => {
    const { statut, corps } = await envoyer(dossierValide(degradation));
    expect(statut).toBe(422);
    expect(champsEnErreur(corps.details)).toContain(champAttendu);
  });

  it("rejette une confirmation qui ne correspond pas", async () => {
    const { statut, corps } = await envoyer(
      dossierValide({ confirmation: "Brume2027" }),
    );
    expect(statut).toBe(422);
    expect(champsEnErreur(corps.details)).toContain("confirmation");
  });

  it("rejette un portrait d’acteur sans nom d’acteur", async () => {
    const { statut, corps } = await envoyer(
      dossierValide({ portraitType: "ACTEUR", acteurNom: "" }),
    );
    expect(statut).toBe(422);
    expect(champsEnErreur(corps.details)).toContain("acteurNom");
  });

  it("répond en français", async () => {
    const { corps } = await envoyer(dossierValide({ ageReel: 15 }));
    const messages = corps.details.map((d: { message: string }) => d.message);
    expect(messages).toContain(MESSAGES.ageReel);
  });

  it("n’enregistre rien tant que la base est absente, dossier valide compris", async () => {
    // Le dossier passe la validation : c’est bien le stockage qui manque,
    // et le joueur doit l’apprendre plutôt que de croire son envoi parti.
    const { statut, corps } = await envoyer(dossierValide());
    expect(statut).toBe(503);
    expect(corps.erreur).toBe(MESSAGES.baseIndisponible);
  });
});
