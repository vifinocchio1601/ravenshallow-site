/**
 * **Les scènes simultanées — art. 17.3.**
 *
 * Trois, et cinq à partir de la troisième année.
 *
 * ── Ce compte n’oppose rien, et c’est une décision ──
 *
 * Le joueur a tranché le 26 août 2026 : la limite est **un principe de
 * confiance**, pas un verrou. « Si on voit qu’un tel ne finit jamais ses
 * scènes, il va avoir droit à une remontrance. » Aucune fonction d’ici ne
 * refuse donc quoi que ce soit, et il ne faut pas en écrire une.
 *
 * Le compte est **affiché** malgré tout : il dit au joueur où il en est, et
 * donne au modérateur le fait dont il a besoin le jour de la remontrance. Sans
 * lui, personne ne voit rien venir et la remontrance tombe de nulle part.
 *
 * ── Ce qui compte comme une scène ──
 *
 * Ce que le joueur a **réellement écrit** : les sujets non clos, dans un
 * espace qui compte les scènes, où il a publié au moins un post — celui qu’il
 * a ouvert compris. Figurer sur une liste sans jamais écrire n’a jamais été
 * participer à une scène.
 */

import { rangAnnee, type Fonction } from "@/lib/dossier/etats";

export const SCENES_AVANT_TROISIEME = 3;
export const SCENES_DES_TROISIEME = 5;

/** L’année à partir de laquelle le plafond passe à cinq. */
const TROISIEME = 3;

/** Le repère de ce membre, selon son année. Jamais une autorisation. */
export function reperDeScenes(fonction: Fonction): number {
  return rangAnnee(fonction) >= TROISIEME
    ? SCENES_DES_TROISIEME
    : SCENES_AVANT_TROISIEME;
}

/**
 * Le joueur est-il au-delà de son repère ?
 *
 * **À n’utiliser que pour afficher.** Rien dans le site ne doit refuser une
 * ouverture parce que cette fonction rend `true` — c’est une remarque, pas
 * une porte.
 */
export function auDelaDuRepere(fonction: Fonction, ouvertes: number): boolean {
  return ouvertes > reperDeScenes(fonction);
}
