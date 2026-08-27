import reglages from "@/config/ecriture.json";

/**
 * **Ce qui fait dix lignes** — art. 12.2.
 *
 * Partagé **mot pour mot** entre le compteur du champ de saisie et la route
 * qui publie : deux comptages qui divergent, c’est un joueur qui voit « 10 »
 * à l’écran et se fait refuser son post. Même choix que `dossier/schema.ts`.
 *
 * ── Pourquoi le comptage n’est plus un comptage de lignes ──
 *
 * Il l’a été, et il se trompait **dans les deux sens**. Il découpait sur les
 * retours à la ligne et comptait celles qui portaient un signe :
 *
 *   - « a » suivi d’un retour, dix fois, faisait dix lignes et passait.
 *     L’unique post écrit sur le site en était un : **dix lignes au compteur,
 *     vingt-six caractères réels** ;
 *   - un beau post de deux mille signes écrit en **trois paragraphes** faisait
 *     trois lignes et se faisait refuser.
 *
 * Le second est le plus grave : la règle **punissait la prose** et récompensait
 * le retour chariot. On compte donc les caractères réels, et l’on continue de
 * les **afficher en lignes** — c’est le vocabulaire du règlement, et personne
 * ne compte en signes.
 *
 * ── Ce qui ne compte pas ──
 *
 * Le balisage de mise en forme, le hors-RP, et les blancs répétés. L’ordre des
 * passes est celui-là et il n’est pas indifférent : les balises d’abord, pour
 * que des marqueurs `[HRP]` séparés par du balisage se retrouvent ; les
 * entités ensuite, sans quoi « &amp;amp; » compterait cinq signes pour un.
 *
 * ⚠️ **Ce fichier ne protège de rien.** Retirer des balises pour compter n’est
 * pas nettoyer : le nettoyage se fait à l’enregistrement et à l’affichage, par
 * liste blanche, ailleurs. Ne jamais se servir de `texteQuiCompte` pour rendre
 * un texte sûr.
 */

/**
 * Le minimum du domaine (art. 12.2). Les autres espaces n’en ont aucun.
 *
 * **Il reste dans le code, à dessein** : c’est une règle du règlement écrite
 * par le joueur, pas un réglage. Seule sa *mesure* — combien de caractères
 * font une ligne — vit dans `config/ecriture.json`, parce qu’elle, il faudra
 * l’ajuster après avoir vu de vrais posts.
 */
export const LIGNES_MINIMUM_RP = 10;

/** Ce qu’une ligne vaut en caractères réels. Réglable sans toucher au code. */
export const CARACTERES_PAR_LIGNE = reglages.caracteresParLigne;

/**
 * Les blocs hors-RP, retirés avant comptage.
 *
 * Insensible à la casse, et tolérant à un bloc jamais refermé — quelqu’un qui
 * ouvre `[HRP]` en fin de post et oublie la fermeture ne doit pas voir tout
 * son RP disparaître du compte… mais ne doit pas non plus faire compter son
 * commentaire. On coupe donc à la fin.
 */
const BLOC_HRP = /\[hrp\][\s\S]*?(?:\[\/hrp\]|$)/gi;

export function sansHorsRP(corps: string): string {
  return corps.replace(BLOC_HRP, "");
}

/**
 * Les balises qui **séparent** deux morceaux de texte. Remplacées par un saut
 * de ligne, sinon « <p>mot</p><p>autre</p> » se lirait « motautre » et le
 * compte perdrait un signe à chaque paragraphe.
 */
const BALISES_DE_BLOC =
  /<\s*\/?\s*(?:p|div|br|li|ul|ol|blockquote|hr|h[1-6]|table|tr|td)\b[^>]*>/gi;

/** Tout le reste du balisage — gras, italique, lien : il ne sépare rien. */
const TOUTE_BALISE = /<[^>]*>/g;

/**
 * Les entités qu’un nettoyeur produit à partir de texte ordinaire.
 *
 * Sans ce décodage, cinq esperluettes tapées à la main deviendraient
 * « &amp;amp; » cinq fois, soit vingt-cinq signes comptés pour cinq écrits.
 * L’espace insécable revient à un vrai caractère blanc, que la passe suivante
 * ramène à un espace ordinaire.
 */
const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decoderEntites(texte: string): string {
  return texte.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|#39);/gi,
    (trouvee) => ENTITES[trouvee.toLowerCase()] ?? trouvee,
  );
}

/**
 * Le texte tel qu’il compte : sans balisage, sans hors-RP, blancs réduits.
 *
 * C’est la seule fonction qui décide de ce qui compte. Tout le reste — le
 * nombre, les lignes affichées, la barre — en découle.
 */
export function texteQuiCompte(corps: string): string {
  const sansBalises = corps
    .replace(BALISES_DE_BLOC, "\n")
    .replace(TOUTE_BALISE, "");

  return sansHorsRP(decoderEntites(sansBalises))
    .replace(/\s+/g, " ")
    .trim();
}

/** Combien de caractères réels le post porte. */
export function caracteresUtiles(corps: string): number {
  return texteQuiCompte(corps).length;
}

/** Le seuil, en caractères, pour un minimum exprimé en lignes. */
export function seuilEnCaracteres(lignesMinimum: number): number {
  return lignesMinimum * CARACTERES_PAR_LIGNE;
}

/**
 * Ce que le joueur lit — **des lignes, jamais des signes**.
 *
 * Arrondi vers le bas : à 799 caractères sur 800, on affiche « 9 lignes sur
 * 10 », et c’est honnête. Annoncer « 10 » à quelqu’un dont le post va être
 * refusé serait le pire des compteurs.
 */
export function lignesAffichees(corps: string): number {
  return Math.floor(caracteresUtiles(corps) / CARACTERES_PAR_LIGNE);
}

/**
 * Le minimum est-il atteint ? `null` = aucun minimum, et tout passe — sauf le
 * vide, que la base refuse de toute façon.
 *
 * La comparaison se fait **en caractères**, jamais sur les lignes affichées :
 * passer par l’arrondi ferait refuser un post à 800 signes pile un jour où
 * l’on changerait la largeur d’une ligne.
 */
export function respecteLeMinimum(
  corps: string,
  lignesMinimum: number | null,
): boolean {
  if (lignesMinimum === null) return texteQuiCompte(corps).length > 0;
  return caracteresUtiles(corps) >= seuilEnCaracteres(lignesMinimum);
}

/** Ce qu’il reste à écrire, en lignes. Zéro quand c’est bon. */
export function lignesManquantes(
  corps: string,
  lignesMinimum: number | null,
): number {
  if (lignesMinimum === null) return 0;
  if (respecteLeMinimum(corps, lignesMinimum)) return 0;
  const manque = seuilEnCaracteres(lignesMinimum) - caracteresUtiles(corps);
  // Arrondi vers le haut : s’il manque un seul signe, il reste une ligne à
  // écrire. Annoncer « 0 » à quelqu’un dont le post est encore refusé serait
  // le même mensonge que l’arrondi de l’affichage, dans l’autre sens.
  return Math.max(1, Math.ceil(manque / CARACTERES_PAR_LIGNE));
}

/**
 * L’avancement, entre 0 et 1, pour la barre.
 *
 * Calculé sur les caractères et non sur les lignes affichées : la barre
 * avance alors à chaque frappe, au lieu de sauter d’un dixième toutes les
 * quatre-vingts.
 */
export function proportion(corps: string, lignesMinimum: number | null): number {
  if (lignesMinimum === null) return 1;
  const seuil = seuilEnCaracteres(lignesMinimum);
  if (seuil <= 0) return 1;
  return Math.min(1, caracteresUtiles(corps) / seuil);
}
