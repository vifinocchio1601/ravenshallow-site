import { describe, expect, it } from "vitest";
import type { Fonction, Maison } from "@/lib/dossier/etats";
import { AUCUN_POUVOIR, type Pouvoirs } from "./pouvoirs";
import {
  maisonDuMembre,
  peutLireLeLieu,
  peutOuvrirUnSujet,
  peutRepondre,
  reglesDuLieu,
  type ParametresEspace,
  type ParametresSection,
  type PourLeForum,
} from "./lieux";

/**
 * Le moteur du forum, éprouvé sur les lieux réels de l’école.
 *
 * Ces cas sont ceux de la liste de recette du joueur — ceux qui ont survécu à
 * ses deux décisions : le mode de participation et la limite de scènes tiennent
 * à la bonne foi, l’année et la maison restent des verrous.
 */

// ── Les trois espaces, tels que la migration les pose ──

const DOMAINE: ParametresEspace = {
  lignesMinimum: 10,
  quiOuvreUnSujet: "TOUT_MEMBRE",
  quiRepond: "TOUT_MEMBRE",
  comptePourLesPoints: true,
  compteLesScenes: true,
  visibilite: "TOUS",
  anneeMinimale: null,
  ouvert: true,
};

const NON_MAGES: ParametresEspace = {
  ...DOMAINE,
  lignesMinimum: null,
  comptePourLesPoints: false,
  compteLesScenes: false,
};

const ESPACE_MAISON: ParametresEspace = {
  ...DOMAINE,
  lignesMinimum: null,
  quiOuvreUnSujet: "DETENTEUR_PERMISSION",
  quiRepond: "MEMBRES_MAISON",
  comptePourLesPoints: false,
  compteLesScenes: false,
  visibilite: "MAISON",
};

// ── Quelques pièces du château ──

function piece(partiel: Partial<ParametresSection> = {}): ParametresSection {
  return {
    anneeMinimale: null,
    maisonReservee: null,
    visibilite: null,
    quiOuvreUnSujet: null,
    ouverte: true,
    ...partiel,
  };
}

/** L’aile est, cinquième année — le lieu le plus fermé du château. */
const LA_RESERVE = piece({ anneeMinimale: "CINQUIEME_ANNEE" });
const DORTOIR_NATTORM = piece({ maisonReservee: "NATTORM" });
/** Aile de Kaldrafn, mais tout le monde y monte poster son courrier. */
const TOUR_AUX_CORBEAUX = piece();
const SOUTERRAINS = piece({ anneeMinimale: "SIXIEME_ANNEE" });

// ── Quelques élèves ──

function eleve(fonction: Fonction, maison: Maison | null): PourLeForum {
  return {
    fonction,
    maison,
    etatMaison: maison ? "FAIT" : "NON_FAIT",
  };
}

const PREMIERE_ANNEE = eleve("PREMIERE_ANNEE", "TIDEAL");
const BRYGGELD = eleve("TROISIEME_ANNEE", "BRYGGELD");
const NATTORM = eleve("TROISIEME_ANNEE", "NATTORM");
const SEPTIEME = eleve("SEPTIEME_ANNEE", "KALDRAFN");
/** Une directrice : sa maison est en base, mais sous `SANS_OBJET`. */
const DIRECTRICE: PourLeForum = {
  fonction: "PREMIERE_ANNEE",
  maison: "TIDEAL",
  etatMaison: "SANS_OBJET",
};

const MODERATEUR: Pouvoirs = { ...AUCUN_POUVOIR, role: "MODERATEUR" };

const rien = AUCUN_POUVOIR;

// ─────────────────────────────────────────────────────────────
//  Une section ne peut que resserrer
// ─────────────────────────────────────────────────────────────

describe("une section resserre, elle n’ouvre jamais", () => {
  it("l’année la plus haute l’emporte, quel que soit le côté", () => {
    const espaceStrict: ParametresEspace = {
      ...DOMAINE,
      anneeMinimale: "QUATRIEME_ANNEE",
    };
    // La section demande moins : l'espace tient.
    expect(
      reglesDuLieu(espaceStrict, piece({ anneeMinimale: "DEUXIEME_ANNEE" }))
        .anneeMinimale,
    ).toBe("QUATRIEME_ANNEE");
    // La section demande plus : elle l'emporte.
    expect(
      reglesDuLieu(espaceStrict, piece({ anneeMinimale: "SIXIEME_ANNEE" }))
        .anneeMinimale,
    ).toBe("SIXIEME_ANNEE");
  });

  it("« sa maison » l’emporte sur « tous »", () => {
    expect(reglesDuLieu(ESPACE_MAISON, piece()).visibilite).toBe("MAISON");
    expect(
      reglesDuLieu(DOMAINE, piece({ visibilite: "MAISON" })).visibilite,
    ).toBe("MAISON");
  });

  it("il faut que les deux soient ouverts", () => {
    expect(reglesDuLieu(DOMAINE, piece({ ouverte: false })).ouvert).toBe(false);
    expect(
      reglesDuLieu({ ...DOMAINE, ouvert: false }, piece()).ouvert,
    ).toBe(false);
  });

  it("sans section, ce sont les règles de l’espace, et aucune maison", () => {
    expect(reglesDuLieu(DOMAINE)).toEqual({ ...DOMAINE, maisonReservee: null });
  });
});

// ─────────────────────────────────────────────────────────────
//  Le verrouillage par année
// ─────────────────────────────────────────────────────────────

describe("un première année ne peut pas écrire dans la Réserve — mais il la lit", () => {
  const regles = reglesDuLieu(DOMAINE, LA_RESERVE);

  it("il la lit", () => {
    // « Le contenu reste lisible. Un site où l'on ne voit rien paraît vide. »
    expect(peutLireLeLieu(PREMIERE_ANNEE, rien, regles)).toBe(true);
  });

  it("il n’y ouvre pas de sujet, et on lui dit à partir de quand", () => {
    const verdict = peutOuvrirUnSujet(PREMIERE_ANNEE, rien, regles);
    expect(verdict.peut).toBe(false);
    expect(verdict).toMatchObject({
      raison: "ANNEE_INSUFFISANTE",
      anneeRequise: "CINQUIEME_ANNEE",
    });
  });

  it("un septième année y écrit", () => {
    expect(peutOuvrirUnSujet(SEPTIEME, rien, regles).peut).toBe(true);
  });

  it("les souterrains restent fermés même à un cinquième année", () => {
    const cinquieme = eleve("CINQUIEME_ANNEE", "BRYGGELD");
    const souterrains = reglesDuLieu(DOMAINE, SOUTERRAINS);
    expect(peutOuvrirUnSujet(cinquieme, rien, souterrains).peut).toBe(false);
    expect(peutLireLeLieu(cinquieme, rien, souterrains)).toBe(true);
  });
});

describe("un redoublant ne perd aucun accès", () => {
  /**
   * Le redoublement ne touche pas à l’année (art. 18.5) : le rang ne bouge
   * pas, donc les accès non plus. C’est acquis par construction — ce test
   * fige la promesse plutôt qu’un mécanisme.
   */
  it("son année ne bouge pas, ses portes non plus", () => {
    const avant = eleve("CINQUIEME_ANNEE", "NATTORM");
    const apresRedoublement = eleve("CINQUIEME_ANNEE", "NATTORM");
    const regles = reglesDuLieu(DOMAINE, LA_RESERVE);
    expect(peutOuvrirUnSujet(avant, rien, regles)).toEqual(
      peutOuvrirUnSujet(apresRedoublement, rien, regles),
    );
    expect(peutOuvrirUnSujet(apresRedoublement, rien, regles).peut).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
//  Les dortoirs
// ─────────────────────────────────────────────────────────────

describe("un Bryggeld devant le dortoir de Nattorm", () => {
  const dortoir = reglesDuLieu(DOMAINE, DORTOIR_NATTORM);

  it("il le lit — la lecture reste ouverte à tous", () => {
    expect(peutLireLeLieu(BRYGGELD, rien, dortoir)).toBe(true);
  });

  it("il n’y écrit pas, et on lui dit de quelle maison il s’agit", () => {
    expect(peutOuvrirUnSujet(BRYGGELD, rien, dortoir)).toMatchObject({
      peut: false,
      raison: "RESERVE_A_LA_MAISON",
      maison: "NATTORM",
    });
  });

  it("un Nattorm y écrit", () => {
    expect(peutOuvrirUnSujet(NATTORM, rien, dortoir).peut).toBe(true);
  });

  it("mais il monte à la Tour aux Corbeaux comme tout le monde", () => {
    // Le lieu est dans l'aile de Kaldrafn — la maison au corbeau — et reste
    // ouvert à tous en écriture. C'est voulu : tout le monde y poste son
    // courrier.
    const tour = reglesDuLieu(DOMAINE, TOUR_AUX_CORBEAUX);
    expect(peutOuvrirUnSujet(BRYGGELD, rien, tour).peut).toBe(true);
    expect(peutRepondre(BRYGGELD, rien, tour, ouvert()).peut).toBe(true);
  });

  it("la directrice n’écrit dans aucun dortoir : sa maison est sans objet", () => {
    expect(maisonDuMembre(DIRECTRICE)).toBeNull();
    expect(peutOuvrirUnSujet(DIRECTRICE, rien, dortoir).peut).toBe(false);
  });

  it("mais un détenteur de la permission de lecture y voit ce qui est réservé", () => {
    const reserve = reglesDuLieu(ESPACE_MAISON, DORTOIR_NATTORM);
    expect(peutLireLeLieu(BRYGGELD, rien, reserve)).toBe(false);
    const lecteur: Pouvoirs = {
      ...AUCUN_POUVOIR,
      permissions: [{ permission: "LIRE_ESPACES_MAISON", maison: "NATTORM" }],
    };
    expect(peutLireLeLieu(BRYGGELD, lecteur, reserve)).toBe(true);
    // Lire n'est pas écrire.
    expect(peutOuvrirUnSujet(BRYGGELD, lecteur, reserve).peut).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
//  Les annonces d’une maison
// ─────────────────────────────────────────────────────────────

describe("les annonces s’écrivent par les préfets et les détenteurs", () => {
  const annonces = reglesDuLieu(ESPACE_MAISON, piece({ maisonReservee: "KALDRAFN" }));
  const kaldrafn = eleve("DEUXIEME_ANNEE", "KALDRAFN");

  it("un élève de la maison ne les écrit pas pour autant", () => {
    expect(peutOuvrirUnSujet(kaldrafn, rien, annonces)).toMatchObject({
      peut: false,
      raison: "PERMISSION_REQUISE",
      maison: "KALDRAFN",
    });
  });

  it("le préfet de Kaldrafn les écrit", () => {
    const prefet: Pouvoirs = { ...AUCUN_POUVOIR, prefetDe: ["KALDRAFN"] };
    expect(peutOuvrirUnSujet(kaldrafn, prefet, annonces).peut).toBe(true);
  });

  it("une permission sur Kaldrafn ne donne rien sur Nattorm", () => {
    const surKaldrafn: Pouvoirs = {
      ...AUCUN_POUVOIR,
      permissions: [{ permission: "ANNONCES_MAISON", maison: "KALDRAFN" }],
    };
    const annoncesNattorm = reglesDuLieu(
      ESPACE_MAISON,
      piece({ maisonReservee: "NATTORM" }),
    );
    expect(peutOuvrirUnSujet(kaldrafn, surKaldrafn, annonces).peut).toBe(true);
    expect(peutOuvrirUnSujet(NATTORM, surKaldrafn, annoncesNattorm).peut).toBe(
      false,
    );
  });

  it("mais les élèves de la maison répondent aux annonces", () => {
    expect(peutRepondre(kaldrafn, rien, annonces, ouvert()).peut).toBe(true);
    expect(peutRepondre(NATTORM, rien, annonces, ouvert())).toMatchObject({
      peut: false,
      raison: "RESERVE_A_LA_MAISON",
    });
  });
});

// ─────────────────────────────────────────────────────────────
//  « Sur convocation »
// ─────────────────────────────────────────────────────────────

describe("le bureau de la direction s’ouvre sur convocation", () => {
  const bureau = reglesDuLieu(
    DOMAINE,
    piece({ quiOuvreUnSujet: "STAFF_SEULEMENT" }),
  );

  it("un septième année n’y ouvre pas de sujet, quelle que soit son année", () => {
    expect(peutOuvrirUnSujet(SEPTIEME, rien, bureau)).toMatchObject({
      peut: false,
      raison: "SUR_CONVOCATION",
    });
  });

  /**
   * **Ce n’est pas un lieu fermé, et c’est toute la différence** : l’élève
   * convoqué doit pouvoir répondre. Le confondre avec `ouverte: false` le
   * ferait taire.
   */
  it("mais il répond à une convocation, même en première année", () => {
    expect(peutRepondre(PREMIERE_ANNEE, rien, bureau, ouvert()).peut).toBe(true);
  });

  it("le staff convoque", () => {
    expect(peutOuvrirUnSujet(PREMIERE_ANNEE, MODERATEUR, bureau).peut).toBe(true);
  });

  it("et le lieu reste lisible de tous", () => {
    expect(peutLireLeLieu(PREMIERE_ANNEE, rien, bureau)).toBe(true);
  });

  it("une pièce ne peut que resserrer ce réglage aussi", () => {
    // L'espace des maisons exige déjà une permission : une pièce qui
    // demanderait « tout membre » ne doit pas rouvrir la porte.
    const annonces = reglesDuLieu(
      ESPACE_MAISON,
      piece({ maisonReservee: "TIDEAL", quiOuvreUnSujet: "TOUT_MEMBRE" }),
    );
    expect(annonces.quiOuvreUnSujet).toBe("DETENTEUR_PERMISSION");
    // Et dans l'autre sens, elle resserre bien.
    const convoque = reglesDuLieu(
      DOMAINE,
      piece({ quiOuvreUnSujet: "STAFF_SEULEMENT" }),
    );
    expect(convoque.quiOuvreUnSujet).toBe("STAFF_SEULEMENT");
  });
});

// ─────────────────────────────────────────────────────────────
//  Le verrouillage n’est pas rétroactif
// ─────────────────────────────────────────────────────────────

function ouvert(annee: Fonction | null = null) {
  return { clos: false, anneeRequiseALOuverture: annee };
}

describe("une scène en cours ne se ferme pas si les règles changent", () => {
  /**
   * **Le point le plus délicat du moteur.** Répondre compare l’année à celle
   * FIGÉE À L’OUVERTURE du sujet, jamais à celle du lieu aujourd’hui. Relire
   * la règle du lieu ici refermerait les scènes en cours le jour où l’on
   * durcit un couloir.
   */
  it("le lieu se durcit, la scène ouverte reste ouverte", () => {
    const scene = ouvert("PREMIERE_ANNEE");
    // Le lieu exige maintenant la sixième année…
    const durci = reglesDuLieu(DOMAINE, SOUTERRAINS);
    expect(peutRepondre(PREMIERE_ANNEE, rien, durci, scene).peut).toBe(true);
    // …mais on n'y ouvre plus de nouvelle scène.
    expect(peutOuvrirUnSujet(PREMIERE_ANNEE, rien, durci).peut).toBe(false);
  });

  it("une scène ouverte sous une exigence la garde", () => {
    const scene = ouvert("CINQUIEME_ANNEE");
    const lieuDevenuLibre = reglesDuLieu(DOMAINE, piece());
    expect(peutRepondre(PREMIERE_ANNEE, rien, lieuDevenuLibre, scene)).toMatchObject(
      { peut: false, raison: "ANNEE_INSUFFISANTE", anneeRequise: "CINQUIEME_ANNEE" },
    );
  });

  it("un sujet clos n’accepte plus de réponse", () => {
    const regles = reglesDuLieu(DOMAINE, piece());
    expect(
      peutRepondre(SEPTIEME, rien, regles, {
        clos: true,
        anneeRequiseALOuverture: null,
      }),
    ).toMatchObject({ peut: false, raison: "SUJET_CLOS" });
  });
});

// ─────────────────────────────────────────────────────────────
//  Le staff
// ─────────────────────────────────────────────────────────────

describe("les modérateurs interviennent partout", () => {
  it.each([
    ["la Réserve", reglesDuLieu(DOMAINE, LA_RESERVE)],
    ["le dortoir de Nattorm", reglesDuLieu(DOMAINE, DORTOIR_NATTORM)],
    ["un lieu fermé", reglesDuLieu(DOMAINE, piece({ ouverte: false }))],
    ["les annonces", reglesDuLieu(ESPACE_MAISON, piece({ maisonReservee: "TIDEAL" }))],
  ])("%s s’ouvre à un modérateur de première année sans maison", (_nom, regles) => {
    const petitModo: PourLeForum = {
      fonction: "PREMIERE_ANNEE",
      maison: null,
      etatMaison: "NON_FAIT",
    };
    expect(peutLireLeLieu(petitModo, MODERATEUR, regles)).toBe(true);
    expect(peutOuvrirUnSujet(petitModo, MODERATEUR, regles).peut).toBe(true);
  });

  it("y compris pour répondre dans un sujet clos (art. 17.2)", () => {
    const regles = reglesDuLieu(DOMAINE, piece());
    expect(
      peutRepondre(SEPTIEME, MODERATEUR, regles, {
        clos: true,
        anneeRequiseALOuverture: null,
      }).peut,
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
//  Un lieu fermé
// ─────────────────────────────────────────────────────────────

describe("un lieu définitivement clos", () => {
  const clos = reglesDuLieu(DOMAINE, piece({ ouverte: false }));

  it("se lit encore : ce qui s’y est joué n’est pas caché", () => {
    expect(peutLireLeLieu(SEPTIEME, rien, clos)).toBe(true);
  });

  it("ne s’écrit plus", () => {
    expect(peutOuvrirUnSujet(SEPTIEME, rien, clos)).toMatchObject({
      peut: false,
      raison: "LIEU_FERME",
    });
    expect(peutRepondre(SEPTIEME, rien, clos, ouvert())).toMatchObject({
      peut: false,
      raison: "LIEU_FERME",
    });
  });
});

// ─────────────────────────────────────────────────────────────
//  Les non-mages
// ─────────────────────────────────────────────────────────────

describe("le monde des non-mages n’a ni année ni maison", () => {
  const regles = reglesDuLieu(NON_MAGES, piece());

  it("un première année sans maison y ouvre un sujet", () => {
    const nouveau: PourLeForum = {
      fonction: "PREMIERE_ANNEE",
      maison: null,
      etatMaison: "NON_FAIT",
    };
    expect(peutOuvrirUnSujet(nouveau, rien, regles).peut).toBe(true);
  });

  it("et rien ne s’y compte", () => {
    expect(regles.comptePourLesPoints).toBe(false);
    expect(regles.compteLesScenes).toBe(false);
    expect(regles.lignesMinimum).toBeNull();
  });
});
