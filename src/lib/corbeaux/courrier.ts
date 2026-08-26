import "server-only";
import { prisma } from "@/lib/prisma";
import { cleAdministration } from "./droits";

/**
 * **Le courrier adressé à l’administration — et rien d’autre.**
 *
 * Ce fichier existe parce que la règle « aucun membre du staff ne lit les
 * conversations privées » avait été appliquée si strictement qu’elle bloquait
 * aussi le fil qui lui est **explicitement adressé**. Un membre écrivait à
 * l’administration, son corbeau partait en base, et personne ne pouvait le
 * lire ni y répondre. Le garde-fou avait fait son travail ; l’écran manquait.
 *
 * ── Ce qui le rend sûr ──
 *
 * **Chaque lecture écrit `AVEC_ADMINISTRATION` en toutes lettres**, sans
 * exception et même quand il paraît redondant. Le filtre n'est
 * délibérément pas factorisé dans une constante : le sortir des `where`
 * reviendrait à le rendre invisible, et c'est exactement là que le test le
 * cherche. `etancheite.test.ts` relit le code source de
 * ce fichier et échoue si une seule requête l’oublie.
 *
 * Trois raisons font que ce filtre suffit :
 *
 *   1. le type d’une conversation est posé à sa création et **ne change
 *      jamais** — un déclencheur en base le refuse (migration
 *      `20260826100000_tour_aux_corbeaux`). Un fil entre joueurs ne peut donc
 *      pas se déguiser en courrier ;
 *   2. la clé doit s’accorder avec le type — une contrainte `CHECK` — et
 *      `administration:<id>` n’est jamais une paire d’identifiants ;
 *   3. rien ici ne prend d’identifiant de conversation sans le revalider.
 *
 * ── Ce qu’on ne trouvera jamais ici ──
 *
 * Une lecture des fils entre joueurs, une recherche dans les messages, un
 * export. Ce fichier voit **une** sorte de conversation : celle qu’un membre a
 * délibérément ouverte avec le château.
 */

export type FilCourrierEnListe = {
  id: string;
  /** Le nom du personnage, ou `null` si la fiche manque. */
  membre: string | null;
  membreId: string | null;
  /** Le membre est-il suspendu ? C’est souvent le motif de sa lettre. */
  suspendu: boolean;
  dernierMessageLe: string;
  corbeaux: number;
  /**
   * Le dernier mot est-il celui du membre ?
   *
   * C’est ce qui distingue une lettre qui attend d’une conversation close, et
   * c’est la seule chose qui compte pour trier la file. Un « lu / non lu » ne
   * dirait rien : la zone d’administration n’a pas de comptes, on ne saurait
   * pas qui a lu.
   */
  enAttente: boolean;
};

export type CorbeauCourrier = {
  id: string;
  /** Écrit par le château : l’auteur est absent, et c’est ce qui le désigne. */
  deLAdministration: boolean;
  auteur: string | null;
  corps: string;
  envoyeLe: string;
};

export type FilCourrierComplet = Omit<FilCourrierEnListe, "corbeaux"> & {
  corbeaux: CorbeauCourrier[];
};

type LigneFil = {
  id: string;
  dernierMessageLe: Date;
  participations: {
    utilisateur: {
      id: string;
      statutAcces: string;
      eleve: { prenomNom: string } | null;
    };
  }[];
};

function enTete(fil: LigneFil) {
  const membre = fil.participations[0]?.utilisateur;
  return {
    id: fil.id,
    membre: membre?.eleve?.prenomNom ?? null,
    membreId: membre?.id ?? null,
    suspendu: membre?.statutAcces === "EN_BANNISSEMENT",
    dernierMessageLe: fil.dernierMessageLe.toISOString(),
  };
}

const CHAMPS_MEMBRE = {
  utilisateur: {
    select: {
      id: true,
      statutAcces: true,
      eleve: { select: { prenomNom: true } },
    },
  },
} as const;

/**
 * Les lettres reçues, celles qui attendent d’abord.
 *
 * Le **contenu** ne voyage pas jusqu’ici, seulement le nombre de corbeaux :
 * la file reste ouverte sur un écran, et des fragments de lettres n’ont pas à
 * y traîner. On les lit une par une, en ouvrant.
 */
export async function listerCourrier(): Promise<FilCourrierEnListe[]> {
  const fils = await prisma.conversation.findMany({
    where: { type: "AVEC_ADMINISTRATION" },
    orderBy: { dernierMessageLe: "desc" },
    take: 100,
    select: {
      id: true,
      dernierMessageLe: true,
      participations: { select: CHAMPS_MEMBRE },
      _count: { select: { messages: true } },
      // Le dernier corbeau, pour savoir qui a parlé en dernier.
      messages: {
        orderBy: { envoyeLe: "desc" },
        take: 1,
        select: { auteurId: true },
      },
    },
  });

  return fils.map((fil) => ({
    ...enTete(fil),
    corbeaux: fil._count.messages,
    // Un auteur présent = le membre. Absent = le château a répondu.
    enAttente: fil.messages[0]?.auteurId != null,
  }));
}

/** Une lettre, et l’échange qui l’entoure. */
export async function lireCourrier(
  id: string,
): Promise<FilCourrierComplet | null> {
  const fil = await prisma.conversation.findFirst({
    // L'identifiant vient de l'URL : on ne s'y fie pas. Le filtre est refait
    // ici, et c'est lui qui empêche d'ouvrir un fil entre joueurs en tapant
    // son identifiant à la main.
    where: { id, type: "AVEC_ADMINISTRATION" },
    select: {
      id: true,
      dernierMessageLe: true,
      participations: { select: CHAMPS_MEMBRE },
    },
  });
  if (!fil) return null;

  const corbeaux = await prisma.message.findMany({
    where: { conversationId: id, conversation: { type: "AVEC_ADMINISTRATION" } },
    orderBy: { envoyeLe: "asc" },
    take: 200,
    select: {
      id: true,
      corps: true,
      envoyeLe: true,
      auteurId: true,
      auteur: { select: { eleve: { select: { prenomNom: true } } } },
    },
  });

  return {
    ...enTete(fil),
    enAttente: corbeaux[corbeaux.length - 1]?.auteurId != null,
    corbeaux: corbeaux.map((m) => ({
      id: m.id,
      deLAdministration: m.auteurId === null,
      auteur: m.auteur?.eleve?.prenomNom ?? null,
      corps: m.corps,
      envoyeLe: m.envoyeLe.toISOString(),
    })),
  };
}

/** Combien de lettres attendent une réponse — pour l’accueil de l’administration. */
export async function courrierEnAttente(): Promise<number> {
  const fils = await prisma.conversation.findMany({
    where: { type: "AVEC_ADMINISTRATION" },
    select: { messages: { orderBy: { envoyeLe: "desc" }, take: 1, select: { auteurId: true } } },
  });
  return fils.filter((f) => f.messages[0]?.auteurId != null).length;
}

export type ResultatReponse = "ENVOYEE" | "FIL_INCONNU";

/**
 * Répondre à une lettre.
 *
 * **`auteurId` reste nul, et c’est ce qui signe le château.** La zone
 * d’administration n’a pas de comptes distincts — un mot de passe partagé —,
 * il n’y a donc personne à nommer, comme pour `roleAffichePosePar` et
 * `traitePar`. Dans un fil de courrier, il n’y a que deux interlocuteurs : le
 * membre, et l’Administration. Un corbeau sans auteur ne peut venir que de la
 * seconde.
 *
 * Le fil est **revalidé avant d’écrire**, et pas seulement à l’affichage : une
 * action serveur est une route publique, et rien n’empêche de lui passer
 * l’identifiant d’une conversation entre joueurs. Le filtre du `findFirst`
 * ci-dessous est la seule chose qui l’en empêche — un test en base le vérifie
 * en essayant vraiment.
 *
 * Le corps arrive **déjà validé** par `schema.ts`, le même fichier que pour
 * les joueurs : deux endroits qui nettoient le même texte finissent par le
 * nettoyer différemment.
 */
export async function repondreAuCourrier(
  conversationId: string,
  corps: string,
): Promise<ResultatReponse> {
  const fil = await prisma.conversation.findFirst({
    where: { id: conversationId, type: "AVEC_ADMINISTRATION" },
    select: { id: true },
  });
  if (!fil) return "FIL_INCONNU";

  await prisma.$transaction(async (tx) => {
    const corbeau = await tx.message.create({
      data: { conversationId: fil.id, auteurId: null, corps },
      select: { envoyeLe: true },
    });
    // Le fil remonte dans la boîte du membre, et sa pastille s'allume : le
    // corbeau n'a pas d'auteur, donc il n'est pas de lui, donc il est non lu.
    await tx.conversation.update({
      where: { id: fil.id },
      data: { dernierMessageLe: corbeau.envoyeLe },
    });
  });

  return "ENVOYEE";
}

/**
 * **Le château écrit le premier à un membre.**
 *
 * Jusqu’ici le courrier ne savait que *répondre* : un fil existait forcément,
 * parce qu’un membre l’avait ouvert. L’article 19.3 demande l’inverse — un
 * post masqué pour correction, et « le joueur en est informé ». Il fallait
 * donc pouvoir commencer la conversation.
 *
 * Le fil est créé s’il n’existe pas, avec sa participation dans la même
 * écriture : sans elle, le membre ne verrait jamais la lettre. Le corbeau
 * n’a **pas d’auteur** — dans un fil de courrier il n’y a que deux
 * interlocuteurs, et un corbeau sans auteur ne peut venir que du second.
 * C’est ce qui le signe.
 *
 * `AVEC_ADMINISTRATION` est écrit en toutes lettres, à chaque requête, comme
 * partout dans ce fichier : c’est le filtre qui empêche le courrier de
 * déborder sur les conversations entre joueurs, et le sortir dans une
 * constante le rendrait invisible.
 */
export async function ecrireAuMembre(
  utilisateurId: string,
  corps: string,
): Promise<ResultatReponse> {
  const cle = cleAdministration(utilisateurId);

  const existant = await prisma.conversation.findFirst({
    where: { clePaire: cle, type: "AVEC_ADMINISTRATION" },
    select: { id: true },
  });

  if (existant) return repondreAuCourrier(existant.id, corps);

  await prisma.conversation.create({
    data: {
      type: "AVEC_ADMINISTRATION",
      clePaire: cle,
      // Ouvert par le château : personne à nommer, comme pour l'auteur du
      // corbeau. L'anti-démarchage ne compte que les fils ouverts PAR un
      // membre — celui-ci ne pèse donc sur le plafond de personne.
      ouvertParId: null,
      participations: { create: { utilisateurId } },
      messages: { create: { auteurId: null, corps } },
    },
  });

  return "ENVOYEE";
}
