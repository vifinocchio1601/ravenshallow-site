/**
 * **Les bannières du site, et le code qu'un partenaire colle chez lui.**
 *
 * Trois formats, ceux que la bible retient (§15) parce que ce sont ceux que
 * la communauté RP francophone demande :
 *
 *   200 × 320  le standard, celui de presque toutes les demandes
 *   468 ×  60  le bandeau horizontal, en tête ou en pied de page
 *    88 ×  31  le micro-bouton des blocs de liens
 *
 * ⚠️ **Aucun import ici**, comme `corbeaux/constantes.ts` et
 * `calendrier/natures.ts` : ce fichier est lu par la page publique, par les
 * textes et par le composant qui propose la copie. Un cycle se formerait vite.
 *
 * Les images sont fabriquées par `scripts/fabriquer-bannieres.mjs`, à partir
 * du blason et des polices du site. Elles sont en **PNG** et non en WebP : ces
 * images-là s'affichent chez le partenaire, dans un bloc de liens tenu par un
 * forum qui a parfois quinze ans.
 */

/**
 * **L'adresse publique du site**, écrite en toutes lettres et absolue.
 *
 * Une bannière collée chez un partenaire ne peut pas porter d'adresse
 * relative : elle est lue depuis un autre domaine. C'est le seul endroit du
 * site qui ait besoin de connaître son propre nom de domaine — les courriels
 * le déduisent de leur environnement, ce qu'un code à copier ne peut pas
 * faire.
 */
export const ADRESSE_DU_SITE = "https://ravenshallow.com";

/** Ce qu'un lecteur d'écran entend à la place de la bannière, chez eux. */
export const TEXTE_ALTERNATIF =
  "Ravenshallow — école de magie sur la côte nordique";

export type Banniere = {
  /** Sert de clé de liste et de fragment d'identifiant. */
  cle: string;
  /** Comment on l'appelle à l'écran. */
  nom: string;
  /** À quoi elle sert — la phrase qui évite d'avoir à essayer les trois. */
  usage: string;
  largeur: number;
  hauteur: number;
  /** Chemin depuis la racine du site, sans le domaine. */
  fichier: string;
};

export const BANNIERES: Banniere[] = [
  {
    cle: "grande",
    nom: "200 × 320",
    usage: "Le format le plus demandé : celui des blocs de partenaires.",
    largeur: 200,
    hauteur: 320,
    fichier: "/bannieres/ravenshallow-200x320.png",
  },
  {
    cle: "bandeau",
    nom: "468 × 60",
    usage: "Le bandeau horizontal, en tête ou en pied de page.",
    largeur: 468,
    hauteur: 60,
    fichier: "/bannieres/ravenshallow-468x60.png",
  },
  {
    cle: "bouton",
    nom: "88 × 31",
    usage: "Le micro-bouton, pour les listes de liens serrées.",
    largeur: 88,
    hauteur: 31,
    fichier: "/bannieres/ravenshallow-88x31.png",
  },
];

/** L'adresse complète d'une bannière — celle qu'on colle, jamais la relative. */
export function adresseBanniere(banniere: Banniere): string {
  return `${ADRESSE_DU_SITE}${banniere.fichier}`;
}

/**
 * Le code HTML, pour un forum qui accepte le balisage.
 *
 * `width` et `height` y figurent : sans eux, la page du partenaire saute au
 * chargement de l'image, et c'est chez lui que ça se voit.
 */
export function codeHtml(banniere: Banniere): string {
  return [
    `<a href="${ADRESSE_DU_SITE}" target="_blank" rel="noopener">`,
    `<img src="${adresseBanniere(banniere)}" alt="${TEXTE_ALTERNATIF}"`,
    ` width="${banniere.largeur}" height="${banniere.hauteur}"></a>`,
  ].join("");
}

/**
 * Le même, en BBCode.
 *
 * **Les deux sont nécessaires**, et ce n'est pas une commodité : la moitié des
 * forums RP francophones tournent sous phpBB ou Forumactif, où le HTML est
 * refusé. Donner un seul des deux, c'est renvoyer une demande sur deux vers
 * un code qui ne marchera pas chez elle.
 */
export function codeBBCode(banniere: Banniere): string {
  return `[url=${ADRESSE_DU_SITE}][img]${adresseBanniere(banniere)}[/img][/url]`;
}
