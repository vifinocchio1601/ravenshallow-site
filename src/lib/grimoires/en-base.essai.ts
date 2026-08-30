import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Les Grimoires, **SUR LA VRAIE BASE**.
 *
 *   npm run grimoires:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l'exclut de
 * `npm test` **à dessein** : la suite ordinaire ne touche jamais la base, qui
 * est celle de production tant qu'il n'existe pas de branche d'essai.
 *
 * Ce qui ne peut se vérifier QU'ici : les garanties de
 * `20260830140000_grimoires`, le déclencheur des quatre interdits **dans les
 * deux sens**, et surtout que le contenu réservé à l'administration **ne
 * figure dans aucune réponse** rendue à un joueur — la règle la plus
 * importante du lot.
 *
 * ⚠️ **Le ménage vise le préfixe de slug `essai-`, et rien d'autre.** Il n'y
 * a pas de compte à qui rattacher ces lignes : c'est l'adresse qui les
 * distingue, et un effacement plus large emporterait les volumes du joueur.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. Posé AVANT que `@/lib/prisma` ne soit chargé — d'où
// les imports dynamiques.
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
  corrigerChapitre,
  corrigerGrimoire,
  lireLeChapitre,
  lireLeVolume,
  lireLeVolumeEntier,
  listerLEtagere,
  listerPourAdministration,
  poserGrimoire,
} = await import("./depot");

/** Le préfixe qui distingue ce que cet essai a écrit. */
const MARQUE = "essai-";

/**
 * Une phrase qu'on cherchera dans les réponses. Si elle en sort un jour,
 * c'est que le filtrage a cédé.
 */
const SECRET = "le verbe qui ne se prononce pas";

let volumeId = "";
let chapitreOuvertId = "";
let chapitreReserveId = "";

async function menage() {
  await prisma.grimoire.deleteMany({
    where: { slug: { startsWith: MARQUE } },
  });
}

beforeAll(async () => {
  await menage();

  const volume = await prisma.grimoire.create({
    data: {
      slug: `${MARQUE}sortileges`,
      titre: "ESSAI — Sortilèges",
      exergue: "Vingt-quatre runes · quatre interdits",
      description: "Le volume d’essai. Il ne doit rien rester de lui.",
      reliure: "CUIR_SOMBRE",
      ordre: 900,
      posePar: "Essai",
    },
  });
  volumeId = volume.id;

  const ouvert = await prisma.chapitreGrimoire.create({
    data: {
      grimoireId: volumeId,
      slug: "les-sorts-simples",
      titre: "Les sorts simples",
      ordre: 0,
      acces: "TOUS",
    },
  });
  chapitreOuvertId = ouvert.id;

  await prisma.blocGrimoire.create({
    data: {
      chapitreId: chapitreOuvertId,
      ordre: 0,
      type: "FICHE_SORT",
      ancre: "sortilege-de-l-entrave",
      donnees: {
        nom: "Sortilège de l’Entrave",
        glyphes: ["ᚾ"],
        formule: "Naudhiz",
        lie: false,
        matiere: "sortileges",
        annee: 1,
        effet: "Ferme et retient une porte.",
        limite: "Cède à qui pousse assez fort.",
      },
    },
  });

  const reserve = await prisma.chapitreGrimoire.create({
    data: {
      grimoireId: volumeId,
      slug: "les-quatre-sorts-interdits",
      titre: "Les quatre sorts interdits",
      ordre: 1,
      acces: "ADMINISTRATION",
    },
  });
  chapitreReserveId = reserve.id;

  await prisma.blocGrimoire.create({
    data: {
      chapitreId: chapitreReserveId,
      ordre: 0,
      type: "FICHE_INTERDITE",
      ancre: "sortilege-de-hel",
      donnees: {
        nom: "Sortilège de Hel",
        verbe: "tuer",
        rubriques: [{ titre: "Ce qu’il fait", texte: SECRET }],
      },
    },
  });
});

/**
 * Un second volume, **entièrement réservé**. Il n'a aucune raison d'exister
 * dans le premier lot — mais rien n'empêchera le joueur d'en poser un, et un
 * livre qui s'annoncerait sur l'étagère pour s'ouvrir sur rien serait pire
 * qu'une absence.
 */
beforeAll(async () => {
  const clos = await prisma.grimoire.create({
    data: {
      slug: `${MARQUE}tout-reserve`,
      titre: "ESSAI — Volume clos",
      description: "Tous ses chapitres sont réservés.",
      reliure: "TOILE_BLEUE",
      ordre: 901,
      posePar: "Essai",
    },
  });
  await prisma.chapitreGrimoire.create({
    data: {
      grimoireId: clos.id,
      slug: "note-du-chateau",
      titre: "Note du château",
      ordre: 0,
      acces: "ADMINISTRATION",
    },
  });
});

afterAll(async () => {
  await menage();
  const reste = await prisma.grimoire.count({
    where: { slug: { startsWith: MARQUE } },
  });
  expect(reste).toBe(0);
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────
//  Ce que la base refuse d'elle-même
// ─────────────────────────────────────────────────────────────

describe("les garanties de la migration", () => {
  it("refuse une adresse qui n’est pas une adresse", async () => {
    await expect(
      prisma.grimoire.create({
        data: {
          slug: `${MARQUE}Sortilèges Interdits`,
          titre: "x",
          description: "x",
          reliure: "PARCHEMIN",
          ordre: 0,
          posePar: "Essai",
        },
      }),
    ).rejects.toThrow();
  });

  it("refuse un titre fait de blancs — btrim ne suffirait pas", async () => {
    await expect(
      prisma.grimoire.create({
        data: {
          slug: `${MARQUE}titre-blanc`,
          titre: "\n\n\t  \n",
          description: "x",
          reliure: "PARCHEMIN",
          ordre: 0,
          posePar: "Essai",
        },
      }),
    ).rejects.toThrow();
  });

  it("refuse un retrait à moitié posé", async () => {
    await expect(
      prisma.grimoire.update({
        where: { id: volumeId },
        data: { retireLe: new Date() },
      }),
    ).rejects.toThrow();
  });

  it("refuse un contenu de bloc qui ne soit pas un objet", async () => {
    await expect(
      prisma.blocGrimoire.create({
        data: {
          chapitreId: chapitreOuvertId,
          ordre: 9,
          type: "SEPARATEUR",
          donnees: [1, 2, 3],
        },
      }),
    ).rejects.toThrow();
  });

  it("refuse deux fois la même ancre dans un chapitre", async () => {
    await expect(
      prisma.blocGrimoire.create({
        data: {
          chapitreId: chapitreOuvertId,
          ordre: 8,
          type: "SEPARATEUR",
          ancre: "sortilege-de-l-entrave",
          donnees: {},
        },
      }),
    ).rejects.toThrow();
  });
});

describe("le verrou des quatre interdits", () => {
  it("refuse une fiche interdite dans un chapitre ouvert", async () => {
    await expect(
      prisma.blocGrimoire.create({
        data: {
          chapitreId: chapitreOuvertId,
          ordre: 7,
          type: "FICHE_INTERDITE",
          donnees: {
            nom: "x",
            verbe: "x",
            rubriques: [{ titre: "x", texte: "x" }],
          },
        },
      }),
    ).rejects.toThrow();
  });

  it("refuse d’ouvrir un chapitre qui en porte une — l’autre bout", async () => {
    await expect(
      prisma.chapitreGrimoire.update({
        where: { id: chapitreReserveId },
        data: { acces: "TOUS" },
      }),
    ).rejects.toThrow();

    const apres = await prisma.chapitreGrimoire.findUniqueOrThrow({
      where: { id: chapitreReserveId },
      select: { acces: true },
    });
    expect(apres.acces).toBe("ADMINISTRATION");
  });
});

// ─────────────────────────────────────────────────────────────
//  Ce qui descend chez un joueur, et ce qui ne descend pas
// ─────────────────────────────────────────────────────────────

describe("le sommaire d’un volume", () => {
  it("cache au joueur le chapitre réservé, pas même grisé", async () => {
    const lu = await lireLeVolume(`${MARQUE}sortileges`, false);
    expect(lu?.sommaire.map((c) => c.slug)).toEqual(["les-sorts-simples"]);
  });

  it("le montre au staff", async () => {
    const lu = await lireLeVolume(`${MARQUE}sortileges`, true);
    expect(lu?.sommaire).toHaveLength(2);
  });
});

describe("un chapitre réservé", () => {
  it("répond comme un chapitre qui n’existe pas", async () => {
    const reserve = await lireLeChapitre(
      `${MARQUE}sortileges`,
      "les-quatre-sorts-interdits",
      false,
    );
    const inexistant = await lireLeChapitre(
      `${MARQUE}sortileges`,
      "la-salle-des-coffres",
      false,
    );
    expect(reserve).toBeNull();
    expect(inexistant).toBeNull();
  });

  it("s’ouvre pour le staff, avec son contenu", async () => {
    const lu = await lireLeChapitre(
      `${MARQUE}sortileges`,
      "les-quatre-sorts-interdits",
      true,
    );
    expect(lu?.chapitre.blocs).toHaveLength(1);
    expect(JSON.stringify(lu)).toContain(SECRET);
  });
});

describe("rien de réservé ne quitte le serveur", () => {
  /**
   * L'essai décisif : on sérialise **tout** ce que le dépôt rend à un joueur
   * et l'on y cherche le secret. C'est ce qu'un navigateur recevrait.
   */
  it("ni dans le sommaire, ni dans le chapitre, ni en lecture continue", async () => {
    const reponses = [
      await listerLEtagere(false),
      await lireLeVolume(`${MARQUE}sortileges`, false),
      await lireLeChapitre(`${MARQUE}sortileges`, "les-sorts-simples", false),
      await lireLeVolumeEntier(`${MARQUE}sortileges`, false),
    ];

    for (const reponse of reponses) {
      const envoye = JSON.stringify(reponse);
      expect(envoye).not.toContain(SECRET);
      expect(envoye).not.toContain("Sortilège de Hel");
      expect(envoye).not.toContain("Les quatre sorts interdits");
      expect(envoye).not.toContain("sortilege-de-hel");
    }
  });

  it("la lecture continue montre exactement ce que le sommaire promet", async () => {
    const continu = await lireLeVolumeEntier(`${MARQUE}sortileges`, false);
    expect(continu?.chapitres.map((c) => c.slug)).toEqual(
      continu?.volume.sommaire.map((c) => c.slug),
    );
    expect(continu?.chapitres[0]?.blocs).toHaveLength(1);
  });
});

describe("les gestes de l’administration", () => {
  it("refuse une adresse déjà prise, sans rien écrire", async () => {
    const avant = await prisma.grimoire.count();
    const r = await poserGrimoire({
      slug: `${MARQUE}sortileges`,
      titre: "ESSAI — doublon",
      exergue: null,
      description: "Le même slug qu’un volume existant.",
      reliure: "PARCHEMIN",
    });
    expect(r.ok).toBe(false);
    expect(await prisma.grimoire.count()).toBe(avant);
  });

  it("corrige ce qu’un volume annonce, et marque la reprise", async () => {
    const r = await corrigerGrimoire(volumeId, {
      slug: `${MARQUE}sortileges`,
      titre: "ESSAI — Sortilèges, corrigé",
      exergue: null,
      description: "Une autre ligne d’étagère.",
      reliure: "CUIR_FAUVE",
    });
    expect(r.ok).toBe(true);

    const apres = await prisma.grimoire.findUniqueOrThrow({
      where: { id: volumeId },
    });
    expect(apres.titre).toBe("ESSAI — Sortilèges, corrigé");
    expect(apres.exergue).toBeNull();
    expect(apres.modifieLe).not.toBeNull();
  });

  /**
   * ⚠️ **L'essai qui compte.** Le refus vient d'un déclencheur de la base,
   * et il doit se lire en une phrase — jamais remonter en erreur 500 sur un
   * clic normal. C'est la leçon de « Remettre au bloc » chez les partenaires.
   */
  it("refuse d’ouvrir aux joueurs un chapitre qui porte un interdit", async () => {
    const r = await corrigerChapitre(chapitreReserveId, {
      titre: "Les quatre sorts interdits",
      acces: "TOUS",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("13.2");

    const apres = await prisma.chapitreGrimoire.findUniqueOrThrow({
      where: { id: chapitreReserveId },
      select: { acces: true },
    });
    expect(apres.acces).toBe("ADMINISTRATION");
  });

  it("laisse renommer un chapitre ouvert", async () => {
    const r = await corrigerChapitre(chapitreOuvertId, {
      titre: "Les sorts simples, renommés",
      acces: "TOUS",
    });
    expect(r.ok).toBe(true);

    const apres = await prisma.chapitreGrimoire.findUniqueOrThrow({
      where: { id: chapitreOuvertId },
      select: { titre: true },
    });
    expect(apres.titre).toBe("Les sorts simples, renommés");
  });
});

describe("un volume dont rien ne s’ouvre", () => {
  it("ne figure pas sur l’étagère d’un joueur", async () => {
    const vus = (await listerLEtagere(false)).map((v) => v.slug);
    expect(vus).toContain(`${MARQUE}sortileges`);
    expect(vus).not.toContain(`${MARQUE}tout-reserve`);
  });

  it("y figure pour le staff", async () => {
    const vus = (await listerLEtagere(true)).map((v) => v.slug);
    expect(vus).toContain(`${MARQUE}tout-reserve`);
  });
});

describe("un volume retiré", () => {
  it("sort de l’étagère et ne s’ouvre plus, mais reste en base", async () => {
    await prisma.grimoire.update({
      where: { id: volumeId },
      data: { retireLe: new Date(), retirePar: "Essai" },
    });

    const etagere = await listerLEtagere(false);
    expect(etagere.some((v) => v.id === volumeId)).toBe(false);
    expect(await lireLeVolume(`${MARQUE}sortileges`, true)).toBeNull();

    // L'administration, elle, le voit toujours — le seul chemin qui le voie.
    const enAdmin = (await listerPourAdministration()).find(
      (v) => v.id === volumeId,
    );
    expect(enAdmin?.retirePar).toBe("Essai");
    expect(enAdmin?.detail).toHaveLength(2);

    await prisma.grimoire.update({
      where: { id: volumeId },
      data: { retireLe: null, retirePar: null },
    });
    expect(await lireLeVolume(`${MARQUE}sortileges`, false)).not.toBeNull();
  });
});
