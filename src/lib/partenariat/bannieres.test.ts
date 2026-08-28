import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADRESSE_DU_SITE,
  BANNIERES,
  adresseBanniere,
  codeBBCode,
  codeHtml,
} from "./bannieres";

/**
 * Les bannières, et le code qu'un partenaire colle chez lui.
 *
 * Ce fichier éprouve deux choses que rien d'autre ne rattraperait : le code
 * donné à copier, et **l'existence réelle des images**. Une bannière annoncée
 * 200 × 320 mais absente du dépôt ne se voit pas au développement — elle se
 * voit chez le partenaire, sous la forme d'un cadre vide sur son forum.
 */

/**
 * Les dimensions d'un PNG, lues dans son en-tête.
 *
 * Le bloc `IHDR` d'un PNG commence à l'octet 16 : largeur puis hauteur, en
 * entiers de quatre octets. Pas besoin d'une bibliothèque de dessin pour cela,
 * et le test ne doit dépendre d'aucun outil qui ne soit pas installé — `sharp`
 * ne fait pas partie du site.
 */
function dimensionsPng(chemin: string): { largeur: number; hauteur: number } {
  const octets = readFileSync(chemin);
  return {
    largeur: octets.readUInt32BE(16),
    hauteur: octets.readUInt32BE(20),
  };
}

describe("les bannières", () => {
  it("en propose trois, aux formats de la bible", () => {
    // 200 × 320, 468 × 60, 88 × 31 — bible §15. Ce ne sont pas des tailles
    // choisies : ce sont celles que les blocs de liens attendent.
    expect(
      BANNIERES.map((b) => `${b.largeur}x${b.hauteur}`),
    ).toEqual(["200x320", "468x60", "88x31"]);
  });

  it("existent vraiment, et aux dimensions annoncées", () => {
    for (const banniere of BANNIERES) {
      const chemin = path.join(process.cwd(), "public", banniere.fichier);
      expect(dimensionsPng(chemin)).toEqual({
        largeur: banniere.largeur,
        hauteur: banniere.hauteur,
      });
    }
  });

  it("sont en PNG, et pas en WebP", () => {
    // ⚠️ Le seul endroit du site où le WebP serait un mauvais choix : ces
    // images s'affichent chez le partenaire, sur un forum qui a parfois quinze
    // ans. Une bannière qui ne s'affiche pas est un partenariat perdu sans que
    // personne sache pourquoi.
    for (const banniere of BANNIERES) {
      expect(banniere.fichier.endsWith(".png")).toBe(true);
    }
  });

  it("donnent une adresse absolue — jamais relative", () => {
    // Elle est lue depuis un autre domaine : une adresse relative y pointerait
    // vers le forum du partenaire.
    for (const banniere of BANNIERES) {
      expect(adresseBanniere(banniere).startsWith("https://")).toBe(true);
      expect(adresseBanniere(banniere)).toContain(ADRESSE_DU_SITE);
    }
  });

  it("produisent un code HTML complet", () => {
    const code = codeHtml(BANNIERES[0]);
    expect(code).toContain(`href="${ADRESSE_DU_SITE}"`);
    expect(code).toContain(adresseBanniere(BANNIERES[0]));
    // Les dimensions y figurent : sans elles, la page du partenaire saute au
    // chargement de l'image, et c'est chez lui que ça se voit.
    expect(code).toContain('width="200"');
    expect(code).toContain('height="320"');
    expect(code).toContain("alt=");
  });

  it("produisent un BBCode complet", () => {
    // La moitié des forums RP francophones refusent le HTML : donner un seul
    // des deux codes, c'est renvoyer une demande sur deux vers un code qui ne
    // marchera pas chez elle.
    const code = codeBBCode(BANNIERES[0]);
    expect(code).toBe(
      `[url=${ADRESSE_DU_SITE}][img]${adresseBanniere(BANNIERES[0])}[/img][/url]`,
    );
  });

  it("pointent vers le domaine du site, et en https", () => {
    expect(ADRESSE_DU_SITE).toBe("https://ravenshallow.com");
  });
});
