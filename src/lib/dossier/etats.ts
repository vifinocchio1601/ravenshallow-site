/**
 * Libellés des états, fonctions et droits d’accès.
 * Miroir des enums Prisma — aucun de ces textes ne doit être écrit ailleurs.
 */

export type StatutDossier =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "ACCEPTE"
  | "A_CORRIGER"
  | "REFUSE";

export type StatutAcces = "EN_ATTENTE" | "VALIDE" | "EN_BANNISSEMENT";

/**
 * Le rôle technique du compte. Miroir de l’enum Prisma `Role`.
 *
 * **À ne pas confondre avec `roleAffiche`**, qui est un libellé décoratif et
 * n’ouvre rien. Celui-ci ouvre : `MODERATEUR` et `ADMIN` sont le staff, et
 * « les modérateurs interviennent partout » sur le forum, y compris pour clore
 * un sujet abandonné (art. 17.2).
 *
 * Il ne dit rien des permissions à la carte, qui vivent à part et s’accordent
 * à n’importe quel membre : la directrice du château n’est pas modératrice du
 * site, et peut pourtant écrire les annonces des quatre maisons.
 */
export type Role = "JOUEUR" | "MODERATEUR" | "ADMIN";

export const ROLES: readonly Role[] = ["JOUEUR", "MODERATEUR", "ADMIN"];

export const LIBELLES_ROLE: Record<Role, { court: string; detail: string }> = {
  JOUEUR: { court: "Joueur", detail: "Aucun pouvoir de modération" },
  MODERATEUR: {
    court: "Modérateur",
    detail: "Intervient partout sur le forum",
  },
  ADMIN: { court: "Administrateur", detail: "Comme modérateur, sans réserve" },
};

/**
 * L’année d’étude, et rien d’autre. Miroir de l’enum Prisma `Fonction`.
 *
 * `PROFESSEUR` et `DIRECTION` en ont été retirés : un rôle au château se
 * saisit maintenant en toutes lettres dans `roleAffiche`, et deux façons
 * d’écrire « directrice » auraient fini par se contredire.
 */
export type Fonction =
  | "PREMIERE_ANNEE"
  | "DEUXIEME_ANNEE"
  | "TROISIEME_ANNEE"
  | "QUATRIEME_ANNEE"
  | "CINQUIEME_ANNEE"
  | "SIXIEME_ANNEE"
  | "SEPTIEME_ANNEE";

export type Genre = "FEMININ" | "MASCULIN" | "AUTRE";

/**
 * Où en est une étape des premiers pas — ou si elle ne concerne pas ce compte.
 * Miroir de l’enum Prisma `EtatEtape`.
 *
 * **Ne jamais déduire cet état de la présence d’une valeur.** Une maison
 * absente veut dire « le Miroir l’attend » pour un élève et « ce n’est pas son
 * sujet » pour une directrice : le site doit faire l’inverse dans les deux
 * cas, et seule cette valeur-ci sait laquelle.
 */
export type EtatEtape = "NON_FAIT" | "FAIT" | "SANS_OBJET";

/** Les deux étapes des premiers pas, telles que l’administration les pilote. */
export type Etape = "maison" | "baguette";

/**
 * Ce que l’administration demande — jamais un état directement.
 *
 * `RETABLIR` ne rend pas un état choisi : il rend **celui que la valeur
 * commande**. Une maison écrite revient à `FAIT`, une case vide à `NON_FAIT`.
 * Il n’y a donc aucun moyen de fabriquer un état bancal depuis l’écran, et
 * aucune question à poser à l’administrateur.
 */
export type ActionEtape = "RETIRER" | "RETABLIR";

export const LIBELLES_ETAT_ETAPE: Record<EtatEtape, string> = {
  NON_FAIT: "Attendu",
  FAIT: "Fait",
  SANS_OBJET: "Sans objet",
};

/** Les quatre maisons (bible du lore, §4). Miroir de l’enum Prisma `Maison`. */
export type Maison = "KALDRAFN" | "NATTORM" | "BRYGGELD" | "TIDEAL";

/**
 * Dans l’ordre de l’enum Prisma — donc de la fondation de l’école.
 *
 * Cet ordre est celui du parcours des maisons dans le calcul de la
 * répartition. Il n’y départage jamais rien : deux maisons ne peuvent pas
 * marquer le même nombre de points sur une même réponse, le barème donnant
 * toujours 2 à l’une et 1 à l’autre.
 */
export const MAISONS: readonly Maison[] = [
  "KALDRAFN",
  "NATTORM",
  "BRYGGELD",
  "TIDEAL",
];

/**
 * **La clé d'une maison dans une adresse** — « kaldrafn », « tideal ».
 *
 * La valeur de l'enum, en minuscules, et rien d'autre : une table de
 * correspondance tenue à la main finirait par diverger, et l'on se
 * retrouverait avec une maison joignable par deux adresses ou par aucune.
 *
 * ⚠️ **`TIDEAL` n'a pas d'accent dans le code**, et sa clé n'en a donc pas non
 * plus. Le nom qui s'affiche — « Tideål » — vit dans `NOMS_MAISON`, et c'est
 * le seul endroit où il porte son rond.
 */
export function cleDeMaison(maison: Maison): string {
  return maison.toLowerCase();
}

/** L'inverse, et il refuse tout ce que `MAISONS` ne reconnaît pas. */
export function maisonDepuisCle(cle: string): Maison | null {
  const cherchee = MAISONS.find((m) => cleDeMaison(m) === cle.toLowerCase());
  return cherchee ?? null;
}

export const LIBELLES_STATUT_DOSSIER: Record<StatutDossier, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente de lecture",
  ACCEPTE: "Accepté",
  A_CORRIGER: "À corriger",
  REFUSE: "Refusé",
};

export const LIBELLES_STATUT_ACCES: Record<
  StatutAcces,
  { court: string; detail: string }
> = {
  VALIDE: { court: "Validé", detail: "Accès total à l’école" },
  EN_ATTENTE: { court: "En attente", detail: "Pas d’accès à l’école" },
  EN_BANNISSEMENT: {
    court: "En bannissement",
    detail: "Pas d’accès au forum, accès au bureau",
  },
};

const ANNEES: Record<string, string> = {
  PREMIERE_ANNEE: "1re année",
  DEUXIEME_ANNEE: "2e année",
  TROISIEME_ANNEE: "3e année",
  QUATRIEME_ANNEE: "4e année",
  CINQUIEME_ANNEE: "5e année",
  SIXIEME_ANNEE: "6e année",
  SEPTIEME_ANNEE: "7e année",
};

/**
 * Les deux valeurs retirées de la liste.
 *
 * Plus personne ne peut les choisir — mais le journal d’un membre garde les
 * changements d’avant, et « PREMIERE_ANNEE → DIRECTION » doit rester lisible.
 * Effacer cette table rendrait l’historique muet.
 */
const ANNEES_RETIREES: Record<string, string> = {
  PROFESSEUR: "Professeur",
  DIRECTION: "Direction",
};

/**
 * **Le rang d’une année, de 1 à 7 — et le seul endroit qui en compare deux.**
 *
 * `Fonction` est une liste de chaînes : sans rang, chaque page qui veut savoir
 * si un élève « a atteint la quatrième année » réinventerait un ordre, et
 * c’est la copie qu’on oublierait de corriger.
 *
 * Une valeur inconnue — les deux retirées de l’enum, ou une valeur d’avant un
 * renommage — rend **1**, le sens prudent : elle ferme les portes plutôt que
 * de les ouvrir par accident.
 *
 * **Le redoublant ne perd rien** : son année ne bouge pas au redoublement
 * (art. 18.5), donc son rang non plus. C’est acquis par construction, il n’y a
 * rien à écrire pour l’obtenir.
 */
export function rangAnnee(fonction: Fonction): number {
  const rang = FONCTIONS.indexOf(fonction);
  return rang === -1 ? 1 : rang + 1;
}

/**
 * **L’année d’après, ou `null` en septième** — art. 18.4.
 *
 * Ici parce que c’est le seul fichier qui connaisse l’ordre des années :
 * `rangAnnee` et `atteintLAnnee` s’y appuient déjà, et une seconde liste
 * tenue ailleurs finirait par diverger de celle-ci.
 *
 * `null` en septième année n’est pas une erreur : c’est la fin des études.
 * L’élève reste où il est, et ce qu’il devient est une décision de lore que
 * le règlement ne tranche pas.
 */
export function anneeSuivante(fonction: Fonction): Fonction | null {
  const rang = FONCTIONS.indexOf(fonction);
  if (rang === -1 || rang >= FONCTIONS.length - 1) return null;
  return FONCTIONS[rang + 1]!;
}

/** L’année exigée est-elle atteinte ? `null` = aucune exigence. */
export function atteintLAnnee(
  fonction: Fonction,
  requise: Fonction | null,
): boolean {
  if (!requise) return true;
  return rangAnnee(fonction) >= rangAnnee(requise);
}

/** Libellé d’une année. Sait aussi relire les deux valeurs retirées. */
export function libelleAnnee(fonction: Fonction): string {
  return ANNEES[fonction] ?? ANNEES_RETIREES[fonction] ?? fonction;
}

/**
 * **La place du personnage, telle qu’elle s’affiche.**
 *
 * C’est ici que le rôle particulier remplace l’année : une directrice n’est
 * pas en troisième année. L’année reste stockée et modifiable — elle est
 * masquée, pas effacée : vider le rôle la fait réapparaître.
 *
 * Le rôle n’est pas facultatif dans la signature, et c’est délibéré : partout
 * où l’année s’affiche, l’oublier devient une erreur de compilation plutôt
 * qu’une page qui annonce tranquillement la directrice en première année.
 *
 * Ce libellé n’ouvre rien. Il n’est lu par aucun contrôle d’accès, et ne doit
 * jamais l’être — voir `lib/dossier/role-affiche.ts`.
 */
export function libellePlace(
  fonction: Fonction,
  roleAffiche: string | null,
): string {
  return roleAffiche ?? libelleAnnee(fonction);
}

export const FONCTIONS: Fonction[] = [
  "PREMIERE_ANNEE",
  "DEUXIEME_ANNEE",
  "TROISIEME_ANNEE",
  "QUATRIEME_ANNEE",
  "CINQUIEME_ANNEE",
  "SIXIEME_ANNEE",
  "SEPTIEME_ANNEE",
];

export const STATUTS_ACCES: StatutAcces[] = [
  "VALIDE",
  "EN_ATTENTE",
  "EN_BANNISSEMENT",
];

/** Textes de l’administration et des écrans d’état du joueur. */
export const TEXTES_ETATS = {
  envoye: {
    titre: "Ton dossier est parti",
    corps:
      "Il attend maintenant la lecture de l’administration. Rien ne s’ouvre avant : ni le château, ni les scènes, ni les cours. Tu recevras un courriel dès que la décision sera prise.",
    badge: "En attente de lecture",
  },
  correction: {
    titre: "Ton dossier revient corrigé",
    corps:
      "Rien n’est perdu : tout ce que tu as écrit t’attend tel quel. Reprends seulement ce qui est signalé, puis renvoie-le.",
    noteTitre: "Note de l’administration",
    badge: "À corriger",
    action: "Reprendre mon dossier",
  },
  accepte: {
    titre: "Ton dossier est accepté",
    corps:
      "Le château t’ouvre ses portes. Deux choses t’attendent avant tout le reste : la baguette, chez Bjornstav à Kaldvik, puis le Miroir de Brume.",
    badge: "Accepté",
  },
  refuse: {
    titre: "Ton dossier n’a pas été retenu",
    corps: "L’administration t’a laissé un mot ci-dessous.",
    badge: "Refusé",
  },

  /**
   * Ce qui entoure les trois écrans d’état, une fois le joueur connecté.
   *
   * Ces pages sont des culs-de-sac assumés : rien de l’école ne s’ouvre
   * avant l’acceptation du dossier. On n’y laisse donc que deux issues —
   * écrire à l’administration, ou repartir.
   */
  pages: {
    eyebrow: "Ton dossier",
    contact: "Écrire à l’administration",
    adresseContact: "ravenshallow.rp@gmail.com",
    deconnexion: "Se déconnecter",
    accueil: "Retour à l’accueil",

    attente: {
      detail:
        "Chaque dossier est lu en entier, dans l’ordre d’arrivée. Tu recevras un courriel dès qu’une décision sera prise — inutile de revenir vérifier ici.",
      // Le refrain « rien ne s’ouvre » est déjà dans le corps de l’écran :
      // le répéter ici sonnerait comme une punition. On donne plutôt une
      // prise — la seule dont le joueur dispose à ce stade.
      rappel:
        "Tu as reçu un courriel à l’envoi de ton dossier : son lien te permet de corriger ta fiche tant qu’elle est en lecture, si tu y repères une faute.",
    },

    correction: {
      detail:
        "Tout ce que tu as écrit t’attend intact : reprends seulement ce qui est signalé ci-dessus, puis renvoie ton dossier.",
    },

    refus: {
      detail:
        "Si la décision te paraît injuste ou repose sur un malentendu, tu peux écrire à l’administration. Un refus n’interdit pas de proposer un autre personnage plus tard.",
      sansNote: "Aucun motif n’a été laissé.",
    },
  },

  admin: {
    inscriptions: {
      titre: "Inscriptions",
      eyebrow: "Dossiers à lire",
      vide: "Aucun dossier en attente pour l’instant.",
      lire: "Lire le dossier",
      depuis: "Déposé le",
      /**
       * Ce qu'un lecteur d'écran entend à la place de la pastille — « 0 » et
       * « 1 » sont au singulier en français, et zéro n'affiche rien du tout :
       * une pastille vide est du bruit sur un tableau de bord.
       */
      unALire: "1 dossier à lire",
      aLire: "{n} dossiers à lire",
    },
    membres: {
      titre: "Liste des membres",
      eyebrow: "L’école",
      vide: "Aucun membre pour l’instant.",
      age: "Âge",
      // La liste ne porte plus que les sept années : « Fonction » n’aurait
      // plus décrit ce qu’elle contient.
      annee: "Année",
      acces: "Statut d’accès",
      jusquau: "Suspendu jusqu’au",
      jusquauAide: "Vide = exclusion définitive",
      enregistrer: "Enregistrer",
      enregistre: "Modifications enregistrées",
    },
    /**
     * Les deux commandes de la fiche d’un membre.
     *
     * Chaque confirmation dit ce qui disparaît **et** ce qui est conservé :
     * un administrateur qui retire une maison doit savoir, avant de cliquer,
     * qu’il ne l’efface pas.
     */
    etapes: {
      titre: "Maison et baguette",
      aide: "Une directrice, un professeur, un intendant ne sont concernés ni par le Miroir ni par la boutique. Retirer une étape n’efface rien : la valeur reste en base et se rétablit d’un clic.",
      retirer: "Retirer",
      retablir: "Rétablir",
      annuler: "Annuler",
      /** Ce que porte le fil du journal, une fois l’action passée. */
      poseeLe: "Modifié le",

      maison: {
        terme: "Maison",
        aucune: "Aucune",
        eyebrow: "La maison",
        etatDetail: {
          NON_FAIT: "Attendu au Miroir de Brume",
          FAIT: "Réparti — la maison s’affiche et compte au tournoi",
          SANS_OBJET: "Ce compte n’est pas concerné par la répartition",
        },
        retrait: {
          titre: "Retirer la maison de {nom} ?",
          corps:
            "Ce compte n’aura plus de maison : ni blason, ni mention sur sa fiche, et il cessera de compter au tournoi inter-maisons. Le Miroir ne l’attendra plus, et la note des premiers pas disparaîtra de son bureau.",
          conserve:
            "Sa maison actuelle — {valeur} — est conservée et pourra être rétablie.",
          confirmer: "Retirer la maison",
        },
        retablissement: {
          titre: "Rétablir la maison de {nom} ?",
          corps:
            "Ce compte retrouve sa maison, telle qu’elle était : {valeur}. Elle réapparaîtra sur sa fiche et dans le bandeau, et il comptera de nouveau au tournoi.",
          sansValeur:
            "Ce compte n’a jamais été réparti : le Miroir de Brume l’attendra de nouveau, et la note des premiers pas réapparaîtra sur son bureau.",
          confirmer: "Rétablir la maison",
        },
      },

      baguette: {
        terme: "Baguette",
        aucune: "Aucune",
        eyebrow: "La baguette",
        etatDetail: {
          NON_FAIT: "Attendu chez Bjornstav, à Kaldvik",
          FAIT: "Choisie — elle s’affiche sur la fiche et au bureau",
          SANS_OBJET: "Ce compte n’est pas concerné par la boutique",
        },
        retrait: {
          titre: "Retirer la baguette de {nom} ?",
          corps:
            "La baguette disparaîtra de sa fiche et de son bureau, sans rien à la place. La boutique ne l’attendra plus, et la note des premiers pas disparaîtra.",
          conserve:
            "Sa baguette actuelle — {valeur} — est conservée et pourra être rétablie.",
          confirmer: "Retirer la baguette",
        },
        retablissement: {
          titre: "Rétablir la baguette de {nom} ?",
          corps:
            "Ce compte retrouve sa baguette, telle qu’elle était : {valeur}.",
          sansValeur:
            "Ce compte n’est jamais passé à Kaldvik : la boutique l’attendra de nouveau, et la note des premiers pas réapparaîtra sur son bureau.",
          confirmer: "Rétablir la baguette",
        },
      },
    },

    suppression: {
      bouton: "Supprimer ce membre",
      titre: "Supprimer {nom} ?",
      corps:
        "Son compte, sa fiche, son journal et sa réservation de visage seront effacés. Cette action est définitive.",
      confirmer: "Supprimer définitivement",
      annuler: "Annuler",
      faite: "Membre supprimé.",
    },

    actions: {
      accepter: "Accepter",
      corriger: "Renvoyer en correction",
      refuser: "Refuser",
      note: "Note de l’administration",
      notePlaceholder:
        "Ce que le joueur doit reprendre, en toutes lettres. Il ne verra que ça.",
      noteRequise:
        "La note est obligatoire pour un renvoi en correction ou un refus.",
      retour: "Retour aux inscriptions",
    },
    journal: {
      titre: "Journal",
      vide: "Rien à signaler pour l’instant.",
      par: "par",
      systeme: "le joueur",
    },
  },
} as const;
