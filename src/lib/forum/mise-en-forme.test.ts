import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALIGNEMENTS,
  CLASSES_DE_BLOC,
  CLASSES_DE_SPAN,
  CLASSES_D_IMAGE,
  LARGEURS_IMAGE,
  COULEURS,
  TAILLES,
  TEXTES_MISE_EN_FORME,
  classeCouleur,
} from "./mise-en-forme";

/**
 * **Cet essai relit `globals.css`** et refait le calcul de contraste, comme
 * `etancheite.test.ts` relit la zone d'administration. Sans lui, « toutes les
 * couleurs sont lisibles » resterait une intention : il suffirait d'ajouter
 * une teinte au fichier de styles pour qu'elle échappe à toute vérification.
 *
 * Éprouvé en introduisant la faute : ramener Kaldrafn à sa valeur de blason
 * (#4a7fa8) fait tomber l'essai.
 */
const CSS = readFileSync("src/app/globals.css", "utf8");

/** Le seuil du texte courant. Les valeurs retenues visent 5:1, avec marge. */
const CONTRASTE_MINIMUM = 4.5;

function variable(nom: string): string {
  const trouve = CSS.match(new RegExp(`--${nom}:\\s*(#[0-9a-fA-F]{6})`));
  if (!trouve) throw new Error(`Variable --${nom} absente de globals.css`);
  return trouve[1];
}

const composantes = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const melange = (dessus: number[], dessous: number[], alpha: number) =>
  dessus.map((v, i) => v * alpha + dessous[i] * (1 - alpha));

function luminance(rgb: number[]): number {
  const c = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contraste(a: number[], b: number[]): number {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
}

/**
 * Les quatre fonds sur lesquels un post peut se poser. Le troisième est
 * calculé : un post est rendu sur `bg-mist/40`, donc sur un mélange.
 */
function fonds(): Record<string, number[]> {
  const vide = composantes(variable("void"));
  const brume = composantes(variable("mist"));
  return {
    void: vide,
    "post (mist/40)": melange(brume, vide, 0.4),
    mist: brume,
    "mist-2": composantes(variable("mist-2")),
  };
}

describe("la palette des posts", () => {
  it("porte une couleur pour chaque outil, et pas une de plus", () => {
    const declarees = [...CSS.matchAll(/--rs-c-([a-z0-9-]+):/g)].map((m) => m[1]);
    expect([...declarees].sort()).toEqual([...COULEURS].sort());
  });

  it("est lisible sur les quatre fonds du site", () => {
    const surLesFonds = fonds();
    const fautes: string[] = [];

    for (const couleur of COULEURS) {
      const teinte = composantes(variable(`rs-c-${couleur}`));
      for (const [nomFond, fond] of Object.entries(surLesFonds)) {
        const rapport = contraste(teinte, fond);
        if (rapport < CONTRASTE_MINIMUM) {
          fautes.push(`${couleur} sur ${nomFond} : ${rapport.toFixed(2)}:1`);
        }
      }
    }

    expect(fautes).toEqual([]);
  });

  it("n’emprunte pas les couleurs de maison telles quelles", () => {
    // Les valeurs des blasons tombent sous le seuil dès qu'on s'en sert comme
    // texte : Kaldrafn 4,35:1, Nattorm 4,17:1. Les reprendre serait rendre
    // deux maisons sur quatre illisibles.
    for (const [maison, blason] of Object.entries({
      kaldrafn: "#4a7fa8",
      nattorm: "#8a5fd6",
    })) {
      expect(variable(`rs-c-${maison}`).toLowerCase()).not.toBe(blason);
    }
  });
});

describe("les classes", () => {
  it("sont toutes stylées — une classe permise mais sans effet serait un piège", () => {
    for (const classe of [...CLASSES_DE_SPAN, ...CLASSES_DE_BLOC]) {
      expect(CSS).toContain(`.post-rendu .${classe}`);
    }
  });

  it("valent aussi pour les images, sur leur propre sélecteur", () => {
    // Les largeurs se posent sur l'image elle-même — `.post-rendu img.rs-i-…`
    // — et non sur un conteneur : c'est l'image qu'on redimensionne.
    for (const classe of CLASSES_D_IMAGE) {
      expect(CSS).toContain(`.post-rendu img.${classe}`);
    }
    expect(CLASSES_D_IMAGE).toHaveLength(LARGEURS_IMAGE.length);
  });

  it("se déduisent des outils, jamais d’une seconde liste", () => {
    expect(CLASSES_DE_SPAN).toHaveLength(COULEURS.length + TAILLES.length - 1);
    expect(CLASSES_DE_BLOC).toHaveLength(ALIGNEMENTS.length);
    expect(CLASSES_DE_SPAN).toContain(classeCouleur("tideal"));
  });

  it("portent toutes le préfixe qui les isole du reste du site", () => {
    for (const classe of [
      ...CLASSES_DE_SPAN,
      ...CLASSES_DE_BLOC,
      ...CLASSES_D_IMAGE,
    ]) {
      expect(classe.startsWith("rs-")).toBe(true);
    }
  });
});

describe("les libellés", () => {
  it("nomment une action, jamais une lettre", () => {
    // « B » ne dit rien à un lecteur d'écran.
    for (const libelle of Object.values(TEXTES_MISE_EN_FORME.marques)) {
      expect(libelle.length).toBeGreaterThan(3);
    }
  });

  it("existent pour chaque couleur de la palette", () => {
    for (const couleur of COULEURS) {
      expect(TEXTES_MISE_EN_FORME.couleurs[couleur]).toBeTruthy();
    }
  });
});
