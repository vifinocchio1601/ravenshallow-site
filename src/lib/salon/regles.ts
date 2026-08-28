import reglages from "@/config/salon.json";

/**
 * **Le frein anti-noyade du salon.**
 *
 * Pas plus de quelques messages par fenêtre de quelques secondes, **par auteur
 * et par pièce**. Il existe pour qu'un seul bavard ne pousse pas la
 * conversation des autres hors de l'écran en trente secondes — pas pour
 * empêcher qui que ce soit de parler.
 *
 * ⚠️ **Ce n'est pas un refus, et il ne faut jamais le ranger parmi les
 * refus.** La route répond **429**, jamais 403, et donne le délai en clair.
 * Un message refusé ne partira jamais ; celui-ci partira dans trois secondes.
 * Confondre les deux ferait lire « vous n'avez pas le droit » là où il faut
 * lire « pas si vite » — c'est exactement la leçon d'`ATTENDRE` dans la Tour
 * aux Corbeaux.
 *
 * **Le calcul est pur** : il reçoit les instants et l'heure, ne lit ni horloge
 * ni base, et s'éprouve donc sur une conversation entière sans attendre. Deux
 * envois simultanés peuvent passer tous les deux — assumé : ce frein ralentit
 * un bavard, il ne garde pas une porte.
 */

export const MESSAGES_PAR_FENETRE: number = reglages.messagesParFenetre;
export const FENETRE_SECONDES: number = reglages.fenetreSecondes;

export type EtatDuFrein =
  | { bloque: false; restants: number }
  | { bloque: true; secondes: number };

/**
 * @param instants Les envois de cet auteur dans cette pièce, en millisecondes.
 *   L'ordre n'importe pas ; ce qui est hors fenêtre est ignoré.
 * @param maintenant L'instant de l'envoi qu'on examine.
 */
export function etatDuFrein(
  instants: readonly number[],
  maintenant: Date,
): EtatDuFrein {
  const fin = maintenant.getTime();
  const debut = fin - FENETRE_SECONDES * 1000;

  // Une valeur abîmée ne doit ni compter ni tout bloquer : elle disparaît, et
  // le reste continue de fonctionner. Même précaution que le plafond des
  // points.
  const dansLaFenetre = instants
    .filter((i) => Number.isFinite(i) && i > debut && i <= fin)
    .sort((a, b) => a - b);

  if (dansLaFenetre.length < MESSAGES_PAR_FENETRE) {
    return { bloque: false, restants: MESSAGES_PAR_FENETRE - dansLaFenetre.length };
  }

  // Le plus ancien de la fenêtre en sortira le premier : c'est lui qui dit
  // dans combien de temps une place se libère. Arrondi vers le haut — annoncer
  // « 0 seconde » à quelqu'un qui doit encore attendre serait faux.
  const plusAncien = dansLaFenetre[dansLaFenetre.length - MESSAGES_PAR_FENETRE]!;
  const libreA = plusAncien + FENETRE_SECONDES * 1000;
  return { bloque: true, secondes: Math.max(1, Math.ceil((libreA - fin) / 1000)) };
}
