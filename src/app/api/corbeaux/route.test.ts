import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";

/**
 * Ce que la route des corbeaux accepte, et surtout ce qu’elle refuse.
 *
 * Les gardes sont refaites ici en entier, sans se reposer sur la page : une
 * route d’API est publique, et rien n’oblige un joueur à passer par
 * `/corbeaux` avant de l’appeler. Ces tests l’appellent d’ailleurs
 * directement, sans page.
 *
 * **Le test le plus important du fichier est celui qui compare deux réponses
 * octet pour octet** : celle d’un corbeau ordinaire et celle d’un corbeau
 * bloqué. Si ces deux-là venaient à différer — un champ, un code, un ordre —,
 * il suffirait d’ouvrir l’inspecteur de son navigateur pour savoir qu’on a
 * été bloqué. Et c’est exactement ce que le blocage doit éviter.
 */

const simule = vi.hoisted(() => ({
  compteConnecte: vi.fn(),
  envoyerCorbeau: vi.fn(),
  listerConversations: vi.fn(),
  compterNonLus: vi.fn(),
}));

vi.mock("@/lib/session/garde", () => ({
  compteConnecte: simule.compteConnecte,
}));

vi.mock("@/lib/corbeaux/depot", () => ({
  envoyerCorbeau: simule.envoyerCorbeau,
  listerConversations: simule.listerConversations,
  compterNonLus: simule.compterNonLus,
}));

const { GET, POST } = await import("./route");

function compte(modifications: Record<string, unknown> = {}) {
  return {
    id: "alice",
    eleveId: "fiche-alice",
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    ...modifications,
  };
}

function envoi(corps: unknown) {
  return new Request("http://localhost/api/corbeaux", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  simule.listerConversations.mockResolvedValue([]);
  simule.compterNonLus.mockResolvedValue(0);
});

describe("qui a le droit d’écrire", () => {
  it("sans session : 401", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(reponse.status).toBe(401);
    expect(simule.envoyerCorbeau).not.toHaveBeenCalled();
  });

  it("sans destinataire : 403, et rien n’est écrit", async () => {
    simule.compteConnecte.mockResolvedValue(compte());
    const reponse = await POST(envoi({ corps: "Bonsoir" }));
    expect(reponse.status).toBe(403);
    expect(simule.envoyerCorbeau).not.toHaveBeenCalled();
  });

  it("la liste demande une session, elle aussi", async () => {
    simule.compteConnecte.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("la liste se ferme à un dossier non accepté", async () => {
    simule.compteConnecte.mockResolvedValue(compte({ statut: "EN_ATTENTE" }));
    const reponse = await GET();
    expect(reponse.status).toBe(403);
    expect(simule.listerConversations).not.toHaveBeenCalled();
  });
});

describe("ce que la route refuse d’écrire", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  it.each([
    ["un corbeau vide", ""],
    ["un corbeau de blancs", "   \n\n  "],
    ["un corbeau trop long", "x".repeat(5001)],
    ["un corps qui n’est pas du texte", 42],
  ])("%s : 422", async (_cas, corps) => {
    const reponse = await POST(envoi({ destinataireId: "bob", corps }));
    expect(reponse.status).toBe(422);
    expect(simule.envoyerCorbeau).not.toHaveBeenCalled();
  });

  it("une requête illisible : 400", async () => {
    const reponse = await POST(
      new Request("http://localhost/api/corbeaux", {
        method: "POST",
        body: "ceci n’est pas du JSON",
      }),
    );
    expect(reponse.status).toBe(400);
  });

  /**
   * Le texte est validé AVANT que le destinataire soit seulement lu. C’est la
   * seule vérification dont la réponse ne dépend de personne d’autre — et
   * donc la seule qui ne risque pas de laisser filtrer quoi que ce soit sur
   * celui à qui l’on écrit.
   */
  it("juge le texte avant de regarder à qui l’on écrit", async () => {
    const reponse = await POST(envoi({ destinataireId: "inconnu", corps: "" }));
    expect(reponse.status).toBe(422);
  });
});

describe("le corbeau passe le nettoyage avant d’être écrit", () => {
  beforeEach(() => {
    simule.compteConnecte.mockResolvedValue(compte());
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: true,
      conversationId: "fil-1",
      corbeauId: "corbeau-1",
    });
  });

  it("le dépôt reçoit le texte déjà rogné, jamais le brut", async () => {
    await POST(envoi({ destinataireId: "bob", corps: "  Bonsoir.  \n\n\n\n\nÀ demain.  " }));
    expect(simule.envoyerCorbeau).toHaveBeenCalledWith(
      expect.anything(),
      { membreId: "bob" },
      "Bonsoir.\n\nÀ demain.",
    );
  });

  it("l’administration se demande par un drapeau, pas par un identifiant", async () => {
    await POST(envoi({ administration: true, corps: "Bonsoir" }));
    expect(simule.envoyerCorbeau).toHaveBeenCalledWith(
      expect.anything(),
      { administration: true },
      "Bonsoir",
    );
  });
});

describe("ce que la route répond quand le dépôt refuse", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  it.each([
    ["TOUR_FERMEE", TEXTES_CORBEAUX.erreurs.tourFermee],
    ["SUSPENDU", TEXTES_CORBEAUX.erreurs.suspendu],
    ["DESTINATAIRE_INCONNU", TEXTES_CORBEAUX.erreurs.destinataireInconnu],
    ["CONVERSATION_CLOSE", TEXTES_CORBEAUX.erreurs.conversationClose],
  ])("%s : 403, avec une phrase et non un code", async (raison, phrase) => {
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: false,
      verdict: { sort: "REFUSE", raison },
    });

    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(reponse.status).toBe(403);
    expect(await reponse.json()).toEqual({ erreur: phrase, raison });
  });
});

describe("l’anti-démarchage répond une attente, pas une faute", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  /**
   * **429 et non 403.** Un corbeau refusé ne partira jamais ; celui-ci partira
   * dans un quart d’heure. Répondre « accès refusé » à quelqu’un qui a
   * simplement écrit à quatre personnes en une heure serait faux, et il
   * écrirait à l’administration pour comprendre ce qu’il a cassé.
   */
  it("429, avec le délai en clair", async () => {
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: false,
      verdict: { sort: "ATTENDRE", minutes: 12 },
    });

    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(reponse.status).toBe(429);

    const lu = (await reponse.json()) as { erreur: string; minutes: number };
    expect(lu.minutes).toBe(12);
    expect(lu.erreur).toContain("12");
    // La phrase rappelle ce qui reste ouvert : sans cela, on croit la Tour
    // fermée.
    expect(lu.erreur).toContain("répondre à une conversation ouverte");
  });

  it("une minute se dit au singulier", async () => {
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: false,
      verdict: { sort: "ATTENDRE", minutes: 1 },
    });

    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(await reponse.json()).toMatchObject({
      erreur: TEXTES_CORBEAUX.erreurs.plafondUneMinute,
    });
  });

  /**
   * Une attente n’est pas un refus, et ne doit donc jamais emprunter le
   * vocabulaire d’un refus : ni « raison », ni le code 403 qui l’accompagne.
   */
  it("ne se présente jamais comme un refus", async () => {
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: false,
      verdict: { sort: "ATTENDRE", minutes: 5 },
    });

    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(reponse.status).not.toBe(403);
    expect(await reponse.json()).not.toHaveProperty("raison");
  });
});

describe("le corbeau bloqué est indiscernable du corbeau ordinaire", () => {
  beforeEach(() => simule.compteConnecte.mockResolvedValue(compte()));

  /**
   * ⚠️ **Le test qui garde tout le dispositif.**
   *
   * Le dépôt rend exactement la même chose dans les deux cas — c’est lui qui
   * pose le masquage, silencieusement, dans la même transaction. La route,
   * elle, n’a aucun moyen de savoir lequel des deux vient de se produire, et
   * c’est très bien ainsi : ce qu’elle ne sait pas, elle ne peut pas le dire.
   *
   * Si ce test tombe un jour, c’est qu’un champ a été ajouté quelque part —
   * et qu’il suffit d’ouvrir l’inspecteur de son navigateur pour savoir qu’on
   * a été bloqué.
   */
  it("même code, mêmes champs, même corps", async () => {
    const memeRetour = {
      envoye: true,
      conversationId: "fil-1",
      corbeauId: "corbeau-1",
    };

    simule.envoyerCorbeau.mockResolvedValue(memeRetour);
    const ordinaire = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    const texteOrdinaire = await ordinaire.text();

    // Le même appel, du point de vue de quelqu'un qui vient d'être bloqué :
    // le dépôt a écrit le corbeau ET son masquage, et rend ceci.
    simule.envoyerCorbeau.mockResolvedValue(memeRetour);
    const bloque = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    const texteBloque = await bloque.text();

    expect(bloque.status).toBe(ordinaire.status);
    expect(texteBloque).toBe(texteOrdinaire);
  });

  /**
   * La réponse d’un envoi réussi ne porte QUE de quoi ouvrir le fil. Pas de
   * « livré », pas de « vu », pas de statut : un champ de plus est un champ
   * qui finirait par dire quelque chose.
   */
  it("ne rend rien de plus que le fil et le corbeau", async () => {
    simule.envoyerCorbeau.mockResolvedValue({
      envoye: true,
      conversationId: "fil-1",
      corbeauId: "corbeau-1",
    });

    const reponse = await POST(envoi({ destinataireId: "bob", corps: "Bonsoir" }));
    expect(Object.keys(await reponse.json()).sort()).toEqual([
      "conversationId",
      "corbeauId",
    ]);
  });
});
