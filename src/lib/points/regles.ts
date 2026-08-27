import reglages from "@/config/points.json";

/**
 * **Ce qu’un post rapporte, et jusqu’où.**
 *
 * Fonction pure de bout en bout : ce fichier ne lit ni horloge ni base, il
 * reçoit les faits et rend un verdict. C’est ce qui permet d’éprouver une
 * journée entière de plafond sans attendre une journée — même parti pris
 * qu’`etatDuPlafond` dans la Tour aux Corbeaux.
 *
 * ── Ce qui est un réglage, ce qui est une règle ──
 *
 * Les trois nombres vivent dans `config/points.json` : ils s’ajusteront après
 * avoir vu de vrais posts. Ce qui vient du règlement, lui, reste dans le
 * code — les points se gagnent au RP (art. 18.1), le classement se fait à la
 * moyenne par élève, une année dure six mois (art. 18.3). Un réglage se
 * change ; une règle du joueur se discute avec lui.
 *
 * ⚠️ **Ce fichier ne dit pas POUR QUI un compte marque.** C’est
 * `lib/ecole/tournoi.ts`, et lui seul : lire `Eleve.maison` ici, ou n’importe
 * où ailleurs, c’est le bug.
 */

/** Ce qu’un post publié rapporte, dans un espace qui compte. */
export const POINTS_PAR_POST: number = reglages.parPost;

/**
 * Le maximum de points qu’un joueur peut gagner en vingt-quatre heures.
 *
 * `null` le désactive entièrement — le mécanisme reste construit et éprouvé,
 * il ne s’applique simplement plus.
 */
export const PLAFOND_PAR_JOUR: number | null = reglages.plafondParJour;

/** Le diviseur minimum de la moyenne par élève. Voir `ecole/tournoi.ts`. */
export const PLANCHER_EFFECTIF: number = reglages.plancherEffectif;

const UN_JOUR = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
//  Le plafond quotidien — art. 18.6 par anticipation
// ─────────────────────────────────────────────────────────────

/**
 * **Vingt-quatre heures glissantes, et non la journée civile.**
 *
 * Une « journée » n’est pas la même pour tout le monde : le serveur de Vercel
 * vit en UTC, le joueur non, et minuit n’arrive pas au même moment pour les
 * deux. Un plafond calé sur le jour du serveur se remettrait à zéro à deux
 * heures du matin pour un joueur français, en plein milieu de sa soirée
 * d’écriture — et il n’aurait aucun moyen de le comprendre.
 *
 * La Tour aux Corbeaux a tranché la même question dans le même sens
 * (`etatDuPlafond`, dans `corbeaux/droits.ts`). Deux façons de compter une
 * journée sur le même site finiraient par se contredire.
 */
export type EtatDuPlafond =
  | { atteint: false; restants: number | null }
  | { atteint: true; reprendLe: Date };

/**
 * Où en est ce joueur de son plafond ?
 *
 * `gainsRecents` porte les instants des points **déjà inscrits au carnet**,
 * reprises comprises. Un point retiré parce que son post a été masqué ne
 * rend pas sa place dans la journée : le post a bien été écrit, et le plafond
 * mesure ce qu’on écrit, pas ce qui a été validé.
 */
export function etatDuPlafond(
  gainsRecents: readonly (Date | string)[],
  maintenant: Date,
): EtatDuPlafond {
  if (PLAFOND_PAR_JOUR === null) return { atteint: false, restants: null };

  const instants = gainsRecents
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t) && maintenant.getTime() - t < UN_JOUR)
    // De la plus récente à la plus ancienne : la N-ième en partant de
    // maintenant est celle dont l'expiration libère une place.
    .sort((a, b) => b - a);

  if (instants.length < PLAFOND_PAR_JOUR) {
    return { atteint: false, restants: PLAFOND_PAR_JOUR - instants.length };
  }

  return {
    atteint: true,
    reprendLe: new Date(instants[PLAFOND_PAR_JOUR - 1]! + UN_JOUR),
  };
}

// ─────────────────────────────────────────────────────────────
//  Ce qu’un post rapporte
// ─────────────────────────────────────────────────────────────

/**
 * Pourquoi un post n’a rien rapporté.
 *
 * Les trois raisons sont **nommées** plutôt que ramenées à un zéro : un post
 * chez les non-mages et un post qui bute sur le plafond ne se racontent pas
 * de la même façon, et le jour où l’écran voudra le dire au joueur, le
 * verdict le sait déjà.
 */
export type RaisonSansPoint =
  | "LIEU_SANS_POINTS"
  | "POST_TROP_COURT"
  | "PLAFOND_ATTEINT";

export type VerdictPoint =
  | { gagne: true; points: number }
  | { gagne: false; raison: RaisonSansPoint };

/**
 * Ce post rapporte-t-il un point ?
 *
 * L’ordre des trois questions n’est pas indifférent : c’est celui du sens.
 * Un post chez les non-mages ne rapporte rien **quoi qu’il arrive** — dire
 * « plafond atteint » à quelqu’un qui écrit là-bas serait faux et le laisserait
 * croire qu’il aurait pu gagner quelque chose.
 *
 * `respecteLeMinimum` est **reçu**, jamais recalculé ici : c’est
 * `forum/longueur.ts` qui sait ce que valent dix lignes, et le comptage ne se
 * fait qu’à un seul endroit sur ce site. Un second comptage finirait par
 * diverger du premier, et un joueur verrait son post accepté sans point.
 */
export function pointDUnPost(faits: {
  /** L’espace compte-t-il ? `Espace.comptePourLesPoints`, jamais deviné. */
  comptePourLesPoints: boolean;
  /** Le post atteint-il le minimum du lieu ? Voir `forum/longueur.ts`. */
  respecteLeMinimum: boolean;
  plafond: EtatDuPlafond;
}): VerdictPoint {
  if (!faits.comptePourLesPoints) {
    return { gagne: false, raison: "LIEU_SANS_POINTS" };
  }
  if (!faits.respecteLeMinimum) {
    return { gagne: false, raison: "POST_TROP_COURT" };
  }
  if (faits.plafond.atteint) {
    return { gagne: false, raison: "PLAFOND_ATTEINT" };
  }
  return { gagne: true, points: POINTS_PAR_POST };
}
