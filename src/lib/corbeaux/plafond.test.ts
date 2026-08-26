import { describe, expect, it } from "vitest";
import {
  etatDuPlafond,
  JOURS_NOUVEAU_VENU,
  plafondDe,
  PLAFOND_ETABLI,
  PLAFOND_NOUVEAU_VENU,
} from "./droits";

/**
 * L’anti-démarchage — art. 3.6.
 *
 * « La publicité non sollicitée, le spam, le démarchage vers d’autres forums
 * en messagerie privée. »
 *
 * Tout le monde peut écrire à tout le monde : c’est ce qui rend le forum
 * accueillant, et ce qui le rend ratissable. Le plafond ne pèse que sur les
 * conversations **nouvelles** — répondre n’est jamais limité, écrire à
 * l’administration non plus, et ces deux exemptions sont vérifiées dans
 * `en-base.essai.ts`, là où le fil existe vraiment.
 *
 * Ici, le calcul pur : combien, dans quelle fenêtre, et quand la place se
 * libère. Aucune horloge n’est lue — c’est ce qui permet de tester une
 * journée entière sans attendre.
 */

const MINUTE = 60 * 1000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

const MAINTENANT = new Date("2026-08-26T12:00:00.000Z");

/** N ouvertures, la plus récente il y a `ilYA` millisecondes, espacées d’une minute. */
function ouvertures(n: number, ilYA = 0): Date[] {
  return Array.from(
    { length: n },
    (_, i) => new Date(MAINTENANT.getTime() - ilYA - i * MINUTE),
  );
}

describe("quel plafond s’applique", () => {
  /**
   * L’ancienneté se compte depuis l’ACCEPTATION du dossier, jamais depuis la
   * création du compte : quelqu’un dont la candidature a mis trois semaines à
   * être lue est un nouveau venu le jour où on lui ouvre la porte.
   */
  it("un compte accepté hier est un nouveau venu", () => {
    const hier = new Date(MAINTENANT.getTime() - JOUR);
    expect(plafondDe(hier, MAINTENANT)).toEqual(PLAFOND_NOUVEAU_VENU);
  });

  it("au-delà de sept jours, le plafond se desserre", () => {
    const avant = new Date(
      MAINTENANT.getTime() - (JOURS_NOUVEAU_VENU + 1) * JOUR,
    );
    expect(plafondDe(avant, MAINTENANT)).toEqual(PLAFOND_ETABLI);
  });

  it("pile sept jours : établi", () => {
    const pile = new Date(MAINTENANT.getTime() - JOURS_NOUVEAU_VENU * JOUR);
    expect(plafondDe(pile, MAINTENANT)).toEqual(PLAFOND_ETABLI);
  });

  /** Une date absente ou illisible vaut « nouveau » : le sens prudent. */
  it.each([[null], ["pas une date"]])("%s vaut nouveau venu", (valeur) => {
    expect(plafondDe(valeur as string | null, MAINTENANT)).toEqual(
      PLAFOND_NOUVEAU_VENU,
    );
  });
});

describe("ce qu’un membre ordinaire ne rencontre jamais", () => {
  /**
   * Le calibrage est le point que le joueur a demandé à valider, et c’est ce
   * test-ci qui le fige : un nouveau venu qui se présente à trois personnes
   * son premier jour ne doit rien voir venir.
   */
  it("deux présentations dans l’heure, le premier jour : rien", () => {
    expect(
      etatDuPlafond(ouvertures(2), PLAFOND_NOUVEAU_VENU, MAINTENANT),
    ).toEqual({ ouvert: true });
  });

  it("neuf conversations dans la journée, membre établi : rien", () => {
    const etalees = Array.from(
      { length: 9 },
      (_, i) => new Date(MAINTENANT.getTime() - (i + 1) * 2 * HEURE),
    );
    expect(etatDuPlafond(etalees, PLAFOND_ETABLI, MAINTENANT)).toEqual({
      ouvert: true,
    });
  });

  it("une liste vide ne bloque évidemment rien", () => {
    expect(etatDuPlafond([], PLAFOND_NOUVEAU_VENU, MAINTENANT)).toEqual({
      ouvert: true,
    });
  });
});

describe("ce que le plafond arrête", () => {
  it("un nouveau venu au-delà de trois dans l’heure", () => {
    const etat = etatDuPlafond(ouvertures(3), PLAFOND_NOUVEAU_VENU, MAINTENANT);
    expect(etat.ouvert).toBe(false);
  });

  it("un membre établi au-delà de dix dans l’heure", () => {
    expect(
      etatDuPlafond(ouvertures(9), PLAFOND_ETABLI, MAINTENANT).ouvert,
    ).toBe(true);
    expect(
      etatDuPlafond(ouvertures(10), PLAFOND_ETABLI, MAINTENANT).ouvert,
    ).toBe(false);
  });

  /**
   * Le plafond journalier existe pour le démarcheur patient : trois par
   * heure, huit heures d’affilée, ferait vingt-quatre conversations sans
   * jamais toucher le plafond horaire.
   */
  it("le plafond du jour attrape ce que celui de l’heure laisse passer", () => {
    const etalees = Array.from(
      { length: 10 },
      (_, i) => new Date(MAINTENANT.getTime() - (i + 1) * 2 * HEURE),
    );
    // Deux heures d'écart : jamais plus d'une par heure.
    expect(
      etatDuPlafond(etalees, PLAFOND_NOUVEAU_VENU, MAINTENANT).ouvert,
    ).toBe(false);
  });

  it("ce qui date de plus de vingt-quatre heures ne compte plus", () => {
    const vieilles = Array.from(
      { length: 30 },
      (_, i) => new Date(MAINTENANT.getTime() - JOUR - i * MINUTE),
    );
    expect(
      etatDuPlafond(vieilles, PLAFOND_NOUVEAU_VENU, MAINTENANT),
    ).toEqual({ ouvert: true });
  });
});

describe("le plafond se relâche, et le dit", () => {
  /**
   * **Une attente, pas une erreur.** On ne dit pas « refusé » : on dit quand
   * réessayer. Un joueur qui lit une erreur technique croit avoir cassé
   * quelque chose, et il écrit à l’administration.
   */
  it("annonce la minute où la place se libère", () => {
    // Trois ouvertures, la plus ancienne il y a cinquante minutes.
    const recentes = [
      new Date(MAINTENANT.getTime() - 10 * MINUTE),
      new Date(MAINTENANT.getTime() - 30 * MINUTE),
      new Date(MAINTENANT.getTime() - 50 * MINUTE),
    ];
    const etat = etatDuPlafond(recentes, PLAFOND_NOUVEAU_VENU, MAINTENANT);

    expect(etat.ouvert).toBe(false);
    if (etat.ouvert) return;
    // La troisième en partant de maintenant expire dans dix minutes.
    expect(etat.minutes).toBe(10);
  });

  it("dix minutes plus tard, la porte se rouvre d’elle-même", () => {
    const recentes = [
      new Date(MAINTENANT.getTime() - 10 * MINUTE),
      new Date(MAINTENANT.getTime() - 30 * MINUTE),
      new Date(MAINTENANT.getTime() - 50 * MINUTE),
    ];
    const plusTard = new Date(MAINTENANT.getTime() + 11 * MINUTE);
    expect(etatDuPlafond(recentes, PLAFOND_NOUVEAU_VENU, plusTard)).toEqual({
      ouvert: true,
    });
  });

  /** « Réessayez dans 0 minute » se lit comme une panne. */
  it("ne dit jamais zéro minute", () => {
    const presqueExpirees = [
      new Date(MAINTENANT.getTime() - HEURE + 1000),
      new Date(MAINTENANT.getTime() - HEURE + 2000),
      new Date(MAINTENANT.getTime() - HEURE + 3000),
    ];
    const etat = etatDuPlafond(
      presqueExpirees,
      PLAFOND_NOUVEAU_VENU,
      MAINTENANT,
    );
    if (etat.ouvert) return;
    expect(etat.minutes).toBeGreaterThanOrEqual(1);
  });

  /**
   * Quand les deux plafonds bloquent, il faut attendre que **le dernier** se
   * relâche. Prendre le premier annoncerait une réouverture qui n’aurait pas
   * lieu, et le joueur reviendrait pour se faire arrêter à nouveau — la
   * meilleure façon de transformer une attente en agacement.
   */
  it("quand les deux plafonds bloquent, c’est le plus long qui vaut", () => {
    const dixDansLaJournee = Array.from(
      { length: 10 },
      (_, i) => new Date(MAINTENANT.getTime() - (i + 1) * 2 * HEURE),
    );
    const troisDansLHeure = ouvertures(3);
    const etat = etatDuPlafond(
      [...troisDansLHeure, ...dixDansLaJournee],
      PLAFOND_NOUVEAU_VENU,
      MAINTENANT,
    );

    expect(etat.ouvert).toBe(false);
    if (etat.ouvert) return;
    // Le plafond horaire rouvrirait dans moins d'une heure ; le journalier
    // demande beaucoup plus. C'est lui qui commande.
    expect(etat.minutes).toBeGreaterThan(60);
  });
});
