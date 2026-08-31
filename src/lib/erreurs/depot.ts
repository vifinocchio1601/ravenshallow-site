import "server-only";
import { prisma } from "@/lib/prisma";
import { caviarder } from "./caviardage";

/**
 * La trace d'une erreur du serveur — **le seul endroit qui en écrit une**.
 *
 * ── Ce que cette couture ajoute, et ce qu'elle ne remplace pas ──
 *
 * Le site journalisait ses erreurs par `console.error`, qui part dans les
 * journaux d'exécution de Vercel. Ceux-là ne durent que quelques heures selon
 * la formule, et leur lecture demande un jeton : « les erreurs des dernières
 * vingt-quatre heures » n'était pas une question à laquelle on pouvait
 * répondre.
 *
 * **`console.error` reste**, et doit rester : on y regarde en direct quand
 * quelque chose brûle. `noterErreur` s'y ajoute, pour qu'on puisse regarder le
 * lendemain matin.
 *
 * ── Trois principes ──
 *
 * 1. ⚠️ **Elle n'échoue jamais bruyamment.** Journaliser une erreur ne doit
 *    pas en provoquer une seconde : si la base est injoignable — ce qui est
 *    précisément le cas où l'on voudrait une trace —, on se contente de la
 *    console. Une couture de journalisation qui fait tomber la requête qu'elle
 *    observait est pire que pas de journalisation du tout. C'est déjà le
 *    parti pris de `noterLaConnexion` et des envois de courriel.
 *
 * 2. ⚠️ **Le caviardage se fait ICI, à l'écriture.** Voir `caviardage.ts` :
 *    ce qui n'est jamais écrit ne fuit pas, et la politique de confidentialité
 *    reste vraie sans avoir à promettre un masquage à l'affichage.
 *
 * 3. **La rétention est appliquée en passant.** Trente jours suffisent
 *    largement aux vingt-quatre heures dont La Veille a besoin, et bornent la
 *    table sans qu'aucune tâche planifiée n'ait à exister.
 */

/** Trente jours. Vit ici et non dans un JSON : c'est une durée de rétention
 *  annoncée, pas un bouton à tourner. */
const RETENTION_JOURS = 30;

/** Le message tronqué à ce que la contrainte accepte. */
const MESSAGE_MAX = 2000;

export type Portee =
  | "connexion"
  | "dossier"
  | "reinitialisation"
  | "oubli"
  | "visages"
  | "courriel"
  | "archivage"
  | "depot"
  | "forum"
  | "inconnu";

/**
 * Note une erreur, sans jamais lever.
 *
 * `chemin` est la route où c'est arrivé, quand l'appelant la connaît — elle
 * aide à retrouver le contexte sans avoir à garder la pile.
 */
export async function noterErreur(
  portee: Portee,
  erreur: unknown,
  chemin?: string,
): Promise<void> {
  try {
    const { type, code, message } = decrire(erreur);

    await prisma.erreurServeur.create({
      data: {
        portee,
        type,
        code,
        message: caviarder(message).slice(0, MESSAGE_MAX) || "(sans message)",
        chemin: chemin ? caviarder(chemin).slice(0, 300) : null,
      },
    });

    await oublierLesVieilles();
  } catch {
    // ⚠️ Silence volontaire, et c'est la décision la plus importante du
    // fichier. On est déjà dans un chemin d'erreur : lever ici remplacerait
    // le vrai défaut par celui de sa journalisation, et l'appelant — une
    // route de connexion, un envoi de courriel — tomberait pour avoir voulu
    // se souvenir. `console.error` a déjà été appelé par l'appelant.
  }
}

/** Le nom de la classe, le code s'il y en a un, et le message. */
function decrire(erreur: unknown): {
  type: string;
  code: string | null;
  message: string;
} {
  if (erreur instanceof Error) {
    // Prisma et Node posent un `code` sur l'erreur : `P2028`, `ECONNREFUSED`.
    // C'est ce qui distingue « la base dort » de « la requête est fausse ».
    const code = (erreur as { code?: unknown }).code;
    return {
      type: erreur.name || erreur.constructor.name || "Error",
      code: typeof code === "string" && code.trim() ? code.slice(0, 40) : null,
      message: erreur.message || String(erreur),
    };
  }
  return { type: typeof erreur, code: null, message: String(erreur) };
}

/**
 * Efface ce qui a passé trente jours.
 *
 * ⚠️ **En dehors de toute transaction, et sans jamais faire échouer l'appel.**
 * C'est du ménage : qu'il rate ce matin n'a aucune conséquence, il repassera
 * à la prochaine erreur.
 */
async function oublierLesVieilles(): Promise<void> {
  const limite = new Date(Date.now() - RETENTION_JOURS * 24 * 60 * 60 * 1000);
  try {
    await prisma.erreurServeur.deleteMany({ where: { survenuLe: { lt: limite } } });
  } catch {
    // Sans conséquence : la prochaine erreur repassera par ici.
  }
}
