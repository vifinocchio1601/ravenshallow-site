import { describe, expect, it } from "vitest";
import {
  mieuxVautClore,
  peutRetirerLaScene,
  peutRetirerSonPost,
} from "./suppression";

const scene = (etat: Partial<Parameters<typeof peutRetirerLaScene>[0]> = {}) => ({
  estStaff: false,
  estLAuteur: false,
  auteursAutres: 0,
  ...etat,
});

describe("retirer une scène — l’auteur", () => {
  it("peut retirer la sienne tant qu’il y est seul", () => {
    const verdict = peutRetirerLaScene(scene({ estLAuteur: true }));
    expect(verdict).toEqual({ peut: true, motifRequis: false, previendra: false });
  });

  /**
   * **Art. 2.4 — les écrits partagés ne se mutilent pas.** Dès qu'un autre a
   * écrit, sa part n'appartient plus à celui qui a ouvert la scène.
   */
  it("ne peut plus dès qu’un autre y a écrit", () => {
    expect(peutRetirerLaScene(scene({ estLAuteur: true, auteursAutres: 1 }))).toEqual({
      peut: false,
      raison: "DEJA_ECRIT_PAR_D_AUTRES",
    });
  });

  it("n’a rien à justifier chez lui", () => {
    const verdict = peutRetirerLaScene(scene({ estLAuteur: true }));
    expect(verdict.peut && verdict.motifRequis).toBe(false);
  });

  it("ne touche pas à la scène d’un autre", () => {
    expect(peutRetirerLaScene(scene())).toEqual({
      peut: false,
      raison: "PAS_A_MOI",
    });
    expect(peutRetirerLaScene(scene({ auteursAutres: 3 }))).toEqual({
      peut: false,
      raison: "PAS_A_MOI",
    });
  });
});

describe("retirer une scène — le staff", () => {
  it("passe dans tous les cas", () => {
    for (const etat of [
      scene({ estStaff: true }),
      scene({ estStaff: true, auteursAutres: 5 }),
      scene({ estStaff: true, estLAuteur: true, auteursAutres: 2 }),
    ]) {
      expect(peutRetirerLaScene(etat).peut).toBe(true);
    }
  });

  /**
   * **Le motif est obligatoire même sur une scène vide.** C'est la seule
   * chose qui restera au journal : « scène supprimée » sans le pourquoi ne se
   * relit pas six mois plus tard.
   */
  it("doit toujours dire pourquoi, même sur une scène vide", () => {
    const verdict = peutRetirerLaScene(scene({ estStaff: true }));
    expect(verdict.peut && verdict.motifRequis).toBe(true);
  });

  it("prévient dès que quelqu’un d’autre y a écrit, jamais sinon", () => {
    const vide = peutRetirerLaScene(scene({ estStaff: true }));
    expect(vide.peut && vide.previendra).toBe(false);

    const peuplee = peutRetirerLaScene(scene({ estStaff: true, auteursAutres: 2 }));
    expect(peuplee.peut && peuplee.previendra).toBe(true);
  });
});

describe("proposer la clôture d’abord", () => {
  it("dès qu’un autre a écrit, quel que soit le demandeur", () => {
    expect(mieuxVautClore(scene({ estLAuteur: true, auteursAutres: 1 }))).toBe(true);
    expect(mieuxVautClore(scene({ estStaff: true, auteursAutres: 1 }))).toBe(true);
  });

  it("jamais sur une scène où l’on est seul", () => {
    expect(mieuxVautClore(scene({ estLAuteur: true }))).toBe(false);
    expect(mieuxVautClore(scene({ estStaff: true }))).toBe(false);
  });
});

const post = (etat: Partial<Parameters<typeof peutRetirerSonPost>[0]> = {}) => ({
  estStaff: false,
  estLAuteur: false,
  aDesPostsApres: false,
  ...etat,
});

describe("retirer son post", () => {
  it("part sans laisser de trace quand il fermait la scène", () => {
    expect(peutRetirerSonPost(post({ estLAuteur: true }))).toEqual({
      peut: true,
      placeConservee: false,
    });
  });

  /**
   * Une réponse qui suit un trou ne se comprend plus : la place reste, et
   * l'écran dit qu'un post a été retiré.
   */
  it("laisse sa place dès qu’on a répondu après lui", () => {
    expect(
      peutRetirerSonPost(post({ estLAuteur: true, aDesPostsApres: true })),
    ).toEqual({ peut: true, placeConservee: true });
  });

  it("n’appartient qu’à son auteur", () => {
    expect(peutRetirerSonPost(post())).toEqual({
      peut: false,
      raison: "PAS_A_MOI",
    });
  });

  /**
   * **Le staff ne retire pas un post par ici.** Masquer est un autre geste,
   * qui laisse le texte lisible à son auteur pour qu'il le reprenne
   * (art. 19.3) — voir `masquerPost`. Les confondre ferait disparaître ce
   * qu'on demandait de corriger.
   */
  it("ne s’ouvre pas au staff sur le post d’autrui", () => {
    expect(peutRetirerSonPost(post({ estStaff: true }))).toEqual({
      peut: false,
      raison: "PAS_A_MOI",
    });
  });
});
