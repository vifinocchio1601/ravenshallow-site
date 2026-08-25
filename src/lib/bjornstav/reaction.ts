import "server-only";
import {
  estCodeBois,
  estCodeCoeur,
  libelleBaguette,
  type CodeBois,
  type CodeCoeur,
} from "@/lib/ecole/baguette";
import {
  APRES_LA_REACTION,
  AVANT_LA_REACTION,
  MAIN_SELON_LE_BOIS,
  PIECE_SELON_LE_COEUR,
  SUITE_COEUR,
  VARIANTES,
  type Paragraphe,
} from "./constantes";

/**
 * Ce que la baguette répond, une fois prise en main.
 *
 * **L’assemblage se fait ici, côté serveur, et nulle part ailleurs.** Le
 * navigateur ne reçoit que le texte de sa propre baguette : les vingt-cinq
 * réactions ne sont jamais toutes présentes quelque part où on pourrait les
 * lire.
 *
 * Deux fragments, dans cet ordre, et l’ordre porte du sens :
 *
 *   1. **ce que la main sent** — dépend du bois seul
 *   2. **ce que la pièce voit** — dépend du cœur seul
 *
 * Sauf pour cinq mariages, qui remplacent le second fragment par une réaction
 * qui leur est propre. Le premier, lui, ne bouge jamais : ce que la main sent
 * reste ce que le bois fait sentir, quel que soit le cœur.
 *
 * Rien de tout cela n’a le moindre effet de jeu, et rien n’influence la
 * répartition. C’est une scène, pas une statistique.
 */

/** Le code reçu du navigateur n’est jamais cru sur parole. */
export type Assemblage =
  | { valide: true; bois: CodeBois; coeur: CodeCoeur }
  | { valide: false; raison: "bois-inconnu" | "coeur-inconnu" };

/**
 * Ces deux codes viennent-ils bien des listes ?
 *
 * Séparé du reste pour que la route puisse refuser **avant** d’écrire quoi
 * que ce soit en base : on ne pose pas une baguette pour découvrir ensuite
 * qu’on ne sait pas la raconter.
 */
export function verifierCodes(bois: unknown, coeur: unknown): Assemblage {
  if (!estCodeBois(bois)) return { valide: false, raison: "bois-inconnu" };
  if (!estCodeCoeur(coeur)) return { valide: false, raison: "coeur-inconnu" };
  return { valide: true, bois, coeur };
}

/**
 * Les deux fragments de la réaction, dans l’ordre.
 *
 * Le second est **remplacé**, jamais complété, quand le mariage a sa propre
 * réaction : sans quoi le joueur lirait deux fois ce que la pièce voit.
 */
export function assemblerReaction(
  bois: CodeBois,
  coeur: CodeCoeur,
): readonly Paragraphe[] {
  const variante = VARIANTES[`${bois}|${coeur}`];

  return [
    { ton: "recit", texte: MAIN_SELON_LE_BOIS[bois] },
    ...(variante ?? [{ ton: "recit", texte: PIECE_SELON_LE_COEUR[coeur] }]),
  ];
}

/** Ce mariage a-t-il sa propre réaction ? Cinq sur vingt-cinq. */
export function aUneVarianteAssociee(
  bois: CodeBois,
  coeur: CodeCoeur,
): boolean {
  return VARIANTES[`${bois}|${coeur}`] !== undefined;
}

/**
 * Tout ce qui se passe après le choix du cœur, prêt à partir.
 *
 * La photographie de l’échoppe se glisse entre les deux moitiés : elle
 * paraît à l’instant où le joueur prend la baguette, juste avant qu’elle ne
 * réponde. D’où cette coupure, qui est une coupure de mise en scène et non
 * de logique.
 */
export type Denouement = {
  /** La parole du fabricant, la fabrication, la prise en main. */
  avantPhoto: readonly Paragraphe[];
  /** La réaction, puis la sortie de l’échoppe. */
  apresPhoto: readonly Paragraphe[];
  /** « Frêne, cœur de plume de corbeau ». */
  libelle: string;
};

export function assemblerDenouement(
  bois: CodeBois,
  coeur: CodeCoeur,
): Denouement {
  return {
    avantPhoto: [...SUITE_COEUR[coeur], ...AVANT_LA_REACTION],
    apresPhoto: [...assemblerReaction(bois, coeur), ...APRES_LA_REACTION],
    // `libelleBaguette` ne rend `null` que si les deux codes sont vides ;
    // ils sont vérifiés ici, donc jamais.
    libelle: libelleBaguette(bois, coeur) ?? "",
  };
}
