/**
 * Les blasons.
 *
 * Tant que le Miroir de Brume n’a pas parlé, l’élève porte celui de l’école :
 * une absence de maison ne doit jamais se voir comme un trou dans la page.
 */

export const BLASON_ECOLE = {
  src: "/crests/ravenshallow.png",
  largeur: 679,
  hauteur: 900,
  alt: "Blason de Ravenshallow",
} as const;

type Blason = { src: string; largeur: number; hauteur: number; alt: string };

const BLASONS_MAISON: Record<string, Blason> = {
  KALDRAFN: {
    src: "/crests/kaldrafn.png",
    largeur: 608,
    hauteur: 900,
    alt: "Blason de la maison Kaldrafn",
  },
  NATTORM: {
    src: "/crests/nattorm.png",
    largeur: 615,
    hauteur: 900,
    alt: "Blason de la maison Nattorm",
  },
  BRYGGELD: {
    src: "/crests/bryggeld.png",
    largeur: 608,
    hauteur: 900,
    alt: "Blason de la maison Bryggeld",
  },
  TIDEAL: {
    src: "/crests/tideal.png",
    largeur: 608,
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

/** Ce qu’on affiche à la place du nom de maison avant la répartition. */
export const REPARTITION_A_VENIR = "Répartition à venir";
