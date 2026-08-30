import { appelleCeQuiSuit, type TypeBloc } from "./blocs";

/**
 * **Comment on remplit une page de grimoire.**
 *
 * Le lecteur mesure les blocs dans le navigateur, puis appelle ceci. Le
 * calcul est **pur** : il reçoit des hauteurs et rend des pages, ne connaît
 * ni le DOM ni l'écran, et s'éprouve donc sur cent blocs sans rien afficher.
 * Même parti pris que le frein du salon et le plafond de la Tour.
 *
 * ── Deux règles, et elles ne sont pas décoratives ──
 *
 * • **Un bloc ne se coupe jamais.** On empile des blocs entiers : une fiche
 *   de sort partagée en deux se lirait formule d'un côté, effet de l'autre.
 * • **Un titre ne finit jamais une page.** Il annonce ce qu'on ne voit pas —
 *   c'est la ligne veuve que tous les typographes chassent. S'il tombe en
 *   dernier, il part avec ce qu'il annonce.
 *
 * ⚠️ **Un bloc plus haut qu'une page reste seul sur la sienne.** Le tableau
 * des vingt-quatre runes est dans ce cas : il défile alors à l'intérieur de
 * son cadre. C'est la limite connue de ce lecteur — la seule autre voie
 * serait de couper un tableau en tranches, ce qui demanderait au serveur de
 * le rendre par morceaux.
 */

export type BlocAPaginer = {
  /** Sa hauteur mesurée, en pixels, à la largeur d'une page. */
  hauteur: number;
  type: TypeBloc;
};

/**
 * Rend les pages, chacune étant la liste des index de ses blocs.
 *
 * `dispo` est la hauteur utile d'une page ; `ecart` l'espace entre deux
 * blocs — le même que la feuille de style, sans quoi la dernière ligne
 * déborderait une page sur deux.
 */
export function paginer(
  blocs: readonly BlocAPaginer[],
  dispo: number,
  ecart: number,
): number[][] {
  if (blocs.length === 0) return [];
  // Une page qui ne peut rien porter ferait une page par bloc à l'infini :
  // on rend alors tout d'un tenant plutôt qu'un lecteur inutilisable.
  if (dispo <= 0) return [blocs.map((_, i) => i)];

  const pages: number[][] = [];
  let courante: number[] = [];
  let hauteur = 0;

  for (const [i, bloc] of blocs.entries()) {
    const besoin = bloc.hauteur + (courante.length > 0 ? ecart : 0);

    if (courante.length > 0 && hauteur + besoin > dispo) {
      pages.push(courante);
      courante = [];
      hauteur = 0;
    }

    hauteur += bloc.hauteur + (courante.length > 0 ? ecart : 0);
    courante.push(i);
  }

  if (courante.length > 0) pages.push(courante);

  return sansTitreOrphelin(pages, blocs);
}

/**
 * Repousse un titre resté seul en bas de page vers ce qu'il annonce.
 *
 * On ne le fait pas quand il est **seul sur sa page** : il n'y aurait alors
 * rien pour le retenir, et on le repousserait indéfiniment.
 */
function sansTitreOrphelin(
  pages: number[][],
  blocs: readonly BlocAPaginer[],
): number[][] {
  for (let p = 0; p < pages.length - 1; p++) {
    const page = pages[p];
    if (page.length < 2) continue;

    const dernier = page[page.length - 1];
    if (!appelleCeQuiSuit(blocs[dernier].type)) continue;

    page.pop();
    pages[p + 1].unshift(dernier);
  }
  return pages;
}

/**
 * **La page où se trouve un bloc.** C'est ce qui permet de retrouver sa
 * place après un redimensionnement, un changement de taille de texte, ou de
 * suivre un lien qui vise une ancre précise.
 *
 * Rend 0 quand le bloc est introuvable : on ouvre au début plutôt que de ne
 * rien ouvrir.
 */
export function pageDuBloc(pages: readonly number[][], bloc: number): number {
  const trouvee = pages.findIndex((page) => page.includes(bloc));
  return trouvee === -1 ? 0 : trouvee;
}
