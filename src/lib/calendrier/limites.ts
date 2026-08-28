/**
 * **Les plafonds d'un événement**, alignés sur les contraintes `CHECK` de
 * `20260828180000_calendrier`.
 *
 * Séparés des textes pour la même raison que ceux d'une annonce : le champ de
 * saisie a besoin de connaître la longueur maximale, et rien d'autre.
 *
 * ⚠️ **La description est bien plus courte que celle d'une annonce**, et ce
 * n'est pas un oubli : un calendrier porte des repères, pas des articles. Le
 * détail s'écrit dans une annonce du Grand Hall, qui a la barre complète.
 */

/** Une ligne de titre — « La veillée des braises ». */
export const TITRE_EVENEMENT_MAX = 140;

/** Deux ou trois phrases. Du texte brut : ce qui est mesuré est ce qui se lit. */
export const DESCRIPTION_EVENEMENT_MAX = 2000;
