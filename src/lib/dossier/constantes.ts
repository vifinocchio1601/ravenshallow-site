/**
 * Tous les textes du dossier d’admission : libellés, aides à la saisie,
 * messages d’erreur et listes de choix.
 *
 * Rien de tout cela ne doit être écrit en dur dans un composant — les
 * gabarits piochent ici. Apostrophes typographiques (’) partout.
 */

// ─────────────────────────────────────────────────────────────
//  Listes de choix — miroir exact des enums Prisma
// ─────────────────────────────────────────────────────────────

export const LIMITES_ECRITURE = [
  { valeur: "DEUIL", libelle: "Deuil" },
  { valeur: "MALTRAITANCE", libelle: "Maltraitance" },
  { valeur: "NOYADE", libelle: "Noyade" },
  { valeur: "ENFERMEMENT", libelle: "Enfermement" },
  { valeur: "EMPRISE_MENTALE", libelle: "Emprise mentale" },
  { valeur: "BLESSURES_DECRITES", libelle: "Blessures décrites" },
  { valeur: "HARCELEMENT", libelle: "Harcèlement" },
  { valeur: "ROMANCE", libelle: "Romance" },
] as const;

export const GENRES = [
  { valeur: "FEMININ", libelle: "Féminin" },
  { valeur: "MASCULIN", libelle: "Masculin" },
  { valeur: "AUTRE", libelle: "Autre" },
] as const;

export const FAMILLES = [
  {
    valeur: "SORCIERS",
    libelle: "Famille de sorciers",
    detail: "La magie depuis des générations",
  },
  {
    valeur: "MIXTE",
    libelle: "Famille mixte",
    detail: "Un parent sorcier, un parent non",
  },
  {
    valeur: "PREMIER_LIGNEE",
    libelle: "Premier de sa lignée",
    detail: "Personne avant lui, personne pour l’expliquer",
  },
] as const;

export const TYPES_PORTRAIT = [
  {
    valeur: "ACTEUR",
    libelle: "Photographie d’un acteur",
    detail: "Personne majeure, cohérente avec 13 ans",
  },
  {
    valeur: "IA_ILLUSTRATION",
    libelle: "Généré par IA ou illustration",
    detail: "Recommandé pour les 13-15 ans",
  },
] as const;

// ─────────────────────────────────────────────────────────────
//  Contraintes chiffrées
// ─────────────────────────────────────────────────────────────

export const AGE_MINIMUM_JOUEUR = 16;
export const BIOGRAPHIE_MINIMUM = 700;
export const MOT_DE_PASSE_MINIMUM = 8;
/** Âge de l’élève à l’entrée — art. 10.2, non modifiable côté joueur. */
export const AGE_ELEVE_ENTREE = 13;

/** Portrait : format unique du site, et taille de sortie du recadrage. */
export const PORTRAIT_RATIO = 9 / 16;
export const PORTRAIT_LARGEUR = 720;
export const PORTRAIT_HAUTEUR = 1280;
export const PORTRAIT_QUALITE = 0.82;
/** Poids maximal du fichier déposé, avant recadrage. */
export const PORTRAIT_POIDS_MAX = 12 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────
//  Textes de la page
// ─────────────────────────────────────────────────────────────

export const TEXTES = {
  page: {
    titre: "Dossier d’admission",
    titreAccent: "d’admission",
    chapeau:
      "Ce dossier sera lu par l’administration avant toute entrée au château. La baguette et le Miroir de Brume viendront après — ils ne se présentent qu’aux candidats admis.",
    reglementApprouve:
      "Règlement lu et approuvé le {date} — parties I et II. Toute évolution est affichée dans le Grand Hall et s’applique sept jours plus tard.",
    retour: "Retour au règlement",
  },

  parties: {
    postulant: { numero: "I", titre: "Le postulant", portee: "hors RP" },
    eleve: { numero: "II", titre: "L’élève", portee: "fiche RP" },
  },

  /** Garde-fou : on n’ouvre pas le dossier sans acceptation du règlement. */
  garde: {
    titre: "Le règlement d’abord",
    corps:
      "Le dossier ne s’ouvre qu’une fois le règlement lu et approuvé. Rien n’est perdu : reviens ici juste après.",
    action: "Lire le règlement",
  },

  champs: {
    email: {
      label: "Adresse e-mail",
      placeholder: "corbeau@exemple.fr",
      aide: "C’est ton identifiant de connexion. Une adresse, un élève.",
    },
    ageReel: {
      label: "Âge réel",
      placeholder: "16 minimum",
      aide: "Vérifié à l’inscription, jamais conservé : seule la mention « 16 ans ou plus » est enregistrée.",
    },
    motDePasse: {
      label: "Mot de passe",
      placeholder: "••••••••",
      regles: {
        longueur: "8 caractères",
        majuscule: "1 majuscule",
        chiffre: "1 chiffre",
      },
    },
    confirmation: { label: "Confirmation", placeholder: "••••••••" },
    limites: {
      label: "Limites d’écriture",
      aide: "Les thèmes que tu ne veux pas voir apparaître dans tes scènes. Opposables à tous, jamais à justifier.",
      autresPlaceholder: "Autres limites, en toutes lettres (facultatif)",
    },
    prenomNom: {
      label: "Prénom et nom",
      placeholder: "Elena Blackwood",
      aide: "Format imposé : Prénom Nom ou Prénom I. Nom.",
    },
    ageEleve: {
      label: "Âge",
      valeur: "13 ans",
      aide: "Première année. Tous les élèves franchissent le Miroir avec leur promotion.",
    },
    genre: {
      label: "Genre",
      vide: "—",
      aide: "Sert aux accords dans les textes du site.",
    },
    famille: { label: "Famille" },
    portrait: {
      label: "Portrait",
      acteurLabel: "Nom de l’acteur ou de l’actrice",
      acteurPlaceholder: "Vérifié dans le registre des visages",
      importLabel: "Importer le portrait au format 9:16",
      aide: "Format unique pour tout le château : 9:16, portrait vertical. Une image d’un autre format sera recadrée dans ce cadre avant l’envoi — ce que tu vois ici est ce que les autres joueurs verront de ton élève.",
      cadrer: "Cadrer l’image",
      zoom: "Zoom",
      valider: "Valider le cadrage",
      changer: "Changer d’image",
      deplacer:
        "Fais glisser l’image pour la cadrer, ou utilise les flèches du clavier.",
    },
    biographie: {
      label: "Biographie",
      aide: "D’où il vient, ce qu’il a laissé derrière lui, pourquoi la lettre de Ravenshallow n’a surpris personne — ou tout le monde. Pas d’anachronisme, pas de technologie moderne.",
      placeholder:
        "Le vent de la baie de Kaldvik sentait le sel et la tourbe le matin où…",
      minimum: "Minimum 700 signes",
    },
    qualites: {
      label: "Trois qualités",
      placeholders: ["1re", "2e", "3e"],
      aria: ["Première qualité", "Deuxième qualité", "Troisième qualité"],
    },
    defauts: {
      label: "Trois défauts",
      placeholders: ["1er", "2e", "3e"],
      aria: ["Premier défaut", "Deuxième défaut", "Troisième défaut"],
    },
    peur: {
      label: "Sa plus grande peur",
      placeholder: "Une seule, la vraie — celle qu’il ne nomme pas à voix haute",
    },
    certification104: {
      label:
        "Je certifie que mon élève ne relève d’aucun cas de l’article 10.4 : ni descendant ou héritier d’un fondateur, ni lié par le sang à Alaric Nattmor, ni créature ou hybride, ni déjà initié à la magie noire, ni doté de pouvoirs hors du système établi.",
    },
  },

  envoi: {
    bouton: "Envoi de mon dossier",
    enCours: "Envoi en cours…",
    complet: "Le dossier est complet.",
    resteListe: "Il reste : {champs}.",
    resteNombre: "Il reste {n} champs à compléter.",
  },

  fiche: {
    titre: "Ma fiche",
    chapeau:
      "Tu peux reprendre ta fiche à tout moment : un prénom mal orthographié, un portrait à remplacer, une biographie à compléter. Ton adresse et ton mot de passe, eux, ne se modifient pas ici.",
    enregistrer: "Enregistrer ma fiche",
    enregistrement: "Enregistrement…",
    enregistree: "Ta fiche est enregistrée.",
    incomplete: "Il reste des champs à compléter avant d’enregistrer.",
    lienInvalide: {
      titre: "Ce lien n’est plus valable",
      corps:
        "Il a peut-être expiré, ou été tronqué par ton client de messagerie. Écris-nous et nous t’en renverrons un.",
    },
    verrouillee: {
      titre: "Ta fiche n’est plus modifiable",
      corps:
        "Ce dossier n’est plus ouvert à la reprise. Si quelque chose doit être corrigé, écris à l’administration.",
    },
  },

  brouillon: {
    enregistre: "Brouillon enregistré",
    restaure: "Brouillon restauré — reprends où tu t’étais arrêté.",
    effacer: "Effacer le brouillon",
  },
} as const;

// ─────────────────────────────────────────────────────────────
//  Messages d’erreur
// ─────────────────────────────────────────────────────────────

export const MESSAGES = {
  email: "Adresse invalide",
  emailPris: "Cette adresse est déjà inscrite",
  ageReel: "Le site est réservé aux 16 ans et plus",
  motDePasse: "Le mot de passe ne respecte pas les trois règles",
  confirmation: "Les deux mots de passe diffèrent",
  prenomNom: "Format attendu : Elena Blackwood ou Elena V. Blackwood",
  genre: "Choisis un genre",
  famille: "Choisis une famille",
  portraitType: "Choisis un type de portrait",
  acteurRequis: "Indique le nom de l’acteur ou de l’actrice",
  acteurPris: "Ce visage est déjà porté par un autre élève",
  acteurLibre: "Visage disponible",
  acteurVerification: "Vérification…",
  acteurIndisponible:
    "Le registre des visages est momentanément injoignable — réessaie dans un instant",
  portraitRequis: "Le portrait est obligatoire",
  portraitFormat: "Ce fichier n’est pas une image",
  portraitPoids: "Image trop lourde — 12 Mo maximum",
  portraitPret: "Portrait recadré en 9:16",
  biographie: "La biographie doit faire au moins 700 signes",
  qualites: "Les trois qualités sont obligatoires",
  defauts: "Les trois défauts sont obligatoires",
  peur: "Ce champ est obligatoire",
  certification104: "La certification de l’article 10.4 est obligatoire",
  reglement: "Le règlement doit être approuvé avant l’envoi",
  envoiEchoue: "L’envoi a échoué. Réessaie dans un instant.",
  baseIndisponible:
    "La base n’est pas encore configurée : le dossier ne peut pas être enregistré.",
} as const;

/**
 * Nom court de chaque champ, tel qu’il apparaît dans la ligne « il reste… »
 * sous le bouton d’envoi.
 */
export const NOMS_COURTS: Record<string, string> = {
  email: "e-mail",
  ageReel: "âge réel",
  motDePasse: "mot de passe",
  confirmation: "confirmation",
  prenomNom: "nom de l’élève",
  genre: "genre",
  famille: "famille",
  portraitType: "type de portrait",
  acteurNom: "nom de l’acteur",
  portrait: "portrait",
  biographie: "biographie",
  qualites: "qualités",
  defauts: "défauts",
  plusGrandePeur: "peur",
  certification104: "certification 10.4",
};
