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
      "Il attend maintenant la lecture de l’administration. Rien ne s’ouvre avant : ni la Grande Salle, ni les scènes, ni les cours. Tu recevras un courriel dès que la décision sera prise.",
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
