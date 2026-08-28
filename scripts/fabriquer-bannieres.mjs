/**
 * Fabrique les trois bannières de partenariat, aux formats de la bible (§15).
 *
 *   200 × 320  — le standard de la communauté RP francophone
 *   468 ×  60  — le bandeau horizontal
 *    88 ×  31  — le micro-bouton des blocs de liens
 *
 * ── Ce script ne tourne pas tout seul, et le site n'en dépend pas ──
 *
 * `sharp` et `opentype.js` ne sont PAS des dépendances du projet : ce sont des
 * outils de fabrication, installés le temps d'un rendu et retirés ensuite —
 * même parti pris que la conversion du tableau d'affichage.
 *
 *   npm install --no-save --no-package-lock sharp opentype.js
 *   node scripts/fabriquer-bannieres.mjs
 *
 * ⚠️ `--no-save --no-package-lock` : sans les deux, npm réécrit `package.json`
 * ou son verrou, et le site se met à dépendre d'un outil de dessin.
 *
 * ── Pourquoi du texte en CHEMINS, et pas du texte SVG ──
 *
 * librsvg — le moteur de `sharp` — ne va chercher que les polices installées
 * sur la machine. Cinzel et EB Garamond ne le sont pas : elles sont chargées
 * par `next/font` à la compilation, pour le navigateur. Un `<text>` sortirait
 * donc dans une police système, différente d'un poste à l'autre.
 *
 * `opentype.js` lit le fichier de la police et rend chaque lettre en tracé.
 * Ce qui sort ne dépend plus d'aucune police installée, et c'est exactement
 * la lettre du site.
 *
 * ── Pourquoi du PNG, alors que tout le reste du site est en WebP ──
 *
 * Ces images-ci ne s'affichent pas chez nous : elles s'affichent chez le
 * partenaire, dans un bloc de liens tenu par un forum qui a parfois quinze
 * ans. Le PNG s'y affiche partout ; le WebP, pas toujours. Une bannière qui ne
 * s'affiche pas est un partenariat perdu sans que personne sache pourquoi.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

let sharp;
let opentype;
try {
  sharp = (await import("sharp")).default;
  opentype = (await import("opentype.js")).default;
} catch {
  console.error(
    [
      "",
      "Les outils de dessin ne sont pas installés. Ils ne font pas partie du",
      "site — on les pose le temps du rendu, puis on les retire :",
      "",
      "  npm install --no-save --no-package-lock sharp opentype.js",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// La palette du site, en dur.
//
// Recopiée de `tailwind.config.ts` : ce script ne tourne pas dans Next et ne
// peut pas lire la configuration. Trois valeurs, et elles ne bougent jamais.
// ─────────────────────────────────────────────────────────────

const VOID = "#05070b";
const FJORD = "#0d141c";
const PARCHMENT = "#e9e1cd";
const SILVER = "#8ea0b3";
const TEAL = "#3fd9c7";

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SORTIE = path.join(RACINE, "public", "bannieres");
const BLASON = path.join(RACINE, "public", "crests", "ravenshallow.webp");

/**
 * Le rendu se fait à trois fois la taille, puis se réduit.
 *
 * À 88 × 31, une capitale fait six pixels de haut : rendue directement, elle
 * bave. Rendue à dix-huit puis réduite en Lanczos, elle reste lisible.
 */
const SUPER = 3;

// ─────────────────────────────────────────────────────────────
// Les polices, prises à la source du site.
// ─────────────────────────────────────────────────────────────

const POLICES = {
  titre: "Cinzel:700",
  capitales: "Cinzel:400",
  corps: "EB+Garamond:400",
  corpsItalique: "EB+Garamond:400italic",
};

const CACHE = path.join(tmpdir(), "ravenshallow-polices");

/**
 * Google Fonts sert du TTF à qui se présente comme un navigateur ancien, et du
 * WOFF2 aux autres. `opentype.js` ne lit pas le WOFF2 : d'où le vieil en-tête.
 */
async function police(specification) {
  await mkdir(CACHE, { recursive: true });
  const nom = createHash("sha1").update(specification).digest("hex").slice(0, 12);
  const fichier = path.join(CACHE, `${nom}.ttf`);

  if (!existsSync(fichier)) {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css?family=${specification}`, {
        headers: { "User-Agent": "Mozilla/4.0" },
      })
    ).text();
    const adresse = css.match(/https:\/\/[^)]*\.ttf/)?.[0];
    if (!adresse) throw new Error(`Police introuvable : ${specification}`);
    const octets = Buffer.from(await (await fetch(adresse)).arrayBuffer());
    await writeFile(fichier, octets);
  }

  const octets = await readFile(fichier);
  return opentype.parse(
    octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength),
  );
}

// ─────────────────────────────────────────────────────────────
// Poser une ligne de texte.
// ─────────────────────────────────────────────────────────────

/**
 * La boîte réellement occupée par une ligne, tracés compris.
 *
 * ⚠️ **On mesure les TRACÉS, jamais les avances.** L'avance d'un glyphe est la
 * place qu'il réserve, pas celle qu'il noircit : en capitales espacées de
 * Cinzel, l'écart atteint plusieurs pixels, et « RAVENSHALLOW » centré sur ses
 * avances sortait du cadre par la droite. Le premier rendu s'est affiché
 * « RAVENSHA ».
 *
 * L'interlettrage se pose lettre à lettre — `opentype.js` n'en a pas la
 * notion —, et le crénage saute avec lui. Sans conséquence ici : on n'écrit
 * que des capitales espacées et de très courtes lignes.
 */
function tracer(font, texte, taille, interlettre) {
  let curseur = 0;
  const morceaux = [];
  let gauche = Infinity;
  let droite = -Infinity;

  for (const signe of texte) {
    const chemin = font.getPath(signe, curseur, 0, taille);
    const boite = chemin.getBoundingBox();
    // Une espace ne noircit rien : sa boîte est vide, et la compter fausserait
    // les bords d'une ligne qui commence ou finit par elle.
    if (Number.isFinite(boite.x1)) {
      gauche = Math.min(gauche, boite.x1);
      droite = Math.max(droite, boite.x2);
      morceaux.push(chemin.toPathData(2));
    }
    curseur += font.getAdvanceWidth(signe, taille) + interlettre;
  }

  return {
    // ⚠️ **Un tracé par lettre, jamais un `d` géant.** librsvg tronque en
    // silence un attribut qui dépasse une dizaine de milliers de signes : le
    // premier rendu affichait « Ce que la brume s » et « RAVENSHAL », le SVG
    // portant pourtant le texte entier. Rien dans l'image ne dit que c'est le
    // moteur qui a coupé — on cherche d'abord la faute dans sa propre mesure.
    traces: morceaux,
    gauche: Number.isFinite(gauche) ? gauche : 0,
    largeur: Number.isFinite(gauche) ? droite - gauche : 0,
  };
}

/**
 * Une ligne de texte, rendue en tracés SVG.
 *
 * `x` est le centre quand `centre` vaut vrai, le bord gauche sinon ; `y` est
 * toujours la ligne de base.
 *
 * **`largeurMax` réduit la taille plutôt que de laisser déborder.** Une
 * bannière est un cadre fixe : une ligne trop longue n'y est pas coupée
 * proprement, elle est tranchée au bord. Mieux vaut un mot d'un demi-point
 * plus petit qu'un nom amputé.
 */
function ligne(font, texte, {
  x, y, taille, interlettre = 0, couleur, centre = true, opacite = 1, largeurMax,
}) {
  let mesure = tracer(font, texte, taille, interlettre);

  if (largeurMax && mesure.largeur > largeurMax) {
    const facteur = largeurMax / mesure.largeur;
    mesure = tracer(font, texte, taille * facteur, interlettre * facteur);
  }

  const dx = centre ? x - mesure.gauche - mesure.largeur / 2 : x - mesure.gauche;
  const transparence = opacite === 1 ? "" : ` fill-opacity="${opacite}"`;
  const lettres = mesure.traces
    .map((trace) => `<path d="${trace}"/>`)
    .join("");

  return `<g transform="translate(${dx.toFixed(2)} ${y.toFixed(2)})" fill="${couleur}"${transparence}>${lettres}</g>`;
}

/** La largeur qu'occupera une ligne — pour aligner à droite. */
function largeur(font, texte, taille, interlettre) {
  return tracer(font, texte, taille, interlettre).largeur;
}

// ─────────────────────────────────────────────────────────────
// Le rendu.
// ─────────────────────────────────────────────────────────────

/**
 * Le fond, le texte, puis le blason par-dessus.
 *
 * Le blason est composé par `sharp` et non embarqué dans le SVG : il est en
 * WebP à couche alpha, que librsvg ne sait pas toujours lire — et le
 * redimensionner ici le rend plus net qu'un `<image>` mis à l'échelle.
 */
async function rendre({ nom, largeurFinale, hauteurFinale, contenu, blason }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largeurFinale * SUPER}" height="${hauteurFinale * SUPER}" viewBox="0 0 ${largeurFinale} ${hauteurFinale}">${contenu}</svg>`;

  // `SVG_DEBUG=<dossier>` écrit le SVG à côté du rendu. C'est par là qu'on a
  // trouvé que librsvg tronquait un attribut `d` trop long : le fichier
  // portait le texte entier, l'image non. Sans cette comparaison, on cherche
  // la faute dans sa propre mesure.
  if (process.env.SVG_DEBUG) {
    await writeFile(path.join(process.env.SVG_DEBUG, `${nom}.svg`), svg);
  }
  let image = sharp(Buffer.from(svg)).resize(largeurFinale, hauteurFinale, {
    kernel: "lanczos3",
  });

  if (blason) {
    const ecu = await sharp(BLASON)
      .resize({ height: Math.round(blason.hauteur), kernel: "lanczos3" })
      .png()
      .toBuffer();
    const { width } = await sharp(ecu).metadata();
    image = sharp(await image.png().toBuffer()).composite([
      {
        input: ecu,
        left: Math.round(blason.centreX - width / 2),
        top: Math.round(blason.haut),
      },
    ]);
  }

  const fichier = path.join(SORTIE, nom);
  await image.png({ compressionLevel: 9, palette: true }).toFile(fichier);
  const { size } = statSync(fichier);
  console.log(`  ${nom}  ${largeurFinale}×${hauteurFinale}  ${Math.round(size / 1024)} Ko`);
}

/** Le voile d'aurore et le liseré, communs aux trois formats. */
function decor(l, h, { voile = 0.1 } = {}) {
  return `
    <defs>
      <linearGradient id="nuit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${FJORD}"/>
        <stop offset="100%" stop-color="${VOID}"/>
      </linearGradient>
      <radialGradient id="aurore" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stop-color="${TEAL}" stop-opacity="${voile}"/>
        <stop offset="70%" stop-color="${TEAL}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${l}" height="${h}" fill="url(#nuit)"/>
    <rect width="${l}" height="${h}" fill="url(#aurore)"/>
    <rect x="0.5" y="0.5" width="${l - 1}" height="${h - 1}" fill="none"
          stroke="${SILVER}" stroke-opacity="0.28" stroke-width="1"/>`;
}

async function main() {
  await mkdir(SORTIE, { recursive: true });

  const titre = await police(POLICES.titre);
  const capitales = await police(POLICES.capitales);
  const corps = await police(POLICES.corps);
  const italique = await police(POLICES.corpsItalique);

  console.log("Bannières :");

  // ── 200 × 320 — le format demandé par presque tous les partenaires ──
  await rendre({
    nom: "ravenshallow-200x320.png",
    largeurFinale: 200,
    hauteurFinale: 320,
    blason: { hauteur: 116, centreX: 100, haut: 26 },
    contenu: [
      decor(200, 320, { voile: 0.13 }),
      ligne(titre, "RAVENSHALLOW", {
        x: 100, y: 182, taille: 15.5, interlettre: 2.4, couleur: PARCHMENT,
        largeurMax: 168,
      }),
      `<rect x="70" y="194" width="60" height="1" fill="${TEAL}" fill-opacity="0.6"/>`,
      ligne(capitales, "ÉCOLE DE MAGIE", {
        x: 100, y: 212, taille: 8, interlettre: 2, couleur: SILVER, largeurMax: 168,
      }),
      ligne(capitales, "CÔTE NORDIQUE", {
        x: 100, y: 226, taille: 8, interlettre: 2, couleur: SILVER, largeurMax: 168,
      }),
      ligne(italique, "Ce que la brume scelle,", {
        x: 100, y: 256, taille: 12, couleur: PARCHMENT, opacite: 0.82, largeurMax: 172,
      }),
      ligne(italique, "la sagesse le garde.", {
        x: 100, y: 271, taille: 12, couleur: PARCHMENT, opacite: 0.82, largeurMax: 172,
      }),
      ligne(capitales, "RAVENSHALLOW.COM", {
        x: 100, y: 300, taille: 8, interlettre: 1.5, couleur: TEAL, largeurMax: 168,
      }),
    ].join(""),
  });

  // ── 468 × 60 — le bandeau ──
  await rendre({
    nom: "ravenshallow-468x60.png",
    largeurFinale: 468,
    hauteurFinale: 60,
    blason: { hauteur: 44, centreX: 34, haut: 8 },
    contenu: [
      decor(468, 60, { voile: 0.14 }),
      `<rect x="62" y="14" width="1" height="32" fill="${SILVER}" fill-opacity="0.3"/>`,
      ligne(titre, "RAVENSHALLOW", {
        x: 78, y: 30, taille: 17, interlettre: 3.4, couleur: PARCHMENT, centre: false,
        largeurMax: 250,
      }),
      ligne(corps, "École de magie sur la côte nordique — forum de jeu de rôle", {
        x: 79, y: 45, taille: 12, couleur: SILVER, centre: false, largeurMax: 250,
      }),
      ligne(capitales, "RAVENSHALLOW.COM", {
        x: 456 - largeur(capitales, "RAVENSHALLOW.COM", 8, 1.4),
        y: 45, taille: 8, interlettre: 1.4, couleur: TEAL, centre: false,
      }),
    ].join(""),
  });

  // ── 88 × 31 — le micro-bouton ──
  //
  // Pas de blason : à cette taille, l'écu devient une tache où l'on ne
  // distingue plus rien. Le nom seul, lisible, vaut mieux qu'un décor illisible.
  await rendre({
    nom: "ravenshallow-88x31.png",
    largeurFinale: 88,
    hauteurFinale: 31,
    contenu: [
      decor(88, 31, { voile: 0.16 }),
      ligne(titre, "RAVENSHALLOW", {
        x: 44, y: 15, taille: 7.6, interlettre: 0.7, couleur: PARCHMENT, largeurMax: 76,
      }),
      `<rect x="30" y="18.5" width="28" height="0.7" fill="${TEAL}" fill-opacity="0.6"/>`,
      ligne(capitales, "ÉCOLE DE MAGIE", {
        x: 44, y: 26, taille: 5.2, interlettre: 0.7, couleur: SILVER, largeurMax: 72,
      }),
    ].join(""),
  });

  console.log(`\nRangées dans public/bannieres/`);
}

await main();
