import { describe, expect, it } from "vitest";
import {
  etatDuPlafond,
  pointDUnPost,
  PLAFOND_PAR_JOUR,
  POINTS_PAR_POST,
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
