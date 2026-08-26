import type { EtatEtape } from "@/lib/dossier/etats";
import { aUneMaison, estConcerneParLeMiroir } from "@/lib/session/acces";

/**
 * Les blasons.
 *
 * Tant que le Miroir de Brume n’a pas parlé, l’élève porte celui de l’école :
 * une absence de maison ne doit jamais se voir comme un trou dans la page.
 */

export const BLASON_ECOLE = {
  src: "/crests/ravenshallow.webp",
  largeur: 679,
  hauteur: 900,
  alt: "Blason de Ravenshallow",
} as const;

/**
 * Les blasons sont en **WebP** : les PNG d’origine pesaient un mégaoctet
 * pièce, pour un écu de trente pixels dans le bandeau. Même image, −86 %.
 *
 * `largeur` et `hauteur` sont les dimensions **naturelles** du fichier, et ne
 * disent rien de la taille d’affichage : elles ne servent qu’à donner son
 * rapport à `next/image`. **Chaque usage doit donc déclarer son `sizes`** —
 * sans lui, le navigateur réclame la pleine largeur pour une vignette.
 */
type Blason = { src: string; largeur: number; hauteur: number; alt: string };

const BLASONS_MAISON: Record<string, Blason> = {
  KALDRAFN: {
    src: "/crests/kaldrafn.webp",
    largeur: 608,
    hauteur: 900,
    alt: "Blason de la maison Kaldrafn",
  },
  NATTORM: {
    src: "/crests/nattorm.webp",
    largeur: 615,
    hauteur: 900,
    alt: "Blason de la maison Nattorm",
  },
  BRYGGELD: {
    src: "/crests/bryggeld.webp",
    largeur: 625,
    hauteur: 900,
    alt: "Blason de la maison Bryggeld",
  },
  TIDEAL: {
    src: "/crests/tideal.webp",
    largeur: 641,
    hauteur: 900,
    alt: "Blason de la maison Tideål",
  },
};

export const NOMS_MAISON: Record<string, string> = {
  KALDRAFN: "Kaldrafn",
  NATTORM: "Nattorm",
  BRYGGELD: "Bryggeld",
  TIDEAL: "Tideål",
};

/** Le blason de la maison, ou celui de l’école tant qu’il n’y en a pas. */
export function blasonDe(maison: string | null | undefined): Blason {
  return (maison && BLASONS_MAISON[maison]) || BLASON_ECOLE;
}

/** Le strict nécessaire pour afficher une maison — pas la fiche entière. */
export type PourAfficherLaMaison = {
  maison: string | null;
  etatMaison: EtatEtape;
};

/** Ce qu’on affiche à la place du nom de maison avant la répartition. */
export const REPARTITION_A_VENIR = "Répartition à venir";

/**
 * La mention de maison, ou **rien du tout**.
 *
 * Trois réponses pour trois états, et la troisième est la raison d’être de
 * cette fonction : un compte que la répartition ne concerne pas n’affiche pas
 * « Répartition à venir », qui serait un mensonge, ni le nom d’une maison
 * qu’il garde pourtant en base. Il n’affiche rien, et porte le blason de
 * l’école — comme n’importe quel élève avant le Miroir.
 */
export function mentionMaison(compte: PourAfficherLaMaison): string | null {
  if (!estConcerneParLeMiroir(compte)) return null;
  if (!aUneMaison(compte) || !compte.maison) return REPARTITION_A_VENIR;
  return NOMS_MAISON[compte.maison] ?? compte.maison;
}

/** Le blason : celui de la maison seulement si elle s’affiche. */
export function blasonAffiche(compte: PourAfficherLaMaison): Blason {
  return blasonDe(aUneMaison(compte) ? compte.maison : null);
}
