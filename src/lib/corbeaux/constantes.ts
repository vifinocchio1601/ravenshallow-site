/**
 * Tous les textes de la Tour aux Corbeaux. Rien en dur dans un composant.
 * Apostrophes typographiques (’).
 *
 * **La mise en scène tient tout entière dans le vocabulaire** : on envoie un
 * corbeau, on n’envoie pas un message. C’est la seule chose de RP ici — la
 * Tour est un outil de coordination entre joueurs, hors jeu. Aucune règle
 * d’écriture ne s’y applique : pas de minimum de lignes, pas d’avertissement
 * de contenu, pas de balise hors RP, et **aucun point ne s’y gagne**.
 */

/** L’entrée du bandeau est courte ; le titre de la page est complet. */
export const NOM_COURT = "Les Corbeaux";
export const NOM_LONG = "La Tour aux Corbeaux";

export const TEXTES_CORBEAUX = {
  /** Ce qu’annonce l’onglet du navigateur. */
  metaTitre: `${NOM_LONG} — Ravenshallow`,

  liste: {
    eyebrow: "Ravenshallow",
    titre: NOM_LONG,
    accueil:
      "De quoi s’écrire entre joueurs : caler une scène, s’accorder sur une intrigue, faire connaissance. Rien de ce qui s’écrit ici n’est du jeu.",
    /** Le libellé de la région, pour les lecteurs d’écran. */
    aria: "Vos conversations",
    vide: "Aucun corbeau à votre fenêtre.",
    videAide: "Personne ne vous a encore écrit, et vous n’avez écrit à personne.",
    nouveau: "Écrire à quelqu’un",
    /** Lu à voix haute avant le nom, quand le fil porte des non-lus. */
    nonLusAria: "{n} non lus",
    unNonLuAria: "1 non lu",
    /** L’aiguille du panneau « Mon courrier », au bureau. */
    versLaTour: "Ouvrir la Tour aux Corbeaux",
    /**
     * Un fil dont tous les corbeaux ont été retirés de ma vue. Il reste dans
     * la liste — l’autre garde les siens, et il peut réécrire à tout moment —
     * mais il n’a plus rien à montrer.
     */
    videExtrait: "Rien à lire pour l’instant.",
  },

  /**
   * Le fil de l’administration.
   *
   * Il n’a pas de correspondant : on n’écrit pas à quelqu’un, on écrit au
   * château. C’est aussi la voie de recours de l’article 8.5, et la seule qui
   * reste ouverte pendant une suspension.
   */
  administration: {
    nom: "L’Administration",
    aide: "Pour joindre l’équipe du site : une question, un souci, une décision à contester.",
    ouvrir: "Écrire à l’administration",
  },

  /** Ce que voit un membre dont l’accès est suspendu. */
  suspendu: {
    titre: "Votre accès est suspendu",
    corps:
      "Vos conversations vous attendent et ne s’affichent pas pour l’instant. Vous pouvez écrire à l’administration — c’est aussi par là que se conteste une décision, une fois, dans les quinze jours (article 8.5).",
  },

  fil: {
    /** La région annoncée, et le point où arrivent les nouveaux corbeaux. */
    aria: "Conversation avec {nom}",
    ariaNouveaux: "Nouveaux corbeaux",
    retour: "Retour aux conversations",
    /** Le bouton qui remonte dans le passé. */
    plusAncien: "Voir les corbeaux plus anciens",
    debut: "C’est le début de votre conversation.",
    /** Séparateur de journée dans le fil. */
    aujourdhui: "Aujourd’hui",
    hier: "Hier",
    /**
     * Le compte a été supprimé depuis. Son corbeau reste lisible chez celui
     * qui l’a reçu — personne n’efface ce qu’il a écrit chez autrui, pas même
     * en s’en allant.
     */
    auteurDisparu: "Un membre qui n’est plus là",
  },

  ecrire: {
    libelle: "Votre corbeau",
    /** Jamais « Votre message » : le vocabulaire tient la scène. */
    invite: "Écrivez ici…",
    envoyer: "Envoyer un corbeau",
    envoiEnCours: "Le corbeau s’envole…",
    /** Le compteur n’apparaît qu’en approchant de la limite. */
    restants: "{n} signes restants",
    /**
     * Dit sous le champ, une fois pour toutes : ce n’est pas une scène.
     * Sans cette phrase, un joueur appliquerait par réflexe les règles
     * d’écriture du forum — dix lignes minimum, avertissements en tête.
     */
    horsJeu: "Hors jeu. Écrivez comme vous écrivez.",
  },

  /**
   * La phrase la plus importante de tout le lot.
   *
   * Supprimer ne retire un corbeau que de SA propre vue : la copie du
   * destinataire reste intacte. Personne ne peut effacer ce qu’il a écrit
   * chez autrui — c’est ce qui protège un membre harcelé dont l’agresseur
   * voudrait faire disparaître ses traces.
   *
   * Il faut le dire **au moment du geste**, et sans détour : quelqu’un qui
   * croit avoir effacé son message des deux côtés se trompe sur ce que le
   * site vient de faire.
   */
  supprimer: {
    action: "Retirer de ma vue",
    titre: "Retirer ce corbeau de votre vue ?",
    avertissement:
      "Il disparaîtra de chez vous, et de chez vous seulement. Votre correspondant gardera sa copie : personne ici ne peut effacer ce qu’il a écrit chez quelqu’un d’autre.",
    confirmer: "Retirer de ma vue",
    annuler: "Annuler",
    /** Le fil entier, même règle. */
    conversation: "Retirer cette conversation de ma vue",
    conversationAvertissement:
      "Elle disparaîtra de votre liste, et de la vôtre seulement. Votre correspondant garde la sienne, entière. Si un nouveau corbeau arrive, la conversation revient — vide de ce qui précède.",
  },

  nouveau: {
    titre: "Envoyer un corbeau",
    aide: "Cherchez un personnage par son nom.",
    champ: "Nom du personnage",
    invite: "Commencez à taper un nom…",
    /** Annoncé aux lecteurs d’écran pendant la frappe. */
    resultatsAria: "{n} personnages trouvés",
    unResultatAria: "1 personnage trouvé",
    aucun: "Personne de ce nom.",
    aucunAide: "Vérifiez l’orthographe — la recherche porte sur le nom du personnage.",
    tropCourt: "Encore une lettre ou deux.",
    /** Quand un fil existe déjà : on n’en ouvre pas un second, on le rejoint. */
    dejaOuverte: "Conversation ouverte",
    /** Revenir sur son choix de destinataire, avant d’avoir écrit. */
    changer: "Changer",
  },

  /**
   * Le signalement.
   *
   * **En un clic, avec un motif facultatif** : quelqu’un qui subit des
   * messages pénibles ne doit pas avoir à rédiger un dossier pour être
   * entendu. Le motif aide la modération quand il est là ; son absence ne
   * disqualifie rien.
   */
  signaler: {
    action: "Signaler",
    actionAria: "Signaler ce corbeau",
    titre: "Signaler ce corbeau ?",
    /** Dit avant d’envoyer : ce que la modération verra, et rien de plus. */
    cequeVoitLaModeration:
      "La modération recevra ce corbeau et une dizaine autour, pour comprendre l’échange. Elle ne verra ni le reste de la conversation, ni votre boîte.",
    confidentiel:
      "Les signalements sont confidentiels : la personne signalée ne saura pas qui l’a signalée (article 8.6).",
    /** Les deux gestes restent distincts, et le dialogue le redit. */
    etBloquer:
      "Signaler ne bloque personne. Si vous ne voulez plus rien recevoir de cette personne, bloquez-la : c’est un geste séparé.",
    motif: "Motif (facultatif)",
    motifAide: "Quelques mots suffisent.",
    motifInvite: "Ce qui vous a gêné…",
    confirmer: "Signaler",
    annuler: "Annuler",
    /** Après coup, sans détour et sans promesse de délai. */
    fait: "Signalement transmis à la modération.",
    /** On ne signale pas le staff au staff. */
    pasIci: "Ce fil est celui de l’administration : écrivez-lui directement.",
    echec: "Le signalement n’est pas parti. Réessayez dans un instant.",
  },

  /**
   * Le blocage.
   *
   * **Le texte de confirmation doit dire ce que le blocage fait ET ce qu’il ne
   * fait pas**, en particulier ceci : la personne bloquée n’en est pas
   * informée. Ce n’est pas un détail d’implémentation qu’on tairait — c’est la
   * mesure elle-même, et celui qui bloque doit savoir sur quoi il compte.
   * Quelqu’un qui croirait avoir « prévenu » l’autre se comporterait autrement.
   */
  bloquer: {
    action: "Bloquer",
    actionAria: "Bloquer {nom}",
    titre: "Bloquer {nom} ?",
    /**
     * **Tous les accords passent par « cette personne ».**
     *
     * Un personnage peut être de n’importe quel genre, et `Correspondant` ne
     * le porte pas — il n’a pas à le porter pour afficher un nom et un blason.
     * Écrire « elle ne pourra plus » en se référant au personnage serait faux
     * une fois sur deux ; s’y référer par « cette personne », féminin en
     * français, rend la phrase juste dans tous les cas sans rien demander de
     * plus au modèle.
     */
    consequences: [
      "Ses corbeaux ne vous arriveront plus.",
      "Cette personne ne pourra plus vous écrire, ni ouvrir de nouvelle conversation avec vous.",
      "Elle n’en sera pas informée : de son côté, ses envois paraîtront normaux.",
      "Ce qui a déjà été échangé reste visible pour vous deux, mais la conversation est close.",
      "Vous pouvez la débloquer à tout moment.",
    ],
    /** Rappelé sous la confirmation : les deux gestes sont distincts. */
    etSignaler:
      "Bloquer ne prévient pas la modération. Si ces messages posent problème, signalez-les : ce sont deux gestes séparés.",
    confirmer: "Bloquer",
    annuler: "Annuler",
  },

  bloques: {
    titre: "Personnes bloquées",
    aide: "Vous ne recevez plus rien de ces personnes, et elles ne le savent pas.",
    lien: "Personnes bloquées",
    vide: "Vous n’avez bloqué personne.",
    videAide: "Cette liste se remplit depuis une conversation.",
    /** « Blocage posé aujourd’hui », « … le 12 août ». Sans accord : le
     *  personnage peut être de n’importe quel genre. */
    depuis: "Blocage posé {quand}",
    debloquer: "Débloquer",
    debloquerAria: "Débloquer {nom}",
    /** Ce que débloquer ne fait PAS : ramener ce qui n’est jamais arrivé. */
    apresDeblocage:
      "Vous recevrez à nouveau les corbeaux de cette personne. Ceux qu’elle a envoyés pendant le blocage ne réapparaîtront pas.",
  },

  /**
   * Le courrier adressé à l’administration — côté staff.
   *
   * Séparé des signalements, et pas par commodité : ce ne sont pas les mêmes
   * gestes. Mélanger une question anodine et un signalement de harcèlement
   * dans la même file est le meilleur moyen de traiter les deux mal.
   */
  courrier: {
    eyebrow: "Courrier",
    titre: "Le courrier",
    lien: "Ouvrir le courrier",
    accroche:
      "Les lettres que des membres ont adressées à l’administration. C’est aussi par là qu’une sanction se conteste, dans les quinze jours (article 8.5).",
    limite:
      "Cet écran ne montre que les fils ouverts avec l’administration. Les conversations entre joueurs n’y figurent pas, et rien ici ne permet de les atteindre.",
    vide: "Aucune lettre.",
    videAide: "Personne n’a écrit à l’administration.",
    enAttente: "{n} en attente de réponse",
    unEnAttente: "1 en attente de réponse",
    /** Le seul état qui compte : le dernier mot est-il celui du membre ? */
    badgeEnAttente: "Attend une réponse",
    badgeRepondu: "Répondu",
    /** Souvent le motif de la lettre — le staff doit le voir tout de suite. */
    badgeSuspendu: "Accès suspendu",
    corbeaux: "Corbeaux",
    retour: "Retour au courrier",
    membreInconnu: "Membre sans fiche",

    /** Le fil. */
    filTitre: "L’échange",
    signature: "L’Administration",
    repondre: "Répondre",
    repondreAide:
      "Votre réponse s’affichera sous « L’Administration » : la zone d’administration n’a pas de comptes distincts, il n’y a personne d’autre à nommer.",
    champ: "Votre réponse",
    invite: "Écrivez ici…",
    envoyer: "Envoyer la réponse",
  },


  /**
   * L’écran de modération — côté administration.
   *
   * **Il ne montre que ce qu’un joueur a délibérément transmis.** Pas de
   * boîte, pas de recherche, pas d’export : il n’existe aucun chemin d’ici
   * vers une conversation, et ces textes le disent à qui lit l’écran, pour
   * que personne ne cherche un bouton qui n’existera jamais.
   */
  moderation: {
    eyebrow: "Signalements",
    titre: "Signalements",
    lien: "Ouvrir les signalements",
    accroche:
      "Les corbeaux qu’un membre a transmis à la modération, avec la dizaine de messages qui les entoure.",
    limite:
      "Cet écran ne donne accès à rien d’autre : ni le reste de la conversation, ni la boîte d’un membre. Il n’existe aucun moyen de les ouvrir.",
    vide: "Aucun signalement.",
    videAide: "Rien n’a été transmis à la modération.",
    enAttente: "{n} en attente",
    unEnAttente: "1 en attente",

    colonnePar: "Signalé par",
    colonneCorbeaux: "Corbeaux transmis",
    retour: "Retour aux signalements",

    statuts: {
      EN_ATTENTE: "En attente",
      TRAITE: "Traité",
      CLASSE_SANS_SUITE: "Classé sans suite",
    },

    motifDonne: "Motif indiqué",
    motifAbsent: "Aucun motif indiqué.",
    contexteTitre: "Ce qui a été transmis",
    contexteAide:
      "Copie figée au moment du signalement. Elle ne change plus, même si un corbeau est retiré ensuite.",
    corbeauVise: "Corbeau signalé",
    messageEfface:
      "Ce corbeau a été retiré, ou son auteur a quitté le site depuis. La copie ci-dessus reste, et fait foi.",
    compteSupprime: "Compte supprimé",

    traiter: "Traiter",
    traiterAide:
      "La note reste dans le dossier du signalement. Une sanction, elle, se pose depuis la fiche du membre et s’inscrit à son journal.",
    note: "Note de traitement",
    noteInvite: "Ce qui a été décidé, et pourquoi…",
    marquerTraite: "Marquer traité",
    classerSansSuite: "Classer sans suite",
    traiteLe: "Traité par {auteur} le {date}",
    rappelConfidentiel:
      "Le signalement est confidentiel : la personne visée ne doit pas apprendre qui l’a signalée. Les signalements manifestement abusifs et répétés sont eux-mêmes sanctionnables (article 8.6).",
  },


  /**
   * Ce que le site répond quand ça ne passe pas. Jamais un code, jamais une
   * erreur technique : le joueur doit savoir quoi faire ensuite.
   */
  erreurs: {
    tourFermee:
      "La Tour aux Corbeaux s’ouvre aux membres dont le dossier a été accepté.",
    suspendu:
      "Votre accès est suspendu : vous pouvez encore écrire à l’administration, et à elle seule.",
    destinataireInconnu: "Ce personnage ne peut pas recevoir de corbeau.",
    /**
     * Le chemin est nommé tel qu’il existe. « Depuis vos réglages » envoyait
     * chercher une page qui n’existe pas sur ce site : la liste vit dans la
     * Tour, sous « Personnes bloquées ».
     */
    conversationClose:
      "Cette conversation est close. Vous pouvez la rouvrir depuis « Personnes bloquées », dans la Tour.",
    corpsVide: "Un corbeau ne part pas les serres vides.",
    corpsTropLong: "Un corbeau ne porte pas plus de {max} signes.",
    introuvable: "Cette conversation n’existe pas, ou elle ne vous concerne pas.",
    /**
     * L’anti-démarchage (art. 3.6). **Une attente, jamais une faute.**
     *
     * Le délai est dit en clair, et la phrase rappelle aussitôt ce qui reste
     * ouvert : répondre. Sans ce rappel, un joueur croirait la Tour fermée.
     */
    plafond:
      "La Tour ne laisse pas partir davantage de corbeaux vers de nouveaux destinataires pour l’instant. Réessayez dans {minutes} minutes — répondre à une conversation ouverte n’est jamais limité.",
    plafondUneMinute:
      "La Tour ne laisse pas partir davantage de corbeaux vers de nouveaux destinataires pour l’instant. Réessayez dans une minute — répondre à une conversation ouverte n’est jamais limité.",
    blocageImpossible: "Cette personne ne peut pas être bloquée.",
    /** Panne réelle. On ne prétend pas que le corbeau est parti. */
    envoiEchoue:
      "Le corbeau n’est pas parti. Réessayez dans un instant — votre texte est resté dans le champ.",
    chargement: "Impossible de charger la suite. Réessayez.",
  },
} as const;

