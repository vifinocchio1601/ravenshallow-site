/**
 * Tous les textes de l’école : bandeau, bureau, fiche, salles à venir.
 * Rien en dur dans un composant. Apostrophes typographiques (’).
 */

export const TEXTES_ECOLE = {
  menu: {
    aria: "Navigation de l’école",
    derouler: "Menu",
    replier: "Fermer",
  },

  bureau: {
    titre: "Mon bureau",
    eyebrow: "Ravenshallow",
    /** L’image de fond est un décor : son `alt` reste vide, à dessein. */
    altDecor: "",
    accueil: "Le château dort encore. Voici ce qui t’attend.",

    /**
     * La note du nouvel arrivant. Elle disparaît d’elle-même une fois les
     * deux lignes cochées — ce n’est pas un panneau permanent.
     */
    premiersPas: {
      titre: "Vos premiers pas",
      aide: "Deux choses à faire avant que le château ne s’ouvre en entier.",
      baguette: "Passer chez Bjornstav, à Kaldvik, et choisir votre baguette",
      ceremonie: "Vous présenter devant le Miroir de Brume",
      /** La raison du verrou, écrite en clair — jamais un simple grisé. */
      verrou: "Après la boutique",
      /** Lus par les lecteurs d’écran, en tête de chaque ligne. */
      etatFait: "Fait :",
      etatAFaire: "À faire :",
      etatVerrouille: "Verrouillé :",
    },

    scenes: {
      titre: "Mes scènes en cours",
      aide: "Les scènes où c’est à toi d’écrire.",
      vide: "Aucune scène ouverte pour l’instant.",
      dernierMessage: "Dernier message",
    },
    courrier: {
      titre: "Mon courrier",
      aide: "Les messages que tu n’as pas encore lus.",
      vide: "Aucun corbeau à ta fenêtre.",
    },
    progression: {
      titre: "Ma progression",
      pointsPersonnels: "Points personnels",
      pointsMaison: "Points de la maison",
      annee: "Année",
      prochainesEpreuves: "Prochaines épreuves",
      /** Masqué tant que la répartition n’a pas eu lieu — art. 10.2. */
      maisonInconnue: "Le compteur de maison s’ouvrira à la répartition.",
      sansDate: "Aucune session annoncée.",
    },
    annonces: {
      titre: "Annonces du Grand Hall",
      aide: "Les mots de l’administration, en lecture seule.",
      vide: "Le Grand Hall est silencieux.",
    },
  },

  fiche: {
    titre: "Ma fiche",
    eyebrow: "L’élève",
    lectureSeule:
      "Cette fiche est en lecture. Pour la corriger, écris à l’administration : elle te renverra un lien.",
    portraitAbsent: "Portrait absent",

    ligne: {
      nom: "Prénom et nom",
      age: "Âge",
      fonction: "Année",
      maison: "Maison",
      famille: "Famille",
      baguette: "Baguette",
      baguetteAVenir: "La boutique Bjornstav n’a pas encore ouvert.",
      limites: "Limites d’écriture",
      limitesAucune: "Aucune limite indiquée.",
    },

    bloc: {
      biographie: "Biographie",
      qualites: "Trois qualités",
      defauts: "Trois défauts",
      peur: "Sa plus grande peur",
    },

    bannissement: {
      titre: "Accès suspendu",
      definitif: "Exclusion définitive.",
      jusquau: "Suspendu jusqu’au {date}.",
      recours:
        "Tu peux contester cette décision une fois, dans les quinze jours, par message à un administrateur non impliqué (article 8.5).",
      badge: "En bannissement",
    },
  },

  aVenir: {
    cours: {
      titre: "Les cours",
      corps:
        "Les salles de classe ne sont pas encore ouvertes. Les matières, les emplois du temps et les épreuves viendront avec la rentrée.",
    },
    ecole: {
      titre: "L’école",
      corps:
        "Le château se visite bientôt : la Grande Salle, les dortoirs, la falaise et la forêt sombre y auront chacun leur porte.",
    },
    badge: "À venir",
  },
} as const;
