import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Les points, gagnés **SUR LA VRAIE BASE**.
 *
 *   npm run points:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l’exclut de
 * `npm test` **à dessein** : la suite ordinaire ne doit jamais toucher la
 * base, qui est celle de production tant qu’il n’existe pas de branche
 * d’essai.
 *
 * Ce qui ne peut se vérifier QU’ici, et que `regles.test.ts` ne verra jamais :
 * que le point part vraiment dans les deux compteurs, qu’un masquage le
 * reprend et qu’un démasquage le rend, qu’un post retiré le garde, et que le
 * recalcul depuis le carnet redonne exactement les mêmes totaux.
 *
 * Deux comptes en `@ravenshallow.invalid`, effacés à la fin par leur adresse
 * exacte. Aucun effacement à l’aveugle, jamais. **Et les compteurs sont remis
 * d’aplomb en partant** : les points de l’essai n’ont rien à faire dans le
 * tournoi des joueurs.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. Il doit être posé AVANT que `@/lib/prisma` ne soit
// chargé — d'où les imports dynamiques : un `import` ordinaire serait hissé
// en tête de fichier et lirait un environnement encore vide.
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
const { CARACTERES_PAR_LIGNE } = await import("@/lib/forum/longueur");
const { demasquerPost, masquerPost, ouvrirSujet, repondre, retirerSonPost } =
  await import("@/lib/forum/depot");
const {
  accorderDesPointsAUnEleve,
  ajusterLaMaison,
  annulerLAjustement,
  reprendreLesPointsAccordes,
  compteursDeLaSaison,
  effectifs,
  recalculerLesCompteurs,
  saisonEnCours,
} = await import("./depot");
const { PLAFOND_PAR_JOUR } = await import("./regles");
const { ceQueLaClotureFerait, cloturerLaSaison } = await import("./cloture");
const { archiverLeCompte, restaurerLeCompte, noterLaConnexion } = await import(
  "@/lib/dossier/archivage"
);

const ADRESSE_ELEVE = "essai.points.eleve@ravenshallow.invalid";
const ADRESSE_PROF = "essai.points.prof@ravenshallow.invalid";

/** La pièce où l'essai écrit — dans « Le domaine », donc elle compte. */
const PIECE = "les-cours-interieures";

let saisonId = "";
let eleve = { utilisateurId: "", eleveId: "" };
let prof = { utilisateurId: "", eleveId: "" };
const sujetsCrees: string[] = [];

/** Aucun pouvoir. */
const AUCUN = { role: "JOUEUR", permissions: [], prefetDe: [] } as never;
/** Le staff, pour masquer. */
const STAFF = { role: "ADMIN", permissions: [], prefetDe: [] } as never;

/** Un post qui atteint vraiment le seuil : dix lignes de caractères réels. */
const post = (lignes: number) => "m".repeat(lignes * CARACTERES_PAR_LIGNE);

async function creerCompte(email: string, nom: string, maison: string | null, etat: string) {
  const compte = await prisma.utilisateur.create({
    data: {
      email,
      motDePasseHash: "essai",
      majeur16: true,
      statutAcces: "VALIDE",
      reglementAccepteLe: new Date(),
      reglementVersion: "essai",
      eleve: {
        create: {
          prenomNom: nom,
          genre: "AUTRE",
          famille: "MIXTE",
          portraitType: "IA_ILLUSTRATION",
          biographie: "x".repeat(700),
          qualite1: "a", qualite2: "b", qualite3: "c",
          defaut1: "d", defaut2: "e", defaut3: "f",
          plusGrandePeur: "rien",
          statut: "ACCEPTE",
          fonction: "TROISIEME_ANNEE",
          maison: maison as never,
          etatMaison: etat as never,
        },
      },
    },
    select: { id: true, eleve: { select: { id: true } } },
  });
  return { utilisateurId: compte.id, eleveId: compte.eleve!.id };
}

/** Le membre tel que le dépôt du forum l'attend. */
const membre = (qui: { eleveId: string }, maison: string | null, etat: string) =>
  ({
    eleveId: qui.eleveId,
    fonction: "TROISIEME_ANNEE",
    maison,
    etatMaison: etat,
  }) as never;

async function ouvrirUneScene(qui: never, corps: string) {
  const ouvert = await ouvrirSujet(qui, AUCUN, "domaine", PIECE, {
    titre: `Essai des points ${sujetsCrees.length + 1}`,
    corps,
    avertissement: null,
  });
  if (ouvert.ok) sujetsCrees.push(ouvert.sujetId);
  return ouvert;
}

/**
 * **Effacer un compte d'essai, et le fil du château avec lui.**
 *
 * Une conversation dont tous les participants sont supprimés reste en base,
 * rattachée à personne et visible de personne — la limite connue du projet.
 * Le masquage d'un post envoie un corbeau du château, qui ouvre ce fil : sans
 * ce ménage-ci, chaque passage de l'essai en fabriquerait un de plus. C'est
 * exactement le même geste que dans l'essai du forum.
 */
async function effacerLeCompte(email: string, utilisateurId: string) {
  await prisma.conversation.deleteMany({
    where: { clePaire: `administration:${utilisateurId}` },
  });
  await prisma.utilisateur.deleteMany({ where: { email } });
}

/** Les points personnels, relus en base. */
const pointsDe = async (eleveId: string) =>
  (await prisma.eleve.findUnique({ where: { id: eleveId }, select: { points: true } }))!.points;

beforeAll(async () => {
  const saison = await saisonEnCours();
  if (!saison) throw new Error("Aucune saison ouverte — la migration n’a pas été appliquée.");
  saisonId = saison.id;

  eleve = await creerCompte(ADRESSE_ELEVE, "Points Essai", "TIDEAL", "FAIT");
  // Une professeure : sa maison est écrite, et ne compte pas.
  prof = await creerCompte(ADRESSE_PROF, "Prof Essai", "TIDEAL", "SANS_OBJET");
});

afterAll(async () => {
  // **Le carnet d'abord**, sans quoi l'effacement des scènes échouerait : une
  // ligne du carnet retient son post (`ON DELETE RESTRICT`).
  if (sujetsCrees.length) {
    await prisma.pointGagne.deleteMany({
      where: { post: { sujetId: { in: sujetsCrees } } },
    });
    await prisma.sujet.deleteMany({ where: { id: { in: sujetsCrees } } });
  }
  // Les lignes sans post — celles que l'essai a posées pour éprouver le
  // plafond — et les ajustements de l'essai.
  await prisma.pointGagne.deleteMany({
    where: { eleveId: { in: [eleve.eleveId, prof.eleveId] } },
  });
  await prisma.ajustementMaison.deleteMany({
    where: { parNom: "Essai des points" },
  });

  await effacerLeCompte(ADRESSE_ELEVE, eleve.utilisateurId);
  await effacerLeCompte(ADRESSE_PROF, prof.utilisateurId);

  // **Les compteurs remis d'aplomb.** Les points de l'essai sont passés par
  // le compteur de Tideål, et ils n'ont rien à y faire.
  if (saisonId) await recalculerLesCompteurs(saisonId);
  await prisma.$disconnect();
});

describe("un post de dix lignes dans le domaine rapporte un point", () => {
  it("l’inscrit au carnet, aux points personnels et au compteur de la maison", async () => {
    const avant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const ouvert = await ouvrirUneScene(membre(eleve, "TIDEAL", "FAIT"), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    // 1 — la trace
    const ligne = await prisma.pointGagne.findUnique({
      where: { postId: ouvert.postId },
      select: { points: true, maison: true, source: true, eleveId: true, repriseLe: true },
    });
    expect(ligne).toEqual({
      points: 1,
      maison: "TIDEAL",
      source: "POST",
      eleveId: eleve.eleveId,
      repriseLe: null,
    });

    // 2 — les points personnels
    expect(await pointsDe(eleve.eleveId)).toBe(1);

    // 3 — le compteur de la maison
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(avant + 1);
  });

  it("une réponse rapporte aussi", async () => {
    const sujetId = sujetsCrees[0]!;
    const repondu = await repondre(
      membre(eleve, "TIDEAL", "FAIT"),
      AUCUN,
      sujetId,
      { corps: post(10), avertissement: null },
    );
    expect(repondu.ok).toBe(true);
    expect(await pointsDe(eleve.eleveId)).toBe(2);
  });
});

/** **Un compte sans maison ne rapporte rien, et n’entre pas dans l’effectif.** */
describe("une professeure n’alimente aucune maison", () => {
  it("garde ses points personnels, sans que Tideål n’en profite", async () => {
    const avant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const ouvert = await ouvrirUneScene(membre(prof, "TIDEAL", "SANS_OBJET"), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    // La maison est écrite sur sa fiche — on ne l'efface pas — et la ligne du
    // carnet n'en porte aucune. C'est `maisonQuiCompte` qui a tranché, au
    // moment du gain, et la base refuse désormais de changer cette colonne.
    const ligne = await prisma.pointGagne.findUnique({
      where: { postId: ouvert.postId },
      select: { maison: true, points: true },
    });
    expect(ligne).toEqual({ maison: null, points: 1 });

    expect(await pointsDe(prof.eleveId)).toBe(1);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(avant);
  });

  it("n’entre pas dans l’effectif de sa maison", async () => {
    const compte = await effectifs();
    // L'élève de l'essai y est ; la professeure non. On compare à un état
    // relu maintenant plutôt qu'à un nombre écrit en dur : d'autres comptes
    // vivent sur cette base.
    const eleves = await prisma.eleve.count({
      where: { statut: "ACCEPTE", etatMaison: "FAIT", maison: "TIDEAL", utilisateur: { archiveLe: null } },
    });
    expect(compte.TIDEAL).toBe(eleves);
  });
});

/** **Le plafond quotidien se déclenche.** */
describe("le plafond quotidien", () => {
  it("arrête le point sans jamais refuser le post", async () => {
    const plafond = PLAFOND_PAR_JOUR!;
    const dejaGagnes = await prisma.pointGagne.count({
      where: { eleveId: eleve.eleveId },
    });

    // On remplit la journée avec des lignes sans post — la source à venir des
    // QCM. C'est plus honnête qu'écrire dix posts : le plafond compte des
    // POINTS, quelle qu'en soit la provenance, et l'essai le dit ainsi.
    //
    // **Sans maison**, à dessein : ces lignes sont posées à la main, sans
    // passer par le dépôt, et une maison écrite fausserait le compteur du
    // tournoi sans que rien ne l'ait crédité. C'est le plafond qu'on éprouve
    // ici, pas le compteur.
    await prisma.pointGagne.createMany({
      data: Array.from({ length: plafond - dejaGagnes }, () => ({
        saisonId,
        eleveId: eleve.eleveId,
        maison: null,
        points: 1,
        source: "QCM" as const,
      })),
    });

    const personnelsAvant = await pointsDe(eleve.eleveId);
    const maisonAvant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const ouvert = await ouvrirUneScene(membre(eleve, "TIDEAL", "FAIT"), post(10));
    // **Le post part.** Le plafond ralentit un compteur, il ne ferme pas une
    // porte : refuser le texte serait une tout autre mesure.
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;

    expect(
      await prisma.pointGagne.findUnique({ where: { postId: ouvert.postId } }),
    ).toBeNull();
    expect(await pointsDe(eleve.eleveId)).toBe(personnelsAvant);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(maisonAvant);
  });
});

/** **Un post masqué perd son point ; le démasquage le rend.** */
describe("le post masqué pour correction — art. 19.3", () => {
  let postId = "";

  it("le point s’en va des deux compteurs", async () => {
    // Un nouveau compte, pour repartir d'une journée vide : celui de l'élève
    // a son plafond atteint.
    const neuf = await creerCompte(
      "essai.points.masque@ravenshallow.invalid",
      "Masque Essai",
      "NATTORM",
      "FAIT",
    );
    const ouvert = await ouvrirUneScene(membre(neuf, "NATTORM", "FAIT"), post(10));
    expect(ouvert.ok).toBe(true);
    if (!ouvert.ok) return;
    postId = ouvert.postId;

    expect(await pointsDe(neuf.eleveId)).toBe(1);
    const avant = (await compteursDeLaSaison(saisonId)).NATTORM;

    const masque = await masquerPost(STAFF, postId, "Hors sujet", "Essai");
    expect(masque.ok).toBe(true);

    // La ligne n'est pas effacée : elle porte une date, et cesse de compter.
    const ligne = await prisma.pointGagne.findUnique({
      where: { postId },
      select: { repriseLe: true, points: true },
    });
    expect(ligne?.repriseLe).not.toBeNull();
    expect(ligne?.points).toBe(1);

    expect(await pointsDe(neuf.eleveId)).toBe(0);
    expect((await compteursDeLaSaison(saisonId)).NATTORM).toBe(avant - 1);

    // Et il revient, identique.
    const rouvert = await demasquerPost(STAFF, postId);
    expect(rouvert).toBe(true);
    expect((await prisma.pointGagne.findUnique({ where: { postId } }))?.repriseLe).toBeNull();
    expect(await pointsDe(neuf.eleveId)).toBe(1);
    expect((await compteursDeLaSaison(saisonId)).NATTORM).toBe(avant);

    // Le ménage efface la trace : le compteur doit repartir de ce qui reste,
    // sinon la maison garderait un point que plus rien ne justifie.
    await prisma.pointGagne.deleteMany({ where: { eleveId: neuf.eleveId } });
    await effacerLeCompte(
      "essai.points.masque@ravenshallow.invalid",
      neuf.utilisateurId,
    );
    await recalculerLesCompteurs(saisonId);
  });
});

/** **Un post retiré GARDE ses points** — décision du joueur, art. 17.2. */
describe("le post retiré par son auteur", () => {
  it("garde son point : les points acquis restent acquis", async () => {
    const neuf = await creerCompte(
      "essai.points.retire@ravenshallow.invalid",
      "Retrait Essai",
      "KALDRAFN",
      "FAIT",
    );
    const ouvert = await ouvrirUneScene(membre(neuf, "KALDRAFN", "FAIT"), post(10));
    if (!ouvert.ok) return;

    const avant = (await compteursDeLaSaison(saisonId)).KALDRAFN;

    const retire = await retirerSonPost({ eleveId: neuf.eleveId }, ouvert.postId);
    expect(retire.ok).toBe(true);

    // Le texte n'est plus lu de personne, et le point reste. Seul un geste de
    // l'administration en retire, avec un motif.
    const ligne = await prisma.pointGagne.findUnique({
      where: { postId: ouvert.postId },
      select: { repriseLe: true },
    });
    expect(ligne?.repriseLe).toBeNull();
    expect(await pointsDe(neuf.eleveId)).toBe(1);
    expect((await compteursDeLaSaison(saisonId)).KALDRAFN).toBe(avant);

    await prisma.pointGagne.deleteMany({ where: { eleveId: neuf.eleveId } });
    await effacerLeCompte(
      "essai.points.retire@ravenshallow.invalid",
      neuf.utilisateurId,
    );
    await recalculerLesCompteurs(saisonId);
  });
});

/** **Un retrait administratif ne touche pas les points personnels.** */
describe("l’ajustement de l’administration — art. 19.1", () => {
  let ajustementId = "";

  it("baisse le compteur de la maison, et lui seul", async () => {
    const personnels = await pointsDe(eleve.eleveId);
    const avant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const fait = await ajusterLaMaison(
      saisonId,
      "TIDEAL",
      -5,
      "Retenue collective après le chahut du réfectoire.",
      "Essai des points",
    );
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    ajustementId = fait.id;

    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(avant - 5);
    // **Le test qui compte** : une sanction de fiction ne coûte pas son année
    // à un élève.
    expect(await pointsDe(eleve.eleveId)).toBe(personnels);
  });

  it("refuse un motif vide — ces points s’affichent devant tout le monde", async () => {
    const refus = await ajusterLaMaison(saisonId, "TIDEAL", -5, "   ", "Essai des points");
    expect(refus.ok).toBe(false);
  });

  it("refuse un ajustement qui ne vaut rien", async () => {
    const refus = await ajusterLaMaison(saisonId, "TIDEAL", 0, "Rien", "Essai des points");
    expect(refus.ok).toBe(false);
  });

  it("s’annule sans s’effacer", async () => {
    const avant = (await compteursDeLaSaison(saisonId)).TIDEAL;
    expect(await annulerLAjustement(ajustementId, "Essai des points")).toBe(true);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(avant + 5);

    // La ligne est toujours là, annulée : l'historique garde le geste ET son
    // retrait.
    const ligne = await prisma.ajustementMaison.findUnique({
      where: { id: ajustementId },
      select: { points: true, annuleLe: true, annulePar: true },
    });
    expect(ligne?.points).toBe(-5);
    expect(ligne?.annuleLe).not.toBeNull();

    // Et une seconde annulation ne rend pas les points deux fois.
    expect(await annulerLAjustement(ajustementId, "Essai des points")).toBe(false);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(avant + 5);
  });
});

/**
 * **Donner des points à un joueur — art. 18.1.**
 *
 * Le geste voisin de l'ajustement de maison, et celui qu'il ne faut pas
 * confondre avec lui : celui-ci alimente **les deux compteurs**.
 */
describe("les points donnés à la main", () => {
  let donId = "";

  it("vont dans les deux compteurs à la fois", async () => {
    const personnelsAvant = await pointsDe(eleve.eleveId);
    const maisonAvant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const fait = await accorderDesPointsAUnEleve(
      eleve.eleveId,
      7,
      "Belle scène dans la bibliothèque.",
      "Essai des points",
    );
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    donId = fait.id;
    expect(fait.maison).toBe("TIDEAL");

    expect(await pointsDe(eleve.eleveId)).toBe(personnelsAvant + 7);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(maisonAvant + 7);

    // La ligne est au carnet, avec son motif et son auteur — la base les
    // exige pour cette provenance, et les interdit pour les autres.
    const ligne = await prisma.pointGagne.findUnique({
      where: { id: donId },
      select: { source: true, motif: true, parNom: true, postId: true, maison: true },
    });
    expect(ligne).toEqual({
      source: "ADMINISTRATION",
      motif: "Belle scène dans la bibliothèque.",
      parNom: "Essai des points",
      postId: null,
      maison: "TIDEAL",
    });
  });

  it("refuse un motif vide, et une valeur nulle", async () => {
    expect(
      (await accorderDesPointsAUnEleve(eleve.eleveId, 5, "   ", "Essai des points")).ok,
    ).toBe(false);
    expect(
      (await accorderDesPointsAUnEleve(eleve.eleveId, 0, "Rien", "Essai des points")).ok,
    ).toBe(false);
  });

  /** **Une professeure garde ses points, sa maison n'en profite pas.** */
  it("ne créditent aucune maison pour un compte qui ne marque pour personne", async () => {
    const personnelsAvant = await pointsDe(prof.eleveId);
    const maisonAvant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    const fait = await accorderDesPointsAUnEleve(
      prof.eleveId,
      12,
      "Un cours mémorable.",
      "Essai des points",
    );
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    expect(fait.maison).toBeNull();

    expect(await pointsDe(prof.eleveId)).toBe(personnelsAvant + 12);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(maisonAvant);
  });

  /** **Le plafond quotidien ne s'applique pas à un geste délibéré.** */
  it("passent alors même que le plafond du joueur est atteint", async () => {
    // L'essai du plafond, plus haut, a rempli la journée de cet élève : un
    // post n'y rapporterait plus rien. Un don, si.
    const personnelsAvant = await pointsDe(eleve.eleveId);
    const fait = await accorderDesPointsAUnEleve(
      eleve.eleveId,
      3,
      "Au-delà du plafond, et c’est voulu.",
      "Essai des points",
    );
    expect(fait.ok).toBe(true);
    expect(await pointsDe(eleve.eleveId)).toBe(personnelsAvant + 3);
  });

  it("se reprennent sans s’effacer", async () => {
    const personnelsAvant = await pointsDe(eleve.eleveId);
    const maisonAvant = (await compteursDeLaSaison(saisonId)).TIDEAL;

    expect(await reprendreLesPointsAccordes(donId)).toBe(true);
    expect(await pointsDe(eleve.eleveId)).toBe(personnelsAvant - 7);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(maisonAvant - 7);

    // La ligne reste, avec son motif : l’historique garde le geste ET son
    // retrait. Et une seconde reprise ne retire pas deux fois.
    const ligne = await prisma.pointGagne.findUnique({
      where: { id: donId },
      select: { repriseLe: true, points: true, motif: true },
    });
    expect(ligne?.repriseLe).not.toBeNull();
    expect(ligne?.points).toBe(7);
    expect(await reprendreLesPointsAccordes(donId)).toBe(false);
  });

  /** Le masquage d’un post et la reprise d’un don sont deux chemins distincts. */
  it("ne reprennent jamais un point de post", async () => {
    const dePost = await prisma.pointGagne.findFirst({
      where: { eleveId: eleve.eleveId, source: "POST", repriseLe: null },
      select: { id: true },
    });
    if (!dePost) return;
    expect(await reprendreLesPointsAccordes(dePost.id)).toBe(false);
  });
});

/** **Le recalcul depuis la trace redonne exactement les mêmes totaux.** */
describe("le recalcul", () => {
  it("redonne exactement ce que dit le carnet", async () => {
    // La somme faite à la main, ici, à partir des mêmes lignes — et non pas
    // relue depuis les compteurs, qui sont justement ce qu'on vérifie.
    const [gagnes, ajustements] = await Promise.all([
      prisma.pointGagne.findMany({
        where: { saisonId, repriseLe: null, NOT: { maison: null } },
        select: { maison: true, points: true },
      }),
      prisma.ajustementMaison.findMany({
        where: { saisonId, annuleLe: null },
        select: { maison: true, points: true },
      }),
    ]);
    const attendu: Record<string, number> = {
      KALDRAFN: 0, NATTORM: 0, BRYGGELD: 0, TIDEAL: 0,
    };
    for (const l of [...gagnes, ...ajustements]) attendu[l.maison!] += l.points;

    expect(await recalculerLesCompteurs(saisonId)).toEqual(attendu);
    expect(await compteursDeLaSaison(saisonId)).toEqual(attendu);
  });

  it("relancé deux fois, ne change plus rien", async () => {
    const une = await recalculerLesCompteurs(saisonId);
    expect(await recalculerLesCompteurs(saisonId)).toEqual(une);
  });

  it("répare un compteur faussé à la main", async () => {
    const juste = (await compteursDeLaSaison(saisonId)).TIDEAL;

    // Le jour où un bug fausse un total, c'est ce chemin-là qui sauve.
    await prisma.compteurMaison.update({
      where: { saisonId_maison: { saisonId, maison: "TIDEAL" } },
      data: { points: juste + 9999 },
    });
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(juste + 9999);

    await recalculerLesCompteurs(saisonId);
    expect((await compteursDeLaSaison(saisonId)).TIDEAL).toBe(juste);
  });
});

describe("le ménage", () => {
  it("ne laisse aucune conversation sans personne", async () => {
    // Le corbeau du château, envoyé au masquage, ouvre un fil qui survivrait
    // au compte. La même vérification que dans l'essai du forum : elle est
    // globale, et tombe donc aussi sur ce qu'un autre essai aurait laissé.
    expect(
      await prisma.conversation.count({ where: { participations: { none: {} } } }),
    ).toBe(0);
  });
});

/** **L’archivage d’un compte — art. 7.3.** */
describe("un compte archivé sort de l’effectif", () => {
  it("en sort, y revient, et une connexion lève l’archivage", async () => {
    const avant = (await effectifs()).TIDEAL;
    expect(avant).toBeGreaterThan(0); // l'élève de l'essai y est

    expect(await archiverLeCompte(eleve.utilisateurId, "Essai des points")).toBe(true);
    expect((await effectifs()).TIDEAL).toBe(avant - 1);

    // Un second clic n'archive pas deux fois, et n'écrit pas une ligne de plus.
    expect(await archiverLeCompte(eleve.utilisateurId, "Essai des points")).toBe(false);

    // **Ce n'est pas une sanction** : l'accès n'a pas bougé d'un pouce.
    const compte = await prisma.utilisateur.findUnique({
      where: { id: eleve.utilisateurId },
      select: { statutAcces: true, archiveLe: true },
    });
    expect(compte?.statutAcces).toBe("VALIDE");
    expect(compte?.archiveLe).not.toBeNull();

    // « Le retour reste possible » : une connexion suffit, sans écrire à
    // l'administration pour rentrer chez soi.
    await noterLaConnexion(eleve.utilisateurId);
    const revenu = await prisma.utilisateur.findUnique({
      where: { id: eleve.utilisateurId },
      select: { archiveLe: true, archivePar: true, derniereConnexionLe: true },
    });
    expect(revenu?.archiveLe).toBeNull();
    expect(revenu?.archivePar).toBeNull();
    expect(revenu?.derniereConnexionLe).not.toBeNull();
    expect((await effectifs()).TIDEAL).toBe(avant);

    // Et la trace des deux gestes est au journal.
    const journal = await prisma.journalMembre.findMany({
      where: { utilisateurId: eleve.utilisateurId },
      select: { type: true },
    });
    expect(journal.map((j) => j.type)).toContain("COMPTE_ARCHIVE");
    expect(journal.map((j) => j.type)).toContain("COMPTE_RESTAURE");

    // Restaurer un compte qui n'est pas archivé ne fait rien.
    expect(await restaurerLeCompte(eleve.utilisateurId, "Essai des points")).toBe(false);
  });
});

/**
 * **La clôture d’une année — art. 18.3.**
 *
 * ⚠️ Le geste est irréversible par nature : le classement archivé ne se
 * réécrit pas, et une saison close ne se rouvre pas depuis le site. L’essai
 * le **défait lui-même en base**, pour pouvoir se relancer — et il note ce
 * qu’il doit défaire AVANT de clore, plutôt qu’après : si la clôture passe et
 * que la vérification tombe, le ménage a déjà de quoi travailler.
 */
describe("la clôture archive, puis remet à zéro les seuls compteurs de maison", () => {
  let saisonDOrigine = "";
  let nouvelleSaison = "";
  let anneeDOrigine = "";

  afterAll(async () => {
    if (nouvelleSaison) {
      await prisma.compteurMaison.deleteMany({ where: { saisonId: nouvelleSaison } });
      await prisma.pointGagne.deleteMany({ where: { saisonId: nouvelleSaison } });
      await prisma.saisonScolaire.deleteMany({ where: { id: nouvelleSaison } });
    }
    if (saisonDOrigine) {
      await prisma.classementArchive.deleteMany({ where: { saisonId: saisonDOrigine } });
      // Rouverte APRÈS la suppression de la suivante : la base n'accepte
      // qu'une seule saison ouverte à la fois, et refuserait les deux.
      await prisma.saisonScolaire.update({
        where: { id: saisonDOrigine },
        data: { closeLe: null },
      });
    }
    if (anneeDOrigine) {
      await prisma.eleve.update({
        where: { id: eleve.eleveId },
        data: { fonction: anneeDOrigine as never },
      });
    }
  });

  it("fige le classement, ouvre une saison neuve, et fait passer les cochés", async () => {
    saisonDOrigine = saisonId;
    anneeDOrigine = "TROISIEME_ANNEE";

    const avenir = await ceQueLaClotureFerait();
    expect(avenir).not.toBeNull();
    if (!avenir) return;

    const attendu = avenir.classement.map((l) => ({
      maison: l.maison,
      points: l.pointsAuTournoi,
      effectif: l.effectif,
      rang: l.rang,
    }));
    const pointsPersonnelsAvant = await pointsDe(eleve.eleveId);

    const fait = await cloturerLaSaison(
      "Session d’essai — à effacer",
      [eleve.eleveId],
      "Essai des points",
    );
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    nouvelleSaison = fait.nouvelleSaisonId;

    // 1 — Le classement est archivé, et il dit exactement ce qu'il disait.
    const archive = await prisma.classementArchive.findMany({
      where: { saisonId: saisonDOrigine },
      select: { maison: true, points: true, effectif: true, rang: true },
    });
    expect(archive).toHaveLength(4);
    for (const ligne of attendu) {
      expect(archive).toContainEqual(ligne);
    }

    // 2 — Une archive ne se réécrit pas. La base le refuse, sans exception.
    await expect(
      prisma.classementArchive.updateMany({
        where: { saisonId: saisonDOrigine },
        data: { points: 9999 },
      }),
    ).rejects.toThrow();

    // 3 — L'ancienne saison est close, la neuve est ouverte, et ses quatre
    // compteurs sont à zéro.
    const ancienne = await prisma.saisonScolaire.findUnique({
      where: { id: saisonDOrigine },
      select: { closeLe: true },
    });
    expect(ancienne?.closeLe).not.toBeNull();

    const enCours = await saisonEnCours();
    expect(enCours?.id).toBe(nouvelleSaison);
    expect(await compteursDeLaSaison(nouvelleSaison)).toEqual({
      KALDRAFN: 0, NATTORM: 0, BRYGGELD: 0, TIDEAL: 0,
    });

    // 4 — **Les compteurs de l'ancienne saison n'ont pas été effacés.** Rien
    // n'est jamais remis à zéro sur ce site : on ouvre une page neuve.
    expect(await compteursDeLaSaison(saisonDOrigine)).toEqual(
      Object.fromEntries(attendu.map((l) => [l.maison, l.points])),
    );

    // 5 — **Les points personnels n'ont pas bougé** : ils portent la
    // progression, et c'est justement ce qu'on vient de récompenser.
    expect(await pointsDe(eleve.eleveId)).toBe(pointsPersonnelsAvant);

    // 6 — L'élève coché a changé d'année, avec sa trace au journal.
    const passe = await prisma.eleve.findUnique({
      where: { id: eleve.eleveId },
      select: { fonction: true },
    });
    expect(passe?.fonction).toBe("QUATRIEME_ANNEE");
    expect(fait.passes).toBe(1);

    const journal = await prisma.journalMembre.findMany({
      where: { utilisateurId: eleve.utilisateurId, type: "FONCTION_MODIFIEE" },
      select: { valeurAvant: true, valeurApres: true },
    });
    // Le libellé est celui de `libelleAnnee` — « 4e année » —, et non le
    // nom de la valeur d'enum : c'est ce qu'un humain relira au journal.
    expect(journal.at(-1)?.valeurAvant).toBe("3e année");
    expect(journal.at(-1)?.valeurApres).toBe("4e année");

    // 7 — La professeure, elle, n'a pas été cochée : elle ne bouge pas.
    const prof2 = await prisma.eleve.findUnique({
      where: { id: prof.eleveId },
      select: { fonction: true },
    });
    expect(prof2?.fonction).toBe("TROISIEME_ANNEE");
  });

  it("refuse de clore sans nommer la session qui s’ouvre", async () => {
    const refus = await cloturerLaSaison("   ", [], "Essai des points");
    expect(refus.ok).toBe(false);
  });
});
