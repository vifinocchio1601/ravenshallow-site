/**
 * **Tous les textes des cours.** Rien en dur dans un composant, apostrophes
 * typographiques, et **aucun import** — comme `corbeaux/constantes.ts`.
 *
 * Le vouvoiement est celui des écrans récents — les maisons, le Grand Hall,
 * les alentours. Le forum tutoie parce qu’il s’adresse au joueur qui écrit ;
 * ici, c’est l’école qui parle.
 */

export const TEXTES_COURS = {
  /** Ce qui s’affiche au bandeau, sous « Le domaine ». */
  nom: "Les cours",

  annees: {
    eyebrow: "Le domaine",
    titre: "Les cours",
    chapeau:
      "Sept années, trois cycles, neuf matières. On revient quand on veut sur le programme des années déjà faites — celles qui restent devant s’ouvriront à leur tour.",

    /**
     * Sous chaque cycle, le rappel de ce qu’il impose.
     *
     * ⚠️ **La charge varie D’UNE ANNÉE À L’AUTRE dans un même cycle** : le
     * Seuil en compte 6, puis 7, puis 8. Une phrase qui n’annoncerait que la
     * première serait fausse pour les deux suivantes — c’est ce qu’elle
     * faisait avant d’être relue à l’écran.
     *
     * Et **le singulier compte** : « 1 matières imposées » est la faute que
     * personne ne relit. La Veille n’en impose qu’une.
     */
    cycleSansChoix: "Tout est imposé : {n} matières.",
    cycleSansChoixPlage: "Tout est imposé : de {min} à {max} matières.",
    cycleAvecChoix:
      "{n} matières imposées, et {choix} à choisir parmi celles qui s’ouvrent.",
    cycleAvecChoixUne:
      "1 matière imposée, et {choix} à choisir parmi celles qui s’ouvrent.",

    /**
     * ⚠️ **Une année fermée s’affiche**, elle ne disparaît pas — comme une
     * maison où l’on n’entre pas. Et la raison est écrite : un état ne se
     * signale jamais par la seule couleur.
     */
    fermee: "Pas encore",
    fermeeAria: "Année verrouillée :",
    fermeeRaison: "Vous n’en êtes pas encore là (article 14.4).",

    /** L’année où l’on est. Le mot compte plus que le liseré. */
    laMienne: "Votre année",
  },

  annee: {
    /**
     * Les leçons d'une matière.
     *
     * ⚠️ **« Pas encore ouverte » est dit en toutes lettres**, jamais signalé
     * par la seule couleur ni par une absence : le staff voit le lien, l'élève
     * ne le voit pas du tout — et quand il le verra, il n'y aura plus de
     * mention. Un état ne se signale jamais par la seule couleur.
     */
    lecons: {
      titre: "Leçons",
      lien: "Leçon {rang} sur {total} — {titre}",
      fermee: "Pas encore ouverte aux élèves",
      /**
       * ⚠️ **Avec la DATE**, et pas seulement « pas encore ». Seul le staff
       * lit cette mention, et ce qu'il a besoin de savoir est *quand* — pour
       * relire d'ici là, ou pour corriger la date si elle est fausse. C'est
       * exactement ce qui a manqué le 3 septembre 2026 : l'ouverture dépendait
       * du déploiement, et rien à l'écran ne disait quel jour elle tomberait.
       */
      ouvreLe: "Ouverte aux élèves le {quand}",

      /**
       * Ce qu'on lit en face d'une leçon dont le contrôle est passé.
       *
       * ⚠️ **Le singulier compte**, et c'est la faute que personne ne relit :
       * « 1 jours », « 1 bonne réponses ». Même règle que « 0 point » et
       * qu'« Il manque 1 ligne ».
       */
      controleEnvoye: "Contrôle envoyé · {note} sur {total}",
      /** Le chrono des sept jours, vu de la liste. Il tourne à la seconde sur
       *  la page du contrôle ; ici, une liste n'a pas besoin des secondes. */
      prochaineDans: "Prochaine leçon dans {n} jours",
      prochaineDansUnJour: "Prochaine leçon demain",
      prochaineOuverte: "Le délai est écoulé",
    },

    retour: "Retour aux sept années",
    /** « Cycle du Seuil », en tête de page. */
    cycle: "Cycle : {cycle}",
    charge: "{n} matières cette année",

    imposees: {
      titre: "Les matières imposées",
      aide: "Elles ne se refusent pas.",
    },

    choix: {
      titre: "À choisir",
      /** « Trois matières parmi les six qui s’ouvrent cette année. » */
      aide: "{choix} matières parmi les {offertes} qui s’ouvrent cette année.",
      /** La Veille ne propose que des hautes études : le dire une fois. */
      hauteEtude:
        "En sixième et septième année, ces matières deviennent des hautes études : on les suit après en avoir posé les bases.",
    },

    /** Ce qu’une matière porte sous son nom. */
    matiere: {
      /** ⚠️ `{qui}` reçoit déjà « de … » ou « d’… » — voir `avecDe`. */
      heritage: "Héritage {qui}",
      prerequis: "Après {matieres}",
      /** Le mot du statut, écrit et non deviné à la couleur. */
      statuts: {
        OBLIGATOIRE: "Imposée",
        OPTION: "Au choix",
        HAUTE_ETUDE: "Haute étude",
      },
    },

    /**
     * **Ce qui manque encore se dit**, plutôt que de laisser croire à une page
     * cassée. C'est le procédé des salles à venir.
     *
     * ⚠️ **Cette phrase a menti pendant quelques heures le 4 septembre 2026** :
     * elle annonçait encore les leçons et les contrôles « avec le lot suivant »
     * alors que les six premiers étaient en ligne au-dessus d'elle. Une phrase
     * de ce genre se relit à chaque lot qui la dépasse — elle ne tombe dans
     * aucun test, et c'est l'écran qui l'a montrée.
     */
    aVenir:
      "Les examens de fin d’année viendront avec le lot suivant. Les leçons de première année, elles, sont ouvertes, et chacune se termine par un contrôle.",
  },

  /** Les inscriptions ne sont pas construites non plus. */
  inscriptions: {
    aVenir:
      "Le choix des matières se fera ici, une fois par année, à l’ouverture de la session.",
  },
} as const;
