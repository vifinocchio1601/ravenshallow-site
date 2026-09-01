import { describe, expect, it } from "vitest";
import { collecterLaDisponibilite, type Demandeur } from "./disponibilite";
import { PAGES_FERMEES, PAGES_PUBLIQUES } from "../constantes";

/**
 * Une horloge qui rend les valeurs qu'on lui donne, dans l'ordre, puis reste
 * sur la dernière. Les durées se vérifient alors sans attendre, et l'essai ne
 * dépend pas de la vitesse de la machine.
 *
 * Chaque page lit l'horloge deux fois : au début, puis à la fin.
 */
function horlogeDeValeurs(valeurs: number[]) {
  let i = 0;
  return () => valeurs[Math.min(i++, valeurs.length - 1)];
}

/** Un site qui répond ce qu'on lui dit de répondre. */
function siteQuiRepond(reponses: Record<string, number>, defaut = 200): Demandeur {
  return async (chemin, { cookie }) => {
    const cle = cookie ? `${chemin}#connecte` : chemin;
    const code = reponses[cle] ?? reponses[chemin] ?? defaut;
    if (code === 0) throw new Error("injoignable");
    return { code };
  };
}

/** Toutes les pages fermées se referment, toutes les publiques s’ouvrent. */
function siteEnBonneSante(): Demandeur {
  const reponses: Record<string, number> = {};
  for (const p of PAGES_FERMEES) {
    reponses[p.chemin] = 307;
    reponses[`${p.chemin}#connecte`] = 200;
  }
  return siteQuiRepond(reponses);
}

describe("un site en bonne santé", () => {
  it("ne lève aucune anomalie", async () => {
    const { anomalies, donnees } = await collecterLaDisponibilite({
      demandeur: siteEnBonneSante(),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
    });
    expect(anomalies).toHaveLength(0);
    expect(donnees.pages).toHaveLength(PAGES_PUBLIQUES.length + PAGES_FERMEES.length);
  });
});

describe("les pannes", () => {
  it("signale une page qui répond 500", async () => {
    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteQuiRepond({ "/reglement": 500 }),
      cookie: null,
      compteAUneMaison: true,
    });
    const panne = anomalies.find((a) => a.ou === "/reglement");
    expect(panne?.gravite).toBe("PANNE");
    expect(panne?.quoi).toContain("500");
  });

  it("signale une page muette", async () => {
    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteQuiRepond({ "/": 0 }),
      cookie: null,
      compteAUneMaison: true,
    });
    expect(anomalies.find((a) => a.ou === "/")?.cle).toContain("muette");
  });

  /**
   * ⚠️ La vérification qui compte le plus : une page de l'école qui s'ouvrirait
   * à un inconnu. Rien d'autre dans la ronde ne l'attraperait.
   */
  it("signale une PAGE FERMÉE qui s’ouvre sans session", async () => {
    const reponses: Record<string, number> = {};
    for (const p of PAGES_FERMEES) {
      reponses[p.chemin] = 307;
      reponses[`${p.chemin}#connecte`] = 200;
    }
    reponses["/bureau"] = 200; // la fuite

    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteQuiRepond(reponses),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
    });

    const fuite = anomalies.find((a) => a.cle.includes("ouverte-sans-session"));
    expect(fuite?.gravite).toBe("PANNE");
    expect(fuite?.ou).toBe("/bureau");
  });

  it("ne crie pas quand une page fermée redirige, quelle que soit la forme", async () => {
    for (const code of [302, 303, 307]) {
      const reponses: Record<string, number> = {};
      for (const p of PAGES_FERMEES) {
        reponses[p.chemin] = code;
        reponses[`${p.chemin}#connecte`] = 200;
      }
      const { anomalies } = await collecterLaDisponibilite({
        demandeur: siteQuiRepond(reponses),
        cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
      });
      expect(anomalies, `code ${code}`).toHaveLength(0);
    }
  });

  it("dit clairement quand la connexion du compte de service a échoué", async () => {
    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteEnBonneSante(),
      cookie: null,
      compteAUneMaison: true,
    });
    const souci = anomalies.find((a) => a.cle === "disponibilite:connexion-impossible");
    expect(souci?.gravite).toBe("PANNE");
  });
});

describe("la lenteur", () => {
  it("signale une page très lente, sans mettre le chiffre dans la clé", async () => {
    // La première page mesurée met neuf secondes ; ensuite l’horloge ne
    // bouge plus, donc toutes les autres durent zéro.
    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteEnBonneSante(),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
      horloge: horlogeDeValeurs([0, 9000]),
    });

    const lente = anomalies.find((a) => a.cle.includes("tres-lente"));
    expect(lente?.gravite).toBe("A_SURVEILLER");
    expect(lente?.detail).toBe("9,0 s");
    // ⚠️ La mesure est dans le détail, jamais dans la clé : sinon une lenteur
    // changerait d’identité chaque matin et ne durerait jamais.
    expect(lente?.cle).not.toContain("9");
  });

  it("laisse passer une page simplement un peu lente", async () => {
    const { anomalies } = await collecterLaDisponibilite({
      demandeur: siteEnBonneSante(),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
      horloge: horlogeDeValeurs([0, 2500]),
    });
    expect(anomalies).toHaveLength(0);
  });
});

describe("une page qui dépend de l’état du compte", () => {
  /**
   * ⚠️ **Le faux positif vécu au premier matin, et corrigé ici.**
   *
   * Le compte de La Veille a été passé en « sans objet » depuis
   * l'administration — comme une directrice, ce qu'il est au fond. `/maison`
   * s'est alors refermée sur lui, et la ronde a annoncé DEUX PANNES qui n'en
   * étaient pas : la page faisait exactement ce qu'elle doit.
   *
   * Un faux positif quotidien est pire qu'une surveillance absente : au bout
   * d'une semaine on ne lit plus le rapport.
   */
  it("n’est PAS une panne quand le compte n’a pas de maison", async () => {
    const reponses: Record<string, number> = {};
    for (const p of PAGES_FERMEES) {
      reponses[p.chemin] = 307;
      // Sans maison, le site referme aussi ces deux-là sur un compte connecté.
      reponses[`${p.chemin}#connecte`] = p.exigeUneMaison ? 307 : 200;
    }

    const { anomalies, donnees } = await collecterLaDisponibilite({
      demandeur: siteQuiRepond(reponses),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: false,
    });

    expect(anomalies, "aucune panne : la page se referme comme elle doit").toHaveLength(0);
    expect(donnees.nonVerifiees.map((p) => p.chemin)).toEqual([
      "/maison",
      "/maison/salon",
    ]);
    // Et elle DIT pourquoi : un trou silencieux se lirait « rien à signaler ».
    expect(donnees.nonVerifiees[0].raison).toContain("pas de maison");
  });

  it("mais reste une panne quand le compte EN a une", async () => {
    const reponses: Record<string, number> = {};
    for (const p of PAGES_FERMEES) {
      reponses[p.chemin] = 307;
      reponses[`${p.chemin}#connecte`] = 200;
    }
    reponses["/maison#connecte"] = 307; // là, c'est vraiment cassé

    const { anomalies, donnees } = await collecterLaDisponibilite({
      demandeur: siteQuiRepond(reponses),
      cookie: "ravenshallow_session=x",
      compteAUneMaison: true,
    });

    expect(anomalies.find((a) => a.ou === "/maison")?.gravite).toBe("PANNE");
    expect(donnees.nonVerifiees).toHaveLength(0);
  });
});
