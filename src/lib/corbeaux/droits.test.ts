import { describe, expect, it } from "vitest";
import {
  AUCUN_BLOCAGE,
  cleAdministration,
  clePaire,
  conversationClosePourMoi,
  peutOuvrirLaTour,
  peutRecevoirUnCorbeau,
  porteeDeLaTour,
  sortDuCorbeau,
  sortDuCorbeauVersAdministration,
  type PourLesCorbeaux,
} from "./droits";

/**
 * Qui peut écrire à qui — et ce qu’un corbeau devient.
 *
 * **Le cœur de ces tests est la symétrie qui n’en est pas une** : bloquer et
 * être bloqué ne se voient pas de la même façon des deux côtés, et c’est
 * exactement ce qui protège la personne qui bloque. Plusieurs tests ci-dessous
 * n’existent que pour empêcher qu’on « corrige » cette asymétrie un jour, en
 * la prenant pour un oubli.
 */

function membre(modifications: Partial<PourLesCorbeaux> = {}): PourLesCorbeaux {
  return {
    id: "membre-1",
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    ...modifications,
  };
}

const ALICE = membre({ id: "alice" });
const BOB = membre({ id: "bob" });

describe("à qui la Tour s’ouvre", () => {
  it.each([
    ["un membre en règle", membre(), "TOUT"],
    ["un membre suspendu", membre({ statutAcces: "EN_BANNISSEMENT" }), "ADMINISTRATION_SEULE"],
    ["un dossier en attente", membre({ statut: "EN_ATTENTE", statutAcces: "EN_ATTENTE" }), "RIEN"],
    ["un dossier à corriger", membre({ statut: "A_CORRIGER" }), "RIEN"],
    ["un dossier refusé", membre({ statut: "REFUSE" }), "RIEN"],
    ["un brouillon jamais envoyé", membre({ statut: "BROUILLON" }), "RIEN"],
  ])("%s : %s", (_cas, compte, attendu) => {
    expect(porteeDeLaTour(compte)).toBe(attendu);
  });

  /**
   * Le point le plus contre-intuitif du fichier, et une décision du joueur :
   * un membre suspendu garde la Tour. Non pour continuer à bavarder — il ne
   * verra aucune de ses conversations —, mais parce que l’article 8.5 lui
   * donne quinze jours pour contester sa sanction par message privé.
   */
  it("reste ouverte à un membre suspendu, pour le seul recours", () => {
    const suspendu = membre({ statutAcces: "EN_BANNISSEMENT" });
    expect(peutOuvrirLaTour(suspendu)).toBe(true);
    expect(sortDuCorbeauVersAdministration(suspendu)).toEqual({ sort: "PART" });
  });

  it("reste fermée à un dossier non accepté, même pour l’administration", () => {
    // Un postulant en attente n'a pas encore de compte au sens du forum : il
    // écrit à l'administration par courriel, pas par la Tour.
    expect(
      sortDuCorbeauVersAdministration(membre({ statut: "EN_ATTENTE" })),
    ).toEqual({ sort: "REFUSE", raison: "TOUR_FERMEE" });
  });

  /**
   * La Tour ne regarde NI la maison NI la baguette, et c’est délibéré : le
   * moment où l’on a le plus besoin d’écrire à quelqu’un est celui où l’on
   * vient d’arriver.
   */
  it("s’ouvre au nouvel arrivant, avant sa baguette et le Miroir", () => {
    expect(porteeDeLaTour(membre())).toBe("TOUT");
  });
});

describe("qui peut recevoir un corbeau", () => {
  it("un dossier accepté, et lui seul", () => {
    expect(peutRecevoirUnCorbeau({ statut: "ACCEPTE" })).toBe(true);
    for (const statut of ["EN_ATTENTE", "A_CORRIGER", "REFUSE", "BROUILLON"] as const) {
      expect(peutRecevoirUnCorbeau({ statut }), statut).toBe(false);
    }
  });

  /**
   * Un membre suspendu reste joignable : sa suspension est le plus souvent
   * temporaire, et le corbeau l’attendra. Le retirer de la circulation
   * annoncerait sa sanction à tout le forum, ce que l’article 8.2 interdit —
   * les décisions se disent en privé.
   */
  it("un membre suspendu reste joignable", () => {
    expect(
      sortDuCorbeau(ALICE, membre({ id: "bob", statutAcces: "EN_BANNISSEMENT" }), AUCUN_BLOCAGE),
    ).toEqual({ sort: "PART" });
  });
});

describe("le corbeau ordinaire", () => {
  it("part", () => {
    expect(sortDuCorbeau(ALICE, BOB, AUCUN_BLOCAGE)).toEqual({ sort: "PART" });
  });

  it("ne part pas vers soi-même", () => {
    expect(sortDuCorbeau(ALICE, ALICE, AUCUN_BLOCAGE)).toEqual({
      sort: "REFUSE",
      raison: "DESTINATAIRE_INCONNU",
    });
  });

  it("ne part pas d’un compte à qui la Tour est fermée", () => {
    expect(
      sortDuCorbeau(membre({ id: "alice", statut: "REFUSE" }), BOB, AUCUN_BLOCAGE),
    ).toEqual({ sort: "REFUSE", raison: "TOUR_FERMEE" });
  });

  it("ne part pas d’un membre suspendu vers un autre membre", () => {
    expect(
      sortDuCorbeau(
        membre({ id: "alice", statutAcces: "EN_BANNISSEMENT" }),
        BOB,
        AUCUN_BLOCAGE,
      ),
    ).toEqual({ sort: "REFUSE", raison: "SUSPENDU" });
  });
});

describe("le blocage, vu des deux côtés", () => {
  /**
   * ⚠️ **Ces deux tests-ci sont le cœur du dispositif.**
   *
   * Ils décrivent deux situations symétriques qui doivent produire des
   * réponses OPPOSÉES. Si l’un des deux venait à échouer après une
   * « simplification », c’est que le blocage s’est mis à se voir.
   */
  it("celui qui a bloqué se voit refuser : il a fermé cette porte lui-même", () => {
    expect(
      sortDuCorbeau(ALICE, BOB, { jeLaiBloque: true, ilMaBloque: false }),
    ).toEqual({ sort: "REFUSE", raison: "CONVERSATION_CLOSE" });
  });

  it("celui qui est bloqué voit son corbeau partir — et il part dans le vide", () => {
    expect(
      sortDuCorbeau(ALICE, BOB, { jeLaiBloque: false, ilMaBloque: true }),
    ).toEqual({ sort: "PART_DANS_LE_VIDE" });
  });

  /**
   * Aucune raison n’accompagne `PART_DANS_LE_VIDE`, et il ne faut jamais lui
   * en ajouter une : la route rend ce verdict à l’identique d’un `PART`, et
   * un champ de plus finirait par se retrouver dans une réponse HTTP.
   */
  it("n’emporte aucune explication qui pourrait fuir dans une réponse", () => {
    const verdict = sortDuCorbeau(ALICE, BOB, { jeLaiBloque: false, ilMaBloque: true });
    expect(Object.keys(verdict)).toEqual(["sort"]);
  });

  it("un blocage réciproque : c’est le mien qui l’emporte, et on me le dit", () => {
    expect(
      sortDuCorbeau(ALICE, BOB, { jeLaiBloque: true, ilMaBloque: true }),
    ).toEqual({ sort: "REFUSE", raison: "CONVERSATION_CLOSE" });
  });

  it("un fil ne se ferme JAMAIS du côté de celui qui vient d’être bloqué", () => {
    // Le jour où quelqu'un ajoutera `|| ilMaBloque` « par symétrie », ce test
    // tombera — et c'est précisément son rôle.
    expect(conversationClosePourMoi({ jeLaiBloque: false, ilMaBloque: true })).toBe(false);
    expect(conversationClosePourMoi({ jeLaiBloque: true, ilMaBloque: false })).toBe(true);
  });

  it("l’administration ne se bloque pas", () => {
    expect(sortDuCorbeauVersAdministration(ALICE)).toEqual({ sort: "PART" });
  });
});

describe("la clé d’un fil", () => {
  it("est la même quel que soit celui qui parle en premier", () => {
    expect(clePaire("alice", "bob")).toBe(clePaire("bob", "alice"));
  });

  it("ne se confond jamais avec celle de l’administration", () => {
    // La base porte la même règle, en `CHECK` : sans elle, une conversation
    // entre joueurs pourrait se déguiser en fil du staff, qui le lirait.
    expect(clePaire("alice", "bob").startsWith("administration:")).toBe(false);
    expect(cleAdministration("alice").startsWith("administration:")).toBe(true);
  });

  it("donne une clé différente à chaque membre pour son fil du staff", () => {
    expect(cleAdministration("alice")).not.toBe(cleAdministration("bob"));
  });
});
