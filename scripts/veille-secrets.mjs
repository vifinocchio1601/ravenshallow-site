#!/usr/bin/env node
/**
 * La note des secrets à coller dans GitHub.
 *
 * ── Pourquoi un script plutôt qu'une liste écrite à la main ──
 *
 * Parce que les valeurs vivent dans `.env.local`, qu'on ne doit ni afficher à
 * l'écran, ni recopier à la main, ni coller dans une conversation. Ce script
 * les relit et compose une note **hors du dépôt**, que l'on ouvre ensuite pour
 * copier-coller dans les réglages de GitHub.
 *
 * ⚠️ **Le fichier produit contient des secrets en clair.** Il est écrit en
 * `600` — lisible par vous seul — et rangé à côté des sauvegardes de la base,
 * qui portent déjà des données autrement plus sensibles. **Ne jamais le
 * déplacer dans le dépôt**, qui est public, ni le joindre à un message.
 *
 * Il peut être effacé une fois les secrets posés : GitHub les garde, et ce
 * script sait le régénérer.
 *
 *   node scripts/veille-secrets.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = resolve(RACINE, ".env.local");
const NOTES = resolve(RACINE, "../../../Sauvegardes");
const DEPOT = "https://github.com/vifinocchio1601/ravenshallow-site";

/** Ce que le workflow attend, dans l'ordre où on les posera. */
const SECRETS = [
  {
    nom: "VEILLE_DATABASE_URL",
    quoi: "La connexion à la base, en LECTURE SEULE.",
    obligatoire: true,
  },
  {
    nom: "VEILLE_COURRIEL",
    quoi: "L’adresse du compte de service qui traverse les écrans.",
    obligatoire: true,
  },
  {
    nom: "VEILLE_MOT_DE_PASSE",
    quoi: "Le mot de passe de ce compte.",
    obligatoire: true,
  },
  {
    nom: "MAIL_EXPEDITEUR",
    quoi: "L’adresse d’envoi du site — le rapport part de là, et y arrive.",
    obligatoire: true,
  },
  {
    nom: "MAIL_APP_PASSWORD",
    quoi: "Le mot de passe d’application Google. Le même que celui du site.",
    obligatoire: true,
  },
  {
    nom: "ANTHROPIC_API_KEY",
    quoi: "La clé d’API, pour la section « Suggestions ». FACULTATIVE : sans elle, le rapport part sans cette section.",
    obligatoire: false,
  },
];

function lireEnv() {
  const valeurs = new Map();
  for (const ligne of readFileSync(ENV, "utf8").split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#")) continue;
    const coupure = nette.indexOf("=");
    if (coupure <= 0) continue;
    valeurs.set(
      nette.slice(0, coupure).trim(),
      nette.slice(coupure + 1).trim().replace(/^["']|["']$/g, ""),
    );
  }
  return valeurs;
}

const env = lireEnv();
const lignes = [
  "SECRETS GITHUB DE LA VEILLE",
  "═══════════════════════════",
  "",
  "⚠️  CE FICHIER CONTIENT DES SECRETS EN CLAIR.",
  "    Il est hors du dépôt, qui est public. Ne jamais l’y déplacer,",
  "    ne jamais le joindre à un message. Effaçable une fois les",
  "    secrets posés : GitHub les garde.",
  "",
  "Où les coller :",
  `  ${DEPOT}/settings/secrets/actions`,
  "  → bouton « New repository secret », un par un.",
  "",
  "Le nom doit être recopié EXACTEMENT, majuscules comprises.",
  "",
];

const manquants = [];

for (const secret of SECRETS) {
  const valeur = env.get(secret.nom);
  lignes.push("─".repeat(62), "");
  lignes.push(`Nom    : ${secret.nom}`);
  lignes.push(`         ${secret.quoi}`);
  lignes.push("");

  if (valeur) {
    lignes.push("Valeur :");
    lignes.push(valeur);
  } else {
    lignes.push(secret.obligatoire ? "Valeur : ⚠️ ABSENTE de .env.local" : "Valeur : (absente — c’est permis, ce secret est facultatif)");
    if (secret.obligatoire) manquants.push(secret.nom);
  }
  lignes.push("");
}

lignes.push("─".repeat(62), "");
lignes.push("Une fois les six posés, une ronde peut être lancée à la main :");
lignes.push(`  ${DEPOT}/actions`);
lignes.push("  → « La Veille » → « Run workflow ».");
lignes.push("");

mkdirSync(NOTES, { recursive: true });
const note = resolve(NOTES, "veille-secrets.txt");
writeFileSync(note, lignes.join("\n"), { mode: 0o600 });

// ⚠️ On n'affiche jamais une valeur — seulement des noms et des longueurs.
console.log("Secrets à poser :");
for (const secret of SECRETS) {
  const valeur = env.get(secret.nom);
  const etat = valeur
    ? `${String(valeur.length).padStart(4)} signes`
    : secret.obligatoire
      ? "   ⚠️ ABSENT"
      : "   (facultatif, absent)";
  console.log(`  ${secret.nom.padEnd(22)} ${etat}`);
}

console.log("");
console.log(`Note écrite : ${note}`);
if (manquants.length > 0) {
  console.log("");
  console.log(`⚠️ Il manque ${manquants.length} secret(s) obligatoire(s) : ${manquants.join(", ")}`);
  process.exitCode = 1;
}
