/**
 * **Ce qu'un bloc de grimoire porte.**
 *
 * Le contenu d'un volume est une suite de blocs, dans l'ordre — jamais un
 * pavé de HTML libre. C'est ce qui permet au lecteur de remplir ses pages en
 * mesurant, sans couper une fiche de sort en deux.
 *
 * ⚠️ **Aucun import**, à dessein : les constantes, le schéma, le dépôt et les
 * écrans y puisent sans qu'un cycle se forme. Même procédé que
 * `calendrier/natures.ts` et `corbeaux/constantes.ts`.
 *
 * La forme de `donnees` dépend du type, et `grimoires/schema.ts` est la seule
 * porte qui la vérifie : la base ne garantit qu'un objet.
 */

export type TypeBloc =
  /** Du balisage, nettoyé par la liste blanche du site — la seule. */
  | "PARAGRAPHE"
  /** Un titre dans le chapitre : « Quatrième année · 6 sorts ». */
  | "SOUS_TITRE"
  /** Le bloc riche : glyphes, formule, matière, année, effet, limite. */
  | "FICHE_SORT"
  /** L'un des quatre. Pas de rune, pas de formule : un verbe. */
  | "FICHE_INTERDITE"
  /** Les vingt-quatre runes : des en-têtes et des lignes. */
  | "TABLEAU"
  /** Un blanc qui sépare. Ne porte rien. */
  | "SEPARATEUR";

export const TYPES_BLOC: readonly TypeBloc[] = [
  "PARAGRAPHE",
  "SOUS_TITRE",
  "FICHE_SORT",
  "FICHE_INTERDITE",
  "TABLEAU",
  "SEPARATEUR",
];

export type DonneesParagraphe = {
  /** Du balisage déjà nettoyé. Jamais du texte brut d'un formulaire. */
  html: string;
};

export type DonneesSousTitre = {
  texte: string;
};

/**
 * Une fiche de sort.
 *
 * ⚠️ **`matiere` est l'identifiant du cursus** — `sortileges`, `duel`,
 * `runologie` —, jamais le libellé recopié : le nom s'affiche depuis
 * `cours/cursus.ts`, qui est la source. Deux orthographes finiraient par
 * diverger, et c'est la copie oubliée qu'un joueur lirait.
 *
 * ⚠️ **`annee` ne ferme rien.** Elle s'affiche, et une mention rappelle qu'un
 * sort ne se lance pas avant (art. 14.4) — décision du joueur, 30 août 2026 :
 * le règlement interdit de le lancer, pas d'en lire la fiche.
 */
export type DonneesFicheSort = {
  nom: string;
  /** Une rune pour un sort simple, deux pour un sort lié. */
  glyphes: readonly string[];
  formule: string;
  /** `true` pour un sort lié, `false` pour un sort simple. */
  lie: boolean;
  matiere: string;
  annee: number;
  effet: string;
  /** « Limite. … » — presque toujours présente, jamais obligatoire. */
  limite: string | null;
};

/**
 * L'un des quatre sortilèges interdits (art. 13.2 et 13.3).
 *
 * ⚠️ **Ne peut vivre que dans un chapitre `ADMINISTRATION`**, et c'est un
 * déclencheur de la base qui le tient — dans les deux sens. Ni glyphe ni
 * formule : ils ne se tracent pas, ils se nomment.
 */
export type DonneesFicheInterdite = {
  nom: string;
  /** « tuer », « lier », « faire répondre », « prendre ». */
  verbe: string;
  /**
   * Les rubriques du document, dans l'ordre et avec leur titre : « Ce qu'il
   * fait », « Le prix payé », « La trace visible », « Ce qu'un joueur peut en
   * faire ».
   *
   * ⚠️ **Pas un effet et une limite, comme un sort ordinaire.** Ces quatre
   * fiches-là sont écrites autrement, et les plier au gabarit des autres
   * perdrait ce qui les distingue — le prix payé n'est pas une limite.
   */
  rubriques: readonly { titre: string; texte: string }[];
};

export type DonneesTableau = {
  entetes: readonly string[];
  lignes: readonly (readonly string[])[];
};

export type DonneesSeparateur = Record<string, never>;

/** Un bloc, tel qu'il sort du dépôt et tel que l'écran le reçoit. */
export type Bloc = { id: string; ancre: string | null } & (
  | { type: "PARAGRAPHE"; donnees: DonneesParagraphe }
  | { type: "SOUS_TITRE"; donnees: DonneesSousTitre }
  | { type: "FICHE_SORT"; donnees: DonneesFicheSort }
  | { type: "FICHE_INTERDITE"; donnees: DonneesFicheInterdite }
  | { type: "TABLEAU"; donnees: DonneesTableau }
  | { type: "SEPARATEUR"; donnees: DonneesSeparateur }
);

/**
 * **Un bloc qu'on ne coupe jamais entre deux pages.**
 *
 * Une fiche partagée en deux est illisible : on lit la formule sans l'effet.
 * Un sous-titre suivi de rien est pire encore — c'est la ligne veuve que tous
 * les typographes chassent. La règle vit ici, avec les types, et non dans le
 * composant qui pagine : elle se teste.
 */
export function resteEntier(type: TypeBloc): boolean {
  return type === "FICHE_SORT" || type === "FICHE_INTERDITE";
}

/**
 * **Un bloc qui ne doit jamais finir une page.** Un titre en bas de page
 * annonce ce qu'on ne voit pas.
 */
export function appelleCeQuiSuit(type: TypeBloc): boolean {
  return type === "SOUS_TITRE";
}
