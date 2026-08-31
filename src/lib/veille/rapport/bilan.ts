import type { AnomalieDatee } from "../anomalies";
import type { CeQuiAttend } from "../collecteurs/attente";
import type { Coherence } from "../collecteurs/coherence";
import type { Disponibilite } from "../collecteurs/disponibilite";
import type { Erreurs } from "../collecteurs/erreurs";
import type { Parcours } from "../collecteurs/parcours";
import type { Vie } from "../collecteurs/vie";

/**
 * Ce que la ronde a rapporté — la seule chose que le rapport connaisse.
 *
 * ── Pourquoi un type à part ──
 *
 * Le rapport ne doit rien savoir de la base, du réseau ni des collecteurs : il
 * met en forme un bilan, et c'est tout. C'est ce qui permet de l'éprouver
 * entièrement sans monter une ronde autour — et donc de vérifier pour de bon
 * qu'aucun nom ni aucune adresse n'en sort.
 *
 * ⚠️ **Chaque famille peut être nulle**, et c'est le cœur du dispositif : un
 * collecteur tombé laisse son champ vide, et son nom passe dans `manquants`.
 * Le rapport le dit alors en toutes lettres. Un trou silencieux se lirait
 * comme « rien à signaler », ce qui est exactement le contraire de la vérité.
 */
export type Bilan = {
  instant: Date;
  /** Les anomalies, déjà datées et triées. */
  anomalies: AnomalieDatee[];

  attente: CeQuiAttend | null;
  vie: Vie | null;
  erreurs: Erreurs | null;
  disponibilite: Disponibilite | null;
  parcours: Parcours | null;
  coherence: Coherence | null;

  /** Ce que la ronde n'a pas pu voir, et pourquoi. */
  manquants: { nom: string; raison: string }[];

  /** Les pistes du modèle, ou `null` si l'appel n'a pas abouti. */
  suggestions: string[] | null;

  /** Combien de temps la ronde a duré. */
  dureeMs: number;

  /** La ronde a-t-elle été coupée par sa propre borne de durée ? */
  ecourtee: boolean;
};

/**
 * Ce que l'objet du courriel annonce, nommé poste par poste.
 *
 * ⚠️ **Surtout pas une somme.** Une première version additionnait dossiers,
 * signalements, courrier et partenariats sous le mot « dossiers » : l'objet
 * annonçait « 6 dossiers en attente » là où il y en avait trois. Un chiffre
 * faux dans la seule ligne qu'on lit tous les jours est la pire place possible
 * — on décide dessus sans jamais ouvrir le message.
 *
 * Deux postes seulement remontent jusqu'à l'objet : les dossiers, parce que
 * c'est le travail le plus fréquent, et les signalements, parce qu'ils
 * n'attendent pas (art. 8.6). Le reste est dans le corps.
 */
export function postesDeLObjet(
  attente: CeQuiAttend | null,
): { nombre: number; singulier: string; pluriel: string }[] {
  if (!attente) return [];
  return [
    {
      nombre: attente.dossiers,
      singulier: "dossier en attente",
      pluriel: "dossiers en attente",
    },
    {
      nombre: attente.signalements,
      singulier: "signalement",
      pluriel: "signalements",
    },
  ].filter((poste) => poste.nombre > 0);
}
