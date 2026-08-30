/**
 * Pose en base un grimoire lu par `scripts/lire-grimoire.mjs`.
 *
 *   node scripts/poser-grimoire.mjs .donnees/grimoire-sortileges.json
 *
 * **Deux gestes plutôt qu'un**, exprès : la lecture montre ce qu'elle a
 * compris, on relit, et l'écriture vient après. Un import qui ferait les deux
 * d'un trait ne laisserait rien voir.
 *
 * ⚠️ **Il remplace le contenu du volume, il ne l'ajoute pas.** Ré-importer un
 * document corrigé doit donner exactement le document corrigé, sans doublons
 * — d'où l'effacement des chapitres avant réécriture, en cascade sur leurs
 * blocs. La ligne du volume, elle, survit : son rang sur l'étagère et son
 * éventuel retrait sont des décisions d'administration, pas du contenu.
 *
 * ── Ce qui garantit ce qui entre ──
 *
 * La base tient les formes dures — adresses, longueurs, non-vides, contenu
 * objet, et le verrou qui interdit un sortilège interdit hors d'un chapitre
 * réservé. Ce script y ajoute ce qu'elle ne peut pas voir : une matière du
 * cursus, une année entre 1 et 7, deux runes au plus, un tableau régulier.
 *
 * ⚠️ **Et `src/lib/grimoires/import.test.ts` repasse le fichier produit dans
 * `validerBloc`** — la vraie porte, celle qu'emprunte l'écran
 * d'administration. Un script Node ne peut pas importer un module
 * `server-only` sans outillage qui n'est pas installé ici ; ce test comble
 * l'écart, et tombera le jour où le schéma durcira une règle que l'import ne
 * respecterait plus.
 */

import { readFileSync } from "node:fs";

const fichier = process.argv[2];
if (!fichier) {
  console.error(
    "Usage : node scripts/poser-grimoire.mjs .donnees/grimoire-<slug>.json",
  );
  process.exit(1);
}

// La CLI de Prisma lit `.env`, jamais `.env.local` : le pont, comme
// `scripts/migrer.mjs`. La chaîne ne s'affiche nulle part.
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const coupure = nette.indexOf("=");
  process.env[nette.slice(0, coupure).trim()] ??= nette
    .slice(coupure + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const volume = JSON.parse(readFileSync(fichier, "utf8"));

// ── Les neuf matières, lues dans le cursus — la source ──
const cursus = readFileSync("src/lib/cours/cursus.ts", "utf8");
const MATIERES = new Set(
  [...cursus.matchAll(/id: "([a-z_]+)",\s*\n\s*nom: "/g)].map((m) => m[1]),
);
if (MATIERES.size !== 9) {
  console.error("Le cursus devrait porter neuf matières. L’import s’arrête.");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
//  Ce que la base ne peut pas voir
// ─────────────────────────────────────────────────────────────

const FORME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const soucis = [];

function verifier(condition, quoi) {
  if (!condition) soucis.push(quoi);
}

verifier(FORME.test(volume.slug), `Adresse du volume : ${volume.slug}`);
verifier(Boolean(volume.titre?.trim()), "Le volume n’a pas de titre.");
verifier(Boolean(volume.description?.trim()), "Le volume n’a pas de ligne.");

for (const c of volume.chapitres ?? []) {
  verifier(FORME.test(c.slug), `Adresse de chapitre : ${c.slug}`);
  verifier(
    c.acces === "TOUS" || c.acces === "ADMINISTRATION",
    `Accès inconnu : ${c.acces}`,
  );

  const ancres = new Set();
  for (const b of c.blocs) {
    if (b.ancre) {
      verifier(FORME.test(b.ancre), `Ancre : ${b.ancre}`);
      verifier(!ancres.has(b.ancre), `Ancre en double : ${b.ancre}`);
      ancres.add(b.ancre);
    }

    if (b.type === "FICHE_SORT") {
      const d = b.donnees;
      verifier(MATIERES.has(d.matiere), `Matière hors cursus : ${d.matiere}`);
      verifier(
        Number.isInteger(d.annee) && d.annee >= 1 && d.annee <= 7,
        `Année hors des sept : ${d.nom} (${d.annee})`,
      );
      verifier(
        d.glyphes.length >= 1 && d.glyphes.length <= 2,
        `Un sort porte une rune ou deux liées : ${d.nom}`,
      );
      verifier(Boolean(d.effet?.trim()), `Sort sans effet : ${d.nom}`);
    }

    if (b.type === "FICHE_INTERDITE") {
      verifier(
        c.acces === "ADMINISTRATION",
        `Sortilège interdit dans un chapitre ouvert : ${b.donnees.nom}`,
      );
      verifier(
        b.donnees.rubriques?.length > 0,
        `Sortilège interdit sans rubrique : ${b.donnees.nom}`,
      );
    }

    if (b.type === "TABLEAU") {
      const colonnes = b.donnees.entetes.length;
      verifier(
        b.donnees.lignes.every((l) => l.length === colonnes),
        "Un tableau n’a pas partout le même nombre de colonnes.",
      );
    }
  }
}

if (soucis.length) {
  console.error("L’import s’arrête, rien n’est écrit :");
  for (const s of soucis) console.error(`  ⚠ ${s}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
//  L'écriture
// ─────────────────────────────────────────────────────────────

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

// Des identifiants lisibles plutôt que des cuid : on les connaît d'avance,
// ce qui permet d'écrire en une transaction en forme de liste — celle que
// Prisma envoie en un seul aller-retour. Même parti pris que les pièces du
// château, posées par migration sous `piece-la-reserve`.
const volumeId = `grimoire-${volume.slug}`;

const chapitres = volume.chapitres.map((c, rang) => ({
  id: `chap-${volume.slug}-${c.slug}`,
  grimoireId: volumeId,
  slug: c.slug,
  titre: c.titre,
  ordre: rang,
  acces: c.acces,
}));

const blocs = volume.chapitres.flatMap((c, rang) =>
  c.blocs.map((b, i) => ({
    id: `bloc-${volume.slug}-${rang}-${i}`,
    chapitreId: `chap-${volume.slug}-${c.slug}`,
    ordre: i,
    type: b.type,
    donnees: b.donnees,
    ancre: b.ancre,
  })),
);

const commun = {
  titre: volume.titre,
  exergue: volume.exergue,
  description: volume.description,
  reliure: volume.reliure,
};

try {
  await prisma.$transaction([
    prisma.grimoire.upsert({
      where: { slug: volume.slug },
      // Le rang sur l'étagère et le retrait ne sont pas du contenu : un
      // ré-import ne doit pas les défaire.
      update: { ...commun, modifieLe: new Date() },
      create: {
        ...commun,
        id: volumeId,
        slug: volume.slug,
        ordre: 0,
        posePar: "Administration",
      },
    }),
    prisma.chapitreGrimoire.deleteMany({ where: { grimoireId: volumeId } }),
    prisma.chapitreGrimoire.createMany({ data: chapitres }),
    prisma.blocGrimoire.createMany({ data: blocs }),
  ]);

  console.log(`Posé : ${volume.titre}  (/grimoires/${volume.slug})`);
  for (const c of volume.chapitres) {
    const marque = c.acces === "ADMINISTRATION" ? "  ⚠ réservé" : "";
    console.log(
      `  ${c.titre.padEnd(32)} ${String(c.blocs.length).padStart(3)} blocs${marque}`,
    );
  }
  console.log(`\n  ${blocs.length} blocs en tout.`);
} finally {
  await prisma.$disconnect();
}
