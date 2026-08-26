/**
 * Tous les textes de l’école : bandeau, bureau, fiche, salles à venir.
 * Rien en dur dans un composant. Apostrophes typographiques (’).
 */

export const TEXTES_ECOLE = {
  menu: {
    aria: "Navigation de l’école",
    derouler: "Menu",
    replier: "Fermer",
    /** Le libellé de la liste qu’un groupe déplie, pour les lecteurs d’écran. */
    sousMenuAria: "{groupe} — sous-menu",
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
      /**
       * Le terme change avec la valeur : « Année — Directrice » se
       * contredirait. Le rôle remplace l’année, son libellé aussi.
       */
      role: "Rôle",
      baguette: "Baguette",
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
      /** Affiché à la place de « Année » quand un rôle est posé. */
      role: "Rôle",
      maison: "Maison",
      famille: "Famille",
      baguette: "Baguette",
      /** Affiché tant que l’élève n’est pas passé à Kaldvik. */
      baguetteAVenir: "À choisir chez Bjornstav, à Kaldvik.",
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

  /**
   * Les salles pas encore construites.
   *
   * Chacune existe pour que le menu soit complet et honnête : une entrée qui
   * mène à une page qui dit ce qui viendra vaut mieux qu’une entrée absente —
   * un site où l’on ne voit rien paraît vide.
   *
   * `rune` accompagne le titre ; elle est décorative et lue `aria-hidden`.
   */
  aVenir: {
    badge: "À venir",

    ecole: {
      rune: "ᚺ",
      titre: "L’école",
      corps:
        "L’intérieur du château ouvrira bientôt : les Tours centrales, les quatre ailes et leurs dix-neuf pièces y auront chacune leur porte.",
    },
    cours: {
      rune: "ᛏ",
      titre: "Les cours",
      corps:
        "Les salles de classe ne sont pas encore ouvertes. Les matières, les emplois du temps et les épreuves viendront avec la rentrée.",
    },
    alentours: {
      rune: "ᛚ",
      titre: "Les alentours",
      corps:
        "Ce qui entoure le château — la falaise et la mer, le lac, la forêt sombre, le chemin escarpé qui descend vers Kaldvik. Rien n’y est encore jouable.",
    },
    maison: {
      rune: "ᛗ",
      titre: "Ma maison",
      corps:
        "Le dortoir, les annonces et les espaces réservés à ta maison. Cette porte s’ouvrira en même temps que le forum.",
    },
    nonMages: {
      rune: "ᛜ",
      titre: "Le monde des non-mages",
      corps:
        "Ce qui se joue loin des falaises, chez ceux qui ne savent rien de la magie. L’espace existe ; il attend d’être rempli.",
    },
    histoire: {
      rune: "ᛇ",
      titre: "Histoire",
      corps:
        "La fondation, les quatre, la rupture. Ce que l’on enseigne aux jeunes élèves — et ce que l’on tait aux autres. Les archives s’ouvriront plus tard, avec la carte et le bestiaire.",
    },
  },

  /** Les archives, pour les pages qui portent vraiment quelque chose. */
  archives: {
    eyebrow: "Les archives",
    reglement: {
      titre: "Règlement",
      chapeau:
        "Le texte en vigueur, tel qu’il a été accepté à l’inscription. Il est susceptible d’évoluer : toute modification est affichée dans le Grand Hall et entre en vigueur sept jours plus tard.",
    },
  },
} as const;
