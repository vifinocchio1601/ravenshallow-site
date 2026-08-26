import { TEXTES_CORBEAUX } from "./constantes";
import type { RaisonRefus } from "./droits";

/**
 * Ce qu’on répond à un envoi refusé, raison par raison.
 *
 * Dans son propre fichier, et non dans `constantes.ts` : celui-là doit rester
 * du **texte pur, sans le moindre import**, pour que `ecole/menu.ts` puisse y
 * prendre le nom de l’entrée sans ouvrir un cycle — menu → constantes →
 * droits → acces → menu.
 *
 * Un `Record` complet plutôt qu’un `switch` : ajouter une raison dans
 * `droits.ts` sans lui écrire de phrase ici devient une erreur de
 * compilation, et non une route qui répondrait « Erreur » à un joueur.
 *
 * **`PART_DANS_LE_VIDE` n’y figure pas, et n’y figurera jamais** : un corbeau
 * qui part dans le vide n’est pas refusé. Il reçoit la réponse d’un envoi
 * réussi, mot pour mot.
 */
export const MESSAGE_REFUS: Record<RaisonRefus, string> = {
  TOUR_FERMEE: TEXTES_CORBEAUX.erreurs.tourFermee,
  SUSPENDU: TEXTES_CORBEAUX.erreurs.suspendu,
  DESTINATAIRE_INCONNU: TEXTES_CORBEAUX.erreurs.destinataireInconnu,
  CONVERSATION_CLOSE: TEXTES_CORBEAUX.erreurs.conversationClose,
};
