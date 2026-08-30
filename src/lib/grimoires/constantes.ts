/**
 * Les textes des Grimoires.
 *
 * **Aucun texte en dur dans un composant** — la règle du projet. Ce fichier
 * n'importe rien d'autre que les plafonds, pour que le schéma, le dépôt et
 * les écrans y puisent sans cycle.
 */

import {
  DESCRIPTION_GRIMOIRE_MAX,
  EFFET_MAX,
  NOM_SORT_MAX,
  SOUS_TITRE_MAX,
  TITRE_CHAPITRE_MAX,
  TITRE_GRIMOIRE_MAX,
} from "./limites";

export const TEXTES_GRIMOIRES = {
  /**
   * Le nom complet, sur la page.
   *
   * ⚠️ **« Les Grimoires » et « La bibliothèque » ne se confondent jamais.**
   * La bibliothèque est une pièce de l'aile ouest où l'on joue des scènes ;
   * ici on lit. Aucun libellé de l'un ne doit reprendre celui de l'autre.
   */
  nom: "Les Grimoires",

  /** Le libellé du bandeau, accordé aux quatre voisines du Domaine. */
  nomBandeau: "Les grimoires",

  etagere: {
    eyebrow: "La bibliothèque de consultation",
    titre: "Les Grimoires",
    intro:
      "Ce que le château laisse consulter. On y lit ; on n’y écrit pas — les scènes se jouent à la bibliothèque, dans l’aile ouest.",
    vide: "Aucun volume n’est encore posé sur l’étagère.",
    ouvrir: "Ouvrir",
    /** ⚠️ Le singulier : « 1 chapitres » est la faute que personne ne relit. */
    chapitres: "{n} chapitres",
    chapitreUn: "1 chapitre",
  },

  lecteur: {
    retour: "Retour à l’étagère",
    sommaire: "Sommaire",
    precedente: "Page précédente",
    suivante: "Page suivante",
    /** « Page 4 sur 17 » — affiché, jamais transmis dans un lien. */
    page: "Page {n} sur {total}",
    /** Sur grand écran, on en voit deux à la fois. */
    pages: "Pages {a}–{b} sur {total}",
    modeContinu: "Lecture continue",
    modePagine: "Lecture page à page",
    tailleTexte: "Taille du texte",
    tailles: { petite: "Petite", moyenne: "Moyenne", grande: "Grande" },
    /** Annoncé aux lecteurs d’écran à chaque tour de page. */
    pageAnnoncee: "Page {n} sur {total}, {chapitre}",
    /**
     * ⚠️ Le décor porte un `alt` VIDE : c'est un bureau, une plume et une
     * chandelle — rien à lire. Tout ce qui compte est du vrai texte par
     * -dessus. Même choix que le journal du bureau et le tableau d'une
     * maison.
     */
    decorAlt: "",
    /** Le repli du mode paginé, quand le script ne s'exécute pas. */
    sansScript:
      "Le grimoire se feuillette avec le script actif. Sans lui, la lecture continue reste ouverte.",
  },

  fiche: {
    simple: "Sort simple",
    lie: "Sort lié",
    limite: "Limite",
    formule: "Formule",
    /**
     * ⚠️ **La seule chose que l’année fait sur ce site.** Elle s’affiche et
     * elle rappelle la règle ; elle ne ferme aucune porte — décision du
     * joueur, 30 août 2026.
     */
    rappelAnnee:
      "Un sort ne se lance qu’à partir de l’année où il est enseigné (art. 14.4).",
  },

  /** Ce qu’une rune devient quand la police du lecteur ne la porte pas. */
  runes: {
    /** Le nom reste lisible même si le glyphe ne s’affiche pas. */
    absente: "rune {nom}",
  },

  administration: {
    carteEyebrow: "La bibliothèque",
    carteTitre: "Les Grimoires",
    carteAccroche:
      "Les volumes que le château laisse consulter. Le contenu entre par l’import ; ici on pose, on range, on ouvre ou l’on ferme un chapitre.",
    carteAucun: "Aucun volume",
    carteUn: "1 volume sur l’étagère",
    carteCompte: "{n} volumes sur l’étagère",
    carteLien: "Tenir la bibliothèque",
    metaTitre: "Les Grimoires — Administration",
    eyebrow: "La bibliothèque de consultation",
    titre: "Les Grimoires",
    accroche:
      "Poser un volume, corriger ce qu’il annonce, ouvrir ou fermer un chapitre. Le contenu, lui, entre par l’import : les volumes s’écrivent sous Word et se lisent avec scripts/lire-grimoire.mjs.",
    rappel:
      "Aucune permission attribuable n’ouvre ces gestes — comme les annonces et le calendrier, c’est une décision d’administration.",
    formulaire: {
      titrePoser: "Poser un volume",
      titreCorriger: "Corriger ce volume",
      champTitre: "Titre",
      champSlug: "Adresse",
      aideSlug: "Minuscules, chiffres et tirets : « sortileges ». Elle apparaît dans le lien du volume.",
      champExergue: "Exergue",
      aideExergue: "La ligne sous le titre, dans le lecteur. Facultative.",
      champDescription: "Description",
      aideDescription: "La ligne qu’on lit sur l’étagère, avant d’ouvrir.",
      champReliure: "Reliure",
      poser: "Poser",
      enregistrer: "Enregistrer",
      pose: "Volume posé.",
      corrige: "Volume corrigé.",
    },
    reliures: {
      CUIR_SOMBRE: "Cuir sombre",
      CUIR_FAUVE: "Cuir fauve",
      TOILE_BLEUE: "Toile bleue",
      PARCHEMIN: "Parchemin",
    },
    liste: {
      titre: "Les volumes",
      vide: "Aucun volume n’est posé.",
      corriger: "Corriger",
      retirer: "Retirer de l’étagère",
      remettre: "Remettre à l’étagère",
      monter: "Monter d’un cran",
      descendre: "Descendre d’un cran",
      retire: "Retiré de l’étagère le {jour}",
      chapitres: "{n} chapitres",
      chapitreUn: "1 chapitre",
      blocs: "{n} blocs",
      blocUn: "1 bloc",
      voir: "Voir le volume",
    },
    chapitres: {
      titre: "Les chapitres",
      vide: "Ce volume n’a pas encore de contenu. Il entre par l’import.",
      champTitre: "Titre du chapitre",
      champAcces: "Qui le lit",
      enregistrer: "Enregistrer",
      enregistre: "Chapitre enregistré.",
      /** ⚠️ Le mot compte : « réservé » n'est pas « caché ». */
      acces: {
        TOUS: "Tout membre",
        ADMINISTRATION: "L’administration seule",
      },
      aideAcces:
        "Un chapitre réservé ne descend pas dans le navigateur d’un joueur : ni son contenu, ni son titre, ni sa ligne au sommaire.",
    },
  },

  erreurs: {
    titreVide: "Il faut un titre.",
    titreTropLong: "Le titre ne dépasse pas {max} signes.",
    descriptionVide: "Il faut une ligne de description.",
    descriptionTropLongue: "La description ne dépasse pas {max} signes.",
    exergueTropLong: "L’exergue ne dépasse pas {max} signes.",
    slugInvalide:
      "L’adresse ne prend que des minuscules, des chiffres et des tirets.",
    accesInconnu: "Cette condition d’accès n’existe pas.",
    reliureInconnue: "Cette reliure n’existe pas.",
    typeInconnu: "Ce type de bloc n’existe pas.",
    blocVide: "Ce bloc ne dit rien.",
    blocTropLong: "Ce bloc dépasse ce qu’une page peut porter.",
    matiereInconnue:
      "Cette matière ne figure pas au cursus : {matiere}. Le grimoire s’accorde au cursus, jamais l’inverse.",
    anneeHorsBornes: "Une année du cursus va de 1 à 7.",
    glyphesTropNombreux: "Un sort porte une rune, ou deux liées.",
    tableauIrregulier:
      "Toutes les lignes du tableau n’ont pas le même nombre de colonnes.",
    adressePrise: "Cette adresse est déjà celle d’un autre volume.",
    /**
     * ⚠️ Le refus vient d'un déclencheur de la base, pas du code : un
     * chapitre qui porte un sortilège interdit ne peut pas s'ouvrir aux
     * joueurs. On le dit en clair plutôt que de laisser remonter une erreur.
     */
    chapitreInterdit:
      "Ce chapitre porte un sortilège interdit : il ne peut pas s’ouvrir aux joueurs (art. 13.2). Déplacez la fiche avant de l’ouvrir.",
    ancreInvalide:
      "L’ancre ne prend que des minuscules, des chiffres et des tirets.",
  },

  max: {
    titre: TITRE_GRIMOIRE_MAX,
    titreChapitre: TITRE_CHAPITRE_MAX,
    description: DESCRIPTION_GRIMOIRE_MAX,
    sousTitre: SOUS_TITRE_MAX,
    nomSort: NOM_SORT_MAX,
    effet: EFFET_MAX,
  },
} as const;
