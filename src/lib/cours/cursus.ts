import { type Fonction, rangAnnee } from "@/lib/dossier/etats";

/**
 * **Le cursus des sept années** — écrit par le joueur, 28 août 2026.
 *
 * Source de vérité unique : les statuts de matière, les cycles et les règles
 * de passage. **Toute logique d’inscription aux cours lit ce fichier**, et
 * rien ne recopie une de ses valeurs ailleurs.
 *
 * Pas de `server-only` : il ne contient aucune donnée, seulement des règles,
 * et les deux côtés doivent les lire au mot près. Même choix que
 * `forum/lieux.ts` et `corbeaux/droits.ts`.
 *
 * ── Ce qu’il change dans le lore, et qui a été arbitré avant de l’écrire ──
 *
 * La bible (§9) listait huit matières. Celui-ci en porte **neuf** :
 *
 * • **Sortilèges** est neuf, et c’est la seule matière obligatoire des sept
 *   années. La bible faisait de la Runologie « la base de la magie courante
 *   enseignée avec la baguette » ; ce rôle-là lui revient désormais ;
 * • **la Clairvoyance passe de Sigrid à Einar** — décision du joueur, prise
 *   en connaissance de l’écart : ce sont les visions d’Einar qui ont guidé le
 *   rituel, et Tideål est la maison des pressentiments ;
 * • **les trois cycles** — le Seuil, la Marée, la Veille — n’étaient nulle
 *   part.
 *
 * ✅ **La bible a été corrigée le 28 août 2026**, à la demande du joueur : sa
 * §9 porte désormais les neuf matières, les trois cycles et les conditions de
 * passage chiffrées, et la ligne « Conditions de passage » a quitté ses points
 * ouverts (§16). Les deux documents disent la même chose.
 *
 * ── Les héritages, arbitrés le 30 août 2026 ──
 *
 * **Sigrid porte les Sortilèges, Einar la Runologie** — décision du joueur.
 * La bible donnait la Runologie à Sigrid et laissait les Sortilèges sans
 * héritage ; les deux documents ont été corrigés le même jour, la bible
 * comprise. Einar en porte donc deux — la Runologie et la Clairvoyance —,
 * comme Torvald porte l’herboristerie et l’alchimie.
 *
 * ⚠️ **Ce fichier reste la source.** La bible le raconte, le site l’applique :
 * une valeur qui changerait ici sans que la bible suive n’est pas une faute du
 * code, c'est un document à mettre à jour. L'inverse n'est pas vrai.
 */

/** L’année, telle que le cursus la compte. Voir `anneeDuCursus`. */
export type Annee = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Statut =
  /** Imposée, non désinscriptible. */
  | "OBLIGATOIRE"
  /** Au choix, cycle de la Marée. */
  | "OPTION"
  /** Au choix sur prérequis, cycle de la Veille. */
  | "HAUTE_ETUDE"
  /** Matière non enseignée cette année. */
  | null;

export type CycleId = "SEUIL" | "MAREE" | "VEILLE";

export interface Cycle {
  id: CycleId;
  nom: string;
  annees: Annee[];
  /** Nombre de matières non obligatoires que l’élève doit choisir, par année. */
  choixParAnnee: number;
}

export interface Matiere {
  id: string;
  nom: string;
  /** Fondateur dont la matière porte l’héritage, s’il y en a un. */
  heritage: string | null;
  /** Index 0 = 1re année, index 6 = 7e année. */
  statuts: [Statut, Statut, Statut, Statut, Statut, Statut, Statut];
  /** Ids de matières à avoir suivies avant. */
  prerequis: string[];
}

export const CYCLES: Cycle[] = [
  { id: "SEUIL", nom: "Le Seuil", annees: [1, 2, 3], choixParAnnee: 0 },
  { id: "MAREE", nom: "La Marée", annees: [4, 5], choixParAnnee: 3 },
  { id: "VEILLE", nom: "La Veille", annees: [6, 7], choixParAnnee: 4 },
];

export const MATIERES: Matiere[] = [
  {
    id: "sortileges",
    nom: "Sortilèges",
    heritage: "Sigrid Kaldenor",
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
    ],
    prerequis: [],
  },
  {
    id: "runologie",
    nom: "Runologie",
    heritage: "Einar Tidevann",
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "magie_defensive",
    nom: "Magie défensive",
    heritage: "Alaric Nattmor",
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "herboristerie",
    nom: "Herboristerie nordique",
    heritage: "Torvald Bryggen",
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "creatures",
    nom: "Créatures magiques",
    heritage: null,
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "histoire",
    nom: "Histoire de Ravenshallow",
    heritage: null,
    statuts: [
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "alchimie",
    nom: "Alchimie et potions",
    heritage: "Torvald Bryggen",
    statuts: [
      null,
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: ["herboristerie"],
  },
  {
    id: "clairvoyance",
    nom: "Clairvoyance et divination",
    heritage: "Einar Tidevann",
    statuts: [
      null,
      null,
      "OBLIGATOIRE",
      "OPTION",
      "OPTION",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: [],
  },
  {
    id: "duel",
    nom: "Duel",
    heritage: null,
    statuts: [
      null,
      null,
      null,
      "OBLIGATOIRE",
      "OBLIGATOIRE",
      "HAUTE_ETUDE",
      "HAUTE_ETUDE",
    ],
    prerequis: ["magie_defensive"],
  },
];

/**
 * Les règles de progression.
 *
 * **Le redoublant conserve leçons et contrôles acquis** : seuls les examens
 * sont à repasser. C’est la lecture précise de l’article 18.5, qui disait
 * seulement « le personnage garde ses acquis ».
 *
 * ⚠️ **Rien de tout ceci n’est encore appliqué par le site** : les leçons,
 * les contrôles et les examens ne sont pas construits. Ces valeurs sont
 * posées d’avance, à un seul endroit, pour que le lot qui viendra les lise au
 * lieu de les redécider.
 */
export const REGLES = {
  ageEntree: 13,
  ageSortie: 19,
  /** Une matière ouvre son examen quand tous ses contrôles de leçon sont envoyés. */
  examenExigeTousLesControles: true,
  /** Délai avant l’ouverture de la leçon suivante, compté depuis l’ENVOI du contrôle. */
  delaiEntreLeconsJours: 7,
  /** Un seul envoi par contrôle. Réponses modifiables tant qu’il n’est pas envoyé. */
  controleEnvoiUnique: true,
  /** Note minimale par matière, en pourcentage. */
  seuilParMatiere: 50,
  /** Moyenne générale minimale, en pourcentage. */
  seuilMoyenneGenerale: 60,
  /**
   * Fin de la 3e année : examens portant sur les huit matières et les trois
   * années. **Huit et non neuf** : le Duel n’ouvre qu’en quatrième.
   */
  grandesEpreuves: { annee: 3 as Annee, porteeAnnees: [1, 2, 3] as Annee[] },
  /**
   * Un membre accepté trop tard pour boucler ses contrôles est rattaché à la
   * session suivante. Il n’est pas en échec et n’est pas redoublant.
   */
  rattachementSessionSuivante: true,
} as const;

// ─────────────────────────────────────────────────────────────
//  Lire le cursus
// ─────────────────────────────────────────────────────────────

/** Les sept années, dans l’ordre. Déduite plutôt que tenue à la main. */
export const ANNEES: Annee[] = [1, 2, 3, 4, 5, 6, 7];

/** Statut d’une matière pour une année donnée. */
export function statutDe(matiereId: string, annee: Annee): Statut {
  return MATIERES.find((m) => m.id === matiereId)?.statuts[annee - 1] ?? null;
}

/** Matières imposées d’une année. */
export function obligatoires(annee: Annee): Matiere[] {
  return MATIERES.filter((m) => m.statuts[annee - 1] === "OBLIGATOIRE");
}

/** Matières proposées au choix pour une année (OPTION ou HAUTE_ETUDE). */
export function auChoix(annee: Annee): Matiere[] {
  const s = (m: Matiere) => m.statuts[annee - 1];
  return MATIERES.filter((m) => s(m) === "OPTION" || s(m) === "HAUTE_ETUDE");
}

/**
 * Le cycle d’une année.
 *
 * Les trois cycles couvrent les sept années sans trou ni recouvrement — c’est
 * ce que `cursus.test.ts` vérifie. Le repli sur le premier n’arrive donc
 * jamais ; il existe pour qu’aucun appelant n’ait à traiter un `undefined`
 * qui ne se produira pas.
 */
export function cycleDe(annee: Annee): Cycle {
  return CYCLES.find((c) => c.annees.includes(annee)) ?? CYCLES[0]!;
}

/** Nombre total de cours suivis par un élève : 6, 7, 8, 6, 6, 5, 5. */
export function chargeDe(annee: Annee): number {
  return obligatoires(annee).length + cycleDe(annee).choixParAnnee;
}

/** Une matière par son identifiant. */
export function matiereDe(id: string): Matiere | null {
  return MATIERES.find((m) => m.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────
//  Le pont avec l’année du compte
// ─────────────────────────────────────────────────────────────

/**
 * **L’année du cursus, depuis la fonction du compte.**
 *
 * `Fonction` est un enum de base — `PREMIERE_ANNEE`… —, le cursus compte en
 * nombres. Le pont passe par `rangAnnee`, **seul endroit du site qui connaisse
 * l’ordre des sept années** : une seconde table de correspondance finirait par
 * décaler d’un cran le jour où l’on toucherait à l’enum.
 */
export function anneeDuCursus(fonction: Fonction): Annee {
  return rangAnnee(fonction) as Annee;
}

/** Ce que cette adresse porte est-il une année du cursus ? */
export function estUneAnnee(brut: unknown): brut is Annee {
  const n = typeof brut === "string" ? Number(brut) : brut;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7;
}

/**
 * **Peut-il ouvrir les cours de cette année ?** — art. 14.4.
 *
 * « Les sorts, les zones du château et les matières accessibles à un
 * personnage sont ceux de son année en cours, et se débloquent au passage à
 * l’année suivante. » On lit donc **jusqu’à la sienne**, jamais au-delà : un
 * septième année revoit le programme de première, un première année n’a rien
 * à faire dans celui de septième.
 *
 * Le staff passe partout, comme sur le forum.
 *
 * ⚠️ **`staff` est un paramètre, jamais lu ici.** Cette fonction est pure :
 * elle ne connaît ni la base ni les pouvoirs, et se teste sur deux valeurs.
 * Même parti pris que `peutLireLeLieu`.
 */
export function peutOuvrirLAnnee(
  fonction: Fonction,
  annee: Annee,
  staff: boolean,
): boolean {
  if (staff) return true;
  return annee <= anneeDuCursus(fonction);
}
