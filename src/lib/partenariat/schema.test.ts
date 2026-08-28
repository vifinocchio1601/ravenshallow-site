import { describe, expect, it } from "vitest";
import {
  validerCourriel,
  validerDescriptionPartenaire,
  validerJourNoue,
  validerMessageDemande,
  validerNomForum,
  validerUrlBanniere,
  validerUrlForum,
} from "./schema";
import { MESSAGE_DEMANDE_MAX, MESSAGE_DEMANDE_MIN, NOM_FORUM_MAX } from "./limites";

/**
 * Ce qu'un partenaire et une demande ont le droit d'être.
 *
 * Les mêmes règles que la base, en plus fin : la migration n'arrête que ce qui
 * rendrait la ligne inexploitable, le travail de détail est ici.
 */

describe("le nom d'un forum", () => {
  it("accepte un nom ordinaire", () => {
    expect(validerNomForum("Les Chroniques d’Ysgard")).toEqual({
      ok: true,
      valeur: "Les Chroniques d’Ysgard",
    });
  });

  it("ramène le nom à une ligne", () => {
    // Un bloc de liens ne s'aligne pas si un nom porte un retour à la ligne.
    expect(validerNomForum("Les Chroniques\nd’Ysgard")).toEqual({
      ok: true,
      valeur: "Les Chroniques d’Ysgard",
    });
  });

  it("refuse ce qui n'est fait que de blancs", () => {
    // ⚠️ Des retours à la ligne, pas des espaces : c'est le cas que `btrim`
    // laisse passer côté base, et qui a coûté une migration aux corbeaux.
    expect(validerNomForum("\n\n\t ").ok).toBe(false);
  });

  it("refuse un nom trop long", () => {
    expect(validerNomForum("a".repeat(NOM_FORUM_MAX + 1)).ok).toBe(false);
  });
});

describe("l'adresse d'un forum", () => {
  it("accepte une adresse en https", () => {
    expect(validerUrlForum("https://exemple-rpg.com/index.php")).toEqual({
      ok: true,
      valeur: "https://exemple-rpg.com/index.php",
    });
  });

  it("ne réécrit jamais l'adresse", () => {
    // ⚠️ On valide avec `URL`, on conserve la chaîne d'origine : une adresse
    // ré-encodée change parfois de sens. Piège déjà payé sur la chaîne de
    // connexion de la base.
    const brute = "https://exemple-rpg.com/f5-la-forêt?d=1&t=2";
    expect(validerUrlForum(brute)).toEqual({ ok: true, valeur: brute });
  });

  it("refuse le trafic en clair", () => {
    expect(validerUrlForum("http://exemple-rpg.com").ok).toBe(false);
  });

  it("refuse un hôte sans point", () => {
    // « https://intranet » n'est joignable que sur un réseau local.
    expect(validerUrlForum("https://intranet").ok).toBe(false);
  });

  it("refuse ce qui n'est pas une adresse", () => {
    expect(validerUrlForum("venez nous voir !").ok).toBe(false);
  });

  it("refuse le vide", () => {
    expect(validerUrlForum("").ok).toBe(false);
  });
});

describe("l'adresse de leur bannière", () => {
  it("est facultative — vide vaut « pas de bannière »", () => {
    expect(validerUrlBanniere("")).toEqual({ ok: true, valeur: null });
    expect(validerUrlBanniere(null)).toEqual({ ok: true, valeur: null });
    expect(validerUrlBanniere(undefined)).toEqual({ ok: true, valeur: null });
    expect(validerUrlBanniere("   ")).toEqual({ ok: true, valeur: null });
  });

  it("exige https quand elle est là", () => {
    expect(validerUrlBanniere("http://img.example/b.png").ok).toBe(false);
    expect(validerUrlBanniere("https://img.example/b.png")).toEqual({
      ok: true,
      valeur: "https://img.example/b.png",
    });
  });
});

describe("la description d'un partenaire", () => {
  it("est facultative", () => {
    expect(validerDescriptionPartenaire("")).toEqual({ ok: true, valeur: null });
    expect(validerDescriptionPartenaire(null)).toEqual({
      ok: true,
      valeur: null,
    });
  });

  it("refuse ce qui dépasse", () => {
    expect(validerDescriptionPartenaire("a".repeat(301)).ok).toBe(false);
  });
});

describe("l'adresse de courriel", () => {
  it("accepte une adresse valide, et la met en minuscules", () => {
    expect(validerCourriel("  Contact@Exemple-RPG.com ")).toEqual({
      ok: true,
      valeur: "contact@exemple-rpg.com",
    });
  });

  it("refuse ce qui n'en est pas une", () => {
    expect(validerCourriel("contact chez exemple").ok).toBe(false);
    expect(validerCourriel("contact@").ok).toBe(false);
    expect(validerCourriel("").ok).toBe(false);
  });
});

describe("le message d'une demande", () => {
  it("accepte un mot court mais réel", () => {
    const mot = "Bonjour, un partenariat vous tenterait ?";
    expect(validerMessageDemande(mot)).toEqual({ ok: true, valeur: mot });
  });

  it("refuse plus court que le minimum", () => {
    expect(validerMessageDemande("a".repeat(MESSAGE_DEMANDE_MIN - 1)).ok).toBe(
      false,
    );
  });

  it("accepte pile au minimum", () => {
    expect(validerMessageDemande("a".repeat(MESSAGE_DEMANDE_MIN)).ok).toBe(true);
  });

  it("refuse plus long que le maximum", () => {
    expect(validerMessageDemande("a".repeat(MESSAGE_DEMANDE_MAX + 1)).ok).toBe(
      false,
    );
  });
});

describe("le jour où le partenariat a été noué", () => {
  it("pose la date à midi, jamais à minuit", () => {
    // ⚠️ À minuit UTC, la moitié de la planète lirait la veille. Même
    // précaution que l'entrée en vigueur d'une annonce.
    const resultat = validerJourNoue("2026-09-15");
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.valeur.getHours()).toBe(12);
  });

  it("exige une date", () => {
    expect(validerJourNoue("").ok).toBe(false);
    expect(validerJourNoue(null).ok).toBe(false);
  });

  it("refuse ce qui ne se lit pas", () => {
    expect(validerJourNoue("le 15 septembre").ok).toBe(false);
  });
});
