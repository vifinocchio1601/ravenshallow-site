import { describe, expect, it } from "vitest";
import {
  bornesDuMois,
  etatDuPlafond,
  pointDUnPost,
  PLAFOND_PAR_JOUR,
  POINTS_PAR_POST,
  rangsPartages,
} from "./regles";

/**
 * Ce qu’un post rapporte, et jusqu’où.
 *
 * Tout se joue sur des faits passés en paramètre : ni horloge, ni base. C’est
 * ce qui permet d’éprouver **une journée entière de plafond** sans attendre
 * une journée — le même parti pris que le plafond de la Tour aux Corbeaux.
 */

const MIDI = new Date("2026-09-15T12:00:00.000Z");
const ilYA = (heures: number) => new Date(MIDI.getTime() - heures * 3600_000);

/** Un point gagné il y a tant d’heures. Un seul point, sauf mention. */
const gain = (heures: number, points = 1) => ({ gagneLe: ilYA(heures), points });

/** Le plafond ouvert, pour les cas où ce n’est pas lui qu’on éprouve. */
const OUVERT = { atteint: false as const, restants: null };

describe("ce qu’un post rapporte", () => {
  it("un post de dix lignes dans le domaine rapporte un point", () => {
    expect(
      pointDUnPost({
        comptePourLesPoints: true,
        respecteLeMinimum: true,
        plafond: OUVERT,
      }),
    ).toEqual({ gagne: true, points: POINTS_PAR_POST });
  });

  /** **Un post chez les non-mages ne rapporte rien.** */
  it("un lieu qui ne compte pas ne rapporte rien, quoi qu’il arrive", () => {
    const verdict = pointDUnPost({
      comptePourLesPoints: false,
      respecteLeMinimum: true,
      plafond: OUVERT,
    });
    expect(verdict).toEqual({ gagne: false, raison: "LIEU_SANS_POINTS" });
  });

  /** **Un post trop court ne rapporte rien.** */
  it("un post sous le minimum du lieu ne rapporte rien", () => {
    const verdict = pointDUnPost({
      comptePourLesPoints: true,
      respecteLeMinimum: false,
      plafond: OUVERT,
    });
    expect(verdict).toEqual({ gagne: false, raison: "POST_TROP_COURT" });
  });

  it("le plafond atteint ne rapporte rien non plus", () => {
    const verdict = pointDUnPost({
      comptePourLesPoints: true,
      respecteLeMinimum: true,
      plafond: { atteint: true, reprendLe: MIDI },
    });
    expect(verdict).toEqual({ gagne: false, raison: "PLAFOND_ATTEINT" });
  });

  /**
   * L’ordre des trois questions n’est pas indifférent : c’est celui du sens.
   * Dire « plafond atteint » à quelqu’un qui écrit chez les non-mages serait
   * faux, et le laisserait croire qu’il aurait pu gagner quelque chose.
   */
  it("nomme d’abord la raison la plus forte", () => {
    const verdict = pointDUnPost({
      comptePourLesPoints: false,
      respecteLeMinimum: false,
      plafond: { atteint: true, reprendLe: MIDI },
    });
    expect(verdict).toEqual({ gagne: false, raison: "LIEU_SANS_POINTS" });
  });
});

describe("le plafond quotidien", () => {
  it("est ouvert quand on n’a rien gagné", () => {
    expect(etatDuPlafond([], MIDI)).toEqual({
      atteint: false,
      restants: PLAFOND_PAR_JOUR,
    });
  });

  it("décompte ce qui reste", () => {
    const trois = [gain(1), gain(2), gain(3)];
    expect(etatDuPlafond(trois, MIDI)).toEqual({
      atteint: false,
      restants: (PLAFOND_PAR_JOUR ?? 0) - 3,
    });
  });

  /**
   * **Ce sont des points qu’on additionne, pas des lignes.**
   *
   * Tant qu’un post vaut un point, les deux reviennent au même — mais le
   * réglage s’appelle « points par jour », et il doit dire vrai le jour où un
   * QCM en vaudra deux. Compter les lignes laisserait passer vingt points
   * sous un plafond de dix.
   */
  it("additionne les valeurs, et non le nombre de lignes", () => {
    const plafond = PLAFOND_PAR_JOUR!;
    // Deux lignes, mais elles valent tout le plafond à elles seules.
    const grosses = [gain(1, plafond - 1), gain(2, 1)];

    expect(etatDuPlafond(grosses, MIDI).atteint).toBe(true);
    // Et une de moins laisse exactement une place.
    expect(etatDuPlafond([gain(1, plafond - 1)], MIDI)).toEqual({
      atteint: false,
      restants: 1,
    });
  });

  /** **Le plafond se déclenche.** */
  it("se ferme à la limite exacte, et pas avant", () => {
    const plafond = PLAFOND_PAR_JOUR!;
    const juste = Array.from({ length: plafond - 1 }, (_, i) => gain(i + 1));

    expect(etatDuPlafond(juste, MIDI).atteint).toBe(false);
    expect(etatDuPlafond([...juste, gain(0.5)], MIDI).atteint).toBe(true);
  });

  it("dit quand la place se libère, plutôt que de dire non", () => {
    const plafond = PLAFOND_PAR_JOUR!;
    // Le plus ancien des gains bloquants date de vingt heures : c’est lui qui
    // libère la place, dans quatre heures.
    const gains = [
      gain(20),
      ...Array.from({ length: plafond - 1 }, (_, i) => gain(i + 1)),
    ];

    const etat = etatDuPlafond(gains, MIDI);
    expect(etat.atteint).toBe(true);
    if (etat.atteint) {
      expect(etat.reprendLe.getTime()).toBe(ilYA(20).getTime() + 24 * 3600_000);
    }
  });

  /**
   * **Vingt-quatre heures glissantes, et non la journée civile.** Le serveur
   * vit en UTC, le joueur non : un plafond calé sur minuit du serveur se
   * remettrait à zéro à deux heures du matin, en pleine soirée d’écriture,
   * sans que personne puisse le comprendre.
   */
  it("oublie ce qui a plus de vingt-quatre heures", () => {
    const plafond = PLAFOND_PAR_JOUR!;
    const vieux = Array.from({ length: plafond * 2 }, (_, i) => gain(25 + i));

    expect(etatDuPlafond(vieux, MIDI)).toEqual({
      atteint: false,
      restants: plafond,
    });
  });

  it("ignore une date illisible plutôt que de tout refuser", () => {
    // Une valeur abîmée ne doit ni compter dans le plafond ni le faire
    // basculer : elle disparaît, et le reste continue de fonctionner.
    expect(
      etatDuPlafond([{ gagneLe: "pas une date", points: 1 }, gain(1)], MIDI),
    ).toEqual({
      atteint: false,
      restants: (PLAFOND_PAR_JOUR ?? 0) - 1,
    });
  });

  it("les valeurs du réglage sont bien celles décidées", () => {
    // Ce test tombera le jour où l’on changera `config/points.json`, et c’est
    // voulu : ces deux nombres se règlent avec le joueur, jamais au passage.
    expect(POINTS_PAR_POST).toBe(1);
    expect(PLAFOND_PAR_JOUR).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────
//  Le mois du top, et les rangs partagés
// ─────────────────────────────────────────────────────────────

describe("les bornes du mois", () => {
  it("commencent le 1er à minuit et finissent au 1er suivant", () => {
    const { debut, fin } = bornesDuMois(new Date(2026, 7, 28, 14, 32));
    expect(debut.getFullYear()).toBe(2026);
    expect(debut.getMonth()).toBe(7);
    expect(debut.getDate()).toBe(1);
    expect(debut.getHours()).toBe(0);
    expect(fin.getMonth()).toBe(8);
    expect(fin.getDate()).toBe(1);
  });

  /** Décembre se reporte tout seul : c'est l'intérêt de passer par `Date`. */
  it("passent de décembre à janvier de l’année suivante", () => {
    const { debut, fin } = bornesDuMois(new Date(2026, 11, 31, 23, 59));
    expect(debut.getMonth()).toBe(11);
    expect(fin.getFullYear()).toBe(2027);
    expect(fin.getMonth()).toBe(0);
  });

  it("n’oublient pas le 29 février", () => {
    const { debut, fin } = bornesDuMois(new Date(2028, 1, 29, 12));
    expect(debut.getDate()).toBe(1);
    expect(fin.getMonth()).toBe(2);
    expect(fin.getDate()).toBe(1);
  });

  /** La fin est EXCLUE : le dernier instant du mois y est, le suivant non. */
  it("bornent un mois entier, fin exclue", () => {
    const { debut, fin } = bornesDuMois(new Date(2026, 7, 15));
    const dernier = new Date(2026, 7, 31, 23, 59, 59, 999);
    expect(dernier >= debut && dernier < fin).toBe(true);
    expect(new Date(2026, 8, 1, 0, 0, 0, 0) < fin).toBe(false);
  });

  it("les douze mois d’une année tiennent bout à bout, sans trou", () => {
    for (let mois = 0; mois < 12; mois += 1) {
      const courant = bornesDuMois(new Date(2026, mois, 10));
      const suivant = bornesDuMois(new Date(2026, mois + 1, 10));
      expect(courant.fin.getTime(), `mois ${mois}`).toBe(
        suivant.debut.getTime(),
      );
    }
  });
});

describe("les rangs du top", () => {
  it("se suivent quand personne n’est à égalité", () => {
    expect(rangsPartages([9, 5, 3, 1])).toEqual([1, 2, 3, 4]);
  });

  /**
   * Deux à quatorze sont tous deux troisièmes, et le suivant est cinquième —
   * jamais quatrième. C'est la règle du classement des maisons, appliquée aux
   * personnes.
   */
  it("partagent le rang, et sautent celui qui suit", () => {
    expect(rangsPartages([20, 18, 14, 14, 9])).toEqual([1, 2, 3, 3, 5]);
  });

  it("mettent tout le monde premier quand tout le monde est à zéro", () => {
    expect(rangsPartages([0, 0, 0, 0, 0])).toEqual([1, 1, 1, 1, 1]);
  });

  it("ne bronchent pas sur une liste vide", () => {
    expect(rangsPartages([])).toEqual([]);
  });
});
