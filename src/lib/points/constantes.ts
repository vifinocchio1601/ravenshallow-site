/**
 * Tous les textes des points, et **aucun import**.
 *
 * Même parti pris que `corbeaux/constantes.ts` : un fichier de textes qui
 * n’importe rien peut être lu de partout — du dépôt `server-only` comme d’un
 * composant client — sans jamais ouvrir un cycle.
 */

export const TEXTES_POINTS = {
  /** Le nom du geste, côté administration. */
  ajustement: {
    /**
     * L’auteur d’un ajustement. La zone d’administration entre par un mot de
     * passe partagé, sans comptes distincts : il n’y a personne d’autre à
     * nommer. Même choix que `closPar` et que le poseur d’un rôle affiché.
     */
    parDefautAuteur: "L’Administration",
    erreurs: {
      motifRequis:
        "Un motif est nécessaire : ces points s’affichent dans l’historique de la maison, et personne ne doit les y trouver sans explication.",
      valeurRequise:
        "Indiquez un nombre de points, positif pour en ajouter, négatif pour en retirer.",
      valeurEntiere: "Les points s’écrivent en nombres entiers.",
      saisonFermee:
        "Aucune saison n’est ouverte : il n’y a pas de compteur à corriger.",
      introuvable: "Cet ajustement n’existe pas, ou a déjà été annulé.",
    },
  },

  /** La clôture d’une année scolaire — art. 18.3. */
  cloture: {
    metaTitre: "Clôture de l’année — Administration",
    eyebrow: "Fin d’année",
    titre: "Clore la session",
    accroche:
      "Le classement final est archivé, les compteurs de maison repartent à zéro, et les élèves que vous cochez passent à l’année suivante. Les points personnels ne bougent pas : ils portent la progression, et c’est justement ce qu’on récompense.",
    prevenir:
      "Rien ne se déclenche sur une date : c’est ce bouton, et lui seul. Une fois la session close, son classement est figé et ne se réécrit plus.",

    classement: {
      titre: "Ce qui sera archivé",
      aide: "Le classement tel qu’il est à cet instant. C’est exactement ce qui sera figé.",
      gagnante: "En tête",
    },

    passages: {
      titre: "Qui passe à l’année suivante",
      aide: "Le règlement laisse les conditions de passage à définir (art. 18.5) : c’est donc vous qui cochez, élève par élève. Un élève non coché redouble — ce n’est pas une sanction, seulement un rythme de jeu plus lent, et il garde tout.",
      /** « Sigrid Vale — 3e année → 4e année » */
      vers: "{de} → {a}",
      derniereAnnee: "Septième année — fin des études",
      sansMaison: "Sans maison",
      aucun: "Aucun élève accepté pour l’instant.",
      toutCocher: "Tout cocher",
      toutDecocher: "Tout décocher",
    },

    formulaire: {
      nom: "Nom de la session qui s’ouvre",
      nomAide: "Il figurera dans les archives, et dans le bureau de chacun.",
      nomPlaceholder: "Deuxième session — 2027",
      envoyer: "Clore la session et ouvrir la suivante",
      confirmation:
        "Clore la session ? Le classement sera figé et ne pourra plus être réécrit.",
    },

    /** La note laissée au journal de chaque élève qui passe. */
    noteJournal: "Passage à l’année suivante, à la clôture de « {saison} ».",

    archives: {
      titre: "Les sessions closes",
      aide: "Figées, et jamais recalculées : l’effectif de mars n’est pas celui d’octobre.",
      vide: "Aucune session close pour l’instant. La première est encore en cours.",
      /** « du 27 août 2026 au 27 février 2027 » */
      periode: "du {debut} au {fin}",
    },

    resultat: {
      /** « Session close. Nattorm l’emporte, 3 élèves passent. » */
      fait: "Session close. {gagnante} l’emporte, et {passes}.",
      faitSansGagnante: "Session close. Aucune maison n’avait marqué, et {passes}.",
      unPasse: "un élève passe à l’année suivante",
      desPasses: "{n} élèves passent à l’année suivante",
      aucunPasse: "personne ne change d’année",
    },

    erreurs: {
      nomRequis:
        "Donnez un nom à la session qui s’ouvre : il figurera dans les archives.",
      aucuneSaison:
        "Aucune session n’est ouverte : il n’y a rien à clore.",
    },
  },

  /** L’archivage d’un compte — art. 7.3. */
  absences: {
    metaTitre: "Absences — Administration",
    eyebrow: "Art. 7.3",
    titre: "Les absences",
    accroche:
      "Après trois mois sans connexion, un compte peut être archivé : il sort de l’effectif de sa maison, pour qu’une maison à moitié absente ne soit pas pénalisée au tournoi.",
    rappelDouceur:
      "Ce n’est pas une sanction : le compte garde son accès, sa fiche, ses scènes et ses points. Une simple connexion lève l’archivage d’elle-même — personne n’a à écrire pour rentrer chez soi.",
    rappelManuel:
      "Rien ne s’archive tout seul. Cet écran donne le fait ; la décision reste la vôtre.",

    colonneMembre: "Membre",
    colonneDerniere: "Dernière visite",
    colonneAbsence: "Absence",

    /** « il y a 94 jours » */
    depuis: "il y a {n} jours",
    depuisUnJour: "hier",
    aujourdHui: "aujourd’hui",
    /**
     * La colonne n’existe que depuis le 27 août 2026 : une date absente ne
     * dit pas « absent », elle dit « on ne sait pas ».
     */
    jamaisNotee: "pas encore notée",
    jamaisNoteeAide:
      "La date de dernière visite n’est notée que depuis le 27 août 2026. Un compte sans date ne s’est pas absenté : il n’est simplement pas repassé depuis. Il ne devient archivable qu’une fois revenu, puis reparti trois mois.",

    /**
     * La pastille du seuil.
     *
     * ⚠️ **Surtout pas le nombre de jours du seuil.** « 90 jours » posé à
     * côté d’un compte absent depuis cent se lit comme la durée de son
     * absence, et se contredit avec la ligne juste en dessous. Ce qu’on veut
     * dire est « le seuil est franchi », et il faut l’écrire ainsi.
     */
    seuilAtteint: "Trois mois atteints",

    archiver: "Archiver",
    archiverAria: "Archiver le compte de {nom}",
    restaurer: "Restaurer",
    restaurerAria: "Restaurer le compte de {nom}",
    /** « Archivé le 27 août 2026 par L’Administration » */
    archiveLe: "Archivé le {date} par {auteur}",

    titreArchives: "Les comptes archivés",
    aucunArchive: "Aucun compte archivé.",
    aucunAbsent: "Personne n’atteint les trois mois d’absence.",
  },

  /** L’écran d’administration — `/admin/points`. */
  admin: {
    metaTitre: "Points de maison — Administration",
    eyebrow: "Le tournoi",
    titre: "Les points de maison",
    accroche:
      "Ajouter ou retirer des points à une maison, avec un motif. Le compteur d’une maison et les points personnels d’un élève sont deux choses distinctes : un ajustement fait ici ne touche jamais la progression de personne.",
    /** Le rappel qui empêche d’aller chercher le bouton ailleurs. */
    rappelUniqueGeste:
      "C’est le seul endroit du site où des points s’ajoutent ou se retirent à la main. Un professeur ou un modérateur qui souhaite un ajustement en fait la demande par la Tour aux Corbeaux, en écrivant à l’administration.",
    rappelAutomatique:
      "Les points gagnés en jeu s’ajoutent seuls : un point par post publié dans « Le domaine », dans la limite du plafond quotidien. Rien à faire ici pour eux.",

    saison: {
      titre: "La saison en cours",
      /** « Ouverte le 27 août 2026 » */
      ouverteDepuis: "Ouverte le {date}",
      aucune:
        "Aucune saison n’est ouverte. Les points n’ont nulle part où se poser : ouvrez-en une avant toute chose.",
    },

    tableau: {
      titre: "Les quatre compteurs",
      aide: "Le classement se fait à la moyenne par élève, jamais au total — sinon la maison la plus peuplée gagnerait mécaniquement.",
      maison: "Maison",
      points: "Points",
      effectif: "Élèves",
      moyenne: "Moyenne",
      rang: "Rang",
      /** Le plancher, dit en clair sous le tableau. */
      plancher:
        "La moyenne se calcule sur un effectif d’au moins {plancher} élèves : une maison qui n’en compte qu’un ou deux ne voit pas sa moyenne s’envoler au premier post.",
      /** Affiché seulement quand une maison est passée sous zéro. */
      sousZero:
        "Une maison au moins est en dessous de zéro. Le tournoi la compte à zéro — un tube ne descend pas sous le fond du verre —, mais le compteur reste affiché tel quel : sans cela, un retrait sans effet visible serait refait.",
    },

    formulaire: {
      titre: "Ajouter ou retirer des points",
      aide: "Un nombre positif ajoute, un nombre négatif retire. Le motif s’affichera dans l’historique, visible de tous.",
      maison: "Maison",
      points: "Points",
      pointsAide: "Positif pour ajouter, négatif pour retirer.",
      motif: "Motif",
      motifPlaceholder: "Ce que les joueurs liront dans l’historique…",
      envoyer: "Enregistrer l’ajustement",
      /** Les motifs déjà écrits, proposés pendant la frappe. */
      suggestions: [
        "Belle scène collective",
        "Participation à un événement",
        "Retenue",
        "Entorse au règlement en jeu",
        "Correction d’une erreur de comptage",
      ],
    },

    historique: {
      titre: "L’historique des ajustements",
      aide: "Tout y figure, y compris ce qui a été annulé : un retrait de points qui disparaîtrait de l’histoire serait pire qu’un retrait injuste.",
      vide: "Aucun ajustement pour l’instant. Les compteurs ne portent que ce qui a été gagné en jeu.",
      annuler: "Annuler",
      /** « Annulé le 27 août par L’Administration » */
      annule: "Annulé le {date} par {auteur}",
      annuleCourt: "Annulé",
      /** Le nom accessible du bouton, dans une liste de vingt lignes. */
      annulerAria: "Annuler l’ajustement de {points} points à {maison}",
    },

    /** Le filet : refaire les compteurs depuis le carnet. */
    recalcul: {
      titre: "Refaire les compteurs",
      aide: "Chaque point gagné laisse une ligne dans le carnet, et chaque ajustement la sienne. Ce bouton reconstruit les quatre compteurs à partir de ces lignes, et de rien d’autre — c’est ce qui sauve le jour où un total serait faux.",
      rassurer:
        "Il ne peut rien casser : il n’écrit que des totaux déduits, ne touche ni au carnet, ni aux ajustements, ni aux points personnels, et deux passages de suite donnent le même résultat.",
      bouton: "Refaire les compteurs depuis le carnet",
    },
  },

  /** Ce qu’on lit sous les tubes, au bureau. */
  tournoi: {
    titre: "Le tournoi des maisons",
    aide: "La maison en tête remplit son tube ; les trois autres se mesurent à elle.",

    /** Sous le gros chiffre. C’est lui qui classe, il faut le dire. */
    moyenneLegende: "points par élève",

    /**
     * Le détail, en petit. **Zéro est au singulier en français** — « 0 point »,
     * « 0 élève » —, comme sur la carte de l’auteur.
     */
    unPoint: "{n} point",
    desPoints: "{n} points",
    unEleve: "{n} élève",
    desEleves: "{n} élèves",

    /**
     * L’explication sous les tubes. Sans elle, un joueur voit la maison qui a
     * le plus de points porter le plus petit tube et croit à un défaut.
     */
    explication:
      "Le classement se fait à la moyenne par élève, pour que les maisons les moins nombreuses ne soient pas désavantagées.",

    /** Le liseré ne parle qu’aux yeux : le mot, lui, se lit aussi à voix haute. */
    maMaison: "Ma maison",

    vide: "Aucun point n’a encore été marqué cette saison. Les quatre tubes sont vides, et c’est normal : ils se rempliront au premier post publié dans « Le domaine ».",
    /** Quand aucune saison n’est ouverte — il n’y a pas de tournoi du tout. */
    sansSaison: "Le tournoi reprendra à l’ouverture de la prochaine session.",
  },
} as const;
