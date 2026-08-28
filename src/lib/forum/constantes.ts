/**
 * Tous les textes des pouvoirs. Rien en dur dans un composant.
 * Apostrophes typographiques (’).
 *
 * **Aucun import**, comme `corbeaux/constantes.ts` : c’est ce qui permet à
 * n’importe quel fichier d’y prendre un libellé sans ouvrir un cycle.
 */

export const TEXTES_POUVOIRS = {
  /** Ce que porte l’écran d’ensemble et la carte du tableau de bord. */
  eyebrow: "Le forum",
  titre: "Les pouvoirs",
  metaTitre: "Les pouvoirs — Administration",
  accroche:
    "Qui peut écrire les annonces d’une maison, clore une scène, épingler un sujet. Ces droits s’accordent à n’importe quel membre, indépendamment de son rôle.",
  lien: "Ouvrir les pouvoirs",

  /**
   * Le rappel qui compte, affiché sur les deux écrans.
   *
   * Il n’est pas décoratif : c’est la seule chose qui distingue ce panneau du
   * champ « rôle particulier », qui lui ne donne rien du tout.
   */
  rappel:
    "Ces droits n’ont aucun rapport avec le rôle affiché sur la fiche, qui reste purement décoratif. Un membre peut porter « Directrice » sans aucun pouvoir, et l’inverse.",

  /** Le rappel de ce que la liste ne contient pas, et ne contiendra pas. */
  rappelCorbeaux:
    "Aucun de ces droits ne donne accès aux corbeaux. Personne ne lit les conversations privées, quel que soit son rôle.",

  /** Le panneau de la fiche du membre. */
  panneau: {
    titre: "Pouvoirs sur le forum",
    aide: "Accordés et retirés ici, par l’administration seule. Chaque geste est consigné au journal du membre.",
    aucun: "Aucun pouvoir accordé.",
    accorder: "Accorder",
    retirer: "Retirer",
    /** Pour les deux permissions qui se donnent maison par maison. */
    surLaMaison: "Sur quelle maison ?",
    toutesLesMaisons: "Les quatre maisons",
    depuis: "Accordé le {date} par {auteur}",
  },

  /** Le rôle technique, réglé au même endroit. */
  role: {
    terme: "Rôle sur le site",
    aide: "Le staff intervient partout sur le forum. Sans rapport avec le rôle affiché sur la fiche.",
    enregistrer: "Changer le rôle",
  },

  /** Les préfets. */
  prefets: {
    titre: "Préfets",
    aide: "Un préfet écrit les annonces de sa maison. Le droit vient de la nomination : le retirer suffit à le reprendre (art. 13.5).",
    aucun: "Aucun préfet nommé. Le staff écrit les annonces en attendant.",
    nommer: "Nommer préfet",
    demettre: "Démettre",
    nommeLe: "Préfet de {maison} depuis le {date}",
  },

  /** Les libellés des cinq permissions, et ce que chacune ouvre vraiment. */
  permissions: {
    ANNONCES_MAISON: {
      nom: "Écrire les annonces d’une maison",
      detail:
        "Ouvrir et écrire les sujets d’annonce de cette maison. Ne donne aucun droit sur les autres maisons.",
      portee: "Une maison",
    },
    LIRE_ESPACES_MAISON: {
      nom: "Lire les espaces réservés d’une maison",
      detail:
        "Voir ce qui est réservé à cette maison — son dortoir compris. Ne donne pas le droit d’y écrire.",
      portee: "Une maison",
    },
    CLORE_SCENE: {
      nom: "Clore une scène",
      detail:
        "Fermer un sujet, y compris une scène abandonnée depuis un mois (art. 17.2). Les points acquis restent acquis.",
      portee: "Tout le forum",
    },
    EPINGLER_SUJET: {
      nom: "Épingler un sujet",
      detail: "Maintenir un sujet en tête de sa section.",
      portee: "Tout le forum",
    },
    VERROUILLER_SECTION: {
      nom: "Verrouiller une section",
      detail:
        "Fermer un lieu à l’écriture, sans en cacher le contenu : ce qui s’y est joué reste lisible.",
      portee: "Tout le forum",
    },
  },

  /** L’écran d’ensemble — « qui détient quoi ». */
  ensemble: {
    titre: "Qui détient quoi",
    aide: "Tous les pouvoirs accordés, permission par permission. Sans cette page, on perd le fil en six mois.",
    personne: "Personne.",
    staff: {
      titre: "Le staff",
      aide: "Modérateurs et administrateurs interviennent partout, sans qu’aucune permission leur soit accordée.",
      aucun: "Aucun membre du staff.",
    },
    versLaFiche: "Fiche et journal",
    retour: "Retour à l’administration",
  },

  /** Ce que le journal du membre affiche, une fois le geste passé. */
  journal: {
    PERMISSION_ACCORDEE: "Pouvoir accordé",
    PERMISSION_RETIREE: "Pouvoir retiré",
    PREFET_NOMME: "Nommé préfet",
    PREFET_DEMIS: "Démis de préfet",
  },
} as const;

/**
 * Les textes du forum. Mêmes règles : rien en dur dans un composant, aucun
 * import, apostrophes typographiques.
 *
 * **Les noms et les descriptions des lieux ne sont pas ici** : ils vivent en
 * base, posés par une migration. Une description se corrige sans toucher au
 * code, et c’est le joueur qui l’écrit.
 */
export const TEXTES_FORUM = {
  /**
   * **L'espace hors RP.** Son nom est resté « Le monde des non-mages » —
   * décision du joueur, 28 août 2026 : c'est le monde d'où l'on parle quand on
   * n'est pas son personnage. Sa description en base disait du jeu de rôle
   * jusqu'à ce jour-là, et c'était une erreur de ma part, jamais tranchée par
   * lui.
   */
  nonMages: {
    eyebrow: "Hors du jeu",
    titre: "Le monde des non-mages",
    accroche:
      "Ici on écrit en son nom, pas en celui de son élève. Aucune longueur minimale, aucun point — et l’on peut y poser une question sans la mettre en scène.",
  },

  ecole: {
    eyebrow: "Le domaine",
    titre: "L’école",
    accroche:
      "L’intérieur du château : les Tours centrales et les quatre ailes. Tout ce qui s’y écrit est du jeu de rôle — dix lignes au minimum, et les points s’y gagnent.",
  },

  lieu: {
    retour: "Retour à l’école",
    /** L’aile d’où l’on vient, en tête de la page d’une pièce. */
    dans: "Dans {section}",
    sujets: "{n} sujets",
    unSujet: "1 sujet",
    aucunSujet: "Rien ne s’y joue pour l’instant.",
    /** Le lot des scènes n’est pas construit : on le dit plutôt que de mentir. */
    aVenir:
      "Ouvrir une scène et y répondre viendront avec le lot suivant. Les lieux, eux, sont posés.",
  },

  /**
   * **La carte de celui qui écrit**, à gauche de chaque post.
   *
   * Un seul texte, et il n’est pas anodin : c’est ce qu’on écrit sous le
   * blason quand la maison ne s’affiche pas — un élève que le Miroir attend,
   * un professeur qu’il ne concerne pas. « Répartition à venir » mentirait sur
   * le second ; le nom de l’école est vrai pour les deux.
   */
  auteur: {
    ecole: "Ravenshallow",

    /**
     * Les points — art. 18.2.
     *
     * **En français, zéro est au singulier** : « 0 point », « 1 point »,
     * « 12 points ». Un `n > 1 ? "s" : ""` collé à la volée se trompe une fois
     * sur deux, et personne ne relit un pluriel.
     */
    unPoint: "{n} point",
    desPoints: "{n} points",
  },

  /**
   * **Un lieu verrouillé s’affiche, avec sa condition écrite.**
   *
   * Jamais caché : « un site où l’on ne voit rien paraît vide, et voir une
   * porte fermée donne envie. » Et jamais signalé par la seule couleur — la
   * raison est un texte, que le lecteur d’écran annonce comme les autres.
   */
  verrou: {
    /** Ce qui précède la raison, pour les lecteurs d’écran. */
    aria: "Écriture verrouillée :",
    ANNEE_INSUFFISANTE: "Accessible à partir de la {annee}",
    RESERVE_A_LA_MAISON: "Écriture réservée aux élèves de {maison}",
    SUR_CONVOCATION: "Sur convocation — le château ouvre, l’élève répond",
    PERMISSION_REQUISE: "Réservé aux préfets et aux porteurs d’annonces",
    LIEU_FERME: "Ce lieu est fermé à l’écriture",
    SUJET_CLOS: "Cette scène est close",
    /** Le rappel qui accompagne chaque verrou, et qui compte autant que lui. */
    lectureOuverte: "La lecture reste ouverte.",
  },

  /** Ouvrir une scène, et y répondre. */
  /**
   * **Les mots changent d'un espace à l'autre, l'écran non.**
   *
   * `/ecole` et `/non-mages` partagent `PageDuLieu` et `PageDuSujet` — deux
   * copies finiraient par diverger. Mais on n'« ouvre pas une scène » dans
   * « Présentations », et « Rien ne s'y joue » ne veut rien dire d'une section
   * hors RP. Le vocabulaire voyage donc en paramètre, choisi par la page.
   *
   * ⚠️ **`titreAide` et `corpsAide` peuvent être nuls**, et c'est le point :
   * l'aide du mode de participation (LIBRE, RÉSERVÉ…) et celle des balises
   * `[HRP]` ne parlent que du jeu de rôle. Les afficher hors RP donnerait des
   * consignes qui ne s'appliquent à rien.
   */
  motsRp: {
    estDuJeuDeRole: true,
    /** Le mot qui varie d'un espace à l'autre — l'article voyage avec lui. */
    laScene: "la scène",
    cetteScene: "cette scène",
    sceneClose: "Scène close",
    retour: "Retour à l’école",
    aucunSujet: "Rien ne s’y joue pour l’instant.",
    ouvrir: "Ouvrir une scène",
    titreLibelle: "Titre de la scène",
    titreExemple: "Le vent sur la galerie (RÉSERVÉ Sigrid)",
    corpsLibelle: "Ton post",
  },

  motsHorsRp: {
    estDuJeuDeRole: false,
    laScene: "le sujet",
    cetteScene: "ce sujet",
    sceneClose: "Sujet clos",
    retour: "Retour au monde des non-mages",
    aucunSujet: "Personne n’a encore ouvert de sujet ici.",
    ouvrir: "Ouvrir un sujet",
    titreLibelle: "Titre du sujet",
    titreExemple: "Bonjour, moi c’est…",
    corpsLibelle: "Ton message",
  },

  ecrire: {
    ouvrir: "Ouvrir une scène",
    repondre: "Répondre",
    envoi: "Publication…",
    annuler: "Annuler",

    titre: {
      libelle: "Titre de la scène",
      /**
       * **Le mode se met dans le titre, par convention entre joueurs.** Le
       * site ne l’applique pas : c’est une décision du joueur, prise le
       * 26 août 2026. L’aide montre l’usage par l’exemple, elle n’impose rien
       * — un titre sans mention passe.
       */
      aide: "Indique le mode entre parenthèses : (LIBRE), (SUR INVITATION), (RÉSERVÉ + les noms). C’est une règle entre joueurs, pas une réalité du monde : une scène réservée dans la Salle de Banquet à midi ne veut pas dire que la salle est vide.",
      exemple: "Le vent sur la galerie (RÉSERVÉ Sigrid)",
    },

    corps: {
      libelle: "Ton post",
      libelleReponse: "Ta réponse",
      /** Art. 12.3 — le hors-RP est autorisé, mais ne compte pas. */
      aideHrp: "Le hors-RP se met entre balises [HRP] … [/HRP]. Il est autorisé, mais ne compte pas dans le minimum de lignes.",
    },

    /** Le compteur, annoncé à voix haute comme il s’affiche. */
    compteur: {
      surLeMinimum: "{n} lignes sur {min}",
      atteint: "{n} lignes — le minimum est atteint",
      aria: "Longueur du post",
      sansMinimum: "{n} lignes",
    },

    /** Art. 16.3 — proposé au moment de publier, jamais imposé. */
    avertissement: {
      libelle: "Avertissement de contenu",
      aide: "Si la scène aborde un thème sensible, annonce-le en tête de post — par exemple « violence », « deuil ». Facultatif.",
      exemple: "violence",
      prefixe: "TW",
    },
  },

  /**
   * **Reprendre son propre post.**
   *
   * Sans limite de temps — décision du joueur, 27 août 2026. Ce qui protège
   * les autres n'est pas un délai mais la marque, visible de tous : on voit
   * qu'un texte a bougé depuis qu'on y a répondu.
   */
  modification: {
    action: "Modifier",
    enregistrer: "Enregistrer",
    enCours: "Enregistrement…",
    annuler: "Annuler",
    /** La marque, à côté de la date de publication. */
    marque: "modifié",
  },

  /**
   * **Retirer une scène, retirer son post.**
   *
   * Le vocabulaire est celui du joueur — « supprimer » —, parce que c'est ce
   * qu'il vit : la scène s'en va. Ce que le site en fait derrière, c'est de la
   * garder en base, et il n'a pas à s'en encombrer. Le mot n'est mensonger que
   * dans l'autre sens : promettre une disparition définitive qui n'aurait pas
   * lieu.
   */
  suppression: {
    scene: {
      action: "Supprimer {laScene}",
      titre: "Supprimer {cetteScene} ?",
      /** Quand on est seul à y avoir écrit : rien à ménager. */
      avertissementSeul:
        "Ce sera retiré du forum. Personne d’autre n’y a écrit.",
      /** Pour le staff : ce qui part appartient à plusieurs. */
      avertissementStaff:
        "Ce sera retiré du forum pour tout le monde. Ceux qui y ont écrit seront prévenus par un corbeau du château, avec le motif que tu donnes ici.",
      motif: "Motif de la suppression",
      motifAide:
        "Il figurera au journal, et dans le corbeau envoyé à ceux qui y ont écrit.",
      /** Proposé avant la suppression dès qu’un autre a écrit. */
      plutotClore:
        "Quelqu’un d’autre a écrit ici. Clore ferme sans rien retirer à personne.",
      clore: "Clore {laScene}",
      confirmer: "Supprimer {laScene}",
      annuler: "Annuler",
    },

    post: {
      action: "Retirer mon post",
      titre: "Retirer ce post ?",
      /** Il fermait la scène : il s’en va sans laisser de vide à expliquer. */
      avertissementSeul: "Il disparaîtra du fil.",
      /** On a répondu après : le retirer troue la suite. */
      avertissementSuivi:
        "Quelqu’un a répondu après lui. Sa place restera, avec la mention qu’un post a été retiré — sans quoi la suite de la scène ne se comprendrait plus.",
      confirmer: "Retirer",
      annuler: "Annuler",
      /** Ce que lisent les autres à sa place. */
      marque: "Post retiré par son auteur.",
    },

    /** Le corbeau du château, quand le staff retire une scène. */
    courrier: {
      corps:
        "Bonjour,\n\nUne scène à laquelle tu participais a été retirée du forum par l’administration.\n\nLa scène : « {titre} »\nLe lieu : {lieu}\n\nLe motif :\n{motif}\n\nCe que tu y avais écrit n’est pas perdu, mais il n’est plus lisible sur le forum. Si tu veux en récupérer une copie, ou si le motif ne te paraît pas juste, réponds à ce corbeau.",
    },

    erreurs: {
      pasAMoi: "Cette scène n’est pas la tienne.",
      dejaEcritParDAutres:
        "Quelqu’un d’autre a écrit dans cette scène : elle ne t’appartient plus seul. Tu peux la clore.",
      postPasAMoi: "Ce post n’est pas le tien.",
      motifRequis: "Dis pourquoi : le motif part au journal et aux joueurs.",
    },
  },

  /** Ce que le staff peut faire sur un sujet, et ce que ça dit. */
  moderation: {
    clore: "Clore {laScene}",
    rouvrir: "Rouvrir {laScene}",
    epingler: "Épingler",
    desepingler: "Retirer l’épingle",
    close: "{sceneClose}",
    closeDetail: "Close le {date} par {auteur}. Les points acquis restent acquis.",
    epinglee: "Épinglé",
  },

  /** Art. 19.3 — masqué le temps d’une correction, sept jours. */
  masquage: {
    masquer: "Masquer pour correction",
    demasquer: "Rendre visible",
    motif: "Ce qui doit être corrigé",
    motifRequis: "Dis au joueur ce qu’il doit reprendre : il ne verra que ça.",
    /** Ce que voit celui qui passe. Le texte n’est pas montré. */
    masquePourTous: "Ce post est masqué le temps d’une correction.",
    /** Ce que voit son auteur — lui garde son texte, c’est lui qui corrige. */
    masquePourMoi:
      "Ton post est masqué le temps d’une correction. Tu as jusqu’au {date} pour le reprendre.",
    /** Le corbeau que le château envoie. Le joueur doit être informé. */
    courrier: {
      sujet: "Un de tes posts attend une correction",
      corps:
        "Bonjour,\n\nUn de tes posts a été masqué le temps d’une correction — il n’est pas supprimé, et personne d’autre que toi n’en voit le texte.\n\nCe qu’il faut reprendre :\n{motif}\n\nTu as jusqu’au {date} pour le corriger (article 19.3). Passé ce délai, l’administration décidera de la suite.\n\nSi quelque chose n’est pas clair, réponds à ce corbeau.",
    },
  },

  erreurs: {
    titreVide: "Un titre, même court.",
    titreTropLong: "Le titre ne peut pas dépasser {max} signes.",
    corpsVide: "Il n’y a rien à publier.",
    corpsTropLong: "Le post ne peut pas dépasser {max} signes.",
    tropCourt:
      "Il manque {n} lignes : le minimum est de {min} dans cet espace (article 12.2). Le hors-RP entre balises [HRP] ne compte pas.",
    avertissementTropLong:
      "L’avertissement doit tenir en {max} signes — c’est une mention, pas une explication.",
    lieuIntrouvable: "Ce lieu n’existe pas.",
    sujetIntrouvable: "Cette scène n’existe pas.",
    /** Le refus de la couture, quand il n’y a rien de plus précis à dire. */
    refuse: "Tu ne peux pas écrire ici.",
  },

  /** Les repères affichés au bureau. Aucun n’oppose quoi que ce soit. */
  scenes: {
    titre: "Mes scènes en cours",
    compte: "{n} sur {repere}",
    auDela:
      "Au-delà du rythme conseillé ({repere} scènes). Rien ne t’en empêche — mais tes partenaires t’attendent.",
  },
} as const;

/**
 * **Le vocabulaire d'un espace**, choisi par la page et passé aux écrans
 * partagés. Voir `TEXTES_FORUM.motsRp` et `TEXTES_FORUM.motsHorsRp`.
 */
export type MotsDuLieu = {
  /**
   * ⚠️ **Explicite, et jamais déduit de l'absence de minimum de lignes.**
   * L'espace `maison` n'en a pas non plus et reste du jeu de rôle : le
   * raccourci « pas de minimum donc hors RP » serait faux le jour où l'on
   * meublera les dortoirs.
   *
   * Il commande trois choses qui ne parlent que du jeu de rôle : l'aide du
   * mode de participation — (LIBRE), (RÉSERVÉ) —, celle des balises `[HRP]`,
   * et l'avertissement de contenu de l'article 16.3. Hors RP, elles
   * donneraient des consignes qui ne s'appliquent à rien : l'article 4 y
   * traite les sujets sensibles autrement, en les interdisant plutôt qu'en
   * les annonçant.
   */
  estDuJeuDeRole: boolean;
  /**
   * **Le mot varie, la phrase non.** « Clore la scène » n'a pas de sens sur un
   * fil de présentation — mais dupliquer une vingtaine de phrases pour un seul
   * mot les ferait diverger. Elles sont donc écrites avec `{laScene}`, et
   * l'article voyage avec le mot : « la scène » est féminin, « le sujet » ne
   * l'est pas.
   */
  laScene: string;
  cetteScene: string;
  sceneClose: string;
  retour: string;
  aucunSujet: string;
  ouvrir: string;
  titreLibelle: string;
  titreExemple: string;
  corpsLibelle: string;
};

/**
 * **Le mot de l'espace, posé dans une phrase.**
 *
 * `« Clore {laScene} »` devient « Clore la scène » au château et « Clore le
 * sujet » hors RP. Une seule fonction, appelée partout : trois `replace`
 * recopiés dans trois composants finiraient par en oublier un, et c'est celui
 * qu'on lirait avec une accolade à l'écran.
 */
export function avecLeMot(gabarit: string, mots: MotsDuLieu): string {
  return gabarit
    .replace("{laScene}", mots.laScene)
    .replace("{cetteScene}", mots.cetteScene)
    .replace("{sceneClose}", mots.sceneClose);
}
