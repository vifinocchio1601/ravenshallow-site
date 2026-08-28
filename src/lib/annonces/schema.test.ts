import { describe, expect, it } from "vitest";
import {
  validerCorpsAnnonce,
  validerEntreeEnVigueur,
  validerTitreAnnonce,
} from "./schema";
import { TITRE_ANNONCE_MAX } from "./limites";

/**
 * `schema.ts` est la seule porte par laquelle une annonce entre en base : le
 * dépôt l'appelle lui-même, si bien qu'aucune action serveur ne peut
 * l'oublier. Ces essais figent ce qu'elle laisse passer.
 */

describe("le titre d’une annonce", () => {
  it("passe tel quel", () => {
    const r = validerTitreAnnonce("Les inscriptions rouvrent");
    expect(r).toEqual({ ok: true, valeur: "Les inscriptions rouvrent" });
  });

  it("est ramené à une seule ligne", () => {
    const r = validerTitreAnnonce("Deux\nlignes");
    expect(r.ok && r.valeur).toBe("Deux lignes");
  });

  it("refuse le vide, et les blancs qui en tiennent lieu", () => {
    for (const brut of ["", "   ", "\n\n", "\t", null, 42]) {
      expect(validerTitreAnnonce(brut).ok, JSON.stringify(brut)).toBe(false);
    }
  });

  it("refuse au-delà de la borne, et accepte pile dessus", () => {
    expect(validerTitreAnnonce("a".repeat(TITRE_ANNONCE_MAX)).ok).toBe(true);
    expect(validerTitreAnnonce("a".repeat(TITRE_ANNONCE_MAX + 1)).ok).toBe(false);
  });
});

describe("le corps d’une annonce", () => {
  it("garde le balisage permis", () => {
    const r = validerCorpsAnnonce("<p>Un <strong>mot</strong> en gras.</p>");
    expect(r.ok && r.valeur).toContain("<strong>");
  });

  /**
   * Le nettoyage se fait ICI, et non chez l'appelant : c'est ce qui garantit
   * qu'aucun chemin d'écriture ne peut l'oublier.
   */
  it("passe par la liste blanche, sans qu’on ait à le demander", () => {
    const r = validerCorpsAnnonce('<p>Bonjour<script>alert(1)</script></p>');
    expect(r.ok && r.valeur).not.toContain("script");
  });

  /**
   * Le vide se juge sur le CONTENU et non sur la chaîne : « <p></p> » pèse
   * sept signes et ne dit rien. Une annonce n'a aucun minimum de lignes — les
   * dix de l'article 12.2 pèsent sur le jeu de rôle —, donc c'est la seule
   * chose qui rattrape un envoi vide.
   */
  it("refuse un balisage qui ne porte rien", () => {
    for (const brut of ["", "<p></p>", "<p>   </p>", "<p><br></p>"]) {
      expect(validerCorpsAnnonce(brut).ok, brut).toBe(false);
    }
  });

  /** Trois mots suffisent : il n’y a pas de minimum au Grand Hall. */
  it("accepte une annonce d’une ligne", () => {
    expect(validerCorpsAnnonce("<p>Les inscriptions rouvrent lundi.</p>").ok).toBe(
      true,
    );
  });

  it("accepte une annonce faite d’une seule image", () => {
    expect(
      validerCorpsAnnonce('<p><img src="https://exemple.test/a.png"></p>').ok,
    ).toBe(true);
  });
});

describe("l’entrée en vigueur", () => {
  const AFFICHAGE = new Date(2026, 7, 28, 14, 0, 0);

  /**
   * **Facultative, et c'est tout son sens.** Une annonce ordinaire n'entre pas
   * en vigueur, elle est affichée : un champ vide ne doit jamais produire une
   * erreur.
   */
  it("rend null sur un champ vide, absent ou fait d’espaces", () => {
    for (const brut of ["", "   ", null, undefined, 42]) {
      expect(validerEntreeEnVigueur(brut, AFFICHAGE)).toEqual({
        ok: true,
        valeur: null,
      });
    }
  });

  it("lit une journée et la pose à midi", () => {
    const r = validerEntreeEnVigueur("2026-09-04", AFFICHAGE);
    expect(r.ok).toBe(true);
    const date = r.ok ? r.valeur! : null;
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(8);
    expect(date?.getDate()).toBe(4);
    // Midi, et non minuit : à minuit UTC, la moitié de la planète lirait la
    // veille.
    expect(date?.getHours()).toBe(12);
  });

  /**
   * ⚠️ **On compare des JOURS, et l'on stocke un instant.** Une annonce
   * publiée à 14 h et applicable « aujourd'hui » porterait midi, soit deux
   * heures avant sa propre publication : la contrainte de la base la
   * refuserait. « En vigueur immédiatement » est pourtant légitime.
   */
  it("accepte le jour même, et retient l’instant de l’affichage", () => {
    const r = validerEntreeEnVigueur("2026-08-28", AFFICHAGE);
    expect(r.ok).toBe(true);
    expect(r.ok && r.valeur?.getTime()).toBe(AFFICHAGE.getTime());
  });

  /** La base le refuserait ; mieux vaut une phrase qu’une erreur 500. */
  it("refuse la veille de l’affichage", () => {
    expect(validerEntreeEnVigueur("2026-08-27", AFFICHAGE).ok).toBe(false);
  });

  it("refuse ce qui n’est pas une journée", () => {
    for (const brut of ["demain", "04/09/2026", "2026-9-4", "2026-09"]) {
      expect(validerEntreeEnVigueur(brut, AFFICHAGE).ok, brut).toBe(false);
    }
  });

  /**
   * `new Date(2026, 1, 31)` ne bronche pas et rend le 3 mars. Afficher une
   * date que personne n'a saisie est pire que refuser la saisie.
   */
  it("refuse un 31 février plutôt que de le déplacer", () => {
    expect(validerEntreeEnVigueur("2027-02-31", AFFICHAGE).ok).toBe(false);
  });
});
