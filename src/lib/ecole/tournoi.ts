import { MAISONS, type EtatEtape, type Maison } from "@/lib/dossier/etats";
import { aUneMaison } from "@/lib/session/acces";

/**
 * Qui marque pour sa maison — et le tournoi inter-maisons (art. 18.2).
 *
 * **Les points n’existent pas encore.** Ce fichier ne compte donc rien
 * aujourd’hui : il pose la règle qui décidera *qui* compte, avant que le
 * moindre total soit écrit quelque part.
 *
 * L’ordre n’est pas anodin. Poser cette règle après coup obligerait à
 * retrouver un par un les endroits qui totalisent, et c’est très exactement
 * ainsi qu’un professeur finit par rapporter des points à son ancienne
 * maison : sa maison est toujours écrite en base — on ne l’efface pas —, et
 * n’importe quelle somme naïve la ramasserait au passage.
 *
 * **`maisonQuiCompte` est le seul endroit du site qui répond à la question.**
 * Le lot des points s’y branchera plutôt que de relire `maison` : lire la
 * colonne directement, c’est le bug.
 *
 * Rien ici n’est un contrôle d’accès : ce fichier dit ce qui se totalise,
 * jamais qui a le droit d’entrer où.
 */

/** Le strict nécessaire pour décider — pas la fiche entière. */
export type PourLeTournoi = {
  /** Écrite ou non. **Ne pas la lire directement** : voir ci-dessous. */
  maison: string | null;
  etatMaison: EtatEtape;
};

/**
 * La maison pour laquelle ce compte marque, ou `null` s’il ne marque pour
 * personne.
 *
 * `FAIT` et rien d’autre. Une directrice garde Tideål en base — c’est ce qui
 * lui permet de la retrouver intacte le jour où elle quitte le poste — et ne
 * doit pas pour autant faire pencher le tournoi. Un nouvel élève, lui, n’a
 * pas encore de maison à faire pencher.
 */
export function maisonQuiCompte(compte: PourLeTournoi): Maison | null {
  // Marquer et s'afficher, c'est la même condition aujourd'hui. Le jour où
  // elles divergeront — un membre suspendu qui garde son blason sans plus
  // marquer —, c'est cette ligne-ci qui changera, et elle seule.
  if (!aUneMaison(compte) || !compte.maison) return null;
  // Une valeur écrite avant un renommage ne doit pas fausser un total : on ne
  // rend que ce que la liste des maisons reconnaît.
  return (MAISONS as readonly string[]).includes(compte.maison)
    ? (compte.maison as Maison)
    : null;
}

/**
 * Ce compte pèse-t-il dans le tournoi ?
 *
 * Question de comptage, distincte de « sa maison s’affiche-t-elle ? », à
 * laquelle répond `aUneMaison` dans `session/acces.ts`. Les deux coïncident
 * aujourd’hui ; les séparer laisse la place à une règle qui viendra
 * peut-être — un membre suspendu qui garde son blason sans plus marquer —
 * sans avoir à démêler l’une de l’autre à ce moment-là.
 */
export function compteAuTournoi(compte: PourLeTournoi): boolean {
  return maisonQuiCompte(compte) !== null;
}

/** Les quatre maisons à zéro. Toujours les quatre, jamais un objet partiel. */
export function totauxVides(): Record<Maison, number> {
  return Object.fromEntries(MAISONS.map((m) => [m, 0])) as Record<Maison, number>;
}

/**
 * Le compteur de chaque maison.
 *
 * Prend les membres **bruts** et fait le tri lui-même, à dessein : une
 * fonction qui recevrait une liste déjà filtrée reposerait sur l’appelant
 * pour ne pas se tromper, et c’est précisément ce qu’on veut lui retirer.
 *
 * Les quatre maisons figurent toujours au résultat, même à zéro : un tournoi
 * où une maison disparaît du tableau parce qu’elle n’a encore rien marqué
 * serait illisible.
 */
export function totauxParMaison(
  membres: readonly (PourLeTournoi & { points: number })[],
): Record<Maison, number> {
  const totaux = totauxVides();
  for (const membre of membres) {
    const maison = maisonQuiCompte(membre);
    if (maison) totaux[maison] += membre.points;
  }
  return totaux;
}
