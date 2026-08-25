/**
 * Contenu de l'univers de Ravenshallow.
 * Centralisé ici pour que les sections restent de simples gabarits.
 */

export type House = {
  slug: "kaldrafn" | "nattorm" | "bryggeld" | "tideal";
  name: string;
  totem: string;
  founder: string;
  description: string;
  /** Couleur de la maison (variable CSS). */
  color: string;
  crest: string;
  /** Dimensions naturelles du blason, pour next/image. */
  crestWidth: number;
  crestHeight: number;
  /** Rune associée, en écho aux cours de Runologie. */
  rune: string;
};

export const HOUSES: House[] = [
  {
    slug: "kaldrafn",
    name: "Kaldrafn",
    totem: "Le Corbeau",
    founder: "Sigrid Kaldenor",
    description:
      "Meneurs froids et disciplinés. On y valorise la vision à long terme et une loyauté qui se mérite avant de se donner.",
    color: "var(--kaldrafn)",
    crest: "/crests/kaldrafn.png",
    crestWidth: 608,
    crestHeight: 900,
    rune: "ᚲ",
  },
  {
    slug: "nattorm",
    name: "Nattorm",
    totem: "Le Serpent noir",
    founder: "Alaric Nattmor",
    description:
      "Une maison qui porte un nom qu'elle n'a pas choisi, et une réputation plus lourde que ses élèves ne le méritent.",
    color: "var(--nattorm)",
    crest: "/crests/nattorm.png",
    crestWidth: 615,
    crestHeight: 900,
    rune: "ᚾ",
  },
  {
    slug: "bryggeld",
    name: "Bryggeld",
    totem: "La Salamandre",
    founder: "Torvald Bryggen",
    description:
      "Pragmatiques et travailleurs. Ici, on préfère la débrouillardise à la théorie, et l'entraide à l'éclat individuel.",
    color: "var(--bryggeld)",
    crest: "/crests/bryggeld.png",
    crestWidth: 625,
    crestHeight: 900,
    rune: "ᛒ",
  },
  {
    slug: "tideal",
    name: "Tideål",
    totem: "L'Anguille",
    founder: "Einar Tidevann",
    description:
      "Intuitifs et vigilants, parfois hantés par des pressentiments qu'ils ne contrôlent pas. On y honore le courage de dire ce que l'on voit.",
    color: "var(--tideal)",
    crest: "/crests/tideal.png",
    crestWidth: 641,
    crestHeight: 900,
    rune: "ᛏ",
  },
];

export type Territory = {
  rune: string;
  name: string;
  description: string;
};

export const TERRITORIES: Territory[] = [
  {
    rune: "ᛚ",
    name: "La falaise & l'océan",
    description:
      "Embruns, vents battants et mer profonde en contrebas. Par nuit de tempête, on raconte que des marins noyés hantent encore les épaves, et qu'un chant venu des profondeurs attire les imprudents vers les récifs.",
  },
  {
    rune: "ᛚᚨ",
    name: "Le lac",
    description:
      "Plus intime, plus calme en apparence — un esprit des eaux y joue une musique qu'il vaut mieux ne pas suivre. Ni tout à fait hostile, ni tout à fait bienveillant : simplement gardien de ce qu'on ne voit pas.",
  },
  {
    rune: "ᚠ",
    name: "La forêt sombre",
    description:
      "Zone d'exploration et de couvre-feu. Les élèves qui s'y aventurent trop loin racontent avoir croisé un regard entre les arbres, ou une silhouette dont le dos n'a rien d'humain.",
  },
];

export type SiteLink = {
  href: string;
  label: string;
  /** Mis en avant dans la navigation (gras) — l'entrée « Inscription ». */
  emphasis?: boolean;
};

/**
 * Navigation principale. Les ancres sont absolues (`/#…`) pour rester
 * fonctionnelles depuis une autre route que l'accueil, comme /inscription.
 */
export const NAV_LINKS: SiteLink[] = [
  { href: "/#le-monde", label: "Le monde" },
  { href: "/#les-maisons", label: "Les maisons" },
  { href: "/#la-fondation", label: "La fondation" },
  { href: "/inscription", label: "Inscription", emphasis: true },
];

/** Le pied de page reste sur les ancres de l'accueil, dont « Rejoindre ». */
export const FOOTER_LINKS: SiteLink[] = [
  { href: "#le-monde", label: "Le monde" },
  { href: "#les-maisons", label: "Les maisons" },
  { href: "#la-fondation", label: "La fondation" },
  { href: "#rejoindre", label: "Rejoindre" },
];

/** Elder Futhark — « RAVENSHALLOW » translittéré, utilisé comme frise. */
export const RAVENSHALLOW_RUNES = "ᚱ ᚨ ᚡ ᛖ ᚾ ᛊ ᚺ ᚨ ᛚ ᛚ ᛟ ᚹ";

/**
 * Le serveur Discord — première porte du château.
 *
 * C'est là que se fait l'accueil tant que le forum n'est pas ouvert : on s'y
 * présente, on y pose ses questions, on y apprend l'ouverture des inscriptions.
 */
export const DISCORD = {
  url: "https://discord.gg/V6A7DDUSaQ",
  eyebrow: "Rejoindre",
  titre: "Nous rejoindre",
  bouton: "Rejoindre le Discord",
  corps:
    "Le château s'ouvre d'abord sur Discord : viens t'y présenter, poser tes questions et suivre l'ouverture des inscriptions.",
} as const;
