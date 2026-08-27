import { describe, expect, it } from "vitest";
import {
  DELAI_DE_CONNEXION_SECONDES,
  adresseAvecDelaiDeConnexion,
} from "./adresse";

/**
 * Les adresses de ces essais sont inventées de bout en bout — aucune ne
 * ressemble à celle du projet, et aucune n’est lue depuis l’environnement.
 */
const SANS_REQUETE = "postgresql://usager:motdepasse@hote.exemple.net/base";
const AVEC_SSL = `${SANS_REQUETE}?sslmode=require`;

describe("adresseAvecDelaiDeConnexion", () => {
  it("pose le délai sur une adresse qui n’a aucun paramètre", () => {
    expect(adresseAvecDelaiDeConnexion(SANS_REQUETE)).toBe(
      `${SANS_REQUETE}?connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
  });

  it("l’ajoute aux paramètres existants sans en perdre un", () => {
    expect(adresseAvecDelaiDeConnexion(AVEC_SSL)).toBe(
      `${AVEC_SSL}&connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
  });

  it("ne touche pas une adresse qui porte déjà un délai", () => {
    const choisieALaMain = `${AVEC_SSL}&connect_timeout=30`;
    expect(adresseAvecDelaiDeConnexion(choisieALaMain)).toBe(choisieALaMain);
  });

  it("ne le repose pas non plus quand il est seul", () => {
    const deja = `${SANS_REQUETE}?connect_timeout=15`;
    expect(adresseAvecDelaiDeConnexion(deja)).toBe(deja);
  });

  it("ne se laisse pas tromper par un paramètre au nom voisin", () => {
    const voisin = `${SANS_REQUETE}?pool_connect_timeout=3`;
    expect(adresseAvecDelaiDeConnexion(voisin)).toBe(
      `${voisin}&connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
  });

  it("n’ajoute pas de séparateur en trop derrière un « ? » ou un « & » nu", () => {
    expect(adresseAvecDelaiDeConnexion(`${SANS_REQUETE}?`)).toBe(
      `${SANS_REQUETE}?connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
    expect(adresseAvecDelaiDeConnexion(`${AVEC_SSL}&`)).toBe(
      `${AVEC_SSL}&connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
  });

  it("laisse l’adresse vide telle quelle", () => {
    expect(adresseAvecDelaiDeConnexion("")).toBe("");
  });

  /**
   * Le vrai risque du lot : reconstruire l’adresse par la classe `URL`
   * ré-encoderait le mot de passe et la connexion échouerait, sans que rien
   * n’indique pourquoi. Ce qui précède le « ? » ne doit pas bouger d’un signe.
   */
  it("ne réécrit pas un mot de passe fait de signes inhabituels", () => {
    const rugueuse = "postgresql://usager:a+b%2Fc~d!e@hote.exemple.net:5432/base?sslmode=require";
    const obtenue = adresseAvecDelaiDeConnexion(rugueuse);
    expect(obtenue.startsWith(rugueuse)).toBe(true);
    expect(obtenue).toBe(`${rugueuse}&connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`);
  });

  it("laisse intacte une adresse dont le nom de base porte un « - » ou un point", () => {
    const neon = "postgresql://usager:mdp@ep-exemple-0000-pooler.eu-central-1.aws.exemple.net/base-1?sslmode=require";
    expect(adresseAvecDelaiDeConnexion(neon)).toBe(
      `${neon}&connect_timeout=${DELAI_DE_CONNEXION_SECONDES}`,
    );
  });
});
