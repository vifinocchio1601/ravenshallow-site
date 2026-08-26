import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * L’épreuve du réel : le dépôt de la Tour, sur la vraie base.
 *
 * ⚠️ **Ce fichier n’est PAS dans la suite de tests** — son nom l’en exclut
 * (`.essai.ts`, et non `.test.ts`). Il écrit dans la base, qui est celle de
 * production tant qu’il n’existe pas de branche d’essai. On le lance à la
 * main, et il fait son ménage dans tous les cas :
 *
 *   npx vitest run --include "src/lib/corbeaux/en-base.essai.ts"
 *
 * Les deux comptes qu’il crée sont en `@ravenshallow.invalid` — jamais une
 * adresse réelle du projet — et il ne commence par aucun effacement à
 * l’aveugle : il ne supprime que ce qu’il a lui-même écrit.
 */

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. La chaîne de connexion ne s'affiche nulle part.
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  // Découpé au premier `=` plutôt qu'avec une expression régulière : le
  // drapeau `s` demanderait une cible ES2018, et le tsconfig du projet vise
  // plus bas.
  const coupure = nette.indexOf("=");
  const cle = nette.slice(0, coupure).trim();
  const valeur = nette.slice(coupure + 1).trim();
  process.env[cle] ??= valeur.replace(/^["']|["']$/g, "");
}

const { prisma } = await import("@/lib/prisma");
const { lireSignalement, listerSignalements, traiterSignalement } =
  await import("./moderation");
const {
  bloquer,
  chercherPersonnages,
  compterNonLus,
  debloquer,
  envoyerCorbeau,
  filAdministrationDe,
  lireFil,
  listerBlocages,
  listerConversations,
  marquerLu,
  retirerDeMaVue,
  retirerLeFilDeMaVue,
  signaler,
} = await import("./depot");

type Compte = { id: string; statut: "ACCEPTE"; statutAcces: "VALIDE" };

let alice: Compte;
let bob: Compte;

async function creer(prenomNom: string, cle: string): Promise<Compte> {
  const compte = await prisma.utilisateur.create({
    data: {
      email: `essai.${cle}@ravenshallow.invalid`,
      motDePasseHash: "essai",
      majeur16: true,
      statutAcces: "VALIDE",
      reglementAccepteLe: new Date(),
      reglementVersion: "essai",
      eleve: {
        create: {
          prenomNom,
          genre: "AUTRE",
          famille: "MIXTE",
          portraitType: "IA_ILLUSTRATION",
          biographie: "x".repeat(700),
          qualite1: "a", qualite2: "b", qualite3: "c",
          defaut1: "d", defaut2: "e", defaut3: "f",
          plusGrandePeur: "rien",
          statut: "ACCEPTE",
          maison: "TIDEAL",
          etatMaison: "FAIT",
        },
      },
    },
  });
  return { id: compte.id, statut: "ACCEPTE", statutAcces: "VALIDE" };
}

beforeAll(async () => {
  alice = await creer("Alice Essai", "alice");
  bob = await creer("Bob Essai", "bob");
});

afterAll(async () => {
  // Les conversations partent en premier : elles emportent messages,
  // participations et masquages. Sans cela, celle dont les deux comptes
  // viennent d'être supprimés resterait orpheline.
  const fils = await prisma.conversation.findMany({
    where: {
      OR: [
        { participations: { some: { utilisateurId: { in: [alice.id, bob.id] } } } },
        { ouvertParId: { in: [alice.id, bob.id] } },
      ],
    },
    select: { id: true },
  });
  // Les signalements d'abord : ils survivent volontairement à la disparition
  // du message et du compte, donc rien ne les emporterait en cascade.
  await prisma.signalement.deleteMany({
    where: { OR: [{ parId: { in: [alice.id, bob.id] } }, { viseId: { in: [alice.id, bob.id] } }] },
  });
  await prisma.conversation.deleteMany({ where: { id: { in: fils.map((f) => f.id) } } });
  // `essai.` ET `.invalid` : la double condition n'est pas une précaution
  // pour rien. Effacer tous les `@ravenshallow.invalid` emportait aussi les
  // comptes de démonstration créés à côté pour regarder les écrans — un essai
  // ne doit défaire que ce qu'il a lui-même fait.
  await prisma.utilisateur.deleteMany({
    where: {
      AND: [
        { email: { startsWith: "essai." } },
        { email: { endsWith: "@ravenshallow.invalid" } },
      ],
    },
  });
  await prisma.$disconnect();
});

describe("écrire et lire", () => {
  it("un premier corbeau ouvre le fil", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Bonsoir Bob.");
    expect(envoi.envoye).toBe(true);
  });

  it("le fil est le même dans les deux sens — il n’y en a jamais deux", async () => {
    const second = await envoyerCorbeau(bob, { membreId: alice.id }, "Bonsoir Alice.");
    const premier = await listerConversations(alice);
    expect(premier).toHaveLength(1);
    expect(second.envoye && second.conversationId).toBe(premier[0].id);
  });

  it("Alice voit un non-lu, Bob n’en voit aucun — il vient d’écrire", async () => {
    expect(await compterNonLus(alice)).toBe(1);
    expect(await compterNonLus(bob)).toBe(0);
  });

  it("le fil se lit dans l’ordre, du plus ancien au plus récent", async () => {
    const fil = await lireFil(alice, (await listerConversations(alice))[0].id);
    expect(fil?.corbeaux.map((c) => c.corps)).toEqual([
      "Bonsoir Bob.",
      "Bonsoir Alice.",
    ]);
    expect(fil?.corbeaux.map((c) => c.deMoi)).toEqual([true, false]);
  });

  it("lire éteint le compteur", async () => {
    await marquerLu(alice, (await listerConversations(alice))[0].id);
    expect(await compterNonLus(alice)).toBe(0);
  });

  it("un fil n’est lisible que par ceux qui y sont", async () => {
    const filDAlice = (await listerConversations(alice))[0].id;
    const intrus = await creer("Intrus Essai", "intrus");
    expect(await lireFil(intrus, filDAlice)).toBeNull();
  });
});

describe("le blocage", () => {
  it("Bob bloque Alice : le corbeau d’Alice part, et n’arrive pas", async () => {
    await prisma.blocage.create({ data: { bloqueurId: bob.id, bloqueId: alice.id } });

    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Tu es là ?");
    // Vu d'Alice : rien n'a changé.
    expect(envoi.envoye).toBe(true);

    const filAlice = await lireFil(alice, (await listerConversations(alice))[0].id);
    expect(filAlice?.corbeaux.map((c) => c.corps)).toContain("Tu es là ?");
    // Et rien ne le lui dit.
    expect(filAlice?.conversation.close).toBe(false);

    const filBob = await lireFil(bob, (await listerConversations(bob))[0].id);
    expect(filBob?.corbeaux.map((c) => c.corps)).not.toContain("Tu es là ?");
    expect(await compterNonLus(bob)).toBe(0);
  });

  it("le fil est clos pour Bob, qui a bloqué", async () => {
    const filBob = await lireFil(bob, (await listerConversations(bob))[0].id);
    expect(filBob?.conversation.close).toBe(true);

    const refus = await envoyerCorbeau(bob, { membreId: alice.id }, "Non.");
    expect(refus).toEqual({
      envoye: false,
      verdict: { sort: "REFUSE", raison: "CONVERSATION_CLOSE" },
    });
  });

  /**
   * ⚠️ **Le cas le plus subtil du blocage.**
   *
   * Une personne bloquée qui ouvre un fil NEUF avec le bloqueur : son corbeau
   * est masqué, mais la conversation, elle, est bien créée — avec une
   * participation pour le bloqueur. Sans précaution, il verrait donc surgir
   * dans sa liste un fil vide portant le nom de quelqu'un qu'il a bloqué :
   * exactement ce qu'il a demandé à ne plus voir.
   */
  it("un fil neuf ouvert par une personne bloquée n’apparaît pas chez le bloqueur", async () => {
    const indesirable = await creer("Indésirable Essai", "indesirable");
    await prisma.blocage.create({
      data: { bloqueurId: bob.id, bloqueId: indesirable.id },
    });

    const envoi = await envoyerCorbeau(indesirable, { membreId: bob.id }, "Bonjour !");
    // Vu de l'expéditeur : tout est normal.
    expect(envoi.envoye).toBe(true);
    if (!envoi.envoye) return;
    const chezElle = await lireFil(indesirable, envoi.conversationId);
    expect(chezElle?.corbeaux.map((c) => c.corps)).toContain("Bonjour !");

    // Chez Bob : rien. Ni le corbeau, ni le fil.
    const listeDeBob = await listerConversations(bob);
    expect(listeDeBob.some((c) => c.id === envoi.conversationId)).toBe(false);
    expect(await compterNonLus(bob)).toBe(0);
  });

  it("Alice ne figure plus dans la recherche de Bob", async () => {
    expect(await chercherPersonnages(bob, "Alice")).toHaveLength(0);
    // Mais Bob figure toujours dans celle d'Alice : le retirer lui dirait
    // qu'elle a été bloquée.
    expect(await chercherPersonnages(alice, "Bob Essai")).toHaveLength(1);
  });
});

describe("le fil de l’administration", () => {
  it("n’existe pas tant que rien n’a été écrit", async () => {
    expect(await filAdministrationDe(alice.id)).toBeNull();
  });

  it("naît au premier corbeau, et il n’y en a qu’un", async () => {
    await envoyerCorbeau(alice, { administration: true }, "Une question.");
    const fil = await filAdministrationDe(alice.id);
    expect(fil).not.toBeNull();

    await envoyerCorbeau(alice, { administration: true }, "Une autre.");
    expect(await filAdministrationDe(alice.id)).toBe(fil);
  });

  it("reste ouvert à un membre suspendu, qui ne voit plus que lui", async () => {
    const suspendue = { ...alice, statutAcces: "EN_BANNISSEMENT" as const };

    expect(await envoyerCorbeau(suspendue, { administration: true }, "Je conteste."))
      .toMatchObject({ envoye: true });

    expect(await envoyerCorbeau(suspendue, { membreId: bob.id }, "Salut")).toEqual({
      envoye: false,
      verdict: { sort: "REFUSE", raison: "SUSPENDU" },
    });

    const fils = await listerConversations(suspendue);
    expect(fils).toHaveLength(1);
    expect(fils[0].avecAdministration).toBe(true);
  });

  /**
   * **Le compteur du bandeau doit dire la même chose que la page.**
   *
   * Un membre suspendu ne voit que le fil du staff : lui compter aussi les
   * corbeaux de ses conversations entre joueurs afficherait une pastille
   * derrière laquelle il ne trouverait rien. Une pastille qui envoie chercher
   * ce qu'on ne peut pas atteindre est pire que pas de pastille du tout.
   */
  it("le compteur d'un suspendu ne compte que le fil du staff", async () => {
    const suspendue = { ...alice, statutAcces: "EN_BANNISSEMENT" as const };

    // Quelqu'un lui écrit pendant sa suspension : elle ne doit rien en voir.
    // Un tiers, et non Bob : à ce point de l'essai, Bob a bloqué Alice, et son
    // corbeau ne partirait pas — le test aurait été vert pour la mauvaise
    // raison.
    const camarade = await creer("Camarade Essai", "camarade");
    const envoi = await envoyerCorbeau(camarade, { membreId: alice.id }, "Tu reviens quand ?");
    expect(envoi.envoye).toBe(true);

    const filsVisibles = await listerConversations(suspendue);
    const totalVisible = filsVisibles.reduce((n, f) => n + f.nonLus, 0);

    // Le bandeau et la page s'accordent : ni l'un ni l'autre ne promet ce
    // corbeau-là.
    expect(await compterNonLus(suspendue)).toBe(totalVisible);
    expect(filsVisibles.every((f) => f.avecAdministration)).toBe(true);

    // Une fois l'accès rétabli, il est bien là — rien n'a été perdu.
    expect(await compterNonLus(alice)).toBeGreaterThan(totalVisible);
  });
});

/**
 * ⚠️ **L'ordre de ces blocs n'est pas indifférent.** Ils partagent une base,
 * et se lisent comme une seule histoire : Alice écrit, Bob bloque, Bob
 * débloque, puis Alice ouvre trop de fils. Le bloc du fil de l'administration
 * passe avant tous ceux qui écrivent au staff, parce qu'il vérifie justement
 * qu'il n'existe pas encore.
 */
describe("bloquer et débloquer, de bout en bout", () => {
  it("la liste ne contient que ceux que J’AI bloqués", async () => {
    // Bob a bloqué Alice au test précédent. Alice n'en sait rien, et sa liste
    // est vide — c'est toute la question.
    expect(await listerBlocages(alice)).toHaveLength(0);

    const deBob = await listerBlocages(bob);
    // Bob en a bloqué deux : Alice, et l'indésirable du cas précédent.
    expect(deBob.map((p) => p.prenomNom).sort()).toEqual([
      "Alice Essai",
      "Indésirable Essai",
    ]);
  });

  it("bloquer deux fois ne casse rien", async () => {
    expect(await bloquer(bob, alice.id)).toBe("DEJA");
  });

  it("on ne se bloque pas soi-même", async () => {
    expect(await bloquer(bob, bob.id)).toBe("REFUSE");
  });

  it("un membre suspendu ne bloque personne", async () => {
    const suspendu = { ...bob, statutAcces: "EN_BANNISSEMENT" as const };
    expect(await bloquer(suspendu, alice.id)).toBe("REFUSE");
  });

  /**
   * **Débloquer ne ramène rien.** Le corbeau parti dans le vide pendant le
   * blocage a été masqué à son arrivée, et il le reste : voir surgir d'un coup
   * ce qu'on croyait écarté serait une mauvaise surprise. C'est le choix du
   * joueur, et ce test le fige.
   */
  it("débloquer rouvre la porte, sans rattrapage", async () => {
    const filAvant = await lireFil(bob, (await listerConversations(bob))[0].id);
    const avant = filAvant?.corbeaux.length ?? 0;

    expect(await debloquer(bob, alice.id)).toBe("FAIT");
    // Alice s'en va, l'indésirable reste : débloquer l'une ne débloque pas
    // l'autre.
    expect((await listerBlocages(bob)).map((p) => p.prenomNom)).toEqual([
      "Indésirable Essai",
    ]);

    const filApres = await lireFil(bob, (await listerConversations(bob))[0].id);
    // Rien n'est revenu.
    expect(filApres?.corbeaux).toHaveLength(avant);
    expect(filApres?.corbeaux.map((c) => c.corps)).not.toContain("Tu es là ?");
    // Mais le fil n'est plus clos.
    expect(filApres?.conversation.close).toBe(false);
  });

  it("et les corbeaux repassent", async () => {
    await envoyerCorbeau(alice, { membreId: bob.id }, "Je réessaie.");
    const fil = await lireFil(bob, (await listerConversations(bob))[0].id);
    expect(fil?.corbeaux.map((c) => c.corps)).toContain("Je réessaie.");
  });

  it("débloquer quelqu’un qu’on n’a pas bloqué ne fait rien", async () => {
    expect(await debloquer(bob, alice.id)).toBe("DEJA");
  });
});

describe("l’anti-démarchage", () => {
  /**
   * Le plafond ne pèse que sur les fils NOUVEAUX. Ces deux exemptions-là ne
   * peuvent se vérifier qu'ici, là où les conversations existent vraiment :
   * la fonction pure de `droits.ts` ne sait pas ce qu'est un fil ouvert.
   */
  it("répondre dans un fil ouvert n’est jamais limité", async () => {
    // Les comptes d'essai viennent d'être créés : ils sont « nouveaux venus »,
    // trois nouvelles conversations par heure. Alice en a déjà ouvert une.
    for (let i = 0; i < 6; i++) {
      const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, `Suite ${i}.`);
      expect(envoi.envoye, `réponse ${i}`).toBe(true);
    }
  });

  it("écrire à l’administration n’est jamais limité non plus", async () => {
    for (let i = 0; i < 5; i++) {
      const envoi = await envoyerCorbeau(
        alice,
        { administration: true },
        `Question ${i}.`,
      );
      expect(envoi.envoye, `question ${i}`).toBe(true);
    }
  });

  it("mais ouvrir des fils en rafale finit par demander d’attendre", async () => {
    // Trois destinataires neufs : le plafond du nouveau venu est de trois par
    // heure, et Alice a déjà ouvert celui de Bob.
    const cibles = [];
    for (const cle of ["cible1", "cible2", "cible3", "cible4"]) {
      cibles.push(await creer(`Cible ${cle}`, cle));
    }

    const sorts = [];
    for (const cible of cibles) {
      const envoi = await envoyerCorbeau(alice, { membreId: cible.id }, "Bonsoir.");
      sorts.push(envoi.envoye ? "PARTI" : envoi.verdict.sort);
    }

    // Les deux premiers passent (un fil déjà ouvert au compteur), puis la Tour
    // demande d'attendre.
    expect(sorts).toContain("ATTENDRE");
    // Et ce n'est PAS un refus : le corbeau partira, plus tard.
    expect(sorts).not.toContain("REFUSE");
  });

  it("l’attente annonce un délai, jamais zéro", async () => {
    const derniere = await creer("Cible finale", "finale");
    const envoi = await envoyerCorbeau(alice, { membreId: derniere.id }, "Bonsoir.");

    expect(envoi.envoye).toBe(false);
    if (envoi.envoye) return;
    expect(envoi.verdict.sort).toBe("ATTENDRE");
    if (envoi.verdict.sort !== "ATTENDRE") return;
    expect(envoi.verdict.minutes).toBeGreaterThanOrEqual(1);
    expect(envoi.verdict.minutes).toBeLessThanOrEqual(60);
  });
});

describe("retirer de sa vue", () => {
  /**
   * **La règle qui protège un membre harcelé.** Personne ne peut effacer ce
   * qu'il a écrit chez autrui : supprimer ne retire un corbeau que de sa
   * propre vue, et l'agresseur ne peut pas faire disparaître ses traces.
   */
  it("un corbeau retiré par son auteur reste chez le destinataire", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Une bêtise.");
    expect(envoi.envoye).toBe(true);
    if (!envoi.envoye) return;

    // Alice l'efface — de chez elle.
    expect(await retirerDeMaVue(alice, envoi.corbeauId)).toBe(true);

    const chezAlice = await lireFil(alice, envoi.conversationId);
    expect(chezAlice?.corbeaux.map((c) => c.corps)).not.toContain("Une bêtise.");

    // Chez Bob, il est toujours là.
    const chezBob = await lireFil(bob, envoi.conversationId);
    expect(chezBob?.corbeaux.map((c) => c.corps)).toContain("Une bêtise.");
  });

  it("retirer deux fois ne casse rien", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Encore.");
    if (!envoi.envoye) return;
    expect(await retirerDeMaVue(alice, envoi.corbeauId)).toBe(true);
    expect(await retirerDeMaVue(alice, envoi.corbeauId)).toBe(true);
  });

  it("on ne retire pas un corbeau d’un fil où l’on n’est pas", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Privé.");
    if (!envoi.envoye) return;
    const tiers = await creer("Tiers Essai", "tiers");
    expect(await retirerDeMaVue(tiers, envoi.corbeauId)).toBe(false);
  });

  /**
   * Un fil retiré sort de MA liste, l'autre garde le sien — et il **revient**
   * si l'autre réécrit, vidé de ce qui précède. Sans ce retour, on pourrait
   * faire disparaître quelqu'un de sa boîte pour de bon.
   */
  it("un fil retiré sort de ma liste, pas de la sienne — et il revient", async () => {
    const fil = (await listerConversations(alice))[0].id;

    expect(await retirerLeFilDeMaVue(alice, fil)).toBe(true);
    // CE fil sort de sa liste — pas les autres : Alice en a plusieurs à ce
    // stade de l'essai, dont celui du staff.
    expect((await listerConversations(alice)).some((c) => c.id === fil)).toBe(false);
    // Bob, lui, l'a toujours.
    expect((await listerConversations(bob)).some((c) => c.id === fil)).toBe(true);

    await envoyerCorbeau(bob, { membreId: alice.id }, "Tu es là ?");

    const revenu = await listerConversations(alice);
    expect(revenu.some((c) => c.id === fil)).toBe(true);
    // Vidé de ce qui précède : seul le nouveau corbeau s'y lit.
    const relu = await lireFil(alice, fil);
    expect(relu?.corbeaux.map((c) => c.corps)).toEqual(["Tu es là ?"]);
  });
});

describe("le signalement", () => {
  let signalementId: string;

  /**
   * ⚠️ **Le scénario qui justifie toute la copie figée.**
   *
   * Un corbeau signalé, puis retiré par son auteur, reste consultable par la
   * modération. Sans cela, il suffirait d'effacer après coup pour rendre tout
   * signalement inutile.
   */
  it("un corbeau signalé puis retiré reste lisible par la modération", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Message pénible.");
    expect(envoi.envoye).toBe(true);
    if (!envoi.envoye) return;

    expect(await signaler(bob, envoi.corbeauId, "Il insiste.")).toEqual({
      signale: true,
    });

    // Alice retire son corbeau — de chez elle. La copie, elle, ne bouge pas.
    await retirerDeMaVue(alice, envoi.corbeauId);

    const file = await listerSignalements();
    const trouve = file.find((s) => s.motif === "Il insiste.");
    expect(trouve).toBeDefined();
    if (!trouve) return;
    signalementId = trouve.id;

    const complet = await lireSignalement(signalementId);
    expect(complet?.contexte.some((l) => l.corps === "Message pénible.")).toBe(true);
    expect(complet?.contexte.find((l) => l.vise)?.corps).toBe("Message pénible.");
  });

  it("le contexte transmis est borné, jamais la conversation entière", async () => {
    const complet = await lireSignalement(signalementId);
    // Cinq avant, le corbeau visé, cinq après : onze au plus. Le fil, lui, en
    // compte bien davantage à ce stade de l'essai.
    expect(complet!.contexte.length).toBeLessThanOrEqual(11);
    expect(complet!.contexte.filter((l) => l.vise)).toHaveLength(1);
  });

  it("la copie ne porte ni identifiant de fil ni identifiant de corbeau", async () => {
    // Rien, dans ce que lit la modération, ne permet de remonter à la
    // conversation : elle n'a pas le droit de l'ouvrir, elle n'en a pas non
    // plus le moyen.
    const complet = await lireSignalement(signalementId);
    const brut = JSON.stringify(complet!.contexte);
    expect(brut).not.toContain("conversationId");
    expect(brut).not.toContain("messageId");
  });

  it("on ne signale pas ce qu’on ne voit pas", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Caché.");
    if (!envoi.envoye) return;
    await retirerDeMaVue(bob, envoi.corbeauId);

    expect(await signaler(bob, envoi.corbeauId, null)).toEqual({
      signale: false,
      raison: "INTROUVABLE",
    });
  });

  it("on ne signale pas dans le fil de l’administration", async () => {
    const envoi = await envoyerCorbeau(alice, { administration: true }, "Bonjour.");
    if (!envoi.envoye) return;
    expect(await signaler(alice, envoi.corbeauId, null)).toEqual({
      signale: false,
      raison: "ADMINISTRATION",
    });
  });

  it("on ne signale pas un corbeau d’un fil où l’on n’est pas", async () => {
    const envoi = await envoyerCorbeau(alice, { membreId: bob.id }, "Entre nous.");
    if (!envoi.envoye) return;
    const tiers = await creer("Tiers Signalement", "tiers2");
    expect(await signaler(tiers, envoi.corbeauId, null)).toEqual({
      signale: false,
      raison: "INTROUVABLE",
    });
  });

  it("le traitement s’écrit, la copie ne bouge pas", async () => {
    const avant = await lireSignalement(signalementId);

    expect(await traiterSignalement(signalementId, "TRAITE", "Averti.")).toBe(true);

    const apres = await lireSignalement(signalementId);
    expect(apres?.statut).toBe("TRAITE");
    expect(apres?.traitePar).toBe("Administration");
    expect(apres?.noteTraitement).toBe("Averti.");
    // La preuve est intacte.
    expect(apres?.contexte).toEqual(avant?.contexte);
    expect(apres?.motif).toBe(avant?.motif);
  });

  /**
   * La base refuse de réécrire une copie, quelle que soit la main qui écrit :
   * le site, un script, une commande tapée à la main. Une preuve qui se
   * retouche n'en est pas une.
   */
  it("et la base refuse qu’on la réécrive", async () => {
    await expect(
      prisma.signalement.update({
        where: { id: signalementId },
        data: { contexte: [{ auteur: "X", envoyeLe: "", corps: "autre chose" }] },
      }),
    ).rejects.toThrow();
  });

  it("le compte visé reste supprimable, et le signalement lui survit", async () => {
    const jetable = await creer("Jetable Essai", "jetable");
    const envoi = await envoyerCorbeau(jetable, { membreId: bob.id }, "Bonsoir.");
    if (!envoi.envoye) return;

    await signaler(bob, envoi.corbeauId, "À vérifier.");
    const avant = (await listerSignalements()).find((s) => s.motif === "À vérifier.");
    expect(avant?.vise).toBe("Jetable Essai");

    await prisma.utilisateur.delete({ where: { id: jetable.id } });

    const apres = await lireSignalement(avant!.id);
    // La personne visée n'est plus nommée, mais la copie est là — et fait foi.
    expect(apres).not.toBeNull();
    expect(apres?.vise).toBeNull();
    expect(apres?.contexte.some((l) => l.corps === "Bonsoir.")).toBe(true);
  });
});

describe("la recherche", () => {
  it("ne rend que les dossiers acceptés", async () => {
    const enAttente = await prisma.utilisateur.create({
      data: {
        email: "essai.attente@ravenshallow.invalid",
        motDePasseHash: "essai",
        majeur16: true,
        reglementAccepteLe: new Date(),
        reglementVersion: "essai",
        eleve: {
          create: {
            prenomNom: "Attente Essai",
            genre: "AUTRE", famille: "MIXTE", portraitType: "IA_ILLUSTRATION",
            biographie: "x".repeat(700),
            qualite1: "a", qualite2: "b", qualite3: "c",
            defaut1: "d", defaut2: "e", defaut3: "f",
            plusGrandePeur: "rien",
            statut: "EN_ATTENTE",
          },
        },
      },
    });

    expect(await chercherPersonnages(alice, "Attente")).toHaveLength(0);
    expect(
      await envoyerCorbeau(alice, { membreId: enAttente.id }, "Bonsoir"),
    ).toEqual({
      envoye: false,
      verdict: { sort: "REFUSE", raison: "DESTINATAIRE_INCONNU" },
    });
  });

  it("signale un fil déjà ouvert plutôt que d’en proposer un second", async () => {
    const trouves = await chercherPersonnages(alice, "Bob Essai");
    expect(trouves[0]?.conversationId).not.toBeNull();
  });

  it("ne se rend jamais soi-même", async () => {
    expect(await chercherPersonnages(alice, "Alice Essai")).toHaveLength(0);
  });
});
