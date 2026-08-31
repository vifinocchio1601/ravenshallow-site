import { porteUneAdresse } from "@/lib/erreurs/caviardage";

/**
 * Le dernier contrôle avant l'envoi — **et il refuse, il ne corrige pas**.
 *
 * ── Ce que ce fichier est, et ce qu'il n'est pas ──
 *
 * ⚠️ **Ce n'est pas la protection de la vie privée : c'en est le filet.** La
 * protection, c'est que les collecteurs ne demandent jamais un nom ni une
 * adresse — `etancheite.test.ts` relit leur code source pour s'en assurer.
 * Celui-ci attrape ce qui aurait échappé à la règle.
 *
 * ── Pourquoi il refuse au lieu de masquer ──
 *
 * Un rapport qui se caviarderait tout seul partirait proprement, et personne
 * ne saurait jamais qu'un collecteur ramène ce qu'il ne devrait pas. Le défaut
 * resterait, année après année, sous un masque.
 *
 * En refusant, on transforme une fuite silencieuse en un échec bruyant : le
 * courriel d'échec part, il dit ce qui s'est passé, et l'on corrige le
 * collecteur fautif. C'est le même raisonnement que le déclencheur qui refuse
 * de réécrire une ligne du carnet des points.
 *
 * ── Ce qu'il ne sait pas attraper ──
 *
 * Les noms de personnages. Il n'y a aucun moyen honnête de reconnaître
 * « Sigrid Harlaug » dans un texte français sans le comparer à la base, ce que
 * La Veille ne fera pas pour un contrôle. **Les noms sont protégés en amont,
 * par la règle, et par elle seule** — c'est pourquoi cette règle est vérifiée
 * fichier par fichier plutôt que laissée à la bonne foi.
 */

export type Verdict =
  | { peutPartir: true }
  | { peutPartir: false; raison: string };

export function verifierAvantEnvoi(objet: string, corps: string): Verdict {
  for (const [quoi, texte] of [
    ["l’objet", objet],
    ["le corps", corps],
  ] as const) {
    if (porteUneAdresse(texte)) {
      return {
        peutPartir: false,
        // ⚠️ On ne recopie SURTOUT PAS l'adresse trouvée dans la raison : elle
        // partirait alors dans le courriel d'échec, c'est-à-dire exactement là
        // où l'on refuse de l'envoyer.
        raison:
          `Le rapport a été retenu : ${quoi} contient ce qui ressemble à une ` +
          "adresse de courriel. Un collecteur remonte une donnée personnelle — " +
          "c’est lui qu’il faut corriger, pas ce contrôle.",
      };
    }
  }

  return { peutPartir: true };
}
