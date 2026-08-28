import { describe, expect, it } from "vitest";
import { verifierLesFreins } from "./freins";
import { DELAI_MINIMAL_MS, DEMANDES_PAR_HEURE } from "./limites";

/**
 * Les freins du formulaire public.
 *
 * Tout se joue sur des valeurs passées en paramètre : ni horloge, ni base.
 * C'est le parti pris d'`etatDuPlafond` dans la Tour aux Corbeaux et du frein
 * du salon.
 */

const MAINTENANT = new Date("2026-09-15T12:00:00.000Z").getTime();

const etat = (surcharge: Partial<Parameters<typeof verifierLesFreins>[0]>) => ({
  pot: null,
  ouvertLe: MAINTENANT - 30_000,
  maintenant: MAINTENANT,
  demandesDansLHeure: 0,
  ...surcharge,
});

describe("les freins du formulaire de partenariat", () => {
  it("laisse passer une demande ordinaire", () => {
    expect(verifierLesFreins(etat({}))).toEqual({ suite: "PASSE" });
  });

  it("avale ce qui a rempli le pot de miel", () => {
    expect(verifierLesFreins(etat({ pot: "https://spam.example" }))).toEqual({
      suite: "AVALE",
    });
  });

  it("ne prend pas un pot rempli d'espaces pour un robot", () => {
    // Un navigateur peut poser une espace sur un champ laissé vide ; ce n'est
    // pas un remplissage.
    expect(verifierLesFreins(etat({ pot: "   " }))).toEqual({ suite: "PASSE" });
  });

  it("avale un envoi trop rapide pour être humain", () => {
    expect(
      verifierLesFreins(
        etat({ ouvertLe: MAINTENANT - (DELAI_MINIMAL_MS - 1) }),
      ),
    ).toEqual({ suite: "AVALE" });
  });

  it("laisse passer pile au délai minimal", () => {
    expect(
      verifierLesFreins(etat({ ouvertLe: MAINTENANT - DELAI_MINIMAL_MS })),
    ).toEqual({ suite: "PASSE" });
  });

  it("laisse passer quand l'instant d'ouverture manque", () => {
    // ⚠️ Un navigateur sans JavaScript ne le pose pas. Traiter l'absence comme
    // un envoi trop rapide fermerait le formulaire à qui bloque les scripts,
    // sans que rien ne le lui dise.
    expect(verifierLesFreins(etat({ ouvertLe: null }))).toEqual({
      suite: "PASSE",
    });
  });

  it("laisse passer un instant venu du futur", () => {
    // Une horloge déréglée ne prouve rien. Le refus serait un faux positif
    // impossible à comprendre depuis l'écran.
    expect(
      verifierLesFreins(etat({ ouvertLe: MAINTENANT + 60_000 })),
    ).toEqual({ suite: "PASSE" });
  });

  it("fait attendre au-delà du plafond horaire", () => {
    expect(
      verifierLesFreins(etat({ demandesDansLHeure: DEMANDES_PAR_HEURE })),
    ).toEqual({ suite: "ATTENDRE" });
  });

  it("laisse passer la dernière place du plafond", () => {
    expect(
      verifierLesFreins(etat({ demandesDansLHeure: DEMANDES_PAR_HEURE - 1 })),
    ).toEqual({ suite: "PASSE" });
  });

  it("préfère avaler un robot plutôt que de lui dire d'attendre", () => {
    // L'ordre compte : « revenez dans une heure » est une information, et l'on
    // n'en donne aucune à une machine.
    expect(
      verifierLesFreins(
        etat({ pot: "x", demandesDansLHeure: DEMANDES_PAR_HEURE }),
      ),
    ).toEqual({ suite: "AVALE" });
  });
});
