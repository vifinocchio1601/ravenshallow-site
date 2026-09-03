import { REGLES } from "./cursus";

/**
 * **Le délai de sept jours entre deux leçons** — `REGLES.delaiEntreLeconsJours`,
 * écrit par le joueur.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * Quand s'ouvre la leçon suivante, et comment on écrit le temps qui reste. Deux
 * endroits l'affichent — la page du contrôle, qui fait tourner une horloge à la
 * seconde, et la liste des matières, qui dit « dans 6 jours ». Deux comptes qui
 * divergeraient, c'est un élève qui lit deux nombres différents sur la même
 * attente.
 *
 * ⚠️ **Il compte depuis l'ENVOI du contrôle**, jamais depuis l'ouverture de la
 * leçon ni depuis sa lecture. C'est ce que dit `REGLES`, et c'est la seule date
 * que la base garde — `ControleEnvoye.envoyeLe`, que le déclencheur fige.
 *
 * ── Ce qu'il n'oppose à personne, et pourquoi il tourne quand même ──
 *
 * Il n'y a **qu'une leçon par matière** aujourd'hui : le délai ne ferme donc
 * aucune porte, il n'y a rien derrière. Décision du joueur du 4 septembre
 * 2026 : **le chrono part quand même**. Il dit à l'élève que son contrôle est
 * enregistré et quand la suite viendra — une horloge à zéro serait plus
 * troublante qu'une horloge qui tourne sur une leçon qu'on écrit encore.
 *
 * ⚠️ **Le jour où la leçon 2 arrivera, c'est ici qu'on branchera la garde** —
 * `peutOuvrirLaLecon` recevra ce verdict —, et nulle part ailleurs. La règle
 * est déjà écrite ; il ne manquera qu'un appelant.
 *
 * ── Pur ──
 *
 * Ni base, ni horloge : l'instant arrive en paramètre. C'est ce qui permet
 * d'éprouver une semaine entière sans attendre — même parti pris
 * qu'`etatDuPlafond` et que le frein du salon.
 */

const UN_JOUR = 24 * 60 * 60 * 1000;

/** L'instant où la leçon suivante s'ouvre, depuis l'envoi du contrôle. */
export function finDuDelai(envoyeLe: Date): Date {
  return new Date(
    envoyeLe.getTime() + REGLES.delaiEntreLeconsJours * UN_JOUR,
  );
}

/** Le délai est-il écoulé ? */
export function delaiEcoule(envoyeLe: Date, maintenant: Date): boolean {
  return maintenant.getTime() >= finDuDelai(envoyeLe).getTime();
}

/**
 * **Les jours qui restent, arrondis VERS LE HAUT** — et jamais moins d'un tant
 * que le délai court.
 *
 * ⚠️ L'arrondi va dans le sens de l'attente, comme le décompte des lignes qui
 * manquent à un post. Six jours et vingt-trois heures s'écrivent « 7 jours » :
 * annoncer « 6 » ferait attendre l'élève un jour de plus que ce qu'on lui a
 * dit, et c'est la seule erreur qui se remarque.
 *
 * Rend `0` — et seulement `0` — quand il n'y a plus rien à attendre.
 */
export function joursRestants(envoyeLe: Date, maintenant: Date): number {
  const reste = finDuDelai(envoyeLe).getTime() - maintenant.getTime();
  if (reste <= 0) return 0;
  return Math.ceil(reste / UN_JOUR);
}
