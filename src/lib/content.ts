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
    crest: "/crests/kaldrafn.webp",
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
    crest: "/crests/nattorm.webp",
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
    crest: "/crests/bryggeld.webp",
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
    crest: "/crests/tideal.webp",
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
];

/**
 * Les deux portes du château, à droite de la navigation.
 *
 * Elles se valent : on demande son admission, ou on entre parce qu'on l'a
 * déjà obtenue. Ni l'une ni l'autre n'est secondaire, et elles restent
 * visibles sur téléphone quand les ancres, elles, se replient.
 */
export const PORTES: SiteLink[] = [
  { href: "/inscription", label: "Inscription", emphasis: true },
  { href: "/connexion", label: "Accès au château", emphasis: true },
];

/** Ce que voit un visiteur déjà connecté, à la place des deux portes. */
export const PORTE_CONNECTE = { label: "Entrer au château" } as const;

/**
 * La navigation du pied de page : les ancres de l'accueil, puis le
 * partenariat, qui est une vraie route.
 *
 * ⚠️ **Les ancres sont ABSOLUES** (`/#…`), comme celles de `NAV_LINKS` et pour
 * la même raison : le pied de page ne vit plus seulement sur l'accueil depuis
 * la page de partenariat. Une ancre relative y renverrait vers
 * `/partenariat#le-monde`, qui ne mène nulle part — et rien ne le signalerait,
 * puisqu'un lien vers une ancre absente ne fait tout simplement rien.
 */
export const FOOTER_LINKS: SiteLink[] = [
  { href: "/#le-monde", label: "Le monde" },
  { href: "/#les-maisons", label: "Les maisons" },
  { href: "/#la-fondation", label: "La fondation" },
  { href: "/#rejoindre", label: "Rejoindre" },
  { href: "/partenariat", label: "Partenariat" },
];

/**
 * Les deux pages que la loi réclame. Séparées de `FOOTER_LINKS`, qui ne porte
 * que des ancres de l'accueil : celles-ci sont de vraies adresses, et se
 * rangent sur leur propre ligne, sous la frise.
 */
export const LIENS_LEGAUX: SiteLink[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Données personnelles" },
  { href: "/reglement", label: "Règlement" },
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

/**
 * Les deux pages qu’on ne cherche jamais à voir.
 *
 * Sans elles, Next sert les siennes : un fond blanc, « This page could not be
 * found », en anglais. Un joueur qui tombe dessus ne conclut pas qu’il s’est
 * trompé d’adresse — il conclut que le château est cassé.
 *
 * Elles restent volontairement **hors du bandeau et hors de la navigation** :
 * elles répondent aussi bien pour une adresse du site vitrine que pour une
 * salle de l’école qui n’existe pas, et un menu emprunté à l’un serait faux
 * dans l’autre.
 */
export const PAGE_INTROUVABLE = {
  rune: "ᛒ",
  eyebrow: "Adresse introuvable",
  titre: "Ce couloir ne mène nulle part",
  corps:
    "Le château garde quelques passages murés, et tu viens d’en pousser un. L’adresse que tu as suivie ne correspond à aucune salle — un lien vieilli, une lettre de travers, ou une porte qui n’a jamais été percée.",
  accueil: "Revenir devant les grilles",
  chateau: "Accès au château",
} as const;

/**
 * L’incident. Le texte ne promet rien qu’on ne puisse tenir : il invite à
 * réessayer, parce que la cause la plus fréquente — une base endormie qui se
 * réveille — se résout d’elle-même à la seconde tentative.
 */
export const PAGE_ERREUR = {
  rune: "ᚺ",
  eyebrow: "Incident",
  titre: "La brume s’est levée d’un coup",
  corps:
    "Le château n’a pas pu répondre. C’est le plus souvent passager : reprends la même porte dans un instant, elle s’ouvrira. Si elle résiste encore, préviens l’administration — ce n’est pas de ton fait.",
  reessayer: "Réessayer",
  accueil: "Revenir devant les grilles",
} as const;
