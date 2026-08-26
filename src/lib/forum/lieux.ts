/**
 * **Les règles d’un lieu : qui le lit, qui y ouvre un sujet, qui y répond.**
 *
 * C’est le seul endroit du site qui répond à ces trois questions. La page s’y
 * réfère pour griser, la route d’API pour accepter ou refuser — et elle refait
 * le contrôle **en entier** : une route d’API est publique, et rien n’oblige un
 * joueur à passer par l’écran avant de l’appeler.
 *
 * Pas de `server-only` : le fichier ne contient aucune donnée, seulement des
 * règles, et les deux côtés doivent les lire au mot près. Même choix que
 * `corbeaux/droits.ts` et `forum/pouvoirs.ts`.
 *
 * ── Ce que ce fichier NE fait pas ──
 *
 * Il n’applique **aucun mode de participation**. Libre, sur invitation,
 * réservé : c’est une convention entre joueurs, écrite dans le titre du sujet,
 * et le site ne s’en mêle pas — décision du joueur, 26 août 2026. Un intrus se
 * règle en privé, ou par un corbeau à l’administration.
 *
 * Il ne **compte pas les scènes** pour refuser une ouverture : la limite de
 * l’article 17.3 est affichée, jamais opposée. Voir `forum/scenes.ts`.
 */

import {
  atteintLAnnee,
  type EtatEtape,
  type Fonction,
  type Maison,
} from "@/lib/dossier/etats";
import { aUneMaison } from "@/lib/session/acces";
import {
  estStaff,
  peutEcrireLesAnnoncesDe,
  peutLireLesEspacesDe,
  type Pouvoirs,
} from "./pouvoirs";

export type QuiOuvreUnSujet =
  | "TOUT_MEMBRE"
  | "MEMBRES_MAISON"
  | "DETENTEUR_PERMISSION"
  /** « Sur convocation » : le staff seul ouvre. L’élève convoqué répond. */
  | "STAFF_SEULEMENT";

/**
 * L’ordre de sévérité, du plus ouvert au plus fermé.
 *
 * Il ne sert qu’à la résolution : une section prend **la plus stricte** des
 * deux valeurs. Sans cet ordre, « resserrer » n’aurait pas de sens pour ce
 * réglage-là, et une pièce pourrait rouvrir ce que l’espace a fermé.
 */
const SEVERITE: Record<QuiOuvreUnSujet, number> = {
  TOUT_MEMBRE: 0,
  MEMBRES_MAISON: 1,
  DETENTEUR_PERMISSION: 2,
  STAFF_SEULEMENT: 3,
};

export type QuiRepond = "TOUT_MEMBRE" | "MEMBRES_MAISON";

export type Visibilite = "TOUS" | "MAISON";

/** Les paramètres d’un espace. Miroir des colonnes de `espaces`. */
export type ParametresEspace = {
  lignesMinimum: number | null;
  quiOuvreUnSujet: QuiOuvreUnSujet;
  quiRepond: QuiRepond;
  comptePourLesPoints: boolean;
  compteLesScenes: boolean;
  visibilite: Visibilite;
  anneeMinimale: Fonction | null;
  ouvert: boolean;
};

/** Ce qu’une section peut resserrer. Nul = on garde ce que l’espace dit. */
export type ParametresSection = {
  anneeMinimale: Fonction | null;
  maisonReservee: Maison | null;
  visibilite: Visibilite | null;
  /** « Sur convocation » se règle ici. Nul = on garde ce que l’espace dit. */
  quiOuvreUnSujet: QuiOuvreUnSujet | null;
  ouverte: boolean;
};

/** Les règles effectives, une fois l’espace corrigé par la section. */
export type ReglesDuLieu = ParametresEspace & { maisonReservee: Maison | null };

/**
 * **Une section ne peut que RESSERRER ce que l’espace a ouvert.**
 *
 * On prend la plus stricte des deux valeurs, jamais celle de la section
 * aveuglément : une surcharge qui ouvrirait une porte que l’espace ferme
 * serait une porte dérobée, et personne ne la verrait en lisant l’espace.
 *
 * Le sens du resserrement, pour chaque réglage :
 *   année        — la plus haute des deux
 *   visibilité   — `MAISON` l’emporte sur `TOUS`
 *   ouverture    — il faut que les deux soient ouverts
 *   qui ouvre    — la plus sévère des deux
 */
export function reglesDuLieu(
  espace: ParametresEspace,
  section?: ParametresSection | null,
): ReglesDuLieu {
  if (!section) return { ...espace, maisonReservee: null };

  return {
    ...espace,
    anneeMinimale: laPlusHaute(espace.anneeMinimale, section.anneeMinimale),
    visibilite:
      espace.visibilite === "MAISON" || section.visibilite === "MAISON"
        ? "MAISON"
        : "TOUS",
    quiOuvreUnSujet: laPlusSevere(
      espace.quiOuvreUnSujet,
      section.quiOuvreUnSujet,
    ),
    maisonReservee: section.maisonReservee,
    ouvert: espace.ouvert && section.ouverte,
  };
}

function laPlusSevere(
  espace: QuiOuvreUnSujet,
  section: QuiOuvreUnSujet | null,
): QuiOuvreUnSujet {
  if (!section) return espace;
  return SEVERITE[section] > SEVERITE[espace] ? section : espace;
}

function laPlusHaute(
  a: Fonction | null,
  b: Fonction | null,
): Fonction | null {
  if (!a) return b;
  if (!b) return a;
  return atteintLAnnee(a, b) ? a : b;
}

// ─────────────────────────────────────────────────────────────
//  Le membre
// ─────────────────────────────────────────────────────────────

/** Le strict nécessaire pour décider — ni la fiche, ni la baguette. */
export type PourLeForum = {
  fonction: Fonction;
  /** **Ne pas la lire directement** : voir ci-dessous. */
  maison: string | null;
  etatMaison: EtatEtape;
};

/**
 * La maison du membre, **au sens des accès**.
 *
 * `FAIT` et rien d’autre : une directrice garde Tideål en base sous
 * `SANS_OBJET`, et ne doit pas pour autant écrire dans son dortoir. C’est la
 * même condition que `maisonQuiCompte`, dans `ecole/tournoi.ts`, et les deux
 * restent séparées à dessein — l’un dit qui marque, l’autre qui entre.
 */
export function maisonDuMembre(membre: PourLeForum): Maison | null {
  return aUneMaison(membre) ? (membre.maison as Maison | null) : null;
}

// ─────────────────────────────────────────────────────────────
//  Les verdicts
// ─────────────────────────────────────────────────────────────

export type RaisonRefus =
  /** Le lieu est fermé à l’écriture — sans que rien y soit caché. */
  | "LIEU_FERME"
  /** L’année n’est pas atteinte. Le contenu reste lisible. */
  | "ANNEE_INSUFFISANTE"
  /** Un dortoir, ou un espace de maison : l’écriture est réservée. */
  | "RESERVE_A_LA_MAISON"
  /** Les annonces : il faut être préfet, ou détenir la permission. */
  | "PERMISSION_REQUISE"
  /** « Sur convocation » : le sujet s’ouvre par le staff, pas par l’élève. */
  | "SUR_CONVOCATION"
  /** Le sujet est clos (art. 17.2). Les points acquis restent acquis. */
  | "SUJET_CLOS";

export type Verdict =
  | { peut: true }
  | {
      peut: false;
      raison: RaisonRefus;
      /** Renseignée pour `ANNEE_INSUFFISANTE` : « à partir de la 4e année ». */
      anneeRequise?: Fonction;
      /** Renseignée pour `RESERVE_A_LA_MAISON` et `PERMISSION_REQUISE`. */
      maison?: Maison;
    };

const OUI: Verdict = { peut: true };

/**
 * **Lire.**
 *
 * Presque tout est lisible, et c’est voulu : un première année lit ce qui se
 * joue dans les souterrains, il ne peut simplement pas y écrire ; un dortoir
 * se lit de partout. « Un site où l’on ne voit rien paraît vide, et voir une
 * porte fermée donne envie. »
 *
 * Seule la visibilité `MAISON` referme vraiment — l’espace d’une maison.
 */
export function peutLireLeLieu(
  membre: PourLeForum,
  pouvoirs: Pouvoirs,
  regles: ReglesDuLieu,
): boolean {
  if (regles.visibilite === "TOUS") return true;
  if (estStaff(pouvoirs)) return true;

  const laSienne = maisonDuMembre(membre);
  // Un lieu réservé « à sa maison » sans en nommer une : chacun y voit la
  // sienne, et qui n'en a pas n'y voit rien.
  if (!regles.maisonReservee) return laSienne !== null;

  return (
    laSienne === regles.maisonReservee ||
    peutLireLesEspacesDe(pouvoirs, regles.maisonReservee)
  );
}

/**
 * **Ouvrir un sujet.**
 *
 * L’ordre des questions compte : le staff passe avant tout — « les modérateurs
 * interviennent partout » —, puis le lieu, puis l’année, puis la maison, puis
 * seulement le réglage d’ouverture.
 */
export function peutOuvrirUnSujet(
  membre: PourLeForum,
  pouvoirs: Pouvoirs,
  regles: ReglesDuLieu,
): Verdict {
  if (estStaff(pouvoirs)) return OUI;

  if (!regles.ouvert) return { peut: false, raison: "LIEU_FERME" };

  if (!atteintLAnnee(membre.fonction, regles.anneeMinimale)) {
    return {
      peut: false,
      raison: "ANNEE_INSUFFISANTE",
      anneeRequise: regles.anneeMinimale ?? undefined,
    };
  }

  const laSienne = maisonDuMembre(membre);

  // Un dortoir : l'écriture est réservée, quelle que soit la façon dont les
  // sujets s'y ouvrent.
  if (regles.maisonReservee && laSienne !== regles.maisonReservee) {
    return {
      peut: false,
      raison: "RESERVE_A_LA_MAISON",
      maison: regles.maisonReservee,
    };
  }

  switch (regles.quiOuvreUnSujet) {
    case "TOUT_MEMBRE":
      return OUI;

    case "MEMBRES_MAISON":
      return regles.maisonReservee && laSienne === regles.maisonReservee
        ? OUI
        : {
            peut: false,
            raison: "RESERVE_A_LA_MAISON",
            maison: regles.maisonReservee ?? undefined,
          };

    // « Sur convocation » : le staff est déjà passé plus haut, donc si l'on
    // arrive ici, c'est un élève — et il n'ouvre pas ce sujet lui-même. Il
    // pourra répondre, ce qui est tout l'intérêt : ce n'est pas un lieu fermé.
    case "STAFF_SEULEMENT":
      return { peut: false, raison: "SUR_CONVOCATION" };

    case "DETENTEUR_PERMISSION": {
      // Les annonces d'une maison : sans maison déclarée sur le lieu, il n'y a
      // aucune permission à détenir — on refuse plutôt que de deviner.
      const maison = regles.maisonReservee;
      if (maison && peutEcrireLesAnnoncesDe(pouvoirs, maison)) return OUI;
      return {
        peut: false,
        raison: "PERMISSION_REQUISE",
        maison: maison ?? undefined,
      };
    }
  }
}

/** L’état d’un sujet, pour décider d’une réponse. */
export type PourRepondre = {
  clos: boolean;
  /**
   * L’année exigée **le jour de l’ouverture**, et non celle du lieu
   * aujourd’hui. C’est toute la promesse : « le verrouillage n’est pas
   * rétroactif, une scène en cours ne se ferme pas si les règles changent ».
   */
  anneeRequiseALOuverture: Fonction | null;
};

/**
 * **Répondre.**
 *
 * Une seule différence avec l’ouverture, mais elle est essentielle : l’année
 * se compare à celle **figée à l’ouverture du sujet**, jamais à celle du lieu.
 * Relire la règle du lieu ici refermerait les scènes en cours le jour où on
 * durcit un couloir, ce qu’on a promis de ne pas faire.
 */
export function peutRepondre(
  membre: PourLeForum,
  pouvoirs: Pouvoirs,
  regles: ReglesDuLieu,
  sujet: PourRepondre,
): Verdict {
  // Le staff intervient partout, y compris pour clore un sujet abandonné
  // (art. 17.2) — donc y compris dans un sujet déjà clos.
  if (estStaff(pouvoirs)) return OUI;

  if (sujet.clos) return { peut: false, raison: "SUJET_CLOS" };
  if (!regles.ouvert) return { peut: false, raison: "LIEU_FERME" };

  if (!atteintLAnnee(membre.fonction, sujet.anneeRequiseALOuverture)) {
    return {
      peut: false,
      raison: "ANNEE_INSUFFISANTE",
      anneeRequise: sujet.anneeRequiseALOuverture ?? undefined,
    };
  }

  const laSienne = maisonDuMembre(membre);

  if (regles.maisonReservee && laSienne !== regles.maisonReservee) {
    return {
      peut: false,
      raison: "RESERVE_A_LA_MAISON",
      maison: regles.maisonReservee,
    };
  }

  if (regles.quiRepond === "MEMBRES_MAISON") {
    return regles.maisonReservee && laSienne === regles.maisonReservee
      ? OUI
      : {
          peut: false,
          raison: "RESERVE_A_LA_MAISON",
          maison: regles.maisonReservee ?? undefined,
        };
  }

  return OUI;
}
