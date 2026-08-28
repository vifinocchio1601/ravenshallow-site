import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { avecLeMot, TEXTES_FORUM } from "./constantes";

/**
 * **Aucune accolade ne doit atteindre l'ecran.**
 *
 * Le mot d'un espace — « la scene » au chateau, « le sujet » hors RP — voyage
 * dans les phrases sous la forme `{laScene}`, et `avecLeMot` le pose. Un
 * appel oublie affiche l'accolade telle quelle : c'est arrive le 28 aout 2026
 * sur le bouton « Clore », et rien ne l'avait signale.
 *
 * Cet essai relit le code source des composants du forum et exige que toute
 * cle porteuse d'un gabarit passe par `avecLeMot`.
 */

const GABARITS = ["{laScene}", "{cetteScene}", "{sceneClose}"];

/** Les cles de `TEXTES_FORUM` dont la valeur porte un gabarit. */
function clesAGabarit(objet: unknown, chemin: string[] = []): string[][] {
  if (typeof objet === "string") {
    return GABARITS.some((g) => objet.includes(g)) ? [chemin] : [];
  }
  if (objet && typeof objet === "object") {
    return Object.entries(objet).flatMap(([cle, valeur]) =>
      clesAGabarit(valeur, [...chemin, cle]),
    );
  }
  return [];
}

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

describe("le mot de l'espace ne fuit jamais tel quel", () => {
  const cles = clesAGabarit(TEXTES_FORUM);

  it("il y a bien des phrases a gabarit", () => {
    expect(cles.length).toBeGreaterThan(0);
  });

  it("`avecLeMot` remplace tout ce qu'il doit remplacer", () => {
    const mots = TEXTES_FORUM.motsHorsRp;
    for (const chemin of cles) {
      let valeur: unknown = TEXTES_FORUM;
      for (const cle of chemin) valeur = (valeur as Record<string, unknown>)[cle];
      const rendu = avecLeMot(valeur as string, mots);
      expect(rendu, chemin.join(".")).not.toContain("{");
    }
  });

  /**
   * La verification qui compte : un composant qui affiche une de ces cles sans
   * passer par `avecLeMot` laisserait l'accolade a l'ecran.
   *
   * ⚠️ **On suit l'objet auquel `t` est lie**, jamais le seul nom de la cle :
   * `suppression.scene.action` porte un gabarit, `suppression.post.action`
   * non. Comparer les noms ferait tomber l'essai sur le bouton « Retirer mon
   * post », qui n'a rien fait de mal.
   */
  it("aucun composant n'affiche un gabarit sans le substituer", () => {
    for (const chemin of fichiers("src/components/forum")) {
      const source = readFileSync(chemin, "utf8");

      // « const t = TEXTES_FORUM.suppression.scene; »
      const lien = /const\s+t\s*=\s*TEXTES_FORUM\.([A-Za-z0-9_.]+)\s*;/.exec(source);
      if (!lien) continue;

      let objet: unknown = TEXTES_FORUM;
      for (const cle of lien[1]!.split(".")) {
        objet = (objet as Record<string, unknown>)[cle];
      }
      if (!objet || typeof objet !== "object") continue;

      const aGabarit = Object.entries(objet)
        .filter(
          ([, v]) => typeof v === "string" && GABARITS.some((g) => v.includes(g)),
        )
        .map(([k]) => k);

      for (const cle of aGabarit) {
        const nu = new RegExp(`\\{\\s*t\\.${cle}\\s*\\}`);
        expect(
          nu.test(source),
          `${chemin} affiche t.${cle} sans avecLeMot`,
        ).toBe(false);
      }
    }
  });
});
