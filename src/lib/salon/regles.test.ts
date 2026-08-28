import { describe, expect, it } from "vitest";
import {
  etatDuFrein,
  FENETRE_SECONDES,
  MESSAGES_PAR_FENETRE,
} from "./regles";

/**
 * Le frein anti-noyade du salon.
 *
 * Tout se joue sur des instants passes en paramètre : ni horloge, ni base.
 * C’est ce qui permet d’éprouver une conversation entière sans attendre — le
 * parti pris du plafond de la Tour aux Corbeaux et de celui des points.
 */

const MAINTENANT = new Date("2026-09-15T12:00:00.000Z");
const ilYA = (secondes: number) => MAINTENANT.getTime() - secondes * 1000;

describe("le frein du salon", () => {
  it("laisse parler quand la fenêtre est vide", () => {
    expect(etatDuFrein([], MAINTENANT)).toEqual({
      bloque: false,
      restants: MESSAGES_PAR_FENETRE,
    });
  });

  it("décompte ce qui a été dit dans la fenêtre", () => {
    const instants = [ilYA(1), ilYA(2), ilYA(3)];
    expect(etatDuFrein(instants, MAINTENANT)).toEqual({
      bloque: false,
      restants: MESSAGES_PAR_FENETRE - 3,
    });
  });

  it("bloque au plafond, et dit dans combien de temps", () => {
    // Le plus ancien de la fenêtre sortira le premier : c'est lui qui libère
    // une place.
    const instants = Array.from({ length: MESSAGES_PAR_FENETRE }, (_, i) =>
      ilYA(FENETRE_SECONDES - 3 - i),
    );
    const etat = etatDuFrein(instants, MAINTENANT);
    expect(etat.bloque).toBe(true);
    if (etat.bloque) {
      expect(etat.secondes).toBeGreaterThan(0);
      expect(etat.secondes).toBeLessThanOrEqual(FENETRE_SECONDES);
    }
  });

  /** Ce qui est sorti de la fenêtre ne compte plus : le frein n’est pas un mur. */
  it("oublie ce qui est plus vieux que la fenêtre", () => {
    const vieux = Array.from({ length: 20 }, () => ilYA(FENETRE_SECONDES + 5));
    expect(etatDuFrein(vieux, MAINTENANT)).toEqual({
      bloque: false,
      restants: MESSAGES_PAR_FENETRE,
    });
  });

  /**
   * Annoncer « 0 seconde » à quelqu’un qui doit encore attendre serait faux :
   * l'arrondi va vers le haut, et le plancher est à une seconde.
   */
  it("n’annonce jamais zéro seconde", () => {
    const instants = Array.from({ length: MESSAGES_PAR_FENETRE }, () =>
      ilYA(FENETRE_SECONDES - 0.1),
    );
    const etat = etatDuFrein(instants, MAINTENANT);
    expect(etat.bloque).toBe(true);
    if (etat.bloque) expect(etat.secondes).toBeGreaterThanOrEqual(1);
  });

  it("ignore une valeur abîmée plutôt que de tout bloquer", () => {
    const etat = etatDuFrein([Number.NaN, Infinity, ilYA(1)], MAINTENANT);
    expect(etat).toEqual({ bloque: false, restants: MESSAGES_PAR_FENETRE - 1 });
  });

  /** L’ordre d’arrivée ne doit rien changer : on trie avant de décider. */
  it("ne dépend pas de l’ordre des instants", () => {
    const instants = [ilYA(1), ilYA(9), ilYA(4), ilYA(7), ilYA(2)];
    const melange = [...instants].reverse();
    expect(etatDuFrein(instants, MAINTENANT)).toEqual(
      etatDuFrein(melange, MAINTENANT),
    );
  });

  it("les valeurs du réglage sont bien celles décidées", () => {
    // Ce test tombera le jour où l’on changera `config/salon.json`, et c'est
    // voulu : ces deux nombres se règlent en regardant une vraie conversation.
    expect(MESSAGES_PAR_FENETRE).toBe(5);
    expect(FENETRE_SECONDES).toBe(15);
  });
});
