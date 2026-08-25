import { z } from "zod";
import {
  AGE_MINIMUM_JOUEUR,
  BIOGRAPHIE_MINIMUM,
  FAMILLES,
  GENRES,
  LIMITES_ECRITURE,
  MESSAGES,
  MOT_DE_PASSE_MINIMUM,
  NOMS_COURTS,
  TYPES_PORTRAIT,
} from "./constantes";

/**
 * Schéma du dossier d’admission — **la** source de vérité.
 *
 * Le formulaire s’en sert pour la validation en direct et pour la ligne
 * « il reste… » ; la route d’envoi s’en sert pour revalider côté serveur.
 * Aucune règle ne doit être réécrite d’un côté ou de l’autre.
 */

/** Format imposé : « Prénom Nom » ou « Prénom I. Nom ». */
export const REGEX_PRENOM_NOM =
  /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-]{1,}(?: [A-ZÀ-ÖØ-Þ]\.)? [A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’\-]{1,}$/;

const valeurs = <T extends readonly { valeur: string }[]>(liste: T) =>
  liste.map((entree) => entree.valeur) as [string, ...string[]];

/** Les trois règles du mot de passe, testées une à une pour l’affichage. */
export const REGLES_MOT_DE_PASSE = {
  longueur: (v: string) => v.length >= MOT_DE_PASSE_MINIMUM,
  majuscule: (v: string) => /[A-ZÀ-ÖØ-Þ]/.test(v),
  chiffre: (v: string) => /\d/.test(v),
} as const;

export type RegleMotDePasse = keyof typeof REGLES_MOT_DE_PASSE;

const texteCourt = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(120, "120 caractères maximum");

/**
 * Partie II — la fiche RP. Isolée parce que c’est la seule partie que le
 * joueur peut reprendre après coup, depuis le lien reçu par courriel.
 */
const champsFiche = {
  prenomNom: z.string().trim().regex(REGEX_PRENOM_NOM, MESSAGES.prenomNom),

  genre: z.enum(valeurs(GENRES), { message: MESSAGES.genre }),
  famille: z.enum(valeurs(FAMILLES), { message: MESSAGES.famille }),

  portraitType: z.enum(valeurs(TYPES_PORTRAIT), {
    message: MESSAGES.portraitType,
  }),
  acteurNom: z.string().trim().max(120).optional().or(z.literal("")),

  /** Image déjà recadrée en 9:16 côté client, en data URL. */
  portrait: z.string().min(1, MESSAGES.portraitRequis),

  biographie: z
    .string()
    .trim()
    .min(BIOGRAPHIE_MINIMUM, MESSAGES.biographie)
    .max(20000, "20 000 caractères maximum"),

  qualites: z.tuple([
    texteCourt(MESSAGES.qualites),
    texteCourt(MESSAGES.qualites),
    texteCourt(MESSAGES.qualites),
  ]),
  defauts: z.tuple([
    texteCourt(MESSAGES.defauts),
    texteCourt(MESSAGES.defauts),
    texteCourt(MESSAGES.defauts),
  ]),

  plusGrandePeur: texteCourt(MESSAGES.peur),

  certification104: z.literal(true, { message: MESSAGES.certification104 }),

  /**
   * Art. 15.4 — les limites appartiennent au joueur et évoluent avec lui :
   * elles sont donc reprises depuis la fiche, pas figées au dépôt.
   */
  limitesEcriture: z.array(z.enum(valeurs(LIMITES_ECRITURE))).default([]),
  limitesAutres: z.string().trim().max(500).optional().or(z.literal("")),
};

/** Partie I — le postulant. Verrouillée une fois le dossier déposé. */
const champsPostulant = {
  email: z.string().trim().toLowerCase().email(MESSAGES.email),

  /**
   * Saisi et vérifié, jamais stocké : la route d’envoi n’en garde que
   * `majeur16`. Le champ existe donc dans le schéma, pas dans la base.
   */
  ageReel: z
    .number({ message: MESSAGES.ageReel })
    .int(MESSAGES.ageReel)
    .min(AGE_MINIMUM_JOUEUR, MESSAGES.ageReel)
    .max(120, MESSAGES.ageReel),

  motDePasse: z
    .string()
    .min(MOT_DE_PASSE_MINIMUM, MESSAGES.motDePasse)
    .regex(/[A-ZÀ-ÖØ-Þ]/, MESSAGES.motDePasse)
    .regex(/\d/, MESSAGES.motDePasse),

  confirmation: z.string().min(1, MESSAGES.confirmation),

  /** Horodatage local de l’acceptation, à titre indicatif. */
  reglementAccepteLe: z.string().datetime({ message: MESSAGES.reglement }),
};

/** Le nom d’acteur n’est exigé que pour un portrait photographique. */
const acteurExigeSiPhoto = (donnees: {
  portraitType: string;
  acteurNom?: string;
}) => donnees.portraitType !== "ACTEUR" || (donnees.acteurNom ?? "").trim().length > 0;

export const schemaFiche = z.object(champsFiche).refine(acteurExigeSiPhoto, {
  path: ["acteurNom"],
  message: MESSAGES.acteurRequis,
});

export const schemaDossier = z
  .object({ ...champsPostulant, ...champsFiche })
  .refine((d) => d.confirmation === d.motDePasse, {
    path: ["confirmation"],
    message: MESSAGES.confirmation,
  })
  .refine(acteurExigeSiPhoto, {
    path: ["acteurNom"],
    message: MESSAGES.acteurRequis,
  });

export type Fiche = z.infer<typeof schemaFiche>;

export type Dossier = z.infer<typeof schemaDossier>;

/**
 * Normalise un nom d’acteur pour le registre des visages :
 * minuscules, sans accent, sans ponctuation, espaces réduits.
 * Utilisée des deux côtés — c’est elle qui porte l’unicité en base.
 */
export function normaliserVisage(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Met les valeurs telles que les tient le formulaire (tout en chaînes) à la
 * forme attendue par le schéma. `ageReel` vide devient NaN plutôt que 0, pour
 * que le champ compte comme manquant et non comme « zéro an ».
 */
export function pourValidation<T extends { ageReel: string }>(
  valeurs: T,
  reglementAccepteLe: string | null,
) {
  return {
    ...valeurs,
    ageReel: valeurs.ageReel === "" ? Number.NaN : Number(valeurs.ageReel),
    reglementAccepteLe: reglementAccepteLe ?? "",
  };
}

/**
 * Liste des champs encore incomplets, en noms courts, pour la ligne vivante
 * sous le bouton d’envoi. Déduite du schéma : rien à tenir à jour en double.
 *
 * `visagePris` vient d’une vérification asynchrone contre la base, hors
 * schéma : on l’ajoute ici pour que le bouton en tienne compte lui aussi.
 */
export function champsManquants(
  valeurs: unknown,
  options: { visagePris?: boolean } = {},
): string[] {
  const resultat = schemaDossier.safeParse(valeurs);
  const manquants: string[] = [];

  const ajouter = (cle: string) => {
    const nom = NOMS_COURTS[cle];
    if (nom && !manquants.includes(nom)) manquants.push(nom);
  };

  if (!resultat.success) {
    for (const probleme of resultat.error.issues) {
      ajouter(String(probleme.path[0] ?? ""));
    }
  }

  // Zod n’exécute les `.refine()` de l’objet qu’une fois le reste valide :
  // sans ces deux contrôles, la confirmation et le nom d’acteur manqueraient
  // à l’appel tant qu’un autre champ est incomplet.
  const v = valeurs as Partial<Dossier>;
  if (!v.confirmation || v.confirmation !== v.motDePasse) {
    ajouter("confirmation");
  }
  if (v.portraitType === "ACTEUR" && !(v.acteurNom ?? "").trim()) {
    ajouter("acteurNom");
  }

  if (options.visagePris) ajouter("acteurNom");

  return manquants;
}
