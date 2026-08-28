import { DELAI_MINIMAL_MS, DEMANDES_PAR_HEURE } from "./limites";

/**
 * **Les freins du formulaire public**, et ils sont purs.
 *
 * Ni horloge, ni base : la fonction reçoit l'instant et le nombre de demandes
 * de la dernière heure, et rend un verdict. C'est ce qui permet de l'éprouver
 * sur une journée entière sans attendre — même parti pris qu'`etatDuPlafond`
 * dans la Tour aux Corbeaux et que le frein du salon.
 *
 * ⚠️ **Trois freins, et aucun ne conserve quoi que ce soit de la personne.**
 * La politique de confidentialité écrit que le site ne garde aucune adresse
 * IP, pas même sous forme d'empreinte. Le prix en est un plafond **global** :
 * un robot acharné peut fermer le formulaire une heure. La page dit alors
 * d'écrire sur Discord, qui n'a pas de plafond.
 */

export type Verdict =
  /** Ça passe. */
  | { suite: "PASSE" }
  /**
   * Un robot. **Il n'apprend pas pourquoi** : lui répondre « votre pot de miel
   * était rempli » serait lui donner le mode d'emploi. La page affiche le même
   * accusé de réception que pour un envoi réel — c'est le principe de
   * `PART_DANS_LE_VIDE` dans la Tour, appliqué aux machines.
   */
  | { suite: "AVALE" }
  /**
   * Trop d'envois dans l'heure. **Ce n'est pas un refus** : ce qui est refusé
   * ne partira jamais, ceci partira tout à l'heure. Confondre les deux ferait
   * lire « vous n'avez pas le droit » à qui n'a fait qu'arriver au mauvais
   * moment.
   */
  | { suite: "ATTENDRE" };

export function verifierLesFreins(etat: {
  /** Le champ que l'œil ne voit pas. Rempli : c'est une machine. */
  pot: string | null;
  /** L'instant où le formulaire a été affiché, tel qu'il le rapporte. */
  ouvertLe: number | null;
  maintenant: number;
  /** Combien de demandes ont été déposées dans la dernière heure. */
  demandesDansLHeure: number;
}): Verdict {
  if (etat.pot !== null && etat.pot.trim().length > 0) {
    return { suite: "AVALE" };
  }

  // ⚠️ Un instant d'ouverture **absent** ne vaut pas un envoi trop rapide : un
  // navigateur sans JavaScript ne le pose pas, et refuser ce cas fermerait le
  // formulaire à qui bloque les scripts. Seul un instant présent et trop
  // proche est retenu. Un instant venu du futur — horloge déréglée — passe
  // aussi : il ne prouve rien.
  if (
    etat.ouvertLe !== null &&
    etat.maintenant - etat.ouvertLe >= 0 &&
    etat.maintenant - etat.ouvertLe < DELAI_MINIMAL_MS
  ) {
    return { suite: "AVALE" };
  }

  if (etat.demandesDansLHeure >= DEMANDES_PAR_HEURE) {
    return { suite: "ATTENDRE" };
  }

  return { suite: "PASSE" };
}
