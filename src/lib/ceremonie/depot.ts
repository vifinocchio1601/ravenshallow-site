import "server-only";
import { prisma } from "@/lib/prisma";
import { transaction } from "@/lib/base/transaction";
import type { Maison } from "@/lib/dossier/etats";
import type { Repartition } from "./repartition";
import { lireMelange, tirerMelange } from "./repartition";

/**
 * L’accès à la cérémonie en base.
 *
 * Une ligne par élève, et `eleveId @unique` en travers : c’est la base
 * elle-même qui interdit une seconde cérémonie, pas une condition écrite
 * quelque part qu’on pourrait oublier de recopier.
 */

/** Une ligne qu’on vient d’écrire est valide : inutile de la revalider. */
const decouper = (range: readonly string[]): string[][] =>
  range.map((ligne) => ligne.split(" "));

/**
 * Ouvre la cérémonie de cet élève, ou rouvre celle qui l’est déjà, et rend
 * l’ordre d’affichage de ses réponses.
 *
 * **Le mélange n’est tiré qu’une fois.** Un rechargement de page relit la
 * ligne existante : c’est ce qui empêche un joueur de rebattre les cartes
 * jusqu’à retomber sur un ordre qu’il croit reconnaître.
 */
export async function ouvrirCeremonie(eleveId: string): Promise<string[][]> {
  const existante = await prisma.ceremonieMiroir.findUnique({
    where: { eleveId },
    select: { melange: true },
  });

  if (existante) {
    const melange = lireMelange(existante.melange);
    if (melange) return melange;

    // Le questionnaire a changé sous une cérémonie déjà ouverte : le mélange
    // rangé ne lui correspond plus. Mieux vaut le refaire que d’afficher une
    // question à trois réponses.
    const rebattu = tirerMelange();
    await prisma.ceremonieMiroir.update({
      where: { eleveId },
      data: { melange: rebattu },
    });
    return decouper(rebattu);
  }

  const neuf = tirerMelange();
  try {
    await prisma.ceremonieMiroir.create({ data: { eleveId, melange: neuf } });
    return decouper(neuf);
  } catch {
    // Deux onglets ouverts en même temps : l’autre a gagné la course et sa
    // ligne existe déjà. On adopte son mélange au lieu d’imposer le nôtre —
    // sans quoi l’élève verrait deux ordres différents selon l’onglet.
    const gagnante = await prisma.ceremonieMiroir.findUnique({
      where: { eleveId },
      select: { melange: true },
    });
    return (gagnante && lireMelange(gagnante.melange)) ?? decouper(neuf);
  }
}

/**
 * Inscrit la répartition. **C’est l’instant où elle devient définitive.**
 *
 * L’écriture de la maison passe par un `updateMany` conditionné à
 * `etatMaison: "NON_FAIT"`, et non par un `update` : la base ne modifie la ligne que si
 * elle est encore vierge, et rend le nombre de lignes touchées. Deux requêtes
 * lancées en même temps — deux onglets, un double clic, une requête forgée —
 * ne peuvent donc pas se succéder : la première écrit, la seconde compte zéro
 * et repart bredouille. Sans cette condition, un joueur pourrait envoyer deux
 * jeux de réponses différents et garder le résultat qui lui plaît.
 *
 * La trace suit dans la même transaction : réponses, points, date de clôture.
 * On la garde pour expliquer une répartition (art. 8.5), jamais pour la
 * rejouer (art. 11.2).
 */
export async function enregistrerRepartition(
  eleveId: string,
  reponses: readonly string[],
  repartition: Repartition,
): Promise<{ enregistree: boolean }> {
  return transaction(async (tx) => {
    const ecrit = await tx.eleve.updateMany({
      // La condition porte sur l'ÉTAT, et non sur la maison vide. Un compte
      // que la répartition ne concerne pas peut très bien n'avoir aucune
      // maison : la condition d'avant l'aurait laissé écrire.
      where: { id: eleveId, etatMaison: "NON_FAIT" },
      data: {
        maison: repartition.maison as Maison,
        repartiLe: new Date(),
        // L'état suit la maison dans la même écriture : la base refuserait
        // une maison posée sous un état « attendu ».
        etatMaison: "FAIT",
      },
    });

    // Déjà réparti, ou compte non concerné : on ne touche à rien, surtout pas
    // à la trace existante.
    if (ecrit.count !== 1) return { enregistree: false };

    const trace = {
      reponses: [...reponses],
      points: repartition.points,
      closeLe: new Date(),
    };

    // `upsert` plutôt que `update` : la ligne existe dès la première ouverture
    // de la page, mais une requête arrivée sans elle doit tout de même laisser
    // sa trace plutôt que d’échouer.
    await tx.ceremonieMiroir.upsert({
      where: { eleveId },
      update: trace,
      create: { eleveId, melange: tirerMelange(), ...trace },
    });

    return { enregistree: true };
  });
}
