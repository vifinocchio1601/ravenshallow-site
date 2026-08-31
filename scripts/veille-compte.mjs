#!/usr/bin/env node
/**
 * Le compte de La Veille — celui qui traverse les écrans chaque matin.
 *
 * ── Pourquoi un compte, et pas seulement des pages publiques ──
 *
 * Presque tout le site est derrière la connexion : le bureau, les tubes, le
 * forum, la Tour, les grimoires. Une surveillance qui s'arrêterait à l'accueil
 * et au règlement ne verrait jamais la panne qui compte.
 *
 * ── Ce que ce compte peut, et ce qu'il ne peut pas ──
 *
 * Il se connecte, il lit. Rien d'autre :
 *
 *   • aucune permission accordée — la table `permissions_accordees` reste vide
 *     pour lui, et il n'est préfet de rien ;
 *   • rôle JOUEUR, jamais MODERATEUR ni ADMIN : le staff « passe partout » sur
 *     le forum, et La Veille n'a rien à faire là où un joueur n'entre pas ;
 *   • `compteDeService` à vrai : invisible du Registre, de la recherche de la
 *     Tour, du tournoi, du top du mois et des passages d'année.
 *
 * Qu'elle ne publie rien ne tient pas à un réglage de son compte — un compte
 * accepté PEUT publier. Cela tient à ce que le code de la ronde ne le fait
 * jamais, et à ce que ses identifiants de base ne savent que lire.
 *
 * ── Les choix de fiche, et pourquoi ceux-là ──
 *
 *   septième année  — l'article 14.4 n'ouvre que jusqu'à son année ; la
 *                     septième est la seule qui atteigne tous les lieux et
 *                     tous les programmes. Elle ne verrouille rien : le but
 *                     est de voir le plus d'écrans possible.
 *   Nattorm         — il en faut une pour ouvrir `/maison`, son tableau et
 *                     son salon. Laquelle est sans importance : le compte de
 *                     service ne pèse dans aucun effectif.
 *   une baguette    — sans elle, `aFiniLesPremiersPas` est faux et le site la
 *                     renverrait à Kaldvik au lieu du bureau.
 *   pas de portrait — l'écran affiche alors le blason en filigrane, ce qui est
 *                     un cas d'affichage à surveiller comme un autre.
 *   IA_ILLUSTRATION — surtout pas ACTEUR : cela occuperait un visage au
 *                     registre des visages (art. 6.3), au détriment d'un vrai
 *                     joueur.
 *
 * ── Rejouable, et prudent ──
 *
 * Lancé deux fois, il change le mot de passe et remet les drapeaux à plat.
 * ⚠️ Il ne retouche **jamais** la baguette d'un compte qui en a déjà une : le
 * choix est définitif (art. 11.2 pour la maison, même principe ici), et un
 * déclencheur en base refuserait de toute façon la réécriture.
 *
 *   node scripts/veille-compte.mjs
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, appendFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = resolve(RACINE, ".env.local");
const NOTES = resolve(RACINE, "../../../Sauvegardes");

/**
 * ⚠️ **L'adresse est en `.invalid`, et c'est une règle du projet** : aucun
 * compte de test ne porte une adresse réelle. Elle ne commence PAS par
 * `essai.` — les essais en base effacent `essai.*` ET `.invalid`, et ce compte
 * doit leur survivre. Un futur ménage qui viserait `.invalid` seul
 * l'emporterait : c'est la faute déjà commise une fois par `corbeaux:essai`,
 * et la raison pour laquelle sa double condition existe.
 */
const ADRESSE = "veille@ravenshallow.invalid";
const NOM = "Veille Automatique";
const VARIABLE = "VEILLE_MOT_DE_PASSE";

/** Longueur, une majuscule, un chiffre — les trois règles du site. */
function motDePasse(longueur = 40) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let mot = "";
  while (
    mot.length < longueur ||
    !/[A-Z]/.test(mot) ||
    !/[0-9]/.test(mot)
  ) {
    if (mot.length >= longueur) mot = "";
    for (const octet of randomBytes(longueur)) {
      if (mot.length === longueur) break;
      if (octet >= 248) continue;
      mot += alphabet[octet % alphabet.length];
    }
  }
  return mot;
}

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

/** Écrit une variable dans `.env.local`, sans toucher au reste. */
function poserDansEnv(nom, valeur) {
  const brut = readFileSync(ENV, "utf8");
  const ligne = `${nom}=${valeur}`;
  const motif = new RegExp(`^${nom}=.*$`, "m");
  const neuf = motif.test(brut)
    ? brut.replace(motif, ligne)
    : `${brut.replace(/\n*$/, "")}\n${ligne}\n`;
  // Atomique : le dépôt vit dans Dropbox, qui n'aime pas les écritures en place.
  writeFileSync(`${ENV}.tmp`, neuf, { mode: 0o600 });
  renameSync(`${ENV}.tmp`, ENV);
}

/** La fiche de personnage. Rien d'inventé qui ne soit indiqué plus haut. */
const FICHE = {
  prenomNom: NOM,
  genre: "AUTRE",
  famille: "SORCIERS",
  age: 18,
  fonction: "SEPTIEME_ANNEE",
  portraitType: "IA_ILLUSTRATION",
  biographie:
    "Compte de service. Il n’appartient à personne, ne joue aucune scène et " +
    "n’écrit jamais. Il se connecte chaque matin pour vérifier que les écrans " +
    "du site s’affichent, puis se retire. S’il apparaît quelque part où un " +
    "joueur peut le voir, c’est un défaut à corriger.",
  qualite1: "Ponctuelle",
  qualite2: "Silencieuse",
  qualite3: "Attentive",
  defaut1: "Littérale",
  defaut2: "Insomniaque",
  defaut3: "Sans imagination",
  plusGrandePeur: "Que personne ne lise son rapport",
  statut: "ACCEPTE",
  etatMaison: "FAIT",
  maison: "NATTORM",
  etatBaguette: "FAIT",
  baguetteBois: "IF",
  baguetteCoeur: "PLUME_DE_CORBEAU",
};

async function main() {
  const env = lireEnv();
  const adresse = env.get("DATABASE_URL");
  if (!adresse) throw new Error("DATABASE_URL absente de .env.local");

  const prisma = new PrismaClient({ datasourceUrl: adresse });
  const mot = motDePasse();
  const empreinte = await hash(mot);
  const maintenant = new Date();

  const existant = await prisma.utilisateur.findUnique({
    where: { email: ADRESSE },
    select: { id: true, eleve: { select: { id: true, etatBaguette: true } } },
  });

  let compteId;

  if (existant) {
    console.log("Le compte existe : on remet son mot de passe et ses drapeaux.");
    await prisma.utilisateur.update({
      where: { id: existant.id },
      data: {
        motDePasseHash: empreinte,
        compteDeService: true,
        role: "JOUEUR",
        statutAcces: "VALIDE",
        archiveLe: null,
        archivePar: null,
        // Ferme les sessions ouvertes avec l'ancien mot de passe, et périme
        // les liens envoyés par courriel — le geste du site lui-même.
        sessionVersion: { increment: 1 },
        jetonVersion: { increment: 1 },
      },
    });
    compteId = existant.id;

    // ⚠️ La baguette n'est jamais retouchée : le choix est définitif, et un
    // déclencheur en base refuserait la réécriture.
    const { baguetteBois, baguetteCoeur, etatBaguette, ...reste } = FICHE;
    await prisma.eleve.update({
      where: { utilisateurId: compteId },
      data: {
        ...reste,
        decideLe: maintenant,
        ...(existant.eleve?.etatBaguette === "FAIT"
          ? {}
          : { etatBaguette, baguetteBois, baguetteCoeur, baguetteChoisieLe: maintenant }),
      },
    });
  } else {
    console.log("Le compte est neuf.");
    const cree = await prisma.utilisateur.create({
      data: {
        email: ADRESSE,
        motDePasseHash: empreinte,
        // Art. 2.3 — le booléen est le seul survivant de l'âge saisi. Un
        // compte de service n'a pas d'âge, mais la colonne est obligatoire.
        majeur16: true,
        role: "JOUEUR",
        statutAcces: "VALIDE",
        compteDeService: true,
        reglementAccepteLe: maintenant,
        reglementVersion: "service",
        eleve: {
          create: {
            ...FICHE,
            soumisLe: maintenant,
            decideLe: maintenant,
            baguetteChoisieLe: maintenant,
            repartiLe: maintenant,
          },
        },
      },
      select: { id: true },
    });
    compteId = cree.id;
  }

  // ── Ce qu'il ne doit surtout pas avoir ──
  const permissions = await prisma.permissionAccordee.count({
    where: { utilisateurId: compteId },
  });
  const prefectures = await prisma.prefet.count({
    where: { eleve: { utilisateurId: compteId } },
  });

  const relu = await prisma.utilisateur.findUnique({
    where: { id: compteId },
    select: {
      role: true,
      statutAcces: true,
      compteDeService: true,
      eleve: { select: { statut: true, etatMaison: true, etatBaguette: true, fonction: true } },
    },
  });

  console.log("");
  console.log(`  adresse         : ${ADRESSE}`);
  console.log(`  nom affiché     : ${NOM}`);
  console.log(`  rôle technique  : ${relu.role}`);
  console.log(`  accès           : ${relu.statutAcces}`);
  console.log(`  dossier         : ${relu.eleve.statut}`);
  console.log(`  année           : ${relu.eleve.fonction}`);
  console.log(`  maison          : ${relu.eleve.etatMaison}  baguette : ${relu.eleve.etatBaguette}`);
  console.log(`  compte de service : ${relu.compteDeService}`);
  console.log(`  permissions     : ${permissions}   préfectures : ${prefectures}`);

  if (relu.role !== "JOUEUR") throw new Error("Le compte porte un rôle de staff.");
  if (!relu.compteDeService) throw new Error("Le drapeau de compte de service n’est pas posé.");
  if (permissions > 0 || prefectures > 0) {
    throw new Error("Le compte porte des pouvoirs : à retirer depuis /admin/pouvoirs.");
  }

  await prisma.$disconnect();

  poserDansEnv(VARIABLE, mot);
  poserDansEnv("VEILLE_COURRIEL", ADRESSE);
  console.log("");
  console.log(`Mot de passe écrit dans .env.local sous ${VARIABLE} (ignoré par git).`);

  mkdirSync(NOTES, { recursive: true });
  const note = resolve(NOTES, "veille-secrets.txt");
  appendFileSync(
    note,
    [
      "",
      "───────────────────────────",
      "",
      "Nom    : VEILLE_COURRIEL",
      "Valeur :",
      ADRESSE,
      "",
      "Nom    : VEILLE_MOT_DE_PASSE",
      "Valeur :",
      mot,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(`Ajouté à la note : ${note}`);
}

main().catch((erreur) => {
  console.error("");
  console.error("Échec :", erreur.message);
  process.exitCode = 1;
});
