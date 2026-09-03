import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Les contrôles de leçon, **SUR LA VRAIE BASE**.
 *
 *   npm run cours:essai
 *
 * Le nom de fichier — `en-base.essai.ts`, et non `.test.ts` — l'exclut de
 * `npm test` **à dessein** : la suite ordinaire ne doit jamais toucher la
 * base, qui est celle de production tant qu'il n'existe pas de branche
 * d'essai.
 *
 * Ce qui ne peut se vérifier QU'ici :
 *
 *   • les onze garanties de `20260903150000_controles_de_lecon`, éprouvées
 *     dans des transactions annulées — rien ne reste écrit ;
 *   • **l'index unique partiel**, qui refuse le second envoi d'un élève et
 *     laisse passer deux lignes orphelines. C'est le piège des `NULL` déjà
 *     payé sur `permissions_accordees`, et il ne se voit qu'en base ;
 *   • le déclencheur qui **fige un contrôle envoyé**, en laissant le lien vers
 *     l'élève s'annuler ;
 *   • et le chemin complet : envoyer, gagner ses points, être refusé la
 *     seconde fois.
 *
 * ⚠️ **Le ménage vise un compte `essai.*@ravenshallow.invalid`, et rien
 * d'autre.** Le carnet des points part AVANT le compte : le lien d'un point
 * vers son post est en `ON DELETE RESTRICT`, et le compteur de la maison ne se
 * décrémente pas tout seul — il faut le refaire depuis le carnet, sinon la
 * maison garde un point fantôme.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. Posé AVANT que `@/lib/prisma` ne soit chargé.
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
const { envoyerLeControle, controleEnvoye, controlesEnvoyesDe } = await import(
  "./depot"
);
const { questionnaireDe } = await import("./questionnaires");

const ADRESSE = "essai.controle@ravenshallow.invalid";

/** Ce que le dépôt attend pour décider à qui les points reviennent. */
let auteur: {
  eleveId: string;
  maison: string | null;
  etatMaison: "NON_FAIT" | "FAIT" | "SANS_OBJET";
};

async function menage() {
  const u = await prisma.utilisateur.findUnique({
    where: { email: ADRESSE },
    select: { id: true, eleve: { select: { id: true, maison: true } } },
  });
  if (!u) return;
  // ⚠️ Le carnet d'abord : point → post est en ON DELETE RESTRICT.
  await prisma.pointGagne.deleteMany({ where: { eleveId: u.eleve?.id } });
  await prisma.controleEnvoye.deleteMany({ where: { eleveId: u.eleve?.id } });
  await prisma.conversation.deleteMany({
    where: { clePaire: `administration:${u.id}` },
  });
  await prisma.utilisateur.delete({ where: { id: u.id } });

  // Le compteur ne se décrémente pas tout seul : on le refait depuis le carnet.
  const saison = await prisma.saisonScolaire.findFirst({
    where: { closeLe: null },
    select: { id: true },
  });
  if (saison && u.eleve?.maison) {
    const gagnes = await prisma.pointGagne.aggregate({
      where: {
        saisonId: saison.id,
        maison: u.eleve.maison,
        repriseLe: null,
      },
      _sum: { points: true },
    });
    const ajustes = await prisma.ajustementMaison.aggregate({
      where: { saisonId: saison.id, maison: u.eleve.maison, annuleLe: null },
      _sum: { points: true },
    });
    await prisma.compteurMaison.updateMany({
      where: { saisonId: saison.id, maison: u.eleve.maison },
      data: { points: (gagnes._sum.points ?? 0) + (ajustes._sum.points ?? 0) },
    });
  }
}

await menage();
const cree = await prisma.utilisateur.create({
  data: {
    email: ADRESSE,
    motDePasseHash: "essai",
    majeur16: true,
    reglementAccepteLe: new Date(),
    reglementVersion: "1",
    statutAcces: "VALIDE",
    role: "JOUEUR",
    eleve: {
      create: {
        prenomNom: "Ingrid Solvang",
        genre: "FEMININ",
        famille: "MIXTE",
        portraitType: "IA_ILLUSTRATION",
        biographie: "Compte d’essai des contrôles.",
        plusGrandePeur: "Rien.",
        qualite1: "A",
        qualite2: "B",
        qualite3: "C",
        defaut1: "D",
        defaut2: "E",
        defaut3: "F",
        statut: "ACCEPTE",
        decideLe: new Date(),
        fonction: "PREMIERE_ANNEE",
        maison: "BRYGGELD",
        etatMaison: "FAIT",
      },
    },
  },
  select: { eleve: { select: { id: true, maison: true, etatMaison: true } } },
});
auteur = {
  eleveId: cree.eleve!.id,
  maison: cree.eleve!.maison,
  etatMaison: cree.eleve!.etatMaison as "FAIT",
};

afterAll(async () => {
  await menage();
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────
//  Ce que la base tient elle-même
// ─────────────────────────────────────────────────────────────

/** Une ligne complète, dont on peut changer une colonne. */
function ligne(colonne?: string, valeur?: string): string {
  const champs: Record<string, string> = {
    id: `'essai-${Math.random().toString(36).slice(2)}'`,
    '"eleveId"': `'${auteur.eleveId}'`,
    '"matiereId"': "'sortileges'",
    '"annee"': "1",
    '"rang"': "1",
    '"reponses"': "ARRAY[0,1,2,3,4]::smallint[]",
    '"note"': "3",
    '"surCombien"': "5",
  };
  if (colonne) champs[colonne] = valeur!;
  return `INSERT INTO "controles_envoyes" (${Object.keys(champs).join(",")}) VALUES (${Object.values(champs).join(",")})`;
}

/** Le marqueur qui annule la transaction sans qu'elle ait échoué. */
const ANNULER = Symbol("annuler");

/** `sql` doit être REFUSÉ par la base, et rien ne doit rester écrit. */
async function refuse(...instructions: string[]): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const sql of instructions) await tx.$executeRawUnsafe(sql);
      throw ANNULER;
    });
    return false;
  } catch (erreur) {
    return erreur !== ANNULER;
  }
}

/** `sql` doit PASSER — et l'on annule quand même. */
async function accepte(...instructions: string[]): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const sql of instructions) await tx.$executeRawUnsafe(sql);
      throw ANNULER;
    });
    return false;
  } catch (erreur) {
    return erreur === ANNULER;
  }
}

describe("les garanties de la base", () => {
  it("refuse une note qui ne tient pas dans le questionnaire", async () => {
    expect(await refuse(ligne('"note"', "6"))).toBe(true);
    expect(await refuse(ligne('"note"', "-1"))).toBe(true);
    expect(await refuse(ligne('"surCombien"', "0"))).toBe(true);
  });

  /**
   * ⚠️ **Autant de réponses que de questions.** Sans cela, une note de 3 sur 5
   * pourrait reposer sur deux réponses, et l'on ne saurait plus jamais
   * laquelle manque.
   */
  it("refuse un nombre de réponses qui ne colle pas au nombre de questions", async () => {
    expect(await refuse(ligne('"reponses"', "ARRAY[0,1]::smallint[]"))).toBe(true);
    expect(
      await refuse(ligne('"reponses"', "ARRAY[0,1,2,3,4,0]::smallint[]")),
    ).toBe(true);
  });

  it("refuse une année hors des sept, et un rang à zéro", async () => {
    expect(await refuse(ligne('"annee"', "8"))).toBe(true);
    expect(await refuse(ligne('"annee"', "0"))).toBe(true);
    expect(await refuse(ligne('"rang"', "0"))).toBe(true);
  });

  /**
   * La matière s'écrit **comme le cursus l'écrit** — `magie_defensive`, jamais
   * le slug `magie-defensive` qui sert aux dossiers publics. Deux graphies pour
   * la même matière, et une leçon devient joignable par deux clés.
   */
  it("refuse une matière vide ou écrite comme un slug", async () => {
    expect(await refuse(ligne('"matiereId"', "''"))).toBe(true);
    expect(await refuse(ligne('"matiereId"', "'magie-defensive'"))).toBe(true);
  });

  it("accepte une ligne ordinaire, un zéro, un sans-faute, une orpheline", async () => {
    expect(await accepte(ligne())).toBe(true);
    expect(await accepte(ligne('"note"', "0"))).toBe(true);
    expect(await accepte(ligne('"note"', "5"))).toBe(true);
    expect(await accepte(ligne('"eleveId"', "NULL"))).toBe(true);
  });

  /**
   * ⚠️ **L'index unique est PARTIEL**, et c'est tout le sujet : dans un index
   * unique, Postgres tient deux `NULL` pour **distincts**. Sans le
   * `WHERE "eleveId" IS NOT NULL`, il refuserait d'exister le jour où deux
   * comptes supprimés auraient passé le même contrôle. Cousin exact du piège
   * de `permissions_accordees`.
   */
  it("refuse le second envoi d’un élève, et laisse passer deux orphelines", async () => {
    expect(await refuse(ligne(), ligne())).toBe(true);
    expect(
      await accepte(ligne('"eleveId"', "NULL"), ligne('"eleveId"', "NULL")),
    ).toBe(true);
  });

  /**
   * Un contrôle envoyé ne se réécrit pas — même procédé que la copie figée
   * d'un signalement et que la ligne du carnet. L'EFFACEMENT reste permis :
   * refuser les deux rendrait un compte indestructible.
   *
   * ⚠️ **On antidate, on ne met pas `now()`** : dans une transaction, `now()`
   * rend l'instant du DÉBUT, c'est-à-dire la valeur que la ligne vient de
   * recevoir par défaut. Le déclencheur ne voit alors aucun changement, et
   * l'essai conclut à un trou qui n'existe pas. Payé le 3 septembre 2026.
   */
  it("fige un contrôle envoyé, sauf son lien vers l’élève", async () => {
    const majAvec = (set: string) =>
      `UPDATE "controles_envoyes" SET ${set} WHERE "eleveId" = '${auteur.eleveId}'`;
    for (const set of [
      `"note" = 5`,
      `"reponses" = ARRAY[4,3,2,1,0]::smallint[]`,
      `"matiereId" = 'runologie'`,
      `"annee" = 2`,
      `"rang" = 2`,
      `"surCombien" = 4`,
      `"envoyeLe" = TIMESTAMP '2020-01-01 00:00:00'`,
    ]) {
      expect(await refuse(ligne(), majAvec(set)), set).toBe(true);
    }
    expect(await accepte(ligne(), majAvec(`"eleveId" = NULL`))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
//  Le chemin complet
// ─────────────────────────────────────────────────────────────

describe("envoyer un contrôle", () => {
  const sortileges = questionnaireDe("sortileges", 1, 1)!;
  const justes = sortileges.questions.map((q) => q.bonne);

  it("refuse des réponses qui ne sont pas recevables, sans rien écrire", async () => {
    expect((await envoyerLeControle(auteur, "sortileges", 1, 1, [0, 1])).etat).toBe(
      "REFUSE",
    );
    expect((await envoyerLeControle(auteur, "sortileges", 1, 1, null)).etat).toBe(
      "REFUSE",
    );
    expect(
      (await envoyerLeControle(auteur, "matiere-inventee", 1, 1, justes)).etat,
    ).toBe("REFUSE");
    expect(
      await prisma.controleEnvoye.count({ where: { eleveId: auteur.eleveId } }),
    ).toBe(0);
  });

  /** **Une bonne réponse, un point** — la règle du joueur, 3 septembre 2026. */
  it("accorde un point par bonne réponse, aux DEUX compteurs", async () => {
    const uneFausse = [...justes];
    uneFausse[4] = (justes[4]! + 1) % sortileges.questions[4]!.reponses.length;

    const resultat = await envoyerLeControle(
      auteur,
      "sortileges",
      1,
      1,
      uneFausse,
    );
    expect(resultat.etat).toBe("ENVOYE");
    if (resultat.etat !== "ENVOYE") return;
    expect(resultat.correction.note).toBe(justes.length - 1);
    expect(resultat.points).toBe(justes.length - 1);

    const eleve = await prisma.eleve.findUnique({
      where: { id: auteur.eleveId },
      select: { points: true },
    });
    expect(eleve?.points).toBe(justes.length - 1);

    const carnet = await prisma.pointGagne.findMany({
      where: { eleveId: auteur.eleveId },
      select: { source: true, points: true, maison: true, postId: true, motif: true },
    });
    expect(carnet.length).toBe(1);
    expect(carnet[0]!.source).toBe("QCM");
    expect(carnet[0]!.points).toBe(justes.length - 1);
    // ⚠️ La maison est FIGÉE au moment du gain, comme pour un post.
    expect(carnet[0]!.maison).toBe("BRYGGELD");
    // La base l'exige : un `postId` n'est permis qu'à la source `POST`, et le
    // motif n'est permis qu'à `ADMINISTRATION`.
    expect(carnet[0]!.postId).toBeNull();
    expect(carnet[0]!.motif).toBeNull();
  });

  it("le relit, et le range sous sa clé", async () => {
    const relu = await controleEnvoye(auteur.eleveId, "sortileges", 1, 1);
    expect(relu?.note).toBe(justes.length - 1);
    expect(relu?.surCombien).toBe(justes.length);
    expect(relu?.reponses.length).toBe(justes.length);

    const tous = await controlesEnvoyesDe(auteur.eleveId);
    expect([...tous.keys()]).toEqual(["sortileges/1"]);
  });

  /**
   * ⚠️ **Le second envoi ne coûte rien.** Ce n'est pas une lecture avant
   * écriture qui l'arrête — deux clics simultanés la passeraient tous les
   * deux —, c'est l'index unique, et la transaction annulée emporte les points
   * avec elle.
   */
  it("refuse le second envoi, et n’accorde aucun point de plus", async () => {
    const avant = await prisma.eleve.findUnique({
      where: { id: auteur.eleveId },
      select: { points: true },
    });

    const rejeu = await envoyerLeControle(auteur, "sortileges", 1, 1, justes);
    expect(rejeu.etat).toBe("DEJA_ENVOYE");

    const apres = await prisma.eleve.findUnique({
      where: { id: auteur.eleveId },
      select: { points: true },
    });
    expect(apres?.points).toBe(avant?.points);
    expect(
      await prisma.pointGagne.count({ where: { eleveId: auteur.eleveId } }),
    ).toBe(1);
    // Et la note du premier envoi n'a pas bougé d'un point.
    const relu = await controleEnvoye(auteur.eleveId, "sortileges", 1, 1);
    expect(relu?.note).toBe(justes.length - 1);
  });

  /**
   * ⚠️ **Zéro n'écrit aucune ligne au carnet.** Le contrôle est enregistré avec
   * sa note dans sa propre table ; une ligne à zéro point serait du bruit, et
   * l'historique public en montrerait une par contrôle raté.
   */
  it("enregistre un zéro sans rien écrire au carnet", async () => {
    const runologie = questionnaireDe("runologie", 1, 1)!;
    const toutFaux = runologie.questions.map(
      (q, i) => (q.bonne + 1) % runologie.questions[i]!.reponses.length,
    );

    const resultat = await envoyerLeControle(
      auteur,
      "runologie",
      1,
      1,
      toutFaux,
    );
    expect(resultat.etat).toBe("ENVOYE");
    if (resultat.etat !== "ENVOYE") return;
    expect(resultat.correction.note).toBe(0);
    expect(resultat.points).toBe(0);

    expect(
      await prisma.pointGagne.count({
        where: { eleveId: auteur.eleveId, source: "QCM" },
      }),
    ).toBe(1); // celle des Sortilèges, et elle seule
    expect((await controleEnvoye(auteur.eleveId, "runologie", 1, 1))?.note).toBe(0);
  });

  /**
   * ⚠️ **Le plafond quotidien ne s'applique pas aux contrôles** — décision du
   * joueur, 3 septembre 2026. Six contrôles font jusqu'à trente points dans la
   * journée, là où dix seraient la limite d'un posteur.
   */
  it("ne plafonne pas : les quatre autres contrôles rapportent en entier", async () => {
    let attendu =
      (await prisma.eleve.findUnique({
        where: { id: auteur.eleveId },
        select: { points: true },
      }))?.points ?? 0;

    for (const matiere of [
      "magie_defensive",
      "herboristerie",
      "creatures",
      "histoire",
    ]) {
      const q = questionnaireDe(matiere, 1, 1)!;
      const toutJuste = q.questions.map((question) => question.bonne);
      const r = await envoyerLeControle(auteur, matiere, 1, 1, toutJuste);
      expect(r.etat, matiere).toBe("ENVOYE");
      if (r.etat !== "ENVOYE") continue;
      expect(r.points, matiere).toBe(q.questions.length);
      attendu += q.questions.length;
    }

    const eleve = await prisma.eleve.findUnique({
      where: { id: auteur.eleveId },
      select: { points: true },
    });
    // Quatre sur cinq, puis zéro, puis quatre sans-faute : 4 + 0 + 20 = 24.
    expect(eleve?.points).toBe(attendu);
    expect(attendu).toBeGreaterThan(10);

    const tous = await controlesEnvoyesDe(auteur.eleveId);
    expect(tous.size).toBe(6);
  });
});
