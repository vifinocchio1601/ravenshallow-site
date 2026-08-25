/**
 * Applique les migrations en attente sur la base.
 *
 * La CLI Prisma lit `.env`, jamais `.env.local` — le piège classique du
 * projet. Ce script fait le pont : il reprend les réglages là où Next les
 * prend, puis passe la main à `prisma migrate deploy`. La chaîne de connexion
 * ne s’affiche nulle part et ne quitte pas ce processus.
 *
 *   npm run base:migrer
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// ── Réglages, lus dans .env.local comme le fait Next ──
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const [cle, valeur] = nette.split(/=(.*)/s);
  process.env[cle.trim()] ??= valeur.trim().replace(/^["']|["']$/g, "");
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL absent de .env.local — rien à faire.");
  process.exit(1);
}

// `deploy` et non `dev` : il applique ce qui existe, sans jamais proposer de
// réinitialiser la base ni d’en réécrire l’historique. La base de ce projet
// est celle de production, et il n’existe pas encore de branche d’essai.
const resultat = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  { stdio: "inherit", env: process.env },
);

process.exit(resultat.status ?? 1);
