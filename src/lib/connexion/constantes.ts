/**
 * Tous les textes de la connexion et de la réinitialisation.
 *
 * Rien n’est écrit en dur dans un composant. Apostrophes typographiques (’).
 */

export const TEXTES_CONNEXION = {
  page: {
    titre: "Accès au château",
    titreAccent: "au château",
    eyebrow: "Entrer",
    chapeau:
      "Les portes ne s’ouvrent qu’aux dossiers approuvés par l’administration. Si le tien est encore en lecture, tu le sauras en entrant.",
  },

  champs: {
    email: {
      label: "Adresse e-mail",
      placeholder: "corbeau@exemple.fr",
    },
    motDePasse: {
      label: "Mot de passe",
      placeholder: "••••••••",
      /** Court à l'écran, entier pour les lecteurs d'écran. */
      afficher: "Afficher",
      masquer: "Masquer",
      afficherComplet: "Afficher le mot de passe",
      masquerComplet: "Masquer le mot de passe",
    },
  },

  bouton: "Entrer",
  enCours: "Ouverture des portes…",

  oublie: "Mot de passe oublié ?",
  pasDeDossier: "Pas encore de dossier ?",
  faireDemande: "Faire ma demande d’admission",

  deconnexion: "Se déconnecter",
} as const;

export const MESSAGES_CONNEXION = {
  /**
   * Message unique, quelle que soit la cause : adresse inconnue, mot de passe
   * faux, ou trop de tentatives. Dire « cette adresse n’existe pas »
   * révélerait à un inconnu qui est inscrit sur le site.
   */
  echec: "Adresse ou mot de passe incorrect.",
  emailRequis: "Indique ton adresse e-mail",
  motDePasseRequis: "Indique ton mot de passe",
  indisponible: "La connexion est momentanément indisponible. Réessaie dans un instant.",
} as const;

export const TEXTES_OUBLI = {
  page: {
    eyebrow: "Corbeau",
    titre: "Mot de passe oublié",
    chapeau:
      "Indique l’adresse de ton dossier. Si elle nous est connue, un corbeau partira avec un lien pour choisir un nouveau mot de passe.",
  },
  champEmail: { label: "Adresse e-mail", placeholder: "corbeau@exemple.fr" },
  bouton: "Envoyer le corbeau",
  enCours: "Le corbeau s’envole…",

  /** Même réponse, adresse connue ou non — voir `MESSAGES_CONNEXION.echec`. */
  confirmation: {
    titre: "Le corbeau est parti",
    corps:
      "Si un dossier correspond à cette adresse, un corbeau est parti. Le lien qu’il porte reste valable une heure, et ne sert qu’une fois.",
    badge: "En chemin",
  },
  retour: "Retour à la connexion",
} as const;

export const TEXTES_REINITIALISATION = {
  page: {
    eyebrow: "Nouveau départ",
    titre: "Choisir un nouveau mot de passe",
    chapeau:
      "Ce lien ne servira qu’une fois. Une fois le mot de passe changé, toutes les sessions ouvertes seront fermées — y compris celles que tu n’aurais pas ouvertes.",
  },
  champs: {
    motDePasse: { label: "Nouveau mot de passe", placeholder: "••••••••" },
    confirmation: { label: "Confirmation", placeholder: "••••••••" },
  },
  bouton: "Enregistrer le nouveau mot de passe",
  enCours: "Enregistrement…",

  perime: {
    titre: "Ce lien n’est plus valable",
    corps:
      "Un lien de réinitialisation vit une heure et ne sert qu’une fois. Celui-ci a expiré, a déjà servi, ou a été remplacé par une demande plus récente.",
    badge: "Lien périmé",
    action: "Demander un nouveau lien",
  },

  reussite: {
    titre: "Ton mot de passe est changé",
    corps:
      "Toutes les sessions ouvertes ont été fermées. Tu peux entrer avec ton nouveau mot de passe.",
    badge: "C’est fait",
    action: "Aller à la connexion",
  },
} as const;
