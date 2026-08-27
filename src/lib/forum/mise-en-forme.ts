/**
 * **Ce qu'un joueur a le droit de faire à son texte.**
 *
 * Un seul fichier décrit la mise en forme : les outils proposés par la barre,
 * les classes qu'ils produisent, et — plus loin, dans `nettoyer-html.ts` — ce
 * que le serveur accepte de recevoir. Deux listes tenues à la main
 * finiraient par diverger, et le jour où elles divergent c'est soit un outil
 * qui ne marche plus, soit une balise qui passe sans avoir été voulue.
 *
 * **Ce fichier ne nettoie rien.** Il décrit. Le nettoyage vit à côté, il est
 * `server-only`, et c'est lui qui décide — jamais cette liste seule.
 *
 * ── La palette est restreinte, et ce n'est pas une commodité ──
 *
 * Sept couleurs. Un nuancier libre laisserait choisir un rouge sombre sur un
 * fond presque noir : le joueur ne s'en apercevrait qu'après publication, et
 * les autres ne pourraient tout simplement pas le lire.
 *
 * Les quatre couleurs de maison ici **ne sont pas** celles de
 * `tailwind.config.ts`. Ce sont leurs variantes lisibles — les valeurs
 * d'origine tombaient sous le seuil dès qu'on s'en servait comme texte
 * (Kaldrafn 4,35:1, Nattorm 4,17:1, pour 4,5 exigés). Les valeurs retenues
 * vivent dans `globals.css`, seule source, et `mise-en-forme.test.ts` relit
 * ce fichier pour refaire le calcul sur les quatre fonds du site.
 */

/** Ce qui se met en gras, en italique, en souligné, en barré. */
export const MARQUES = ["gras", "italique", "souligne", "barre"] as const;
export type Marque = (typeof MARQUES)[number];

/**
 * Les couleurs, par leur **clé**. La valeur n'est pas ici : elle est dans
 * `globals.css`, et la classe est le seul lien entre les deux. Le sélecteur
 * de la barre affiche une pastille portant la même classe — il n'a donc
 * jamais à connaître la couleur, et ne peut pas s'en écarter.
 */
export const COULEURS = [
  "kaldrafn",
  "nattorm",
  "bryggeld",
  "tideal",
  "parchemin",
  "parchemin-2",
  "argent",
] as const;
export type Couleur = (typeof COULEURS)[number];

/** Trois niveaux, jamais un curseur. « normal » ne pose aucune classe. */
export const TAILLES = ["normal", "grand", "petit"] as const;
export type Taille = (typeof TAILLES)[number];

export const ALIGNEMENTS = ["gauche", "centre", "droite", "justifie"] as const;
export type Alignement = (typeof ALIGNEMENTS)[number];

/**
 * **Trois largeurs, jamais un curseur.**
 *
 * Même raison que la palette : une image de trois mille pixels posée à sa
 * taille casse la mise en page de tout le monde sur téléphone, et son auteur
 * ne s'en aperçoit pas — il l'a vue sur son écran à lui.
 */
export const LARGEURS_IMAGE = ["petite", "moyenne", "pleine"] as const;
export type LargeurImage = (typeof LARGEURS_IMAGE)[number];

/** Le préfixe, pour qu'une classe de post ne croise jamais une classe du site. */
const P = "rs";

export const classeCouleur = (c: Couleur) => `${P}-c-${c}`;
export const classeTaille = (t: Exclude<Taille, "normal">) => `${P}-t-${t}`;
export const classeAlignement = (a: Alignement) => `${P}-a-${a}`;
export const classeLargeur = (l: LargeurImage) => `${P}-i-${l}`;

/**
 * Toutes les classes permises, déduites des listes ci-dessus.
 *
 * **Déduites, jamais recopiées** : c'est ce qui garantit qu'ajouter une
 * couleur à `COULEURS` la rend utilisable et acceptée du même geste — et
 * qu'aucune classe ne peut être acceptée sans figurer dans un des trois
 * ensembles. Même principe que `ENTREES_MENU`, déduit de `MENU`.
 */
export const CLASSES_DE_SPAN: readonly string[] = [
  ...COULEURS.map(classeCouleur),
  ...TAILLES.filter((t): t is Exclude<Taille, "normal"> => t !== "normal").map(
    classeTaille,
  ),
];

export const CLASSES_DE_BLOC: readonly string[] = ALIGNEMENTS.map(
  classeAlignement,
);

/** Les classes qu'une image a le droit de porter, et rien d'autre. */
export const CLASSES_D_IMAGE: readonly string[] =
  LARGEURS_IMAGE.map(classeLargeur);

/** La classe du conteneur, qui porte les styles. Hors d'elle, rien ne peint. */
export const CLASSE_CONTENEUR = "post-rendu";

/**
 * Les libellés de la barre. Chacun est un **nom d'action**, lisible par un
 * lecteur d'écran : « Mettre en gras », et non « B ».
 */
export const TEXTES_MISE_EN_FORME = {
  barre: "Mise en forme",

  marques: {
    gras: "Mettre en gras",
    italique: "Mettre en italique",
    souligne: "Souligner",
    barre: "Barrer",
  } satisfies Record<Marque, string>,

  tailles: {
    libelle: "Taille du texte",
    normal: "Taille normale",
    grand: "Grande taille",
    petit: "Petite taille",
  } satisfies Record<Taille, string> & { libelle: string },

  couleurs: {
    libelle: "Couleur du texte",
    kaldrafn: "Bleu nuit — Kaldrafn",
    nattorm: "Violet sombre — Nattorm",
    bryggeld: "Cuivre — Bryggeld",
    tideal: "Sarcelle — Tideål",
    parchemin: "Parchemin clair",
    "parchemin-2": "Parchemin vieilli",
    argent: "Argent",
    aucune: "Couleur par défaut",
  } satisfies Record<Couleur, string> & { libelle: string; aucune: string },

  alignements: {
    libelle: "Alignement",
    gauche: "Aligner à gauche",
    centre: "Centrer",
    droite: "Aligner à droite",
    justifie: "Justifier",
  } satisfies Record<Alignement, string> & { libelle: string },

  citation: "Mettre en citation",
  separateur: "Insérer un filet",

  image: {
    poser: "Insérer une image",
    adresse: "Adresse de l’image",
    /**
     * L'article 6.1 est une règle entre joueurs — le site ne peut pas la
     * vérifier. La rappeler au moment du geste est tout ce qu'il peut faire,
     * et c'est le bon moment.
     */
    aide: "Une adresse en https. L’image doit être libre de droits, créditée, ou de toi (article 6.1) — et elle reste chez son hébergeur : si celui-ci ferme, elle disparaît du post.",
    invalide: "Seules les adresses en https sont acceptées.",
    description: "Description de l’image",
    descriptionAide:
      "Pour qui ne la voit pas. Laisse vide si l’image n’est là que pour l’ambiance.",
    largeur: "Largeur de l’image",
    petite: "Image petite",
    moyenne: "Image moyenne",
    pleine: "Image pleine largeur",
    retirer: "Retirer l’image",
  },

  lien: {
    poser: "Insérer un lien",
    adresse: "Adresse du lien",
    aide: "Une adresse du site (/ecole/…) ou une adresse extérieure (https://…).",
    invalide: "Cette adresse n’est pas acceptée.",
    retirer: "Retirer le lien",
  },
} as const;
