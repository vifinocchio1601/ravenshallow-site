import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * **Toute transaction interactive passe par ici**, et c'est le seul endroit
 * qui fixe ses délais.
 *
 * ── Le défaut que cela corrige ──
 *
 * Prisma abandonne une transaction interactive au bout de **cinq secondes**,
 * et n'attend que **deux secondes** pour obtenir une connexion. Sur la
 * formule gratuite de Neon, la base s'endort après cinq minutes sans requête
 * et son réveil dépasse largement ces deux chiffres.
 *
 * Le résultat n'est pas une lenteur mais une **erreur 500** :
 *
 *     PrismaClientKnownRequestError · P2028
 *     Transaction not found. Transaction ID is invalid…
 *
 * Rencontré pour de bon le 27 août 2026, en envoyant un corbeau sur une base
 * qui sortait de veille. Le second essai est passé sans rien changer. Pour un
 * joueur, cela se voit comme une panne : il écrit, il reçoit une erreur, et
 * il ne sait pas s'il doit recommencer — ou si son message est parti deux
 * fois.
 *
 * C'est le cousin exact de `connect_timeout` (voir `base/adresse.ts`) : la
 * même cause, un autre délai, et il n'était pas couvert.
 *
 * ── Pourquoi une fonction plutôt qu'un objet d'options ──
 *
 * Passer les réglages à neuf appels marcherait aujourd'hui et se perdrait au
 * dixième. Ici, **écrire une transaction sans délai demande de contourner
 * cette fonction**, et `transaction.test.ts` relit le code source pour
 * refuser tout appel direct à `prisma.$transaction(async …)`. Même procédé
 * que `etancheite.test.ts`.
 */

/**
 * L'attente pour obtenir une connexion. Deux secondes par défaut, ce qui ne
 * couvre pas un réveil de Neon.
 */
const ATTENTE_MS = 10_000;

/**
 * La durée de vie d'une transaction. Cinq secondes par défaut.
 *
 * Quinze suffisent largement : aucune de nos transactions n'écrit plus de
 * quelques lignes, et ce qui les rend lentes n'est jamais le travail mais le
 * réveil de la base. Plus haut serait sans effet — l'hébergeur coupe la
 * requête bien avant.
 */
const DUREE_MS = 15_000;

const REGLAGES = { maxWait: ATTENTE_MS, timeout: DUREE_MS } as const;

/**
 * Une transaction interactive, munie de délais qui survivent au réveil de la
 * base.
 *
 * S'emploie exactement comme `prisma.$transaction` :
 *
 *     const ecrit = await transaction(async (tx) => { … });
 */
export function transaction<T>(
  travail: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(travail, REGLAGES);
}
