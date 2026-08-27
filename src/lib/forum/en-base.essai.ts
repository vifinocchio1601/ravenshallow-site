import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAISONS } from "@/lib/dossier/etats";
import { peutCloreUneScene, peutEcrireLesAnnoncesDe } from "./pouvoirs";

/**
 * Les pouvoirs, exercés **SUR LA VRAIE BASE**.
 *
 *   npm run pouvoirs:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l’exclut de
 * `npm test` **à dessein** : la suite ordinaire ne doit jamais toucher la
 * base, qui est celle de production tant qu’il n’existe pas de branche
 * d’essai.
 *
 * Ce qui ne peut se vérifier QU’ici, et que les tests purs ne verront jamais :
 * les contraintes de la base, l’idempotence réelle d’un double clic, et
 * **la trace laissée au journal** — qui, quoi, quand, sur quelle maison.
 *
 * Un seul compte, en `@ravenshallow.invalid`, effacé à la fin par son adresse
 * exacte. Aucun effacement à l’aveugle, jamais.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs` et l'essai de la Tour. La chaîne de connexion ne
// s'affiche nulle part.
//
// Il doit être posé AVANT que `@/lib/prisma` ne soit chargé — d'où les
// imports dynamiques ci-dessous : un `import` ordinaire serait hissé en tête
// de fichier et lirait un environnement encore vide.
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const coupure = nette.indexOf("=");
  const cle = nette.slice(0, coupure).trim();
  const valeur = nette.slice(coupure + 1).trim();
  process.env[cle] ??= valeur.replace(/^["']|["']$/g, "");
}

const { prisma } = await import("@/lib/prisma");
// Ce qu'une ligne vaut : le même nombre que le compteur et que la route, lu
// à la source plutôt que recopié ici.
const { CARACTERES_PAR_LIGNE } = await import("./longueur");
const {
  changerLaCloture,
  demasquerPost,
  lireSujet,
  masquerPost,
  modifierSonPost,
  ouvrirSujet,
  repondre,
  retirerLaScene,
  retirerSonPost,
} = await import("./depot");
const { recalculerLesCompteurs, saisonEnCours } = await import(
  "@/lib/points/depot"
);
const {
  accorderPermission,
  accorderSurToutesLesMaisons,
  demettrePrefet,
  modifierRole,
  nommerPrefet,
  pouvoirsDe,
  retirerPermission,
} = await import("./depot-pouvoirs");

const ADRESSE = "essai.pouvoirs@ravenshallow.invalid";

let utilisateurId = "";
let eleveId = "";
/** Les scènes ouvertes par l'essai, effacées à la toute fin. */
const sujetsCrees: string[] = [];

beforeAll(async () => {
  const compte = await prisma.utilisateur.create({
    data: {
      email: ADRESSE,
      motDePasseHash: "essai",
      majeur16: true,
      statutAcces: "VALIDE",
      reglementAccepteLe: new Date(),
      reglementVersion: "essai",
      eleve: {
        create: {
          prenomNom: "Pouvoirs Essai",
          genre: "AUTRE",
          famille: "MIXTE",
          portraitType: "IA_ILLUSTRATION",
          biographie: "x".repeat(700),
          qualite1: "a", qualite2: "b", qualite3: "c",
          defaut1: "d", defaut2: "e", defaut3: "f",
          plusGrandePeur: "rien",
          statut: "ACCEPTE",
          maison: "BRYGGELD",
          etatMaison: "FAIT",
        },
      },
    },
    select: { id: true, eleve: { select: { id: true } } },
  });
  utilisateurId = compte.id;
  eleveId = compte.eleve!.id;
});

afterAll(async () => {
  // **Les sujets d'abord, et au niveau du FICHIER.** Un `afterAll` posé dans
  // un `describe` se déclenche à la fin de son bloc — les blocs suivants
  // créaient encore, et leur sujet restait en base. Ici, on passe en dernier.
  //
  // Ils ne partiraient pas avec le compte : `auteurId` se détache plutôt que
  // de cascader, parce qu'effacer un compte n'efface pas ce qu'il a écrit
  // chez les autres.
  if (sujetsCrees.length) {
    // **Le carnet des points d'abord.** Une ligne du carnet RETIENT son post
    // (`ON DELETE RESTRICT`), et l'effacement des scènes échouerait tant
    // qu'elle est là. Ce n'est pas un défaut de la contrainte : elle est là
    // pour qu'un effacement de post ne fasse jamais disparaître un point en
    // silence, en laissant le compteur de la maison plus haut que le carnet.
    //
    // Les posts des DEUX comptes sont visés — l'essai fait répondre le second
    // dans les scènes du premier, et ses points sont dans le même carnet.
    await prisma.pointGagne.deleteMany({
      where: { post: { sujetId: { in: sujetsCrees } } },
    });
    await prisma.sujet.deleteMany({ where: { id: { in: sujetsCrees } } });

    // Puis les compteurs remis d'aplomb depuis ce qui reste. C'est exactement
    // ce à quoi sert le recalcul : les points de l'essai sont passés par le
    // compteur de Bryggeld, et ils n'ont rien à y faire.
    const saison = await saisonEnCours();
    if (saison) await recalculerLesCompteurs(saison.id);
  }

  // Puis le compte, par l'adresse exacte et rien d'autre. Sa suppression
  // emporte en cascade sa fiche, ses permissions, ses préfectures, son journal.
  await prisma.utilisateur.deleteMany({ where: { email: ADRESSE } });
  await prisma.$disconnect();
});

/** Les entrées du journal de ce compte, de la plus ancienne à la plus récente. */
async function journal() {
  return prisma.journalMembre.findMany({
    where: { utilisateurId },
    orderBy: { creeLe: "asc" },
    select: { type: true, valeurAvant: true, valeurApres: true, parNom: true },
  });
}

describe("un membre neuf n’a aucun pouvoir", () => {
  it("ne peut rien, nulle part", async () => {
    const p = await pouvoirsDe(utilisateurId);
    expect(p.role).toBe("JOUEUR");
    expect(p.permissions).toHaveLength(0);
    expect(p.prefetDe).toHaveLength(0);
    expect(peutCloreUneScene(p)).toBe(false);
    for (const maison of MAISONS) {
      expect(peutEcrireLesAnnoncesDe(p, maison), maison).toBe(false);
    }
  });
});

describe("une permission d’annonce sur Kaldrafn ne donne rien sur Nattorm", () => {
  it("s’accorde, et sur cette maison seulement", async () => {
    const posees = await accorderPermission(
      utilisateurId,
      "ANNONCES_MAISON",
      ["KALDRAFN"],
    );
    expect(posees).toBe(1);

    const p = await pouvoirsDe(utilisateurId);
    expect(peutEcrireLesAnnoncesDe(p, "KALDRAFN")).toBe(true);
    expect(peutEcrireLesAnnoncesDe(p, "NATTORM")).toBe(false);
    expect(peutEcrireLesAnnoncesDe(p, "BRYGGELD")).toBe(false);
    expect(peutEcrireLesAnnoncesDe(p, "TIDEAL")).toBe(false);
  });

  it("laisse au journal qui, quoi et sur quelle maison", async () => {
    const entrees = await journal();
    expect(entrees).toContainEqual({
      type: "PERMISSION_ACCORDEE",
      valeurAvant: null,
      valeurApres: "ANNONCES_MAISON:KALDRAFN",
      parNom: "Administration",
    });
  });

  /** Un double clic n’est pas un événement : ni ligne, ni entrée de journal. */
  it("réaccorder la même ne fait rien du tout", async () => {
    const avant = (await journal()).length;
    const posees = await accorderPermission(
      utilisateurId,
      "ANNONCES_MAISON",
      ["KALDRAFN"],
    );
    expect(posees).toBe(0);
    expect((await journal()).length).toBe(avant);
  });
});

describe("les quatre maisons, c’est quatre lignes", () => {
  it("n’en pose que trois de plus, celle de Kaldrafn étant déjà là", async () => {
    const posees = await accorderSurToutesLesMaisons(
      utilisateurId,
      "ANNONCES_MAISON",
    );
    expect(posees).toBe(3);

    const p = await pouvoirsDe(utilisateurId);
    for (const maison of MAISONS) {
      expect(peutEcrireLesAnnoncesDe(p, maison), maison).toBe(true);
    }
  });

  it("se retirent d’un coup, et laissent quatre traces", async () => {
    const avant = (await journal()).length;
    const retirees = await retirerPermission(
      utilisateurId,
      "ANNONCES_MAISON",
      MAISONS,
    );
    expect(retirees).toBe(4);

    const entrees = await journal();
    expect(entrees.length).toBe(avant + 4);
    expect(
      entrees.filter((e) => e.type === "PERMISSION_RETIREE"),
    ).toHaveLength(4);

    const p = await pouvoirsDe(utilisateurId);
    expect(p.permissions).toHaveLength(0);
  });
});

describe("une permission globale n’a pas de maison", () => {
  it("s’accorde une fois, et une seule", async () => {
    expect(await accorderPermission(utilisateurId, "CLORE_SCENE", [null])).toBe(1);
    expect(await accorderPermission(utilisateurId, "CLORE_SCENE", [null])).toBe(0);

    const lignes = await prisma.permissionAccordee.findMany({
      where: { utilisateurId, permission: "CLORE_SCENE" },
    });
    expect(lignes).toHaveLength(1);
    expect(lignes[0].maison).toBeNull();
    expect(peutCloreUneScene(await pouvoirsDe(utilisateurId))).toBe(true);
  });

  /**
   * **Le piège des deux NULL, éprouvé pour de bon.**
   *
   * Postgres tient deux NULL pour distincts dans un index unique : sans l’index
   * partiel, cette insertion passerait, et retirer la permission une fois n’en
   * retirerait qu’une des deux.
   */
  it("la base refuse une seconde ligne, même sans maison", async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "permissions_accordees" ("id","utilisateurId","permission","accordeePar")
         VALUES ('essai-doublon', $1, 'CLORE_SCENE', 'Essai')`,
        utilisateurId,
      ),
    ).rejects.toThrow();
  });

  /** L’accord entre la permission et sa portée, dans les deux sens. */
  it("la base refuse une permission de maison sans maison", async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "permissions_accordees" ("id","utilisateurId","permission","accordeePar")
         VALUES ('essai-sans-maison', $1, 'ANNONCES_MAISON', 'Essai')`,
        utilisateurId,
      ),
    ).rejects.toThrow();
  });

  it("et une permission globale AVEC une maison", async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "permissions_accordees" ("id","utilisateurId","permission","maison","accordeePar")
         VALUES ('essai-globale-maison', $1, 'EPINGLER_SUJET', 'NATTORM', 'Essai')`,
        utilisateurId,
      ),
    ).rejects.toThrow();
  });

  it("se retire aussi simplement", async () => {
    expect(await retirerPermission(utilisateurId, "CLORE_SCENE", [null])).toBe(1);
    expect(peutCloreUneScene(await pouvoirsDe(utilisateurId))).toBe(false);
  });
});

describe("le préfet écrit les annonces de sa maison sans permission accordée", () => {
  it("la nomination suffit", async () => {
    expect(await nommerPrefet(eleveId, "NATTORM")).toBe(true);

    const p = await pouvoirsDe(utilisateurId);
    // Rien n'a été écrit dans `permissions_accordees` : le droit dérive.
    expect(p.permissions).toHaveLength(0);
    expect(p.prefetDe).toEqual(["NATTORM"]);
    expect(peutEcrireLesAnnoncesDe(p, "NATTORM")).toBe(true);
    expect(peutEcrireLesAnnoncesDe(p, "BRYGGELD")).toBe(false);
  });

  it("nommer deux fois ne fait rien", async () => {
    expect(await nommerPrefet(eleveId, "NATTORM")).toBe(false);
    expect((await pouvoirsDe(utilisateurId)).prefetDe).toEqual(["NATTORM"]);
  });

  /** Art. 13.5 — le rôle peut être repris. Un clic, et rien ne survit. */
  it("le démettre reprend tout, sans rien d’autre à retirer", async () => {
    expect(await demettrePrefet(eleveId, "NATTORM")).toBe(true);

    const p = await pouvoirsDe(utilisateurId);
    expect(p.prefetDe).toHaveLength(0);
    expect(p.permissions).toHaveLength(0);
    expect(peutEcrireLesAnnoncesDe(p, "NATTORM")).toBe(false);
  });

  it("les deux gestes sont au journal, avec la maison", async () => {
    const entrees = await journal();
    expect(entrees).toContainEqual({
      type: "PREFET_NOMME",
      valeurAvant: null,
      valeurApres: "NATTORM",
      parNom: "Administration",
    });
    expect(entrees).toContainEqual({
      type: "PREFET_DEMIS",
      valeurAvant: "NATTORM",
      valeurApres: null,
      parNom: "Administration",
    });
  });
});

describe("le rôle sur le site", () => {
  it("se change, et se distingue d’un changement d’accès au journal", async () => {
    expect(await modifierRole(utilisateurId, "MODERATEUR")).toBe(true);

    const p = await pouvoirsDe(utilisateurId);
    // Le staff passe partout, sans qu'aucune permission lui soit accordée.
    expect(p.permissions).toHaveLength(0);
    expect(peutCloreUneScene(p)).toBe(true);
    for (const maison of MAISONS) {
      expect(peutEcrireLesAnnoncesDe(p, maison), maison).toBe(true);
    }

    expect(await journal()).toContainEqual({
      type: "ROLE_MODIFIE",
      valeurAvant: "JOUEUR",
      valeurApres: "MODERATEUR",
      parNom: "Administration",
    });
  });

  it("le reposer à l’identique n’écrit rien", async () => {
    expect(await modifierRole(utilisateurId, "MODERATEUR")).toBe(false);
  });
});


// ─────────────────────────────────────────────────────────────
//  Le moteur du forum
//
//  Tout se joue dans un espace jetable, `essai-forum`, effacé à la fin : sa
//  suppression emporte en cascade ses sections, ses sujets et ses posts. Les
//  trois vrais espaces ne sont jamais touchés.
// ─────────────────────────────────────────────────────────────

const ESPACE_ESSAI = "essai-forum";

async function creerEspaceEssai() {
  return prisma.espace.create({
    data: {
      cle: ESPACE_ESSAI,
      nom: "Essai",
      description: "Espace jetable.",
      ordre: 99,
      lignesMinimum: 10,
    },
    select: { id: true },
  });
}

describe("les trois espaces sont posés, avec leur paramétrage", () => {
  it("le domaine exige dix lignes, compte les points et les scènes", async () => {
    const domaine = await prisma.espace.findUnique({ where: { cle: "domaine" } });
    expect(domaine).not.toBeNull();
    expect(domaine!.lignesMinimum).toBe(10);
    expect(domaine!.comptePourLesPoints).toBe(true);
    expect(domaine!.compteLesScenes).toBe(true);
    expect(domaine!.visibilite).toBe("TOUS");
  });

  it("les non-mages n’exigent rien et ne comptent rien", async () => {
    const e = await prisma.espace.findUnique({ where: { cle: "non-mages" } });
    expect(e!.lignesMinimum).toBeNull();
    expect(e!.comptePourLesPoints).toBe(false);
    expect(e!.compteLesScenes).toBe(false);
  });

  it("l’espace d’une maison se ferme, et ses sujets s’ouvrent sur permission", async () => {
    const e = await prisma.espace.findUnique({ where: { cle: "maison" } });
    expect(e!.visibilite).toBe("MAISON");
    expect(e!.quiOuvreUnSujet).toBe("DETENTEUR_PERMISSION");
    expect(e!.quiRepond).toBe("MEMBRES_MAISON");
  });

  it("les trois, et rien de plus pour l’instant", async () => {
    const cles = (
      await prisma.espace.findMany({
        where: { cle: { not: ESPACE_ESSAI } },
        orderBy: { ordre: "asc" },
        select: { cle: true },
      })
    ).map((e) => e.cle);
    expect(cles).toEqual(["domaine", "non-mages", "maison"]);
  });

  it("les deux autres espaces sont vides, et c’est voulu", async () => {
    const sections = await prisma.section.count({
      where: { espace: { cle: { in: ["non-mages", "maison"] } } },
    });
    expect(sections).toBe(0);
  });
});

describe("L’école est meublée : cinq sections, vingt pièces", () => {
  it("cinq ailes, dans l’ordre — et la carte fait autorité", async () => {
    const ailes = await prisma.section.findMany({
      where: { parentId: null, espace: { cle: "domaine" } },
      orderBy: { ordre: "asc" },
      select: { nom: true },
    });
    expect(ailes.map((a) => a.nom)).toEqual([
      "Les Tours centrales",
      // La mer à l'EST, la forêt à l'OUEST : la rose des vents de la carte du
      // domaine, opposable en RP (bible §2, art. 12.4).
      "L’aile est — face à la mer · Tideål",
      "L’aile ouest — face à la forêt · Nattorm",
      "L’aile sud — vers la falaise · Bryggeld",
      "L’aile nord — face aux plateaux de givre · Kaldrafn",
    ]);
  });

  it("vingt pièces, et aucune au troisième étage", async () => {
    const pieces = await prisma.section.findMany({
      where: { parentId: { not: null }, espace: { cle: "domaine" } },
      select: { id: true, parent: { select: { parentId: true } } },
    });
    expect(pieces).toHaveLength(20);
    // Le déclencheur le garantit ; on le constate quand même sur le contenu réel.
    for (const p of pieces) expect(p.parent?.parentId).toBeNull();
  });

  it("les quatre dortoirs sont réservés à leur maison, et eux seuls", async () => {
    const reserves = await prisma.section.findMany({
      where: { maisonReservee: { not: null }, espace: { cle: "domaine" } },
      select: { nom: true, maisonReservee: true },
    });
    expect(
      Object.fromEntries(reserves.map((r) => [r.nom, r.maisonReservee])),
    ).toEqual({
      "Le dortoir de Bryggeld": "BRYGGELD",
      "Le dortoir de Kaldrafn": "KALDRAFN",
      "Le dortoir de Nattorm": "NATTORM",
      "Le dortoir de Tideål": "TIDEAL",
    });
  });

  it("deux lieux seulement sont « sur convocation »", async () => {
    const convocations = await prisma.section.findMany({
      where: { quiOuvreUnSujet: "STAFF_SEULEMENT", espace: { cle: "domaine" } },
      select: { nom: true },
    });
    expect(convocations.map((c) => c.nom).sort()).toEqual(
      ["Le bureau de la direction", "Les bureaux des professeurs"].sort(),
    );
  });

  it("les années exigées sont celles qui ont été décidées", async () => {
    const verrous = await prisma.section.findMany({
      where: { anneeMinimale: { not: null }, espace: { cle: "domaine" } },
      select: { nom: true, anneeMinimale: true },
    });
    // Comparé par nom plutôt qu'en liste ordonnée : le tri de Postgres dépend
    // de la collation de la base, et l'apostrophe typographique n'y tombe pas
    // où l'on croit. L'ordre n'est pas ce que ce test veut figer.
    expect(
      Object.fromEntries(verrous.map((v) => [v.nom, v.anneeMinimale])),
    ).toEqual({
      "La salle de duel": "DEUXIEME_ANNEE",
      "Les réserves et les caves": "TROISIEME_ANNEE",
      "Les combles et les toits": "TROISIEME_ANNEE",
      "L’observatoire de la marée": "QUATRIEME_ANNEE",
      "La Réserve": "CINQUIEME_ANNEE",
      "Les souterrains": "SIXIEME_ANNEE",
    });
  });

  /**
   * **Aucune description de lieu ne nomme la grotte ni le sceau.**
   *
   * La règle s’est inversée le 27 août 2026. Les souterrains rappelaient
   * l’article 13.1 en toutes lettres ; le joueur l’a retiré, et sa raison est
   * meilleure que la mienne : rappeler l’interdit dans cette pièce-là, c’est
   * dire aux joueurs où il s’applique, **donc où regarder**. Un interdit posé
   * sur une porte est une flèche.
   *
   * La règle n’en est pas affaiblie : l’article 13.1 vit dans le règlement,
   * approuvé à l’inscription. Ce qui protège la pièce, c’est qu’elle est
   * sans intérêt — des casiers vides, rien à y chercher.
   */
  it("aucun lieu ne nomme la grotte ni le sceau, pas même pour l’interdire", async () => {
    const lieux = await prisma.section.findMany({
      select: { nom: true, description: true },
    });

    const bavards = lieux
      .filter((l) => /grotte|sceau|scell/i.test(`${l.nom} ${l.description}`))
      .map((l) => l.nom);

    expect(bavards).toEqual([]);
  });

  /**
   * **« La Grande Salle » ne doit pas revenir.** Le joueur l’a retirée le
   * 26 août 2026 — « la grande salle c’est Harry Potter » —, et la bible range
   * la ressemblance avec les univers de magie existants parmi les interdits
   * (§13). Le vocabulaire suit la même règle que les visuels.
   */
  it("aucun lieu ne s’appelle « la Grande Salle », nulle part", async () => {
    const emprunts = await prisma.section.findMany({
      where: {
        OR: [
          { nom: { contains: "Grande Salle", mode: "insensitive" } },
          { slug: { contains: "grande-salle" } },
          { description: { contains: "Grande Salle", mode: "insensitive" } },
        ],
      },
      select: { nom: true },
    });
    expect(emprunts).toEqual([]);

    const banquet = await prisma.section.findFirst({
      where: { slug: "la-salle-de-banquet" },
      select: { nom: true, description: true },
    });
    expect(banquet?.nom).toBe("La Salle de Banquet");

    // **Le nom ne bouge plus ; la description, elle, est revenue en arrière**
    // le 27 août 2026. « Quatre longues tables » avait été retiré comme étant
    // l'image qu'on fuit — mais le texte de la Cérémonie du Miroir la porte
    // déjà, et il est en ligne depuis des semaines. Seule la description de la
    // pièce l'évitait, si bien que la salle décrite n'était pas celle qu'on
    // traverse le soir du Miroir. Deux textes qui se contredisent coûtent plus
    // cher qu'une image reconnaissable.
    expect(banquet?.description).toContain("Quatre longues tables");
  });

  it("la Tour aux Corbeaux reste ouverte à tous, malgré l’aile de Kaldrafn", async () => {
    const tour = await prisma.section.findFirst({
      where: { nom: "La Tour aux Corbeaux" },
      select: { maisonReservee: true, anneeMinimale: true, description: true },
    });
    expect(tour!.maisonReservee).toBeNull();
    expect(tour!.anneeMinimale).toBeNull();
    // Sa description reste dans le monde : elle ne parle pas de la messagerie.
    expect(tour!.description.toLowerCase()).not.toContain("messagerie");
  });
});

describe("deux niveaux, jamais trois", () => {
  it("une section accepte une sous-section, et la sous-section n’en accepte pas", async () => {
    const espace = await creerEspaceEssai();
    try {
      const aile = await prisma.section.create({
        data: {
          espaceId: espace.id,
          slug: "aile",
          nom: "Une aile",
          description: "x",
          ordre: 1,
        },
        select: { id: true },
      });

      const piece = await prisma.section.create({
        data: {
          espaceId: espace.id,
          parentId: aile.id,
          slug: "piece",
          nom: "Une pièce",
          description: "x",
          ordre: 1,
        },
        select: { id: true },
      });

      // Le troisième étage : refusé par le déclencheur.
      await expect(
        prisma.section.create({
          data: {
            espaceId: espace.id,
            parentId: piece.id,
            slug: "recoin",
            nom: "Un recoin",
            description: "x",
            ordre: 1,
          },
        }),
      ).rejects.toThrow();

      // Et par l'autre bout : donner un parent à une section qui a déjà des
      // enfants ferait trois niveaux d'un seul UPDATE.
      await expect(
        prisma.section.update({
          where: { id: aile.id },
          data: { parentId: piece.id },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.espace.delete({ where: { id: espace.id } });
    }
  });

  it("une sous-section ne peut pas venir d’un autre espace", async () => {
    const a = await creerEspaceEssai();
    const b = await prisma.espace.create({
      data: { cle: `${ESPACE_ESSAI}-2`, nom: "Essai 2", description: "x", ordre: 98 },
      select: { id: true },
    });
    try {
      const chezA = await prisma.section.create({
        data: { espaceId: a.id, slug: "s", nom: "S", description: "x", ordre: 1 },
        select: { id: true },
      });
      await expect(
        prisma.section.create({
          data: {
            espaceId: b.id,
            parentId: chezA.id,
            slug: "t",
            nom: "T",
            description: "x",
            ordre: 1,
          },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.espace.deleteMany({
        where: { cle: { in: [ESPACE_ESSAI, `${ESPACE_ESSAI}-2`] } },
      });
    }
  });
});

describe("l’année exigée à l’ouverture ne se réécrit jamais", () => {
  /**
   * « Le verrouillage n’est pas rétroactif. » La promesse ne tient que si la
   * valeur figée est intouchable — sinon il suffirait d’un script de reprise
   * pour refermer des scènes en cours sans que personne le voie.
   */
  it("un sujet garde son année, même sous un UPDATE direct", async () => {
    const espace = await creerEspaceEssai();
    try {
      const section = await prisma.section.create({
        data: { espaceId: espace.id, slug: "s", nom: "S", description: "x", ordre: 1 },
        select: { id: true },
      });
      const sujet = await prisma.sujet.create({
        data: {
          sectionId: section.id,
          titre: "Une scène (LIBRE)",
          anneeRequiseALOuverture: "PREMIERE_ANNEE",
        },
        select: { id: true },
      });

      await expect(
        prisma.sujet.update({
          where: { id: sujet.id },
          data: { anneeRequiseALOuverture: "SIXIEME_ANNEE" },
        }),
      ).rejects.toThrow();

      // Le reste du sujet se modifie normalement — seule cette colonne est figée.
      await prisma.sujet.update({
        where: { id: sujet.id },
        data: { epingle: true },
      });
      const relu = await prisma.sujet.findUnique({ where: { id: sujet.id } });
      expect(relu!.epingle).toBe(true);
      expect(relu!.anneeRequiseALOuverture).toBe("PREMIERE_ANNEE");
    } finally {
      await prisma.espace.delete({ where: { id: espace.id } });
    }
  });
});

describe("ni titre ni corps ne peuvent être vides", () => {
  it("le piège de btrim : six lignes vides ne font pas un titre", async () => {
    const espace = await creerEspaceEssai();
    try {
      const section = await prisma.section.create({
        data: { espaceId: espace.id, slug: "s", nom: "S", description: "x", ordre: 1 },
        select: { id: true },
      });

      await expect(
        prisma.sujet.create({
          data: { sectionId: section.id, titre: "\n\n\n\n\n\n" },
        }),
      ).rejects.toThrow();

      const sujet = await prisma.sujet.create({
        data: { sectionId: section.id, titre: "Un vrai titre" },
        select: { id: true },
      });

      await expect(
        prisma.post.create({ data: { sujetId: sujet.id, corps: "  \n\t\n " } }),
      ).rejects.toThrow();

      // Un masquage à moitié posé est refusé lui aussi (art. 19.3).
      const post = await prisma.post.create({
        data: { sujetId: sujet.id, corps: "Un vrai post." },
        select: { id: true },
      });
      await expect(
        prisma.post.update({
          where: { id: post.id },
          data: { masqueLe: new Date() },
        }),
      ).rejects.toThrow();
    } finally {
      await prisma.espace.delete({ where: { id: espace.id } });
    }
  });
});

describe("le ménage du moteur", () => {
  it("aucun espace d’essai ne reste", async () => {
    const restes = await prisma.espace.count({
      where: { cle: { startsWith: "essai-" } },
    });
    expect(restes).toBe(0);
  });
});


// ─────────────────────────────────────────────────────────────
//  Écrire dans le château — art. 12.2, 16.3, 17.2, 19.3
//
//  Bout en bout, sur les vrais lieux de l'école. Tout ce qui est créé est
//  effacé à la fin par le sujet, qui emporte ses posts en cascade.
// ─────────────────────────────────────────────────────────────

const AUCUN = { role: "JOUEUR" as const, permissions: [], prefetDe: [] };
const STAFF = { role: "MODERATEUR" as const, permissions: [], prefetDe: [] };

/**
 * Un post de `n` lignes **au sens du compteur** — soit `n` fois la largeur
 * d’une ligne, en caractères réels.
 *
 * Il valait autrefois `n` courtes phrases séparées par des retours à la
 * ligne : suffisant quand on comptait les sauts de ligne, plus depuis le
 * 27 août 2026. Le remplissage se fait avec des points et non des espaces —
 * les blancs sont réduits avant comptage, et une ligne complétée d’espaces ne
 * pèserait pas ce qu’elle prétend.
 */
const post = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    `Ligne ${i + 1} de la scène, écrite pour occuper toute la largeur permise`
      .padEnd(CARACTERES_PAR_LIGNE, ".")
      .slice(0, CARACTERES_PAR_LIGNE),
  ).join("\n");

async function ouvrirDans(lieu: string, membre: Record<string, unknown>, corps: string, titre = "Une scène (LIBRE)") {
  const r = await ouvrirSujet(
    membre as never,
    AUCUN,
    "domaine",
    lieu,
    { titre, corps, avertissement: null },
  );
  if (r.ok) sujetsCrees.push(r.sujetId);
  return r;
}

describe("écrire dans le château", () => {
  /** L'élève d'essai est de Bryggeld, en première année. */
  const eleve = () => ({
    eleveId,
    fonction: "PREMIERE_ANNEE" as const,
    maison: "BRYGGELD",
    etatMaison: "FAIT" as const,
  });

  it("un post de huit lignes est refusé dans le domaine", async () => {
    const r = await ouvrirDans("les-cours-interieures", eleve(), post(8));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("10");
  });

  it("dix lignes passent, et la scène apparaît", async () => {
    const r = await ouvrirDans("les-cours-interieures", eleve(), post(10));
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const charge = await lireSujet(r.sujetId, {
      membre: eleve() as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.sujet.titre).toBe("Une scène (LIBRE)");
    expect(charge?.posts).toHaveLength(1);
    // L'année du lieu est recopiée à l'ouverture — ici aucune.
    expect(charge?.sujet.anneeRequiseALOuverture).toBeNull();
  });

  it("un première année n’ouvre rien dans la Réserve", async () => {
    const r = await ouvrirDans("la-reserve", eleve(), post(12));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.verdict).toMatchObject({
        raison: "ANNEE_INSUFFISANTE",
        anneeRequise: "CINQUIEME_ANNEE",
      });
    }
  });

  it("un Bryggeld n’écrit pas dans le dortoir de Nattorm", async () => {
    const r = await ouvrirDans("le-dortoir-de-nattorm", eleve(), post(12));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.verdict).toMatchObject({ raison: "RESERVE_A_LA_MAISON", maison: "NATTORM" });
    }
  });

  it("mais il monte à la Tour aux Corbeaux comme tout le monde", async () => {
    const r = await ouvrirDans("la-tour-aux-corbeaux", eleve(), post(11));
    expect(r.ok).toBe(true);
  });

  it("personne n’ouvre un sujet sur convocation, sauf le staff", async () => {
    const refuse = await ouvrirDans("le-bureau-de-la-direction", eleve(), post(12));
    expect(refuse.ok).toBe(false);
    if (!refuse.ok) expect(refuse.verdict).toMatchObject({ raison: "SUR_CONVOCATION" });

    const convoque = await ouvrirSujet(
      eleve() as never,
      STAFF,
      "domaine",
      "le-bureau-de-la-direction",
      { titre: "Convocation", corps: post(12), avertissement: null },
    );
    expect(convoque.ok).toBe(true);
    if (convoque.ok) sujetsCrees.push(convoque.sujetId);
  });

  it("répondre suit les mêmes règles, et remonte la scène", async () => {
    const ouvert = await ouvrirDans("le-hall-d-entree", eleve(), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    const court = await repondre(eleve() as never, AUCUN, ouvert.sujetId, {
      corps: post(4),
      avertissement: null,
    });
    expect(court.ok).toBe(false);

    const bon = await repondre(eleve() as never, AUCUN, ouvert.sujetId, {
      corps: post(10),
      avertissement: "violence",
    });
    expect(bon.ok).toBe(true);

    const charge = await lireSujet(ouvert.sujetId, {
      membre: eleve() as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.posts).toHaveLength(2);
    // Art. 16.3 — l'avertissement voyage avec le post.
    expect(charge?.posts[1]?.avertissementContenu).toBe("violence");
  });

  it("une scène close n’accepte plus de réponse, mais reste lisible", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", eleve(), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    // Un joueur ordinaire ne clôt rien.
    expect(await changerLaCloture(AUCUN, ouvert.sujetId, true, "Essai")).toBe(false);
    expect(await changerLaCloture(STAFF, ouvert.sujetId, true, "Essai")).toBe(true);

    const apres = await repondre(eleve() as never, AUCUN, ouvert.sujetId, {
      corps: post(12),
      avertissement: null,
    });
    expect(apres.ok).toBe(false);
    if (!apres.ok) expect(apres.verdict).toMatchObject({ raison: "SUJET_CLOS" });

    // « Les points acquis restent acquis » : rien n'est effacé.
    const charge = await lireSujet(ouvert.sujetId, {
      membre: eleve() as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.posts).toHaveLength(1);
  });
});

describe("un post masqué le temps d’une correction — art. 19.3", () => {
  it("le motif est obligatoire, et le joueur est prévenu par un corbeau", async () => {
    const ouvert = await ouvrirDans(
      "les-cours-interieures",
      {
        eleveId,
        fonction: "PREMIERE_ANNEE",
        maison: "BRYGGELD",
        etatMaison: "FAIT",
      },
      post(10),
    );
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    // Un joueur ordinaire ne masque rien : ce n'est pas un pouvoir qu'on
    // accorde à la carte, c'est de la modération.
    const refuse = await masquerPost(AUCUN, ouvert.postId, "trop court", "Essai");
    expect(refuse.ok).toBe(false);

    // Le motif ne peut pas être vide : le joueur ne verra que ça.
    const sansMotif = await masquerPost(STAFF, ouvert.postId, "  ", "Essai");
    expect(sansMotif.ok).toBe(false);

    const fait = await masquerPost(
      STAFF,
      ouvert.postId,
      "Il manque le contexte du début de scène.",
      "Essai",
    );
    expect(fait).toMatchObject({ ok: true, prevenu: true });

    // Le texte reste en base, et son auteur le voit toujours : c'est lui qui
    // doit le reprendre.
    const charge = await lireSujet(ouvert.sujetId, {
      membre: {
        fonction: "PREMIERE_ANNEE",
        maison: "BRYGGELD",
        etatMaison: "FAIT",
      } as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.posts[0]?.masque).toBe(true);
    expect(charge?.posts[0]?.corps).toContain("Ligne 1");
    expect(charge?.posts[0]?.motifMasquage).toContain("contexte");

    // Sept jours, jamais moins.
    const limite = new Date(charge!.posts[0]!.corrigerAvantLe!);
    const jours = Math.round((limite.getTime() - Date.now()) / 86_400_000);
    expect(jours).toBe(7);

    // Le corbeau du château est bien arrivé, sans auteur — c'est ce qui le signe.
    const lettre = await prisma.message.findFirst({
      where: {
        auteurId: null,
        conversation: { type: "AVEC_ADMINISTRATION" },
        corps: { contains: "contexte du début de scène" },
      },
      select: { id: true, conversationId: true },
    });
    expect(lettre).not.toBeNull();

    expect(await demasquerPost(STAFF, ouvert.postId)).toBe(true);

    // Ménage : la lettre et son fil sont à nous, ils partent avec le reste.
    if (lettre) {
      await prisma.conversation.deleteMany({ where: { id: lettre.conversationId } });
    }
  });
});

/**
 * **En dernier, et pas par hasard.** Ce bloc efface le compte d’essai pour
 * vérifier que la cascade emporte tout ; le placer plus haut coupait l’herbe
 * sous le pied des tests suivants, qui écrivaient au nom d’une fiche déjà
 * supprimée. Vitest exécute les `describe` dans l’ordre du fichier — l’ordre
 * est donc la garantie, et il mérite d’être dit.
 */
describe("retirer une scène, retirer son post — art. 2.4 et 6.4", () => {
  /** Un second joueur, le temps de ces essais : il faut être deux. */
  const ADRESSE_AUTRE = "essai.autre.forum@ravenshallow.invalid";
  let autreEleveId = "";
  let autreUtilisateurId = "";

  const moi = () => ({
    eleveId,
    fonction: "PREMIERE_ANNEE" as const,
    maison: "BRYGGELD",
    etatMaison: "FAIT" as const,
  });
  const lautre = () => ({
    eleveId: autreEleveId,
    fonction: "PREMIERE_ANNEE" as const,
    maison: "BRYGGELD",
    etatMaison: "FAIT" as const,
  });

  beforeAll(async () => {
    await prisma.utilisateur.deleteMany({ where: { email: ADRESSE_AUTRE } });
    const compte = await prisma.utilisateur.create({
      data: {
        email: ADRESSE_AUTRE,
        motDePasseHash: "essai",
        majeur16: true,
        statutAcces: "VALIDE",
        reglementAccepteLe: new Date(),
        reglementVersion: "essai",
        eleve: {
          create: {
            prenomNom: "Autre Essai",
            genre: "AUTRE",
            famille: "MIXTE",
            portraitType: "IA_ILLUSTRATION",
            biographie: "x".repeat(700),
            qualite1: "a", qualite2: "b", qualite3: "c",
            defaut1: "d", defaut2: "e", defaut3: "f",
            plusGrandePeur: "rien",
            statut: "ACCEPTE",
            maison: "BRYGGELD",
            etatMaison: "FAIT",
          },
        },
      },
      select: { id: true, eleve: { select: { id: true } } },
    });
    autreUtilisateurId = compte.id;
    autreEleveId = compte.eleve!.id;
  });

  afterAll(async () => {
    // **Le fil du château part avec le compte.** Il ne cascade pas : une
    // conversation dont tous les participants sont supprimés reste en base,
    // rattachée à personne et visible de personne. C'est la limite connue du
    // projet — un essai n'a pas à en fabriquer une à chaque passage.
    await prisma.conversation.deleteMany({
      where: { clePaire: `administration:${autreUtilisateurId}` },
    });
    await prisma.utilisateur.deleteMany({ where: { email: ADRESSE_AUTRE } });
  });

  it("l’auteur retire la sienne tant qu’il y est seul", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    const retire = await retirerLaScene(
      { eleveId, utilisateurId },
      AUCUN,
      ouvert.sujetId,
      null,
      "Essai",
    );
    expect(retire).toEqual({ ok: true, prevenus: 0 });

    // Retirée = introuvable, comme un lieu qu'on n'a pas le droit de lire.
    const relu = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    expect(relu).toBeNull();

    // Mais elle est toujours là : rien ne part définitivement sur un clic.
    const enBase = await prisma.sujet.findUnique({
      where: { id: ouvert.sujetId },
      select: { supprimeLe: true, supprimePar: true, titre: true },
    });
    expect(enBase?.supprimeLe).not.toBeNull();
    expect(enBase?.supprimePar).toBe("Essai");
  });

  /** **Art. 2.4** — les écrits partagés ne se mutilent pas. */
  it("ne le peut plus dès qu’un autre a répondu", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;

    const reponse = await repondre(lautre() as never, AUCUN, ouvert.sujetId, {
      corps: post(10),
      avertissement: null,
    });
    expect(reponse.ok).toBe(true);

    const refuse = await retirerLaScene(
      { eleveId, utilisateurId },
      AUCUN,
      ouvert.sujetId,
      null,
      "Essai",
    );
    expect(refuse.ok).toBe(false);

    // Elle est toujours lisible : rien n'a bougé.
    const relu = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    expect(relu).not.toBeNull();

    // Mais il peut la clore — sans permission, parce qu'elle est la sienne.
    expect(
      await changerLaCloture(AUCUN, ouvert.sujetId, true, "Essai", eleveId),
    ).toBe(true);
    // Pas celle d'un autre, en revanche.
    expect(
      await changerLaCloture(AUCUN, ouvert.sujetId, false, "Essai", autreEleveId),
    ).toBe(false);
  });

  it("le staff retire avec un motif, et prévient ceux qui y ont écrit", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;
    await repondre(lautre() as never, AUCUN, ouvert.sujetId, {
      corps: post(10),
      avertissement: null,
    });

    // Le motif est obligatoire : c'est tout ce qui restera au journal.
    const sansMotif = await retirerLaScene(
      { eleveId: "staff", utilisateurId: "staff" },
      STAFF,
      ouvert.sujetId,
      "   ",
      "Modération",
    );
    expect(sansMotif.ok).toBe(false);

    const fait = await retirerLaScene(
      { eleveId: "staff", utilisateurId: "staff" },
      STAFF,
      ouvert.sujetId,
      "Hors sujet, et le lieu ne s’y prête pas.",
      "Modération",
    );
    expect(fait).toMatchObject({ ok: true });
    // Deux joueurs y ont écrit, et le staff n'est ni l'un ni l'autre.
    expect(fait.ok && fait.prevenus).toBe(2);

    // Le corbeau porte le motif, et il est arrivé chez les deux.
    for (const qui of [utilisateurId, autreUtilisateurId]) {
      const recus = await prisma.message.findMany({
        where: { conversation: { participations: { some: { utilisateurId } } } },
        select: { corps: true },
      });
      void qui;
      expect(recus.some((m) => m.corps.includes("Hors sujet"))).toBe(true);
    }

    // Et la trace au journal, chez l'auteur de la scène.
    const trace = await prisma.journalMembre.findFirst({
      where: { utilisateurId, type: "SCENE_SUPPRIMEE" },
      select: { note: true, parNom: true },
    });
    expect(trace?.note).toContain("Hors sujet");
    expect(trace?.parNom).toBe("Modération");
  });

  it("un post retiré s’en va s’il fermait la scène, et laisse sa place sinon", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;

    const deuxieme = await repondre(moi() as never, AUCUN, ouvert.sujetId, {
      corps: post(10),
      avertissement: null,
    });
    expect(deuxieme.ok).toBe(true);
    if (!deuxieme.ok) return;

    // Le dernier ferme la scène : il s'en va sans laisser de vide.
    expect(await retirerSonPost({ eleveId }, deuxieme.postId)).toMatchObject({
      ok: true,
    });
    let charge = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.posts).toHaveLength(1);

    // On répond après le premier : le retirer laissera sa place.
    await repondre(lautre() as never, AUCUN, ouvert.sujetId, {
      corps: post(10),
      avertissement: null,
    });
    expect(await retirerSonPost({ eleveId }, ouvert.postId)).toMatchObject({
      ok: true,
    });

    charge = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    const marque = charge?.posts.find((p) => p.id === ouvert.postId);
    expect(marque?.retire).toBe(true);
    // **Le texte ne traverse plus le réseau**, même vers son auteur.
    expect(marque?.corps).toBe("");
  });

  it("le post d’un autre ne se retire pas", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", lautre(), post(10));
    if (!ouvert.ok) return;
    expect(await retirerSonPost({ eleveId }, ouvert.postId)).toMatchObject({
      ok: false,
    });
  });
});

describe("reprendre son post — art. 6.4", () => {
  const moi = () => ({
    eleveId,
    fonction: "PREMIERE_ANNEE" as const,
    maison: "BRYGGELD",
    etatMaison: "FAIT" as const,
  });

  it("son auteur le reprend, et la marque reste", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    const repris = await modifierSonPost({ eleveId }, ouvert.postId, {
      corps: `<p>${post(10)}</p><p>Et une phrase de plus, ajoutée après coup.</p>`,
      avertissement: "violence",
    });
    expect(repris.ok).toBe(true);

    const charge = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    const relu = charge?.posts[0];
    expect(relu?.corps).toContain("ajoutée après coup");
    expect(relu?.avertissementContenu).toBe("violence");
    // **La marque est ce qui protège les autres** : sans limite de temps, il
    // faut au moins qu'on voie que le texte a bougé.
    expect(relu?.modifieLe).not.toBeNull();
  });

  it("passe par la même porte que la publication", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;

    // Trop court : la reprise ne peut pas faire passer un post sous le seuil.
    const court = await modifierSonPost({ eleveId }, ouvert.postId, {
      corps: "<p>Trois mots.</p>",
      avertissement: null,
    });
    expect(court.ok).toBe(false);

    // Et le balisage est nettoyé comme à la publication.
    const sale = await modifierSonPost({ eleveId }, ouvert.postId, {
      corps: `<p>${post(10)}</p><script>alert("pris")</script>`,
      avertissement: null,
    });
    expect(sale.ok).toBe(true);

    const charge = await lireSujet(ouvert.sujetId, {
      membre: moi() as never,
      pouvoirs: AUCUN,
    });
    expect(charge?.posts[0]?.corps).not.toContain("script");
    expect(charge?.posts[0]?.corps).not.toContain("alert");
  });

  it("ne s’ouvre ni au staff, ni sur un post retiré", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;

    // Le staff masque, il ne réécrit pas.
    const parLeStaff = await modifierSonPost({ eleveId: "staff" }, ouvert.postId, {
      corps: `<p>${post(10)}</p>`,
      avertissement: null,
    });
    expect(parLeStaff.ok).toBe(false);

    await retirerSonPost({ eleveId }, ouvert.postId);
    const apresRetrait = await modifierSonPost({ eleveId }, ouvert.postId, {
      corps: `<p>${post(10)}</p>`,
      avertissement: null,
    });
    expect(apresRetrait.ok).toBe(false);
  });

  /**
   * ⚠️ **Modifier ne démasque pas.** Sinon il suffirait de changer une virgule
   * pour annuler une mesure de modération.
   */
  it("ne démasque pas un post masqué pour correction", async () => {
    const ouvert = await ouvrirDans("les-cours-interieures", moi(), post(10));
    if (!ouvert.ok) return;

    await masquerPost(STAFF, ouvert.postId, "À reprendre.", "Modération");
    await modifierSonPost({ eleveId }, ouvert.postId, {
      corps: `<p>${post(10)}</p><p>Corrigé.</p>`,
      avertissement: null,
    });

    const enBase = await prisma.post.findUnique({
      where: { id: ouvert.postId },
      select: { masqueLe: true, modifieLe: true },
    });
    expect(enBase?.masqueLe).not.toBeNull();
    expect(enBase?.modifieLe).not.toBeNull();
  });
});

describe("le ménage", () => {
  it("ne laisse rien derrière lui", async () => {
    // Le fil du château d'abord : il survivrait au compte, sans participant
    // ni lecteur possible. Voir le commentaire de l'essai du retrait.
    await prisma.conversation.deleteMany({
      where: { clePaire: `administration:${utilisateurId}` },
    });
    await prisma.utilisateur.deleteMany({ where: { email: ADRESSE } });

    expect(
      await prisma.permissionAccordee.count({ where: { utilisateurId } }),
    ).toBe(0);
    expect(await prisma.prefet.count({ where: { eleveId } })).toBe(0);
    expect(await prisma.journalMembre.count({ where: { utilisateurId } })).toBe(0);
    // Les sujets ouverts par cette fiche restent lisibles, détachés : effacer
    // un compte n'efface pas ce qu'il a écrit chez les autres. C'est pourquoi
    // l'essai les supprime lui-même, plus haut.
    expect(await prisma.sujet.count({ where: { auteurId: eleveId } })).toBe(0);

    // **Aucune conversation sans personne.** Le corbeau du château, envoyé
    // quand le staff retire une scène, en fabriquerait une à chaque passage
    // si l'essai ne l'emportait pas.
    expect(
      await prisma.conversation.count({ where: { participations: { none: {} } } }),
    ).toBe(0);
  });
});
