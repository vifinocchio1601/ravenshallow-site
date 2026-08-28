import { TITRE_ANNONCE_MAX } from "./limites";

/**
 * **Tous les textes du Grand Hall**, et rien d'autre.
 *
 * Le nom vient de la bible (§12) et du préambule du règlement, qui en fait
 * « le seul lieu officiel d'annonce ». ⚠️ **Ne pas le confondre avec la
 * Grande Salle** : la bible et le règlement les distinguent explicitement, et
 * demandent que « toute interface, tout menu et toute annonce respectent
 * cette séparation sans exception ». Le Grand Hall est l'administration ; on
 * y lit, on n'y débat pas.
 */
export const TEXTES_ANNONCES = {
  /** Ce qui s'affiche au bandeau — une feuille, sous « Le Grand Hall ». */
  nomCourt: "Annonces",
  nomLong: "Le Grand Hall",

  /**
   * Le même nom, **pour le chapeau du bandeau**, avec une espace insécable
   * (U+00A0) entre « Grand » et « Hall » — et une espace ordinaire avant.
   *
   * ⚠️ **Les deux espaces insécables débordent.** Le nom tient alors sur une
   * seule ligne, l'entrée gagne cinquante pixels de large, et à 1024 px c'est
   * « Se déconnecter » qui sort du parchemin. Seule la seconde est liée.
   *
   * Sans elle, à 1024 px, l'entrée se casse en « LE / GRAND / HALL » quand
   * ses quatre voisines tiennent sur deux lignes : le parchemin grandit d'une
   * ligne pour elle seule, et la rangée penche. Avec, elle se casse en « LE /
   * GRAND HALL », comme « MON / PERSONNAGE ».
   *
   * C'est le procédé du trait d'union insécable des non‑mages, appliqué à une
   * espace. Un lecteur d'écran l'annonce comme une espace ordinaire.
   */
  nomBandeau: "Le Grand\u00A0Hall",

  liste: {
    eyebrow: "Ravenshallow",
    titre: "Le Grand Hall",
    /**
     * La phrase dit ce que le lieu EST — pas ce qu'on y fait. « On y lit, on
     * n'y débat pas » vient de la bible mot pour mot.
     */
    chapeau:
      "Les annonces officielles du château. On y lit, on n’y débat pas — pour répondre, un corbeau à l’administration.",
    vide: "Le Grand Hall est silencieux. Rien n’a encore été affiché.",
    ariaListe: "Les annonces du Grand Hall",
  },

  annonce: {
    retour: "Retour au Grand Hall",
    /** « Affichée le 28 août 2026 » — le mot du préambule, qui fait courir le délai. */
    affichee: "Affichée le {date}",
    modifiee: "Modifiée le {date}",
    /**
     * Le préambule donne sept jours à une modification du règlement. La date
     * s'affiche telle qu'elle a été posée : le site ne la calcule pas, et ne
     * l'oppose à personne.
     */
    enVigueur: "En vigueur le {date}",
    enVigueurPassee: "En vigueur depuis le {date}",
    introuvable: "Cette annonce n’est plus affichée.",
  },

  administration: {
    eyebrow: "Ravenshallow",
    titre: "Les annonces du Grand Hall",

    /** La carte de l'accueil de l'administration. */
    carteEyebrow: "Le Grand Hall",
    carteTitre: "Les annonces",
    carteAccroche:
      "Ce que le château affiche. C’est le seul endroit officiel où annoncer une modification du règlement — elle entre en vigueur sept jours plus tard.",
    carteLien: "Écrire une annonce",
    carteAffichees: "{n} annonces affichées",
    carteUneAffichee: "1 annonce affichée",
    carteAucune: "Rien d’affiché",

    chapeau:
      "Ce que le château affiche. Le règlement fait de ce lieu le seul endroit officiel où l’annoncer : une modification du règlement affichée ici entre en vigueur sept jours plus tard.",

    champTitre: "Titre",
    champTitreAide: `${TITRE_ANNONCE_MAX} signes au plus.`,
    champCorps: "Le texte de l’annonce",
    champVigueur: "Entrée en vigueur",
    champVigueurAide:
      "Facultatif. À renseigner pour une modification du règlement — le préambule donne sept jours. Laissé vide, rien ne s’affiche.",

    publier: "Afficher au Grand Hall",
    enregistrer: "Enregistrer la correction",
    annuler: "Annuler",
    modifier: "Corriger",
    retirer: "Retirer",
    /** Le nom accessible est entier : dans une liste, « retirer » ne dit pas quoi. */
    retirerAria: "Retirer « {titre} » du Grand Hall",
    modifierAria: "Corriger « {titre} »",
    /** Dit ce que le geste fait VRAIMENT — rien ne s'efface sur ce site. */
    retirerAide:
      "L’annonce sort du Grand Hall et du journal. Elle reste en base : ce qui a fait courir un délai doit rester consultable.",

    remettre: "Remettre au Grand Hall",
    remettreAria: "Remettre « {titre} » au Grand Hall",

    aucune: "Aucune annonce affichée.",
    retireesTitre: "Retirées",
    retireeLe: "Retirée le {date} par {qui}",
    /** L'auteur d'un geste d'administration, faute de comptes distincts. */
    posePar: "Administration",
  },

  erreurs: {
    titreVide: "Une annonce a besoin d’un titre.",
    titreTropLong: "Le titre ne peut pas dépasser {max} signes.",
    corpsVide: "Une annonce a besoin d’un texte.",
    corpsTropLong: "Le texte ne peut pas dépasser {max} signes.",
    dateIllisible: "Cette date ne se lit pas.",
    /**
     * La base refuserait de toute façon — mais un message vaut mieux qu'une
     * erreur 500 sur une contrainte dont le joueur ne saura rien faire.
     */
    vigueurAvantAffichage:
      "Une annonce ne peut pas entrer en vigueur avant d’être affichée.",
  },
} as const;
