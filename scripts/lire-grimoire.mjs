/**
 * Lit un grimoire écrit sous Word et en produit des blocs.
 *
 *   node scripts/lire-grimoire.mjs "<chemin.docx>" [--slug x] [--titre "X"]
 *                                                  [--reliure CUIR_SOMBRE]
 *
 * Le résultat est un fichier JSON dans `.donnees/`, **relu avant d'entrer en
 * base** : `scripts/poser-grimoire.mjs` s'en charge, et c'est un second geste
 * exprès. Un import qui écrirait d'un trait ne laisserait rien voir de ce
 * qu'il a compris.
 *
 * ── Ce que le document doit respecter ──
 *
 * Le grimoire des Sortilèges, remis le 30 août 2026, en est le gabarit :
 *
 * • **Titre 1** ouvre un chapitre, **Titre 2** un sous-titre dans le flux ;
 * • une **fiche de sort** est un tableau à deux cellules — les glyphes, puis
 *   quatre paragraphes : le nom, « Formule ⇥ Sort simple · Matière · Ne
 *   année », l'effet, « Limite. … » ;
 * • une **fiche interdite** est un tableau à une cellule : le nom,
 *   « aucune formule ⇥ Le verbe : tuer », puis ses rubriques ;
 * • un chapitre dont le premier paragraphe commence par « Réservé à
 *   l'administration », ou qui porte une fiche interdite, est **réservé**.
 *
 * Tout ce qui précède le premier Titre 1 — page de garde, sommaire — sert au
 * titre, à l'exergue et à la description, puis est écarté.
 *
 * ⚠️ **La matière est rapprochée du cursus, jamais recopiée.** Les neuf noms
 * sont lus dans `src/lib/cours/cursus.ts`, qui est la source : un nom qui n'y
 * figure pas arrête l'import au lieu d'entrer en base sous une orthographe à
 * lui.
 *
 * ⚠️ **Le gras et l'italique des paragraphes ordinaires ne sont pas repris.**
 * Le document n'en porte pas, et deviner une mise en forme depuis Word est le
 * meilleur moyen d'importer du balisage que personne n'a demandé.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

// ─────────────────────────────────────────────────────────────
//  Les arguments
// ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const chemin = args.find((a) => !a.startsWith("--"));
if (!chemin) {
  console.error(
    'Usage : node scripts/lire-grimoire.mjs "<chemin.docx>" [--slug x] [--titre "X"] [--reliure CUIR_SOMBRE]',
  );
  process.exit(1);
}

function option(nom) {
  const i = args.indexOf(`--${nom}`);
  return i === -1 ? null : args[i + 1];
}

// ─────────────────────────────────────────────────────────────
//  Le document
// ─────────────────────────────────────────────────────────────

const sortie = spawnSync("unzip", ["-p", chemin, "word/document.xml"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (sortie.status !== 0) {
  console.error(`Impossible d’ouvrir ${chemin} :`, sortie.stderr?.trim());
  process.exit(1);
}
const xml = sortie.stdout;

/** Le texte d’un morceau de XML Word, tabulations comprises. */
function texte(fragment) {
  const morceaux = [];
  const jeton =
    /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g;
  let m;
  while ((m = jeton.exec(fragment)) !== null) {
    if (m[1] !== undefined) morceaux.push(decoder(m[1]));
    else if (m[0].startsWith("<w:tab")) morceaux.push("\t");
    else morceaux.push("\n");
  }
  return morceaux.join("");
}

function decoder(brut) {
  return brut
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * Le texte tel qu'il s'affichera.
 *
 * ⚠️ **L'apostrophe droite devient typographique.** Le document en porte cent
 * soixante ; le site n'en écrit aucune — c'est une règle du projet, et elle
 * ne se rattrape pas à l'affichage sans recopier la conversion partout. Les
 * motifs que ce script reconnaît la tolèrent des deux façons, et `ardoise`
 * traite les deux formes.
 */
function net(brut) {
  return brut.replace(/\s+/g, " ").trim().replace(/'/g, "’");
}

/** Chaque paragraphe et chaque tableau du corps, dans l’ordre. */
const blocsWord = xml.match(/<w:p[ >][\s\S]*?<\/w:p>|<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? [];

function styleDe(p) {
  return /<w:pStyle w:val="([^"]+)"/.exec(p)?.[1] ?? "";
}

/** Les cellules d’un tableau, chacune découpée en paragraphes. */
function cellules(tbl) {
  const out = [];
  for (const tr of tbl.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? []) {
    for (const tc of tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []) {
      out.push(
        (tc.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []).map((p) => net(texte(p))),
      );
    }
  }
  return out;
}

/** Les cellules d’un tableau, ligne par ligne. */
function lignes(tbl) {
  return (tbl.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? []).map((tr) =>
    (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? []).map((tc) => net(texte(tc))),
  );
}

// ─────────────────────────────────────────────────────────────
//  Les neuf matières, lues dans le cursus — la source
// ─────────────────────────────────────────────────────────────

const cursus = readFileSync("src/lib/cours/cursus.ts", "utf8");
const MATIERES = new Map();
for (const m of cursus.matchAll(/id: "([a-z_]+)",\s*\n\s*nom: "([^"]+)"/g)) {
  MATIERES.set(m[2], m[1]);
}
if (MATIERES.size !== 9) {
  console.error(
    `Le cursus devrait porter neuf matières, ${MATIERES.size} lues. L’import s’arrête plutôt que de deviner.`,
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
//  Les adresses
// ─────────────────────────────────────────────────────────────

function ardoise(brut) {
  return brut
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// ─────────────────────────────────────────────────────────────
//  La lecture
// ─────────────────────────────────────────────────────────────

const FICHE = /Sort (simple|lié)\s*·\s*(.+?)\s*·\s*(\d)e\s+année/;

const entete = [];
const chapitres = [];
let courant = null;
const soucis = [];

function poser(bloc) {
  if (!courant) return; // avant le premier Titre 1 : page de garde et sommaire
  courant.blocs.push(bloc);
}

for (const b of blocsWord) {
  if (b.startsWith("<w:tbl")) {
    const cs = cellules(b);

    // Une fiche de sort : les glyphes, puis quatre paragraphes.
    if (cs.length === 2 && cs[1].length >= 3 && FICHE.test(cs[1][1])) {
      const [nom, meta, effet, limite] = cs[1];
      const [, type, matiere, annee] = FICHE.exec(meta);
      const formule = net(meta.split(/Sort (?:simple|lié)/)[0]);
      const id = MATIERES.get(matiere);
      if (!id) {
        soucis.push(`Matière inconnue du cursus : « ${matiere} » (${nom})`);
        continue;
      }
      poser({
        type: "FICHE_SORT",
        ancre: ardoise(nom),
        donnees: {
          nom,
          glyphes: cs[0][0].split(/\s+/).filter(Boolean),
          formule,
          lie: type === "lié",
          matiere: id,
          annee: Number(annee),
          effet,
          limite: limite ? limite.replace(/^Limite\.\s*/, "") : null,
        },
      });
      continue;
    }

    // Une fiche interdite : une cellule, un verbe, des rubriques.
    if (cs.length === 1 && /Le verbe\s*:/.test(cs[0][1] ?? "")) {
      const [nom, meta, ...rubriquesBrutes] = cs[0];
      poser({
        type: "FICHE_INTERDITE",
        ancre: ardoise(nom),
        donnees: {
          nom,
          verbe: net(meta.split(/Le verbe\s*:/)[1] ?? ""),
          rubriques: rubriquesBrutes.filter(Boolean).map((r) => {
            const coupe = /^(.+?)\.\s+(.*)$/.exec(r);
            return coupe
              ? { titre: coupe[1], texte: coupe[2] }
              : { titre: "Note", texte: r };
          }),
        },
      });
      continue;
    }

    // Tout autre tableau : des en-têtes et des lignes.
    const grille = lignes(b).filter((l) => l.some((c) => c.length > 0));
    if (grille.length > 1) {
      poser({
        type: "TABLEAU",
        ancre: null,
        donnees: { entetes: grille[0], lignes: grille.slice(1) },
      });
    }
    continue;
  }

  const style = styleDe(b);
  const t = net(texte(b));
  if (!t) continue;

  if (style === "Titre1") {
    courant = { slug: ardoise(t), titre: t, acces: "TOUS", blocs: [] };
    chapitres.push(courant);
    continue;
  }

  if (style === "Titre2") {
    poser({ type: "SOUS_TITRE", ancre: ardoise(t), donnees: { texte: t } });
    continue;
  }

  // Le sommaire de Word, et la note qui explique comment le régénérer.
  if (/^TM\d/.test(style)) continue;
  if (/^Si le sommaire appara/.test(t)) continue;

  if (!courant) {
    entete.push(t);
    continue;
  }

  poser({
    type: "PARAGRAPHE",
    ancre: null,
    donnees: {
      html: `<p>${t
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</p>`,
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  Ce qui est réservé à l'administration
// ─────────────────────────────────────────────────────────────

for (const c of chapitres) {
  const porteUnInterdit = c.blocs.some((b) => b.type === "FICHE_INTERDITE");
  const premier = c.blocs.find((b) => b.type === "PARAGRAPHE");
  const annonce = /Réservé à l[’']administration/.test(
    premier?.donnees.html ?? "",
  );
  if (porteUnInterdit || annonce) c.acces = "ADMINISTRATION";
}

// Deux blocs ne peuvent pas partager une ancre dans le même chapitre : la
// base le refuse, et deux liens qui mènent au même endroit ne servent à rien.
for (const c of chapitres) {
  const vues = new Map();
  for (const b of c.blocs) {
    if (!b.ancre) continue;
    const deja = vues.get(b.ancre) ?? 0;
    vues.set(b.ancre, deja + 1);
    if (deja > 0) b.ancre = `${b.ancre}-${deja + 1}`;
  }
}

// ─────────────────────────────────────────────────────────────
//  Le volume
// ─────────────────────────────────────────────────────────────

const titreDeduit =
  option("titre") ??
  (entete[0] ? entete[0][0] + entete[0].slice(1).toLowerCase() : "");
const slug = option("slug") ?? ardoise(titreDeduit || basename(chemin, ".docx"));

// L'exergue est la ligne qui compte les runes et les sorts ; la description,
// celle qui dit ce qu'est le document. Toutes deux sur la page de garde.
const exergue = entete.find((l) => l.includes("·")) ?? null;
const description =
  entete.find((l) => l !== titreDeduit.toUpperCase() && l !== exergue && l.length > 20) ??
  titreDeduit;

const volume = {
  slug,
  titre: titreDeduit,
  exergue,
  description,
  reliure: option("reliure") ?? "CUIR_SOMBRE",
  chapitres,
};

mkdirSync(".donnees", { recursive: true });
const fichier = join(".donnees", `grimoire-${slug}.json`);
writeFileSync(fichier, JSON.stringify(volume, null, 2) + "\n", "utf8");

// ─────────────────────────────────────────────────────────────
//  Ce que la lecture a compris
// ─────────────────────────────────────────────────────────────

const compte = (type) =>
  chapitres.reduce(
    (n, c) => n + c.blocs.filter((b) => b.type === type).length,
    0,
  );

console.log(`Volume  : ${volume.titre}  (/grimoires/${slug})`);
console.log(`Exergue : ${exergue ?? "—"}`);
console.log(`Ligne   : ${description}`);
console.log("");
for (const c of chapitres) {
  const marque = c.acces === "ADMINISTRATION" ? "  ⚠ réservé" : "";
  console.log(
    `  ${c.titre.padEnd(32)} ${String(c.blocs.length).padStart(3)} blocs${marque}`,
  );
}
console.log("");
console.log(
  `  ${compte("FICHE_SORT")} fiches de sort, ${compte("FICHE_INTERDITE")} interdites, ` +
    `${compte("TABLEAU")} tableaux, ${compte("SOUS_TITRE")} sous-titres, ` +
    `${compte("PARAGRAPHE")} paragraphes`,
);
if (soucis.length) {
  console.log("");
  for (const s of soucis) console.log(`  ⚠ ${s}`);
}
console.log("");
console.log(`Écrit dans ${fichier} — à relire avant de le poser en base.`);
