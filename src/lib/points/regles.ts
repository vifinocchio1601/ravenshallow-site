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
 * `gainsRecents` porte les points **déjà inscrits au carnet**, reprises
 * comprises. Un point retiré parce que son post a été masqué ne rend pas sa
 * place dans la journée : le post a bien été écrit, et le plafond mesure ce
 * qu’on écrit, pas ce qui a été validé.
 *
 * ⚠️ **Ce sont des POINTS qu’on additionne, pas des lignes.** Tant qu’un post
 * vaut un point, les deux reviennent au même — mais le réglage s’appelle
 * « points par jour », et il doit dire vrai le jour où un QCM en vaudra deux.
 * Compter les lignes laisserait passer vingt points sous un plafond de dix.
 *
 * ⚠️ **Les points accordés à la main n’entrent PAS dans cette liste**, et
 * c’est l’appelant qui les écarte. Le plafond existe pour qu’un seul membre
 * très actif ne fasse pas gagner sa maison à lui seul ; un geste délibéré de
 * l’administration n’est pas cela, il n’a donc ni à le remplir ni à s’y heurter.
 */
export function etatDuPlafond(
  gainsRecents: readonly { gagneLe: Date | string; points: number }[],
  maintenant: Date,
): EtatDuPlafond {
  if (PLAFOND_PAR_JOUR === null) return { atteint: false, restants: null };

  const gains = gainsRecents
    .map((g) => ({ instant: new Date(g.gagneLe).getTime(), points: g.points }))
    .filter(
      (g) => !Number.isNaN(g.instant) && maintenant.getTime() - g.instant < UN_JOUR,
    )
    // De la plus récente à la plus ancienne : on accumule en remontant le
    // temps, et le gain qui fait franchir le plafond est celui dont
    // l’expiration libère la place.
    .sort((a, b) => b.instant - a.instant);

  let cumul = 0;
  for (const gain of gains) {
    cumul += gain.points;
    if (cumul >= PLAFOND_PAR_JOUR) {
      return { atteint: true, reprendLe: new Date(gain.instant + UN_JOUR) };
    }
  }

  return { atteint: false, restants: PLAFOND_PAR_JOUR - cumul };
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
