#!/usr/bin/env node
/**
 * Les identifiants de La Veille — un rôle PostgreSQL qui ne sait que lire.
 *
 * ── Pourquoi un rôle à part ──
 *
 * La Veille lit toute la base : les compteurs, le carnet des points, les
 * scènes, les dossiers en attente. C'est beaucoup, et c'est nécessaire à son
 * travail. Ce qu'elle ne doit jamais pouvoir faire, c'est écrire.
 *
 * « Elle n'écrit pas » ne peut pas être une convention : une convention tient
 * tant que personne ne se trompe, et un collecteur écrit distraitement un jour
 * ou l'autre. Ici, c'est PostgreSQL qui refuse — le collecteur peut se
 * tromper, la base ne le laissera pas faire.
 *
 * ── Ce que le script fait, et ce qu'il ne fait pas ──
 *
 * Il crée (ou remet à jour) le rôle `veille_lecture`, lui donne le droit de
 * se connecter et de lire, et lui retire tout le reste — explicitement, sans
 * se fier à ce que PostgreSQL accorde par défaut.
 *
 * Il est REJOUABLE : lancé deux fois, il change simplement le mot de passe et
 * réapplique les droits. Aucun `DROP ROLE`, qui échouerait de toute façon tant
 * que des droits lui sont attachés.
 *
 * ⚠️ **Le mot de passe ne s'affiche jamais.** Il est écrit dans `.env.local`
 * — ignoré par git — et dans une note rangée hors du dépôt, que le script
 * ouvre pour vous à la fin. Le dépôt est public : rien de tout cela n'y entre.
 *
 * ⚠️ **`ALTER DEFAULT PRIVILEGES` ne vaut que pour les tables à venir créées
 * par le propriétaire.** Une migration future posera donc ses tables déjà
 * lisibles — mais si un jour une table était créée par un autre rôle, il
 * faudrait relancer ce script. C'est la raison pour laquelle il est rejouable.
 *
 *   node scripts/veille-identifiants.mjs
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = resolve(RACINE, ".env.local");
const NOTES = resolve(RACINE, "../../../Sauvegardes");

/** Le nom du rôle. Il vit ici, et dans la note qu'on écrit à la fin. */
const ROLE = "veille_lecture";

/** La variable qui portera la chaîne de connexion en lecture seule. */
const VARIABLE = "VEILLE_DATABASE_URL";

// ─────────────────────────────────────────────────────────────
//  Lire .env.local — la CLI Prisma ne le fait pas, nous si
// ─────────────────────────────────────────────────────────────

function lireEnv() {
  const valeurs = new Map();
  let texte;
  try {
    texte = readFileSync(ENV, "utf8");
  } catch {
    throw new Error(`Fichier introuvable : ${ENV}`);
  }
  for (const ligne of texte.split("\n")) {
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

/**
 * L'adresse, avec un autre rôle et un autre mot de passe.
 *
 * ⚠️ On ne reconstruit PAS l'adresse avec `URL` : un mot de passe fait de
 * signes inhabituels en ressortirait ré-encodé, et la connexion échouerait
 * sans que rien n'indique pourquoi. Même précaution que `base/adresse.ts` —
 * on ne remplace que ce qui est entre `://` et le `@` qui précède l'hôte.
 */
function adressePour(adresse, role, motDePasse) {
  const debut = adresse.indexOf("://");
  if (debut === -1) throw new Error("Adresse de base illisible.");
  const apres = debut + 3;
  const arobase = adresse.indexOf("@", apres);
  if (arobase === -1) throw new Error("Adresse de base sans identifiants.");
  return (
    adresse.slice(0, apres) +
    `${role}:${motDePasse}` +
    adresse.slice(arobase)
  );
}

/**
 * Un mot de passe fort, et **volontairement alphanumérique**.
 *
 * Pas par timidité : un mot de passe voyage ici dans une URL de connexion et
 * dans une instruction SQL. Les signes de ponctuation demanderaient deux
 * échappements différents, dont l'un finirait par être oublié. Quarante-huit
 * caractères en base 62 valent près de 286 bits — la ponctuation n'ajouterait
 * rien qu'une occasion de se tromper.
 */
function motDePasse(longueur = 48) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const octets = randomBytes(longueur * 2);
  let mot = "";
  for (const octet of octets) {
    if (mot.length === longueur) break;
    // On écarte le reste de la division qui biaiserait le tirage.
    if (octet >= 248) continue;
    mot += alphabet[octet % alphabet.length];
  }
  return mot;
}

// ─────────────────────────────────────────────────────────────
//  Poser le rôle
// ─────────────────────────────────────────────────────────────

/**
 * Les droits, dans l'ordre où ils doivent être posés.
 *
 * ⚠️ **On révoque avant d'accorder, et explicitement.** Se contenter
 * d'accorder `SELECT` laisserait en place ce qu'un réglage antérieur aurait
 * pu donner — et l'on croirait avoir un rôle en lecture seule qui ne l'est
 * pas. Le sens de la lecture, ici, est celui de la fermeture.
 */
function instructions(role, base, mot, roleExiste) {
  return [
    [
      "le rôle lui-même",
      roleExiste
        ? `ALTER ROLE "${role}" WITH LOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOINHERIT PASSWORD '${mot}'`
        : `CREATE ROLE "${role}" WITH LOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOINHERIT PASSWORD '${mot}'`,
    ],
    ["tout retirer sur le schéma", `REVOKE ALL ON SCHEMA public FROM "${role}"`],
    ["tout retirer sur les tables", `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`],
    ["tout retirer sur les séquences", `REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM "${role}"`],
    ["tout retirer sur les fonctions", `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM "${role}"`],
    ["se connecter à la base", `GRANT CONNECT ON DATABASE "${base}" TO "${role}"`],
    ["voir le schéma", `GRANT USAGE ON SCHEMA public TO "${role}"`],
    ["lire les tables", `GRANT SELECT ON ALL TABLES IN SCHEMA public TO "${role}"`],
    [
      "lire les tables à venir",
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "${role}"`,
    ],
    [
      "ne rien créer",
      `REVOKE CREATE ON SCHEMA public FROM "${role}"`,
    ],
  ];
}

async function main() {
  const env = lireEnv();
  const adresse = env.get("DATABASE_URL");
  if (!adresse) throw new Error("DATABASE_URL absente de .env.local");

  const nomBase = adresse.slice(adresse.lastIndexOf("/") + 1).split("?")[0];
  if (!nomBase) throw new Error("Nom de base illisible dans DATABASE_URL");

  const prisma = new PrismaClient({ datasourceUrl: adresse });

  console.log(`Rôle visé   : ${ROLE}`);
  console.log(`Base        : ${nomBase}`);
  console.log("");

  const deja = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM pg_roles WHERE rolname = $1`,
    ROLE,
  );
  const roleExiste = Array.isArray(deja) && deja.length > 0;
  console.log(roleExiste ? "Le rôle existe : on remet ses droits à plat." : "Le rôle est neuf.");
  console.log("");

  const mot = motDePasse();

  for (const [quoi, sql] of instructions(ROLE, nomBase, mot, roleExiste)) {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${quoi}`);
  }

  // ── Ce que le rôle peut réellement faire, relu dans la base ──
  const droits = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT privilege_type
       FROM information_schema.table_privileges
      WHERE grantee = $1 AND table_schema = 'public'
      ORDER BY privilege_type`,
    ROLE,
  );
  const liste = droits.map((d) => d.privilege_type);
  console.log("");
  console.log(`Droits relus dans la base : ${liste.length ? liste.join(", ") : "aucun"}`);
  if (liste.some((d) => d !== "SELECT")) {
    throw new Error(`Le rôle porte autre chose que SELECT : ${liste.join(", ")}`);
  }

  await prisma.$disconnect();

  const adresseVeille = adressePour(adresse, ROLE, mot);

  // ── L'écrire dans .env.local, sans toucher au reste ──
  const brut = readFileSync(ENV, "utf8");
  const ligne = `${VARIABLE}=${adresseVeille}`;
  const remplace = new RegExp(`^${VARIABLE}=.*$`, "m");
  const neuf = remplace.test(brut)
    ? brut.replace(remplace, ligne)
    : `${brut.replace(/\n*$/, "")}\n\n# La Veille — lecture seule, posée par scripts/veille-identifiants.mjs\n${ligne}\n`;
  // Atomique : le dépôt vit dans Dropbox, qui n'aime pas les écritures en place.
  writeFileSync(`${ENV}.tmp`, neuf, { mode: 0o600 });
  renameSync(`${ENV}.tmp`, ENV);
  console.log(`Écrite dans .env.local sous ${VARIABLE} (ignoré par git).`);

  // ── Et dans une note hors du dépôt, à recopier dans les secrets GitHub ──
  mkdirSync(NOTES, { recursive: true });
  const note = resolve(NOTES, "veille-secrets.txt");
  writeFileSync(
    note,
    [
      "Secrets GitHub de La Veille",
      "───────────────────────────",
      "",
      "À coller dans : Settings → Secrets and variables → Actions → New repository secret",
      "sur https://github.com/vifinocchio1601/ravenshallow-site",
      "",
      "⚠️ Ce fichier est HORS du dépôt, qui est public. Ne jamais l'y déplacer,",
      "   ne jamais le joindre à un message.",
      "",
      `Nom    : ${VARIABLE}`,
      "Valeur :",
      adresseVeille,
      "",
      "",
      "(les autres secrets viendront aux étapes suivantes)",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(`Note écrite : ${note}`);
}

main().catch((erreur) => {
  console.error("");
  console.error("Échec :", erreur.message);
  process.exitCode = 1;
});
