/**
 * **Qui lit quoi, dans les grimoires.**
 *
 * La couture unique de ce lot, et elle est courte parce que le joueur a
 * tranché court, le 30 août 2026 : **tout est lisible**, sauf ce qui est
 * réservé à l'administration.
 *
 * ── L'année ne ferme rien ──
 *
 * L'article 14.4 dit qu'un personnage ne dispose que des sorts de son année.
 * Il interdit de les **lancer**, pas d'en lire la fiche — et c'est déjà le
 * principe du forum, où un première année lit ce qui se joue dans les
 * souterrains sans pouvoir y écrire. Chaque fiche affiche donc son année de
 * déblocage, et le lecteur la voit ; aucune requête ne s'en sert.
 *
 * ⚠️ **Ne pas ajouter ici de question sur l'année.** Ce serait recopier une
 * règle que le joueur a écartée, et la recopier à l'endroit où plus personne
 * ne la relirait.
 *
 * ── Ce qui ne descend jamais ──
 *
 * Les quatre sortilèges interdits (art. 13.2 et 13.3). Le chapitre qui les
 * porte n'apparaît **ni dans le sommaire, ni sur l'étagère, ni en grisé** :
 * il n'existe pas pour un joueur. « Il existe, mais pas pour vous » se lit
 * comme une confirmation — même choix que le forum, la Tour et le Grand Hall.
 *
 * ⚠️ **Pure**, comme `peutLireLeLieu` et `peutOuvrirLAnnee` : elle reçoit
 * `staff` en paramètre, ne lit ni base ni pouvoirs, et se teste sur deux
 * valeurs.
 */

/** Miroir de l'enum Prisma `AccesGrimoire`. Deux valeurs, et pas trois. */
export type AccesGrimoire = "TOUS" | "ADMINISTRATION";

/**
 * **Ce chapitre s'ouvre-t-il à ce lecteur ?**
 *
 * Le staff passe partout, comme sur le forum et dans les cours.
 */
export function peutLireLeChapitre(
  acces: AccesGrimoire,
  staff: boolean,
): boolean {
  return acces === "TOUS" || staff;
}

/**
 * **Le filtre, appelé et jamais recopié.**
 *
 * Le dépôt s'en sert pour choisir les chapitres, puis ne demande les blocs
 * que de ceux-là : le contenu réservé ne quitte pas la base. Écrire la
 * condition dans un `where` la mettrait hors de portée des tests — c'est le
 * parti pris de `forum/depot.ts`, qui appelle `peutLireLeLieu`.
 */
export function chapitresLisibles<T extends { acces: AccesGrimoire }>(
  chapitres: readonly T[],
  staff: boolean,
): T[] {
  return chapitres.filter((c) => peutLireLeChapitre(c.acces, staff));
}
