/**
 * Tout ce que La Veille dit, et tout ce qu'elle regarde.
 *
 * Un seul fichier, **et aucun import** : c'est ce qui permet aux collecteurs,
 * au rapport et au courriel d'y puiser sans qu'un cycle se forme. Même procédé
 * que `corbeaux/constantes.ts` et `calendrier/natures.ts`.
 */

// ─────────────────────────────────────────────────────────────
//  Les durées qui viennent du RÈGLEMENT
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **Celles-ci ne sont pas des réglages, et ne doivent jamais descendre
 * dans `config/veille.json`.** Ce sont des règles écrites par le joueur, avec
 * le numéro de leur article. Un rapport qui appliquerait deux mois là où le
 * règlement en dit un serait faux sans que rien ne le signale — et c'est le
 * genre de faux qu'on ne remarque qu'après avoir décidé quelque chose dessus.
 */
export const REGLEMENT = {
  /** Art. 7.2 — un mois sans activité, sans absence signalée : inactif. */
  inactiviteJours: 30,
  /** Art. 7.3 — trois mois : le compte peut être archivé. */
  archivageJours: 90,
  /** Art. 17.2 — une scène sans réponse depuis un mois peut être clôturée. */
  sceneMuetteJours: 30,
  /** Art. 19.3 — sept jours pour corriger un post masqué. */
  correctionJours: 7,
} as const;

// ─────────────────────────────────────────────────────────────
//  Les pages que la ronde ouvre
// ─────────────────────────────────────────────────────────────

export type PageSurveillee = {
  chemin: string;
  /** Ce qu'on en dit dans le rapport. */
  nom: string;
  /**
   * Faut-il être connecté ?
   *
   * ⚠️ **Une page fermée doit répondre 307 sans session**, et c'est une
   * vérification à part entière : le jour où `/bureau` répondrait 200 à un
   * inconnu, ce serait la plus grave des anomalies possibles.
   */
  connecte: boolean;
  /**
   * Cette page dépend-elle de l'état du compte, et non du seul fait d'être
   * connecté ?
   *
   * ⚠️ **Sans ce drapeau, La Veille criait à la panne sur une page qui se
   * refermait légitimement.** `/maison` est gardée par `exigeUneMaison` : le
   * jour où le compte de service est passé en « sans objet » — comme une
   * directrice, ce qu'il est au fond —, elle a répondu 307, et la ronde a
   * annoncé deux PANNES qui n'en étaient pas.
   *
   * Un faux positif quotidien est pire qu'une surveillance absente : au bout
   * d'une semaine on ne lit plus le rapport. Ces pages-là sont donc vérifiées
   * quand le compte peut les ouvrir, et **déclarées non vérifiées** sinon.
   */
  exigeUneMaison?: true;
};

/**
 * ⚠️ **Les adresses vivent ici, pas dans le JSON.** Ce ne sont pas des
 * mesures : chacune correspond à une route du site, et en ajouter une est une
 * décision, pas un réglage. Les chemins à paramètre — une scène, un chapitre —
 * sont résolus par le collecteur, qui va chercher en base une vraie scène
 * plutôt que d'en coder une en dur qui disparaîtrait un jour.
 */
export const PAGES_PUBLIQUES: readonly PageSurveillee[] = [
  { chemin: "/", nom: "L’accueil", connecte: false },
  { chemin: "/reglement", nom: "Le règlement", connecte: false },
  { chemin: "/connexion", nom: "La connexion", connecte: false },
  { chemin: "/inscription", nom: "L’inscription", connecte: false },
  { chemin: "/partenariat", nom: "Le partenariat", connecte: false },
  { chemin: "/mentions-legales", nom: "Les mentions légales", connecte: false },
  { chemin: "/confidentialite", nom: "La confidentialité", connecte: false },
];

export const PAGES_FERMEES: readonly PageSurveillee[] = [
  { chemin: "/bureau", nom: "Mon bureau", connecte: true },
  { chemin: "/ecole", nom: "L’école", connecte: true },
  { chemin: "/alentours", nom: "Les alentours", connecte: true },
  { chemin: "/corbeaux", nom: "La Tour aux Corbeaux", connecte: true },
  { chemin: "/grimoires", nom: "Les Grimoires", connecte: true },
  { chemin: "/registre", nom: "Le Registre", connecte: true },
  { chemin: "/annonces", nom: "Le Grand Hall", connecte: true },
  { chemin: "/calendrier", nom: "Le calendrier", connecte: true },
  { chemin: "/resultats", nom: "Les résultats", connecte: true },
  { chemin: "/cours", nom: "Les cours", connecte: true },
  { chemin: "/maison", nom: "Ma maison", connecte: true, exigeUneMaison: true },
  {
    chemin: "/maison/salon",
    nom: "Le salon",
    connecte: true,
    exigeUneMaison: true,
  },
];

// ─────────────────────────────────────────────────────────────
//  Les textes du rapport
// ─────────────────────────────────────────────────────────────

export const TEXTES = {
  /** Le nom qui signe le courriel. */
  signature: "La Veille de Ravenshallow",

  objet: {
    prefixe: "Ravenshallow",
    toutVaBien: "tout va bien",
    /** L'objet d'un échec de la ronde elle-même. */
    ronde: "la ronde est tombée",
  },

  sections: {
    anomalies: "CE QUI NE VA PAS",
    attente: "CE QUI T’ATTEND",
    vie: "LA VIE DU SITE",
    suggestions: "SUGGESTIONS",
    manquant: "CE QUE LA RONDE N’A PAS PU VOIR",
  },

  gravites: {
    PANNE: "Panne",
    DEGAT: "Dégât silencieux",
    A_SURVEILLER: "À surveiller",
  },

  /** Ce qu'on écrit quand une famille de contrôles est tombée. */
  collecteurTombe:
    "Ce contrôle n’a pas abouti. Les autres ont continué : le reste du " +
    "rapport est complet, celui-ci manque.",

  /**
   * ⚠️ **La section des suggestions dit ce qu'elle est.** Elles sont écrites
   * par un modèle de langage à partir des seuls constats de ce rapport ; il
   * n'a vu ni la base, ni un message, ni un nom. Les mêler aux faits observés
   * ferait lire une hypothèse comme une mesure.
   */
  avertissementSuggestions:
    "Écrites par un modèle de langage, à partir des seuls chiffres ci-dessus. " +
    "Ce ne sont pas des observations, et rien n’a été exécuté.",

  suggestionsAbsentes:
    "La synthèse n’a pas pu être écrite ce matin. Le reste du rapport est " +
    "complet : cette section est un confort, pas une condition.",

  /** Ce qui est rappelé en pied de chaque rapport. */
  pied:
    "La Veille lit, elle n’écrit jamais. Ses identifiants de base n’ont que " +
    "le droit de lire, et son compte n’a aucune permission.",

  /**
   * Ce qu'on écrit quand du contenu de membre porte ce qui ressemble à une
   * consigne. **On ne recopie jamais le texte lui-même** : il est signalé par
   * son emplacement, et il se lit sur le site.
   */
  consigneApparente:
    "Un texte écrit par un membre contient ce qui ressemble à une consigne " +
    "adressée à un automate. Il a été traité comme du texte, jamais exécuté. " +
    "À lire sur le site.",
} as const;

// ─────────────────────────────────────────────────────────────
//  Le nom des chiffres de vie
// ─────────────────────────────────────────────────────────────

/**
 * L'ordre est celui du rapport, et les clés servent aussi de nom en mémoire :
 * les renommer perdrait l'historique des sept jours. Ce n'est pas grave — le
 * chiffre repartirait sans comparaison pendant une semaine — mais autant le
 * savoir avant de le faire.
 */
export const CHIFFRES_DE_VIE = [
  { cle: "membresActifs", nom: "membres actifs" },
  { cle: "posts", nom: "posts publiés" },
  { cle: "scenesOuvertes", nom: "scènes ouvertes" },
  { cle: "scenesCloses", nom: "scènes closes" },
  { cle: "corbeaux", nom: "corbeaux envoyés" },
  { cle: "dossiers", nom: "nouveaux dossiers" },
  { cle: "points", nom: "points distribués" },
] as const;

export type CleDeVie = (typeof CHIFFRES_DE_VIE)[number]["cle"];
