/**
 * Reprise des dossiers déposés avant le branchement de la base.
 *
 * Lit `.donnees/dossiers.json` — l’échafaudage qui a servi jusqu’ici — et
 * recrée chaque dossier dans PostgreSQL, journal compris et horodatages
 * d’origine préservés. Les adresses déjà présentes en base sont ignorées :
 * le script peut donc être relancé sans rien dupliquer.
 *
 *   node scripts/importer-dossiers.mjs
 */

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

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

/** Même normalisation qu’à l’écriture, sans quoi l’unicité ne tiendrait pas. */
function normaliserVisage(nom) {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const prisma = new PrismaClient();

let dossiers;
try {
  dossiers = JSON.parse(readFileSync(".donnees/dossiers.json", "utf8"));
} catch {
  console.log("Aucun fichier .donnees/dossiers.json — rien à reprendre.");
  process.exit(0);
}

let repris = 0;
let ignores = 0;

for (const d of dossiers) {
  const email = d.email.trim().toLowerCase();

  if (await prisma.utilisateur.findUnique({ where: { email }, select: { id: true } })) {
    console.log(`· ${d.prenomNom} — déjà en base, ignoré`);
    ignores += 1;
    continue;
  }

  // Aucun mot de passe n’a jamais été conservé par l’échafaudage : on pose une
  // empreinte inutilisable. La connexion n’existe pas encore ; quand elle
  // arrivera, ces comptes passeront par « mot de passe oublié ».
  const motDePasseHash = await hash(randomBytes(32).toString("hex"));

  const visage =
    d.portraitType === "ACTEUR" && d.acteurNom
      ? { nomActeur: d.acteurNom, nomNormalise: normaliserVisage(d.acteurNom) }
      : null;

  const depot = d.soumisLe ? new Date(d.soumisLe) : new Date();

  await prisma.utilisateur.create({
    data: {
      email,
      motDePasseHash,
      // L’âge réel n’a jamais été conservé : seul le fait d’avoir passé la
      // vérification des 16 ans subsiste, et il l’a passée pour être ici.
      majeur16: true,
      reglementAccepteLe: depot,
      reglementVersion: "2026-08",
      statutAcces: d.statutAcces,
      jetonVersion: d.jetonVersion ?? 0,
      limitesEcriture: d.limitesEcriture ?? [],
      limitesAutres: d.limitesAutres,
      creeLe: depot,
      eleve: {
        create: {
          prenomNom: d.prenomNom,
          genre: d.genre,
          famille: d.famille,
          age: d.age,
          fonction: d.fonction,
          portraitType: d.portraitType,
          acteurNom: d.acteurNom,
          portraitUrl: d.portraitUrl,
          biographie: d.biographie,
          qualite1: d.qualites[0],
          qualite2: d.qualites[1],
          qualite3: d.qualites[2],
          defaut1: d.defauts[0],
          defaut2: d.defauts[1],
          defaut3: d.defauts[2],
          plusGrandePeur: d.plusGrandePeur,
          certification104Le: d.certification104Le ? new Date(d.certification104Le) : null,
          statut: d.statut,
          soumisLe: d.soumisLe ? new Date(d.soumisLe) : null,
          noteAdmin: d.noteAdmin,
          creeLe: depot,
          ...(visage ? { visagePris: { create: { ...visage, prisLe: depot } } } : {}),
        },
      },
      journal: {
        create: (d.journal ?? []).map((e) => ({
          type: e.type,
          valeurAvant: e.valeurAvant,
          valeurApres: e.valeurApres,
          note: e.note,
          parNom: e.parNom,
          creeLe: new Date(e.creeLe),
        })),
      },
    },
  });

  console.log(
    `✓ ${d.prenomNom} — ${d.statut}, ${(d.journal ?? []).length} entrée(s) de journal`,
  );
  repris += 1;
}

console.log(`\n${repris} dossier(s) repris, ${ignores} ignoré(s).`);
await prisma.$disconnect();
