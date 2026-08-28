import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Le calendrier, **SUR LA VRAIE BASE**.
 *
 *   npm run calendrier:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l'exclut de
 * `npm test` **à dessein** : la suite ordinaire ne doit jamais toucher la
 * base, qui est celle de production tant qu'il n'existe pas de branche
 * d'essai.
 *
 * Ce qui ne peut se vérifier QU'ici, et que `schema.test.ts` ne verra jamais :
 * les six garanties de `20260828180000_calendrier`, le partage entre « à
 * venir » et « déjà passé », le retrait qui n'efface rien, et surtout que
 * **seule une épreuve remonte au bureau**.
 *
 * ⚠️ **Le ménage vise le préfixe de titre `ESSAI — `, et rien d'autre.** Il
 * n'y a pas de compte à qui rattacher ces lignes : c'est le titre qui les
 * distingue, et un effacement plus large emporterait les dates du joueur.
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
  corrigerEvenement,
  lireLeCalendrier,
  listerPourAdministration,
  poserEvenement,
  prochaineEpreuve,
  remettreEvenement,
  retirerEvenement,
} = await import("./depot");

/** Le préfixe qui distingue ce que cet essai a écrit. */
const MARQUE = "ESSAI — ";

/** Un jour saisi tel que le formulaire l'envoie, décalé de N jours. */
function dans(jours: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + jours);
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

async function poser(titre: string, nature: string, debut: string, fin?: string) {
  const lu = await poserEvenement({
    titre: `${MARQUE}${titre}`,
    description: "Posé par l’essai en base. À effacer.",
    nature,
    debut,
    fin: fin ?? null,
  });
  if (!lu.ok) throw new Error(`la pose a échoué : ${lu.message}`);
  return lu.valeur.id;
}

afterAll(async () => {
  // Par le préfixe exact, et rien d'autre : les dates du joueur restent.
  await prisma.evenement.deleteMany({
    where: { titre: { startsWith: MARQUE } },
  });
  await prisma.$disconnect();
});

describe("ce que la base refuse d’elle-même", () => {
  /**
   * Les six garanties de `20260828180000_calendrier`. Chacune a été éprouvée
   * en introduisant la faute : elle tombe bien.
   */
  it("refuse un titre vide, ou fait de blancs", async () => {
    // ⚠️ `btrim` de Postgres ne retire que les ESPACES : un titre fait de six
    // retours à la ligne passerait une contrainte écrite avec lui. D'où
    // `~ '[^[:space:]]'`. Le piège a été payé sur les corbeaux.
    await expect(
      prisma.evenement.create({
        data: {
          titre: "\n\t  \n",
          description: "x",
          nature: "FETE",
          debuteLe: new Date(),
          posePar: "Essai",
        },
      }),
    ).rejects.toThrow();
  });

  it("refuse une description vide", async () => {
    await expect(
      prisma.evenement.create({
        data: {
          titre: `${MARQUE}sans description`,
          description: "   ",
          nature: "FETE",
          debuteLe: new Date(),
          posePar: "Essai",
        },
      }),
    ).rejects.toThrow();
  });

  /**
   * ⚠️ **Cette contrainte compare deux dates du MÊME formulaire.** C'est la
   * seule raison pour laquelle elle est sûre : le salon a payé le piège
   * inverse le 28 août 2026, en comparant l'horloge de Postgres à celle de
   * Vercel — quelques millisecondes d'écart, et un clic normal tombait en
   * erreur 500.
   */
  it("refuse une fin antérieure au début, et accepte le même jour", async () => {
    const debut = new Date(2026, 11, 12, 12, 0, 0, 0);
    const veille = new Date(2026, 11, 11, 12, 0, 0, 0);

    await expect(
      prisma.evenement.create({
        data: {
          titre: `${MARQUE}fin avant début`,
          description: "x",
          nature: "FETE",
          debuteLe: debut,
          finitLe: veille,
          posePar: "Essai",
        },
      }),
    ).rejects.toThrow();

    const memeJour = await prisma.evenement.create({
      data: {
        titre: `${MARQUE}fin le même jour`,
        description: "x",
        nature: "FETE",
        debuteLe: debut,
        finitLe: debut,
        posePar: "Essai",
      },
      select: { id: true },
    });
    expect(memeJour.id).toBeTruthy();
  });

  it("refuse un retrait à moitié posé", async () => {
    const pose = await prisma.evenement.create({
      data: {
        titre: `${MARQUE}retrait partiel`,
        description: "x",
        nature: "FETE",
        debuteLe: new Date(),
        posePar: "Essai",
      },
      select: { id: true },
    });

    await expect(
      prisma.evenement.update({
        where: { id: pose.id },
        data: { retireLe: new Date() },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.evenement.update({
        where: { id: pose.id },
        data: { retirePar: "Essai" },
      }),
    ).rejects.toThrow();
  });
});

describe("le calendrier se lit en deux temps", () => {
  it("range chaque date du bon côté", async () => {
    const futur = await poser("dans dix jours", "FETE", dans(10));
    const passe = await poser("il y a dix jours", "FETE", dans(-10));

    const { aVenir, passes } = await lireLeCalendrier();
    expect(aVenir.map((e) => e.id)).toContain(futur);
    expect(passes.map((e) => e.id)).toContain(passe);
    expect(aVenir.map((e) => e.id)).not.toContain(passe);
  });

  /**
   * **Un événement qui DURE reste « à venir » jusqu'à sa fin.** Un trimestre
   * commencé la semaine dernière et fini dans deux mois n'a pas à basculer
   * dans « déjà passé » le lendemain de son ouverture.
   */
  it("garde en cours ce qui a commencé mais n’est pas fini", async () => {
    const enCours = await poser("en cours", "SESSION", dans(-5), dans(30));
    const { aVenir, passes } = await lireLeCalendrier();
    expect(aVenir.map((e) => e.id)).toContain(enCours);
    expect(passes.map((e) => e.id)).not.toContain(enCours);
  });

  it("rend ce qui commence aujourd’hui", async () => {
    const aujourdhui = await poser("aujourd’hui", "FETE", dans(0));
    const { aVenir } = await lireLeCalendrier();
    expect(aVenir.map((e) => e.id)).toContain(aujourdhui);
  });
});

describe("ce qui remonte au bureau", () => {
  /**
   * ⚠️ **`EPREUVE` et rien d’autre.** Le panneau s’appelle « Prochaines
   * épreuves » : y faire monter la veillée des braises le contredirait, et
   * c’est exactement pour cela que `NatureEvenement` existe.
   */
  it("ne retient que les épreuves, et la plus proche", async () => {
    await poser("une fête très proche", "FETE", dans(1));
    await poser("une session très proche", "SESSION", dans(2));
    const proche = await poser("l’épreuve la plus proche", "EPREUVE", dans(3));
    await poser("une épreuve plus lointaine", "EPREUVE", dans(40));

    const lue = await prochaineEpreuve();
    expect(lue?.id).toBe(proche);
    expect(lue?.nature).toBe("EPREUVE");
  });

  it("ne retient jamais une épreuve passée", async () => {
    // Toutes les dates de cet essai sont effacées d'abord : sans cela, celle
    // du cas précédent répondrait à la place.
    await prisma.evenement.deleteMany({ where: { titre: { startsWith: MARQUE } } });
    await poser("une épreuve d’hier", "EPREUVE", dans(-1));
    expect(await prochaineEpreuve()).toBeNull();
  });
});

describe("retirer n’efface rien", () => {
  it("sort du calendrier, reste en administration, et se remet", async () => {
    const id = await poser("à retirer", "FETE", dans(20));

    await retirerEvenement(id);
    const { aVenir, passes } = await lireLeCalendrier();
    expect([...aVenir, ...passes].map((e) => e.id)).not.toContain(id);

    const enAdmin = await listerPourAdministration();
    const ligne = enAdmin.find((e) => e.id === id);
    expect(ligne).toBeDefined();
    expect(ligne?.retireLe).not.toBeNull();
    expect(ligne?.retirePar).not.toBeNull();

    // Le retrait n'efface pas, et c'est ce qui permet à la remise d'exister.
    await remettreEvenement(id);
    const apres = await lireLeCalendrier();
    expect(apres.aVenir.map((e) => e.id)).toContain(id);
  });

  /** Une date retirée deux fois n’est pas re-datée : le `where` s’en charge. */
  it("ne redate pas un retrait déjà posé", async () => {
    const id = await poser("retiré deux fois", "FETE", dans(20));
    await retirerEvenement(id);
    const premier = (await listerPourAdministration()).find((e) => e.id === id);
    await retirerEvenement(id);
    const second = (await listerPourAdministration()).find((e) => e.id === id);
    expect(second?.retireLe).toBe(premier?.retireLe);
  });
});

describe("corriger une date", () => {
  it("marque la reprise, comme sur une annonce", async () => {
    const id = await poser("à corriger", "SESSION", dans(15));
    const avant = (await listerPourAdministration()).find((e) => e.id === id);
    expect(avant?.modifieLe).toBeNull();

    const lu = await corrigerEvenement(id, {
      titre: `${MARQUE}corrigée`,
      description: "Reprise par l’essai en base.",
      nature: "EPREUVE",
      debut: dans(16),
      fin: null,
    });
    expect(lu.ok).toBe(true);

    const apres = (await listerPourAdministration()).find((e) => e.id === id);
    expect(apres?.titre).toBe(`${MARQUE}corrigée`);
    expect(apres?.nature).toBe("EPREUVE");
    expect(apres?.modifieLe).not.toBeNull();
  });

  it("refuse une fin avant le début, sans écrire", async () => {
    const id = await poser("bornes à l’envers", "SESSION", dans(15));
    const lu = await corrigerEvenement(id, {
      titre: `${MARQUE}bornes à l’envers`,
      description: "x",
      nature: "SESSION",
      debut: dans(15),
      fin: dans(14),
    });
    expect(lu.ok).toBe(false);

    const apres = (await listerPourAdministration()).find((e) => e.id === id);
    expect(apres?.modifieLe).toBeNull();
  });
});
