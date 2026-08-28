import "server-only";
import { libellePlace, type Maison } from "@/lib/dossier/etats";
import { prisma } from "@/lib/prisma";
import { TEXTES_SALON } from "./constantes";
import { MESSAGES_AFFICHES } from "./limites";
import { etatDuFrein, FENETRE_SECONDES } from "./regles";
import { validerMessage, type Resultat } from "./schema";

/**
 * L'accès au salon d'une maison.
 *
 * **Le seul endroit qui compose une requête sur `messages_salon`** — et le
 * seul qui sache qu'un message retiré ne s'affiche plus. Une table interrogée
 * toutes les quatre secondes depuis chaque onglet ouvert n'a pas droit à une
 * requête écrite à côté.
 *
 * ⚠️ **Le dépôt ne calcule aucun droit d'accès** — il les reçoit. Qui entre
 * dans la pièce se tranche à la page, qui peut faire le ménage dans
 * `lib/forum/pouvoirs.ts`.
 */

export type MessageAffiche = {
  id: string;
  corps: string;
  ecritLe: string;
  auteurId: string | null;
  auteurNom: string | null;
  auteurPlace: string | null;
};

/** Ce qu'un rafraîchissement rapporte : du neuf, et ce qui a disparu. */
export type Nouveautes = {
  /** Les messages écrits depuis l'instant demandé, du plus ancien au plus récent. */
  messages: MessageAffiche[];
  /**
   * **Les identifiants retirés depuis.** Sans eux, un message décroché par un
   * préfet resterait à l'écran de tous les autres jusqu'au prochain
   * chargement de page — la pièce dirait deux choses différentes selon qui
   * regarde.
   */
  retires: string[];
  /** L'instant à repasser au tour suivant. */
  jusqua: string;
};

const CHAMPS = {
  id: true,
  corps: true,
  ecritLe: true,
  auteurId: true,
  auteur: { select: { prenomNom: true, fonction: true, roleAffiche: true } },
} as const;

type LigneLue = {
  id: string;
  corps: string;
  ecritLe: Date;
  auteurId: string | null;
  auteur: { prenomNom: string; fonction: string; roleAffiche: string | null } | null;
};

function enMessage(ligne: LigneLue): MessageAffiche {
  return {
    id: ligne.id,
    corps: ligne.corps,
    ecritLe: ligne.ecritLe.toISOString(),
    auteurId: ligne.auteurId,
    auteurNom: ligne.auteur?.prenomNom ?? null,
    // **`libellePlace` et jamais `libelleAnnee`** : une directrice venue dire
    // un mot au salon doit s'annoncer « Directrice », pas « première année ».
    auteurPlace: ligne.auteur
      ? libellePlace(
          ligne.auteur.fonction as Parameters<typeof libellePlace>[0],
          ligne.auteur.roleAffiche,
        )
      : null,
  };
}

/**
 * **La pièce en entrant** : les derniers messages, du plus ancien au plus
 * récent — l'ordre d'une conversation, pas celui d'une liste.
 *
 * On prend les N plus récents en base, puis on les remet à l'endroit : trier
 * à l'endroit dès la requête obligerait à tout lire pour n'en garder que la
 * fin.
 */
export async function lireLeSalon(
  maison: Maison,
  combien: number = MESSAGES_AFFICHES,
): Promise<MessageAffiche[]> {
  const lignes = await prisma.messageSalon.findMany({
    where: { maison, retireLe: null },
    orderBy: { ecritLe: "desc" },
    take: combien,
    select: CHAMPS,
  });
  return lignes.reverse().map(enMessage);
}

/**
 * **Quoi de neuf depuis tel instant** — la question du rafraîchissement.
 *
 * Elle rend deux choses, et il faut les deux : ce qui a été dit, et ce qui a
 * été retiré. La seconde est la moins évidente et la plus nécessaire.
 */
export async function nouveautesDuSalon(
  maison: Maison,
  depuis: Date,
): Promise<Nouveautes> {
  // L'instant du serveur, pris AVANT les requêtes : le rendre après laisserait
  // passer entre les deux un message qui ne serait jamais rattrapé.
  const jusqua = new Date();

  const [messages, retires] = await Promise.all([
    prisma.messageSalon.findMany({
      where: { maison, retireLe: null, ecritLe: { gt: depuis } },
      orderBy: { ecritLe: "asc" },
      take: MESSAGES_AFFICHES,
      select: CHAMPS,
    }),
    prisma.messageSalon.findMany({
      where: { maison, retireLe: { gt: depuis } },
      select: { id: true },
    }),
  ]);

  return {
    messages: messages.map(enMessage),
    retires: retires.map((r) => r.id),
    jusqua: jusqua.toISOString(),
  };
}

/** Ce que la route doit distinguer : un refus, une attente, ou c'est parti. */
export type ResultatEnvoi =
  | { sort: "PARTI"; message: MessageAffiche }
  | { sort: "REFUSE"; raison: string }
  | { sort: "ATTENDRE"; secondes: number };

/**
 * Parler au salon.
 *
 * ⚠️ **`ATTENDRE` n'est pas un refus**, et ne se range donc pas avec eux : la
 * route répond 429, jamais 403. Un message refusé ne partira jamais ; celui-ci
 * partira dans trois secondes. La leçon de la Tour aux Corbeaux, appliquée
 * ici.
 */
export async function parlerAuSalon(entrees: {
  maison: Maison;
  auteurId: string;
  corps: unknown;
  aLeDroit: boolean;
}): Promise<ResultatEnvoi> {
  if (!entrees.aLeDroit) {
    return { sort: "REFUSE", raison: TEXTES_SALON.erreurs.pasLeDroit };
  }

  const corps = validerMessage(entrees.corps);
  if (!corps.ok) return { sort: "REFUSE", raison: corps.message };

  const maintenant = new Date();
  const depuis = new Date(maintenant.getTime() - FENETRE_SECONDES * 1000);

  // Le frein lit les derniers instants de CET auteur dans CETTE pièce. Les
  // messages retirés comptent : quelqu'un qui noie la pièce puis efface ses
  // traces ne doit pas récupérer son quota.
  const recents = await prisma.messageSalon.findMany({
    where: { maison: entrees.maison, auteurId: entrees.auteurId, ecritLe: { gt: depuis } },
    orderBy: { ecritLe: "desc" },
    select: { ecritLe: true },
  });

  const frein = etatDuFrein(
    recents.map((r) => r.ecritLe.getTime()),
    maintenant,
  );
  if (frein.bloque) return { sort: "ATTENDRE", secondes: frein.secondes };

  const pose = await prisma.messageSalon.create({
    data: {
      maison: entrees.maison,
      corps: corps.valeur,
      auteurId: entrees.auteurId,
      ecritLe: maintenant,
    },
    select: CHAMPS,
  });

  return { sort: "PARTI", message: enMessage(pose) };
}

/**
 * Retirer un message — **sans l'effacer**.
 *
 * Deux droits mènent ici : **le sien**, toujours, et **le ménage** pour un
 * préfet ou le staff. Le partage est celui du tableau d'affichage.
 *
 * Le `where` porte la maison **et** l'absence de retrait : un identifiant
 * emprunté à une autre pièce ne décroche rien, et reposer le geste ne
 * réécrit pas la date.
 */
export async function retirerDuSalon(entrees: {
  id: string;
  maison: Maison;
  parId: string;
  parNom: string;
  peutFaireLeMenage: boolean;
}): Promise<Resultat<null>> {
  const message = await prisma.messageSalon.findFirst({
    where: { id: entrees.id, maison: entrees.maison, retireLe: null },
    select: { auteurId: true },
  });
  if (!message) {
    return { ok: false, message: TEXTES_SALON.erreurs.introuvable };
  }

  const sien = message.auteurId !== null && message.auteurId === entrees.parId;
  if (!sien && !entrees.peutFaireLeMenage) {
    return { ok: false, message: TEXTES_SALON.erreurs.pasLeDroit };
  }

  await prisma.messageSalon.updateMany({
    where: { id: entrees.id, retireLe: null },
    // ⚠️ Un NOM, jamais un identifiant : un lien serait vidé le jour où ce
    // compte disparaît, et la contrainte « les deux ensemble » tomberait au
    // milieu d'une suppression.
    data: { retireLe: new Date(), retirePar: entrees.parNom },
  });

  return { ok: true, valeur: null };
}

/**
 * **Les quatre pièces, pour l'administration.**
 *
 * C'est le seul chemin par lequel le staff lit un salon dont il n'est pas
 * membre — et il le faut : la page `/maison` exige une maison, qu'une
 * directrice n'a pas. Sans cet écran, le pouvoir de retirer un message ne
 * voudrait rien dire.
 */
export async function lireLesSalonsPourAdministration(
  maisons: readonly Maison[],
  combien = 30,
): Promise<{ maison: Maison; messages: MessageAffiche[] }[]> {
  const pieces = await Promise.all(
    maisons.map(async (maison) => ({
      maison,
      messages: await lireLeSalon(maison, combien),
    })),
  );
  return pieces;
}
