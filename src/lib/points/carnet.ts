import type { PrismaClient } from "@prisma/client";
import { totauxVides } from "@/lib/ecole/tournoi";
import type { Maison } from "@/lib/dossier/etats";

/**
 * Ce que le carnet dit d'une saison — **la seule addition qui fasse foi**.
 *
 * ── Pourquoi cette fonction a été sortie du dépôt ──
 *
 * `recalculerLesCompteurs` faisait la lecture ET l'écriture. C'était sans
 * conséquence tant que le site était seul à s'en servir ; La Veille, elle, ne
 * peut pas l'appeler — elle n'a que le droit de lire, et la base refuserait
 * l'écriture.
 *
 * Elle aurait donc refait la somme dans son coin. Deux additions du même
 * carnet, écrites à deux endroits : le jour où l'une changerait — une source
 * de points nouvelle, une reprise comptée autrement —, La Veille signalerait
 * chaque matin un écart qui n'existe pas, ou pire, cesserait de voir celui qui
 * existe. Une surveillance qui vérifie ses propres calculs ne vérifie rien.
 *
 * D'où **une seule règle, et deux clients** : le site l'appelle avec le sien,
 * La Veille avec ses identifiants de lecture.
 *
 * ── Ce que la somme retient, et ce qu'elle écarte ──
 *
 *   • les points repris (`repriseLe`) ne comptent plus — un post masqué retire
 *     son point, et la ligne reste, barrée (art. 19.3) ;
 *   • les points sans maison ne comptent pour personne — un professeur gagne
 *     des points personnels que le tournoi n'encaisse pas ;
 *   • les ajustements annulés ne comptent plus, et ceux qui tiennent comptent
 *     (art. 19.1) — c'est ce qui interdit de sommer `Eleve.points`.
 *
 * ⚠️ **Aucun plancher à zéro ici.** Une maison peut être à −15 dans le
 * compteur : le plancher est un choix d'AFFICHAGE, posé dans `classement()` et
 * nulle part ailleurs. L'appliquer à la somme rendrait le recalcul faux —
 * −15 puis +5 vaudrait 5 en incrémental et 0 au recalcul, deux vérités.
 */

/** Le minimum qu'un client doit savoir faire. Le site et La Veille l'ont. */
export type LecteurDuCarnet = Pick<PrismaClient, "pointGagne" | "ajustementMaison">;

export async function totauxDepuisLeCarnet(
  base: LecteurDuCarnet,
  saisonId: string,
): Promise<Record<Maison, number>> {
  const [gagnes, ajustements] = await Promise.all([
    base.pointGagne.findMany({
      where: { saisonId, repriseLe: null, NOT: { maison: null } },
      select: { maison: true, points: true },
    }),
    base.ajustementMaison.findMany({
      where: { saisonId, annuleLe: null },
      select: { maison: true, points: true },
    }),
  ]);

  const totaux = totauxVides();
  for (const ligne of [...gagnes, ...ajustements]) {
    if (ligne.maison) totaux[ligne.maison] += ligne.points;
  }
  return totaux;
}
