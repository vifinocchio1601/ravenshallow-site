import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Le partenariat, **SUR LA VRAIE BASE**.
 *
 *   npm run partenariat:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l'exclut de
 * `npm test` **à dessein** : la suite ordinaire ne doit jamais toucher la
 * base, qui est celle de production tant qu'il n'existe pas de branche
 * d'essai.
 *
 * Ce qui ne peut se vérifier QU'ici, et que `schema.test.ts` ne verra jamais :
 * les dix garanties de `20260828190000_partenariats`, **l'index unique
 * partiel** qui interdit le doublon sans interdire de renouer, le retrait qui
 * n'efface rien, et le frein du formulaire public éprouvé pour de bon.
 *
 * ⚠️ **Le ménage vise le suffixe `.ravenshallow.invalid` des adresses, et rien
 * d'autre.** Il n'y a pas de compte à qui rattacher ces lignes ; un effacement
 * plus large emporterait les partenaires du joueur.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. Il doit être posé AVANT que `@/lib/prisma` ne soit
// chargé — d'où les imports dynamiques.
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const coupure = nette.indexOf("=");
  process.env[nette.slice(0, coupure).trim()] ??= nette
    .slice(coupure + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const { prisma } = await import("@/lib/prisma");
const {
  ajouterPartenaire,
  corrigerPartenaire,
  deposerDemande,
  listerDemandes,
  listerPartenaires,
  listerPourAdministration,
  remettrePartenaire,
  retirerPartenaire,
} = await import("./depot");
const { DEMANDES_PAR_HEURE } = await import("./limites");

/** Le domaine qui distingue ce que cet essai a écrit. */
const DOMAINE = "ravenshallow.invalid";

const jourDeCeJour = () => new Date().toISOString().slice(0, 10);

async function ajouter(nom: string, hote: string, banniere?: string) {
  const pose = await ajouterPartenaire({
    nom,
    url: `https://${hote}.${DOMAINE}`,
    banniere: banniere ?? "",
    description: "Posé par l’essai en base. À effacer.",
    noue: jourDeCeJour(),
  });
  if (!pose.ok) throw new Error(`l’ajout a échoué : ${pose.message}`);
  return pose.valeur.id;
}

/**
 * Le ménage. **Deux tables, deux conditions étroites**, et jamais un
 * `deleteMany({})` : la base porte de vraies données du joueur.
 */
async function menage() {
  await prisma.demandePartenariat.deleteMany({
    where: { courriel: { endsWith: `@${DOMAINE}` } },
  });
  await prisma.partenaire.deleteMany({
    where: { url: { contains: DOMAINE } },
  });
}

afterAll(async () => {
  await menage();
  await prisma.$disconnect();
});

describe("le bloc de partenaires", () => {
  it("ajoute, affiche dans l’ordre alphabétique, et ne classe pas par date", async () => {
    await menage();
    // Posés à l'envers de l'alphabet : si l'ordre était celui de l'ajout,
    // « Zephyr » sortirait le premier.
    await ajouter("ZZ Essai Zephyr", "zephyr");
    await ajouter("AA Essai Aurore", "aurore");

    const noms = (await listerPartenaires())
      .filter((p) => p.url.includes(DOMAINE))
      .map((p) => p.nom);
    expect(noms).toEqual(["AA Essai Aurore", "ZZ Essai Zephyr"]);
  });

  it("refuse deux fois la même adresse au bloc", async () => {
    await menage();
    await ajouter("AA Essai Aurore", "aurore");

    // C'est l'index unique partiel qui parle, et le dépôt traduit son refus.
    const second = await ajouterPartenaire({
      nom: "AA Essai Aurore, encore",
      url: `https://aurore.${DOMAINE}`,
      banniere: "",
      description: null,
      noue: jourDeCeJour(),
    });
    expect(second.ok).toBe(false);
  });

  it("laisse renouer avec un partenaire retiré — c’est tout le sujet du partiel", async () => {
    await menage();
    const id = await ajouter("AA Essai Aurore", "aurore");
    await retirerPartenaire(id);

    // Sa ligne est toujours là : sans le `WHERE "retireLe" IS NULL`, cette
    // adresse serait grillée pour toujours.
    const renoue = await ajouterPartenaire({
      nom: "AA Essai Aurore, retour",
      url: `https://aurore.${DOMAINE}`,
      banniere: "",
      description: null,
      noue: jourDeCeJour(),
    });
    expect(renoue.ok).toBe(true);
  });

  it("retire sans effacer, et remet", async () => {
    await menage();
    const id = await ajouter("AA Essai Aurore", "aurore");

    await retirerPartenaire(id);
    expect(
      (await listerPartenaires()).some((p) => p.id === id),
    ).toBe(false);

    const enAdministration = (await listerPourAdministration()).find(
      (p) => p.id === id,
    );
    expect(enAdministration?.retireLe).not.toBeNull();
    expect(enAdministration?.retirePar).not.toBeNull();

    const remis = await remettrePartenaire(id);
    expect(remis.ok).toBe(true);
    expect((await listerPartenaires()).some((p) => p.id === id)).toBe(true);
  });

  it("marque la correction, sans toucher au reste", async () => {
    await menage();
    const id = await ajouter("AA Essai Aurore", "aurore");

    const corrige = await corrigerPartenaire(id, {
      nom: "AA Essai Aurore (corrigé)",
      url: `https://aurore.${DOMAINE}`,
      banniere: `https://images.${DOMAINE}/b.png`,
      description: "Corrigé par l’essai.",
      noue: jourDeCeJour(),
    });
    expect(corrige.ok).toBe(true);

    const relu = (await listerPourAdministration()).find((p) => p.id === id);
    expect(relu?.nom).toBe("AA Essai Aurore (corrigé)");
    expect(relu?.banniereUrl).toBe(`https://images.${DOMAINE}/b.png`);
    expect(relu?.modifieLe).not.toBeNull();
  });
});

describe("ce que la base refuse elle-même", () => {
  /**
   * Chaque garantie est éprouvée **dans une transaction annulée** : la base
   * refuse bien ce qu'elle doit refuser, et rien ne reste écrit. Même procédé
   * que pour les migrations du Grand Hall et du calendrier.
   */
  async function refusee(sql: string) {
    let refus = false;
    try {
      await prisma.$transaction(async (t) => {
        await t.$executeRawUnsafe(sql);
        throw new Error("ANNULATION");
      });
    } catch (erreur) {
      refus = !(erreur instanceof Error && erreur.message === "ANNULATION");
    }
    return refus;
  }

  const ligne = (colonnes: string, valeurs: string) =>
    `INSERT INTO "partenaires" ("id", ${colonnes}, "majLe") VALUES (gen_random_uuid()::text, ${valeurs}, NOW())`;

  const base = `"nom", "url", "noueLe"`;

  it("refuse un nom fait de blancs — btrim ne suffirait pas", async () => {
    // ⚠️ `btrim` ne retire que les ESPACES : la contrainte s'écrit
    // `~ '[^[:space:]]'`. Piège payé sur les corbeaux.
    expect(await refusee(ligne(base, `E'\\n\\n\\t ', 'https://a.invalid', NOW()`))).toBe(true);
  });

  it("refuse une adresse en clair", async () => {
    expect(await refusee(ligne(base, `'Essai', 'http://a.invalid', NOW()`))).toBe(true);
  });

  it("refuse une bannière en clair", async () => {
    expect(
      await refusee(
        ligne(
          `${base}, "banniereUrl"`,
          `'Essai', 'https://a.invalid', NOW(), 'http://img.invalid/b.png'`,
        ),
      ),
    ).toBe(true);
  });

  it("refuse une description vide de sens", async () => {
    expect(
      await refusee(
        ligne(
          `${base}, "description"`,
          `'Essai', 'https://a.invalid', NOW(), '   '`,
        ),
      ),
    ).toBe(true);
  });

  it("refuse un retrait à moitié posé", async () => {
    expect(
      await refusee(
        ligne(
          `${base}, "retireLe"`,
          `'Essai', 'https://a.invalid', NOW(), NOW()`,
        ),
      ),
    ).toBe(true);
  });

  it("refuse un courriel qui n’en est pas un", async () => {
    expect(
      await refusee(
        `INSERT INTO "demandes_partenariat" ("id", "nomDuForum", "url", "courriel", "message") VALUES (gen_random_uuid()::text, 'Essai', 'https://a.invalid', 'pas-un-courriel', 'un mot assez long pour passer')`,
      ),
    ).toBe(true);
  });

  it("refuse une demande acceptée sans date de traitement", async () => {
    // L'accord entre la suite et sa date, dans les deux sens.
    expect(
      await refusee(
        `INSERT INTO "demandes_partenariat" ("id", "nomDuForum", "url", "courriel", "message", "suite") VALUES (gen_random_uuid()::text, 'Essai', 'https://a.invalid', 'a@b.invalid', 'un mot assez long pour passer', 'ACCEPTEE')`,
      ),
    ).toBe(true);
  });

  it("refuse une demande en attente qui porterait une date de traitement", async () => {
    expect(
      await refusee(
        `INSERT INTO "demandes_partenariat" ("id", "nomDuForum", "url", "courriel", "message", "traiteLe") VALUES (gen_random_uuid()::text, 'Essai', 'https://a.invalid', 'a@b.invalid', 'un mot assez long pour passer', NOW())`,
      ),
    ).toBe(true);
  });
});

describe("le formulaire public", () => {
  const demande = (surcharge: Record<string, unknown> = {}) => ({
    nom: "Essai Partenariat",
    url: `https://demande.${DOMAINE}`,
    courriel: `essai.demande@${DOMAINE}`,
    message: "Bonjour, un partenariat vous tenterait ? Nous jouons à côté.",
    pot: "",
    ouvertLe: String(Date.now() - 60_000),
    ...surcharge,
  });

  it("dépose une demande ordinaire", async () => {
    await menage();
    expect(await deposerDemande(demande())).toEqual({ ok: true });

    const nôtres = (await listerDemandes()).filter((d) =>
      d.courriel.endsWith(`@${DOMAINE}`),
    );
    expect(nôtres).toHaveLength(1);
    expect(nôtres[0]?.suite).toBe("EN_ATTENTE");
    expect(nôtres[0]?.traiteLe).toBeNull();
  });

  it("avale le robot SANS le lui dire, et n’écrit rien", async () => {
    await menage();
    // ⚠️ La réponse est celle d'un envoi réussi : un refus explicite donnerait
    // le mode d'emploi du contournement. C'est `PART_DANS_LE_VIDE` appliqué
    // aux machines — et la seule preuve est l'absence de ligne.
    expect(await deposerDemande(demande({ pot: "https://spam.invalid" }))).toEqual({
      ok: true,
    });
    expect(
      (await listerDemandes()).filter((d) => d.courriel.endsWith(`@${DOMAINE}`)),
    ).toHaveLength(0);
  });

  it("avale un envoi instantané, et n’écrit rien non plus", async () => {
    await menage();
    expect(
      await deposerDemande(demande({ ouvertLe: String(Date.now()) })),
    ).toEqual({ ok: true });
    expect(
      (await listerDemandes()).filter((d) => d.courriel.endsWith(`@${DOMAINE}`)),
    ).toHaveLength(0);
  });

  it("refuse une saisie qui ne tient pas, et le dit", async () => {
    await menage();
    const suite = await deposerDemande(demande({ url: "http://clair.invalid" }));
    expect(suite.ok).toBe(false);
    if (suite.ok) return;
    expect(suite.raison).toBe("INVALIDE");
  });

  it("fait attendre au-delà du plafond horaire — sans jamais refuser", async () => {
    await menage();
    // Le plafond est **global** : ces lignes-ci suffisent à le remplir, quelle
    // que soit leur provenance. C'est le prix de ne conserver aucune IP.
    for (let i = 0; i < DEMANDES_PAR_HEURE; i += 1) {
      await deposerDemande(
        demande({ courriel: `essai.plafond${i}@${DOMAINE}` }),
      );
    }

    const suite = await deposerDemande(
      demande({ courriel: `essai.detrop@${DOMAINE}` }),
    );
    expect(suite.ok).toBe(false);
    if (suite.ok) return;
    // ⚠️ `ATTENDRE`, jamais un refus : ce qui est refusé ne partira jamais,
    // ceci partira tout à l'heure.
    expect(suite.raison).toBe("ATTENDRE");
  });
});
