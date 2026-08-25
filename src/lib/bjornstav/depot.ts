import "server-only";
import { prisma } from "@/lib/prisma";
import type { BaguetteBois, BaguetteCoeur } from "@prisma/client";
import type { CodeBois, CodeCoeur } from "@/lib/ecole/baguette";

/**
 * L’inscription de la baguette. **C’est l’instant où elle devient définitive.**
 *
 * L’écriture passe par un `updateMany` conditionné à `baguetteChoisieLe: null`,
 * et non par un `update` : la base ne modifie la ligne que si elle est encore
 * vierge, et rend le nombre de lignes touchées. Deux requêtes lancées en même
 * temps — deux onglets, un double clic, une requête forgée — ne peuvent donc
 * pas se succéder : la première écrit, la seconde compte zéro et repart
 * bredouille. C’est la même mécanique que la répartition du Miroir.
 *
 * **Et ce n’est que le premier des deux verrous.** Le second est dans la base
 * elle-même : une contrainte impose que les trois colonnes aillent ensemble,
 * et un déclencheur refuse toute modification d’une baguette déjà posée, quelle
 * que soit la main qui écrit — voir la migration
 * `20260825200000_baguette_definitive`. Celui-ci évite seulement d’aller la
 * déranger pour rien.
 *
 * Les trois colonnes partent dans la même requête : une baguette à moitié
 * écrite n’existe pas, et la base la refuserait.
 */
export async function inscrireBaguette(
  eleveId: string,
  bois: CodeBois,
  coeur: CodeCoeur,
): Promise<{ inscrite: boolean }> {
  const ecrit = await prisma.eleve.updateMany({
    where: { id: eleveId, baguetteChoisieLe: null },
    data: {
      baguetteBois: bois as BaguetteBois,
      baguetteCoeur: coeur as BaguetteCoeur,
      baguetteChoisieLe: new Date(),
    },
  });

  // Déjà une baguette : on ne touche à rien. Surtout pas à celle qui est là.
  return { inscrite: ecrit.count === 1 };
}
