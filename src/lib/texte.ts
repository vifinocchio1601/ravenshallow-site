/**
 * **Le ménage fait sur un texte libre écrit par un joueur**, avant tout examen.
 *
 * Partagé par les corbeaux et par les posts du forum : les deux acceptent du
 * texte brut, le rendent avec React — donc échappé d’office — et gardent les
 * retours à la ligne par `whitespace-pre-wrap`. Leur besoin est le même, et le
 * recopier des deux côtés était le meilleur moyen de les voir diverger.
 *
 * **Ce qu’on ne touche PAS mérite d’être dit** : ni les apostrophes droites,
 * ni la ponctuation, ni la casse. Le site écrit ses propres textes avec des
 * apostrophes typographiques ; il n’a pas à réécrire ceux d’un joueur. Un bout
 * de code collé, une citation, une orthographe personnelle doivent ressortir
 * tels qu’ils sont entrés.
 */

/**
 * Un caractère de contrôle, **sauf le saut de ligne et la tabulation**.
 *
 * Le saut de ligne est précisément ce qu’on veut garder. La tabulation reste
 * elle aussi — quelqu’un qui colle un bout de texte indenté doit le retrouver
 * indenté.
 *
 * Écrit en toutes lettres plutôt qu’en classe de caractères : une plage se lit
 * mal, et la variante qu’on écrit parfois à sa place contient de vrais
 * caractères de contrôle, invisibles dans un éditeur et perdus au premier
 * copier-coller.
 */
function estCaractereDeControle(signe: string): boolean {
  if (signe === "\n" || signe === "\t") return false;
  const code = signe.codePointAt(0) ?? 0;
  return code < 0x20 || code === 0x7f;
}

/**
 * Quatre passes, dans cet ordre :
 *   1. les fins de ligne de Windows deviennent des sauts simples
 *   2. les caractères de contrôle disparaissent, sauf ceux qui servent
 *   3. les espaces en fin de ligne s’en vont, invisibles et sans usage
 *   4. plus de deux sauts de ligne d’affilée se ramènent à deux : une ligne
 *      vide sépare deux paragraphes, quarante ne séparent rien et poussent
 *      simplement le reste hors de l’écran
 */
export function nettoyerTexteLibre(brut: string): string {
  const sansControle = [...brut.replace(/\r\n?/g, "\n")]
    .filter((signe) => !estCaractereDeControle(signe))
    .join("");

  return sansControle
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Le même ménage, **sur une seule ligne**.
 *
 * Pour ce qui s’affiche dans une liste — un titre de sujet, un avertissement
 * de contenu : un retour à la ligne y casserait l’alignement, et personne ne
 * verrait pourquoi.
 */
export function nettoyerUneLigne(brut: string): string {
  return nettoyerTexteLibre(brut).replace(/\s+/g, " ").trim();
}
