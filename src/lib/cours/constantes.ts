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

  /**
   * **Le registre des contrôles** — la porte des professeurs, posée le
   * 4 septembre 2026.
   *
   * ⚠️ **On dit « les contrôles envoyés », jamais « les copies ».** L'écran
   * ne montre que des notes, et le vocabulaire ne doit pas promettre plus que
   * ce que la permission ouvre.
   */
  /**
   * **La salle des professeurs** — le nom est du joueur, 4 septembre 2026, et
   * il est meilleur que « le registre des contrôles » qu'il remplace : ce
   * n'est pas un tableau de bord, c'est une pièce où l'on entre.
   *
   * ⚠️ **On y lit des notes, jamais des copies.** Le vocabulaire ne doit
   * promettre que ce que la permission ouvre.
   */
  salle: {
    /** L'entrée sur la page des cours, visible du seul détenteur. */
    entree: "La salle des professeurs",
    entreeAide: "Le relevé de chaque élève, et son avancement dans les cours.",

    titre: "La salle des professeurs",
    chapeau:
      "Choisissez un élève pour ouvrir son relevé : ce qu'il a passé, ses notes, et où il en est dans le programme de son année.",

    /** Le regroupement de la liste. Les années d'abord, le château ensuite. */
    chateau: "Le château",
    chateauAide:
      "Ceux qui portent un titre plutôt qu'une année. Ils passent les contrôles comme les autres.",

    aucun: "Aucun membre à afficher.",

    /** Sur chaque ligne : où en est ce membre. Le singulier a sa phrase. */
    avancement: "{n} contrôles envoyés",
    avancementUn: "1 contrôle envoyé",
    avancementAucun: "Aucun contrôle envoyé",

    /** Les derniers envois, tous élèves confondus. */
    recents: "Les derniers contrôles envoyés",
    recentsAucun: "Aucun contrôle n'a encore été envoyé.",

    /** La ligne survit au compte : le nom, lui, s'en va. */
    compteParti: "Un membre qui n'est plus là",
  },

  /**
   * **Le relevé d'un élève.** Ses notes, et son avancement.
   */
  releve: {
    retour: "Retour à la salle des professeurs",
    /**
     * ⚠️ **`{qui}` reçoit déjà « de … » ou « d’… »** — voir `avecDe`. « Relevé
     * de Ingrid » est la faute qu'on a déjà corrigée sur les héritages du
     * cursus, et elle revient partout où un nom suit une préposition.
     */
    titre: "Relevé {qui}",

    /** Le résumé en tête : ce qu'il a passé sur ce qui lui est ouvert. */
    resume: "{envoyes} contrôles passés sur {possibles} ouverts",
    resumeUn: "1 contrôle passé sur {possibles} ouverts",
    resumeUnSeulOuvert: "{envoyes} contrôle passé sur 1 ouvert",
    resumeRien: "Aucune leçon ne lui est encore ouverte",

    /**
     * Le total des notes.
     *
     * ⚠️ **Ce n'est pas une moyenne d'examen.** Les deux seuils du cursus —
     * 50 % par matière, 60 % de moyenne — portent sur les examens de fin
     * d'année, qui ne sont pas construits. Les nommer ici ferait croire à un
     * élève qu'il est reçu ou recalé sur ses contrôles de leçon.
     */
    total: "{points} bonnes réponses sur {surCombien}",
    totalAucun: "Rien de noté pour l'instant",

    /** En face de chaque leçon. */
    passe: "{note} sur {surCombien}",
    pasPasse: "Pas encore passé",
    pasOuverte: "Pas encore ouverte",

    /** Une année du programme qui ne porte aucune leçon en ligne. */
    rien: "Aucune leçon n'est encore en ligne pour son année.",
  },


  /** Les inscriptions ne sont pas construites non plus. */
  inscriptions: {
    aVenir:
      "Le choix des matières se fera ici, une fois par année, à l’ouverture de la session.",
  },
} as const;
