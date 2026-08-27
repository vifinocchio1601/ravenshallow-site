/**
 * Recopie toute la base dans un fichier daté, hors du dépôt.
 *
 * Neon, en formule gratuite, ne sait remonter le temps que sur **six
 * heures** — le maximum du curseur, constaté le 27 août 2026. Au-delà, il
 * n’y a rien. Ce script est le filet : lancé avant une opération risquée et
 * de temps en temps, il laisse une copie que Dropbox versionne à son tour.
 *
 *   npm run base:sauvegarder
 *
 * Trois décisions qui ne se devinent pas :
 *
 * 1. **La liste des tables n’est pas écrite à la main.** Elle est déduite du
 *    schéma Prisma. Une table ajoutée demain serait sinon oubliée en
 *    silence — et une sauvegarde incomplète est pire qu’aucune, parce qu’on
 *    lui fait confiance.
 * 2. **Le fichier sort du dépôt.** Le dépôt GitHub est *public*, et cette
 *    copie porte des adresses de courriel, des portraits et des
 *    conversations privées. Elle va dans `Perso/Ravenshallow/Sauvegardes/`,
 *    à côté de la bible du lore.
 * 3. **L’écriture est atomique** — fichier temporaire puis renommage. Le
 *    dépôt vit dans Dropbox, qui recopie les fichiers pendant qu’on les
 *    écrit ; un renommage, lui, ne se laisse pas doubler.
 *
 * Le script ne lit jamais que la base, n’y écrit rien, et n’affiche à aucun
 * moment la chaîne de connexion.
 */

import { readFileSync, mkdirSync, writeFileSync, renameSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// ── Réglages, lus dans .env.local comme le fait Next ──
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const [cle, valeur] = nette.split(/=(.*)/s);
  process.env[cle.trim()] ??= valeur.trim().replace(/^["']|["']$/g, "");
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL absent de .env.local — rien à sauvegarder.");
  process.exit(1);
}

const exiger = createRequire(join(process.cwd(), "package.json"));
const { PrismaClient, Prisma } = exiger("@prisma/client");

/** Où se rangent les copies : hors du dépôt, dans le Dropbox du projet. */
const DOSSIER = process.env.SAUVEGARDES_DIR ?? join("..", "..", "..", "Sauvegardes");

/** `Utilisateur` → `utilisateur` : la règle de nommage du client Prisma. */
const clientDe = (modele) => modele.charAt(0).toLowerCase() + modele.slice(1);

/**
 * JSON ne sait sérialiser ni un entier long ni un tableau d’octets.
 * Les deux se relisent : un `bigint` en texte, des octets en base64.
 */
function remplacer(_cle, valeur) {
  if (typeof valeur === "bigint") return { __type: "bigint", valeur: valeur.toString() };
  if (valeur instanceof Uint8Array) {
    return { __type: "octets", valeur: Buffer.from(valeur).toString("base64") };
  }
  return valeur;
}

/** `2026-08-27T08-42-13` — triable à l’œil, et valide comme nom de fichier. */
function horodatage(instant) {
  return instant.toISOString().slice(0, 19).replace(/:/g, "-");
}

const prisma = new PrismaClient({ log: ["error"] });

try {
  const modeles = Prisma.dmmf.datamodel.models.map((m) => m.name).sort();
  console.log(`${modeles.length} tables lues dans le schéma.\n`);

  const tables = {};
  const comptes = [];

  for (const modele of modeles) {
    const cle = clientDe(modele);
    const lignes = await prisma[cle].findMany();
    tables[cle] = lignes;
    comptes.push([modele, lignes.length]);
  }

  // L’état des migrations voyage avec les données : sans lui, on ne saurait
  // pas sur quel schéma les réinjecter.
  const migrations = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at FROM _prisma_migrations
     WHERE finished_at IS NOT NULL ORDER BY finished_at`,
  );

  const faiteLe = new Date();
  const contenu = JSON.stringify(
    {
      format: "sauvegarde-ravenshallow",
      version: 1,
      faiteLe: faiteLe.toISOString(),
      migrations: migrations.map((m) => m.migration_name),
      tables,
    },
    remplacer,
    2,
  );

  mkdirSync(DOSSIER, { recursive: true });
  const nom = `ravenshallow-${horodatage(faiteLe)}.json`;
  const destination = join(DOSSIER, nom);
  const temporaire = `${destination}.en-cours`;
  writeFileSync(temporaire, contenu, "utf8");
  renameSync(temporaire, destination);

  const largeur = Math.max(...comptes.map(([m]) => m.length));
  for (const [modele, nombre] of comptes) {
    console.log(`  ${modele.padEnd(largeur)}  ${String(nombre).padStart(6)}`);
  }

  const mo = (statSync(destination).size / 1024 / 1024).toFixed(2);
  console.log(`\nSauvegarde écrite : ${nom}  (${mo} Mo)`);
  console.log(`Rangée dans      : ${DOSSIER}`);
  console.log(`Migrations       : ${migrations.length}, jusqu’à ${migrations.at(-1)?.migration_name ?? "—"}`);
} finally {
  await prisma.$disconnect();
}
