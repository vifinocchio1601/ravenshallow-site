#!/usr/bin/env node
/**
 * Met la valeur d'un secret dans le presse-papiers — sans jamais l'afficher.
 *
 * ── Pourquoi ce script existe ──
 *
 * Les valeurs sont longues : la chaîne de connexion fait 174 signes, la clé
 * d'API 108. Dans un éditeur de texte, elles débordent de la fenêtre, et les
 * sélectionner à la souris finit par en couper la fin — un secret tronqué qui
 * échoue plus tard, sans que rien ne dise pourquoi.
 *
 * Ici, on copie la valeur entière d'un geste, et l'on colle dans GitHub.
 *
 * ⚠️ **Rien n'est affiché à l'écran** : ni la valeur, ni un extrait. On
 * confirme seulement le nom et la longueur, qui suffisent à vérifier que le
 * collage n'a rien perdu.
 *
 *   node scripts/veille-copier.mjs VEILLE_DATABASE_URL
 *   node scripts/veille-copier.mjs            (la liste)
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENV = resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local");

/** L'ordre dans lequel on les pose. */
const SECRETS = [
  "VEILLE_DATABASE_URL",
  "VEILLE_COURRIEL",
  "VEILLE_MOT_DE_PASSE",
  "MAIL_EXPEDITEUR",
  "MAIL_APP_PASSWORD",
  "ANTHROPIC_API_KEY",
];

const env = new Map();
for (const ligne of readFileSync(ENV, "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#")) continue;
  const coupure = nette.indexOf("=");
  if (coupure <= 0) continue;
  env.set(
    nette.slice(0, coupure).trim(),
    nette.slice(coupure + 1).trim().replace(/^["']|["']$/g, ""),
  );
}

const demande = process.argv[2];

if (!demande) {
  console.log("Les six secrets, dans l’ordre où les poser :");
  SECRETS.forEach((nom, i) => {
    const valeur = env.get(nom);
    console.log(
      `  ${i + 1}. ${nom.padEnd(22)} ${valeur ? `${valeur.length} signes` : "absent"}`,
    );
  });
  console.log("");
  console.log("  node scripts/veille-copier.mjs <NOM>");
  process.exit(0);
}

const valeur = env.get(demande);
if (!valeur) {
  console.log(`« ${demande} » n’est pas dans .env.local.`);
  process.exit(1);
}

const copie = spawnSync("pbcopy", { input: valeur });
if (copie.status !== 0) {
  console.log("La copie a échoué.");
  process.exit(1);
}

console.log(`${demande} — ${valeur.length} signes, dans le presse-papiers.`);
console.log("Colle maintenant dans le champ « Secret » de GitHub (⌘V).");
