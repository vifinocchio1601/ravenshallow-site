import { NATURES, type NatureEvenement } from "./natures";

/**
 * **Tous les textes du calendrier.** Rien en dur dans un composant, et les
 * apostrophes sont typographiques.
 *
 * Le calendrier est la troisième des cinq choses que la bible (§12) met au
 * Grand Hall, après le règlement et les annonces. Comme elles : on y lit, on
 * n'y débat pas.
 */

export const TEXTES_CALENDRIER = {
  /** Ce qui s'affiche au bandeau — une feuille, sous « Le Grand Hall ». */
  nom: "Calendrier",

  page: {
    eyebrow: "Le Grand Hall",
    titre: "Le calendrier",
    chapeau:
      "Les dates du château : la rentrée, les trimestres, les épreuves et les temps forts de l’année. Elles sont données dans le calendrier réel — c’est celui sur lequel on s’organise.",
    /** Le calendrier n’est pas vide « pour l’instant » : il n’a rien à dire. */
    vide: "Aucune date n’est encore posée. Elles viendront avec la première session.",
  },

  aVenir: {
    titre: "À venir",
    /** Rien devant, mais des dates derrière : ce n’est pas la même chose. */
    vide: "Rien n’est annoncé pour l’instant.",
    /** Ce qui commence aujourd’hui, ou qui est en cours. */
    enCours: "En ce moment",
  },

  passes: {
    titre: "Déjà passé",
    vide: "Rien encore.",
  },

  /** Une ligne du calendrier. */
  evenement: {
    /** Un événement d’un seul jour. */
    le: "Le {date}",
    /** Un événement qui dure — un trimestre, une session d’épreuves. */
    du: "Du {debut} au {fin}",
    modifie: "Modifié le {date}",
  },

  /** Les trois natures, telles qu’elles s’affichent. */
  natures: {
    EPREUVE: "Épreuve",
    FETE: "Temps fort",
    SESSION: "Session",
  } satisfies Record<NatureEvenement, string>,

  /**
   * Ce que le bureau annonce sous « Prochaines épreuves ».
   *
   * ⚠️ **Seule la nature `EPREUVE` y remonte.** Le panneau porte ce titre
   * depuis le lot du bureau ; y faire monter une fête le contredirait.
   */
  bureau: {
    /** « La session d’hiver — le 12 décembre 2026 ». */
    ligne: "{titre} — le {date}",
  },

  administration: {
    metaTitre: "Le calendrier — Administration",
    eyebrow: "Le Grand Hall",
    titre: "Le calendrier",
    accroche:
      "Les dates que le château annonce. Elles s’affichent au Grand Hall et remontent au bureau de chaque membre quand ce sont des épreuves.",
    /**
     * Le rappel qui compte : ce n’est pas une charge qu’on délègue.
     * Le préambule du règlement fait du Grand Hall le seul lieu officiel.
     */
    rappel:
      "Comme les annonces, le calendrier ne s’écrit qu’ici. Aucun pouvoir accordé à un membre n’y donne accès, préfet compris.",

    /** L’auteur, faute de comptes distincts en zone d’administration. */
    posePar: "L’Administration",

    /** La carte du tableau de bord, à côté de celle du Grand Hall. */
    carteEyebrow: "Le Grand Hall",
    carteTitre: "Le calendrier",
    carteAccroche:
      "La rentrée, les trimestres, les épreuves et les temps forts. Les épreuves remontent au bureau de chaque membre.",
    carteAucune: "Aucune date posée",
    carteUneAVenir: "1 date à venir",
    carteAVenir: "{n} dates à venir",
    carteLien: "Ouvrir le calendrier",

    formulaire: {
      titre: "Poser une date",
      titreChamp: "Titre",
      titrePlaceholder: "La veillée des braises",
      descriptionChamp: "Ce qu’il faut en savoir",
      descriptionAide:
        "Deux ou trois phrases. Le détail, s’il en faut, s’écrit dans une annonce — c’est elle qui a la mise en forme.",
      natureChamp: "Nature",
      natureAide:
        "Seules les épreuves remontent au bureau des membres, sous « Prochaines épreuves ».",
      debutChamp: "Date",
      finChamp: "Jusqu’au (facultatif)",
      finAide:
        "À renseigner pour ce qui dure : un trimestre, une session d’épreuves. Laissé vide, l’événement tient sur un jour.",
      poser: "Poser la date",
      enregistrer: "Enregistrer",
      annuler: "Annuler",
    },

    liste: {
      titre: "Les dates posées",
      aide: "Les plus proches d’abord. Une date retirée reste ici, et nulle part ailleurs.",
      vide: "Aucune date posée.",
      corriger: "Corriger",
      retirer: "Retirer du calendrier",
      remettre: "Remettre au calendrier",
      retireeLe: "Retirée le {date}",
      /** Ce que le lecteur d’écran entend, faute de voir la ligne. */
      corrigerAria: "Corriger « {titre} »",
      retirerAria: "Retirer « {titre} » du calendrier",
      remettreAria: "Remettre « {titre} » au calendrier",
    },
  },

  erreurs: {
    titreVide: "Un titre, même court.",
    titreTropLong: "Le titre ne peut pas dépasser {max} signes.",
    descriptionVide:
      "Une ligne au moins : une date sans rien dire n’apprend rien à personne.",
    descriptionTropLongue:
      "La description ne peut pas dépasser {max} signes. Pour en dire plus, une annonce.",
    natureIllisible: "Choisissez une nature.",
    dateRequise: "Une date, au format jour/mois/année.",
    dateIllisible: "Cette date ne se lit pas.",
    /** L’ordre des deux dates. La base le refuserait ; mieux vaut une phrase. */
    finAvantDebut: "La fin ne peut pas précéder le début.",
    introuvable: "Cette date n’existe pas, ou a déjà été retirée.",
  },

  /** L’ordre d’affichage des natures dans la liste déroulante. */
  ordreDesNatures: NATURES,
} as const;
