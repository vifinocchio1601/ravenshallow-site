import { describe, expect, it } from "vitest";
import { corpsDeLEchec, corpsDuRapport } from "./corps";
import { objetDeLEchec, objetDuRapport } from "./objet";
import { verifierAvantEnvoi } from "./caviardage";
import { bilanCalme, bilanCharge } from "./exemples";

describe("l’objet du courriel", () => {
  it("se lit sans ouvrir le message", () => {
    expect(objetDuRapport(bilanCharge())).toBe(
      "Ravenshallow — 3 anomalies, 3 dossiers en attente, 2 signalements — 12 sept.",
    );
  });

  it("dit que tout va bien quand tout va bien", () => {
    expect(objetDuRapport(bilanCalme())).toBe(
      "Ravenshallow — tout va bien — 13 sept.",
    );
  });

  /**
   * ⚠️ « Tout va bien » ne se dit que si la ronde a VRAIMENT tout vu. Une
   * ronde amputée qui l'annoncerait mentirait par omission — et c'est
   * exactement le silence qu'on cherche à rendre impossible.
   */
  it("ne dit jamais que tout va bien sur une ronde amputée", () => {
    const bilan = {
      ...bilanCalme(),
      manquants: [{ nom: "la cohérence", raison: "base injoignable" }],
    };
    const objet = objetDuRapport(bilan);
    expect(objet).not.toContain("tout va bien");
    expect(objet).toContain("1 contrôle n’a pas abouti");
  });

  it("accorde au singulier, zéro compris", () => {
    const bilan = { ...bilanCalme() };
    bilan.anomalies = [bilanCharge().anomalies[0]];
    expect(objetDuRapport(bilan)).toContain("1 anomalie —");
  });

  it("l’échec de la ronde a son propre objet, reconnaissable", () => {
    expect(objetDeLEchec(new Date("2026-09-12T03:00:00Z"))).toBe(
      "Ravenshallow — la ronde est tombée — 12 sept.",
    );
  });
});

describe("le corps du rapport", () => {
  const charge = corpsDuRapport(bilanCharge());

  it("met ce qui ne va pas en premier, dans l’ordre de gravité", () => {
    const panne = charge.indexOf("PANNE");
    const degat = charge.indexOf("DÉGÂT");
    const attente = charge.indexOf("CE QUI T’ATTEND");
    expect(panne).toBeGreaterThan(-1);
    expect(panne).toBeLessThan(degat);
    expect(degat).toBeLessThan(attente);
  });

  it("dit depuis quand une anomalie dure", () => {
    expect(charge).toContain("déjà là depuis 4 jours");
    expect(charge).toContain("vue ce matin");
  });

  it("compte ce qui attend sans nommer personne", () => {
    expect(charge).toContain("3 dossiers d’admission attendent une lecture");
    expect(charge).toContain("2 signalements n’ont pas été traités");
    expect(charge).toContain("1 lettre au château attend une réponse");
  });

  it("tait ce qui est à zéro plutôt que d’écrire « 0 »", () => {
    expect(charge).not.toContain("0 demande");
  });

  it("groupe les erreurs au lieu de les lister", () => {
    expect(charge).toContain("52 × connexion — PrismaClientKnownRequestError (P2028)");
    expect(charge).toContain("2 autres familles");
  });

  it("écrit l’écart avec un vrai signe moins", () => {
    // U+2212, jamais le trait d'union : dans une colonne de chiffres,
    // « -15 » et « +15 » ne se lisent pas à la même hauteur.
    expect(charge).toContain("−89 %");
  });

  it("sépare les suggestions des faits, et dit d’où elles viennent", () => {
    const suggestions = charge.indexOf("SUGGESTIONS");
    expect(suggestions).toBeGreaterThan(charge.indexOf("LA VIE DU SITE"));
    expect(charge).toContain("Écrites par un modèle de langage");
  });

  it("dit ce que la ronde n’a pas pu voir", () => {
    expect(charge).toContain("CE QUE LA RONDE N’A PAS PU VOIR");
    expect(charge).toContain("le parcours au navigateur");
  });

  it("ne dépasse jamais 66 colonnes", () => {
    for (const ligne of charge.split("\n")) {
      expect(ligne.length, ligne).toBeLessThanOrEqual(66);
    }
  });

  it("dit clairement quand une famille de contrôles manque", () => {
    const sansAttente = corpsDuRapport({ ...bilanCharge(), attente: null });
    expect(sansAttente).toContain("Ce contrôle n’a pas abouti");
  });

  it("dit quand la synthèse manque, sans que le rapport en souffre", () => {
    const sansIA = corpsDuRapport({ ...bilanCharge(), suggestions: null });
    expect(sansIA).toContain("La synthèse n’a pas pu être écrite");
    // Et les faits sont toujours là : c'est tout le point.
    expect(sansIA).toContain("3 dossiers d’admission attendent une lecture");
  });

  it("annonce une ronde écourtée", () => {
    const court = corpsDuRapport({ ...bilanCharge(), ecourtee: true });
    expect(court).toContain("durée maximale");
  });
});

describe("un matin calme", () => {
  const calme = corpsDuRapport(bilanCalme());

  it("le dit sans faire semblant qu’il se passe quelque chose", () => {
    expect(calme).toContain("Rien à signaler ce matin.");
    expect(calme).toContain("Rien n’attend. Tout est à jour.");
  });

  it("ne montre pas une section d’erreurs vide", () => {
    expect(calme).not.toContain("Erreurs du serveur");
  });
});

describe("le courriel d’échec", () => {
  it("dit ce qui s’est passé, et pourquoi il part quand même", () => {
    const corps = corpsDeLEchec(new Date("2026-09-12T03:00:00Z"), "base injoignable");
    expect(corps).toContain("base injoignable");
    expect(corps).toContain("Rien n’a été vérifié ce matin");
  });
});

describe("le filet avant l’envoi", () => {
  it("laisse partir un rapport propre", () => {
    const bilan = bilanCharge();
    expect(
      verifierAvantEnvoi(objetDuRapport(bilan), corpsDuRapport(bilan)).peutPartir,
    ).toBe(true);
  });

  /**
   * ⚠️ L'essai qui compte : un collecteur écrit distraitement remonte une
   * adresse. Le rapport ne doit PAS partir — et le refus ne doit pas recopier
   * l'adresse, sinon elle partirait dans le courriel d'échec.
   */
  it("retient un rapport qui porte une adresse, sans la recopier", () => {
    const bilan = bilanCharge();
    bilan.anomalies[0].detail = "envoi raté vers sigrid@exemple.fr";

    const verdict = verifierAvantEnvoi(objetDuRapport(bilan), corpsDuRapport(bilan));
    expect(verdict.peutPartir).toBe(false);
    if (verdict.peutPartir) return;
    expect(verdict.raison).not.toContain("sigrid@exemple.fr");
    expect(verdict.raison).toContain("adresse de courriel");
  });

  it("retient aussi une adresse glissée dans l’objet", () => {
    const bilan = bilanCalme();
    const verdict = verifierAvantEnvoi(
      "Ravenshallow — souci avec a@b.fr — 13 sept.",
      corpsDuRapport(bilan),
    );
    expect(verdict.peutPartir).toBe(false);
  });
});
