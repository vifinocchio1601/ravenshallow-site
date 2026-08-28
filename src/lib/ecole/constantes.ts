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

  /**
   * **Ma maison** — la page, pas le tableau qu'elle porte. Les textes du
   * tableau d'affichage vivent dans `lib/tableau/constantes.ts` : ce sont
   * deux choses, et l'une pourrait un jour vivre ailleurs.
   */
  maison: {
    /**
     * Le chapeau dit où l'on est, le titre dit laquelle. L'inverse — « Le
     * tournoi des maisons » en chapeau — annonçait le panneau du bas
     * au-dessus du nom de la maison, et le disait deux fois.
     */
    eyebrow: "Ma maison",

    /** La page des quatre — à ne pas confondre avec « Ma maison ». */
    toutes: {
      eyebrow: "Ravenshallow",
      titre: "Les maisons",
      chapeau:
        "Les quatre maisons de l’école. On entre chez soi ; le reste se regarde de loin.",
      /** Ce qui distingue une porte ouverte d’une porte close, en toutes lettres. */
      laSienne: "Votre maison",
      ouverte: "Entrer",
      close: "Vous n’entrez pas ici",
      /** Le cas de la directrice : aucune maison à elle, et les quatre ouvertes. */
      aucuneSienne:
        "Vous n’êtes d’aucune maison — et vous entrez dans les quatre.",
      ariaListe: "Les quatre maisons",
    },
    rune: "ᛗ",
    /** Le blason est du décor : le nom de la maison est écrit à côté. */
    altBlason: "",
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
    /**
     * **Le journal du château**, qui a remplacé le panneau « Annonces du
     * Grand Hall » le 27 août 2026. Le papier est son propre cadre : une
     * bordure de panneau autour d’une une de gazette ferait un cadre dans un
     * cadre.
     *
     * Le titre est dans l’image, en grandes capitales. Celui d’ici est le
     * même, **invisible à l’œil et lu à voix haute** : une image ne donne pas
     * son titre à un lecteur d’écran, et un panneau sans titre ne se repère
     * pas dans une page.
     */
    journal: {
      titre: "Le Guetteur du Nord",
      /** L’image est de la décoration : tout ce qui compte est du vrai texte. */
      altDecor: "",
      vide: "Rien à signaler cette semaine.",
      /** Le nom accessible de la zone qui défile, dans le cadre. */
      regionAnnonces: "Les annonces du château",
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
