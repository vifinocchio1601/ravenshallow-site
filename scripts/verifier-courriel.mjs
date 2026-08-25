/**
 * Vérifie que Gmail accepte les identifiants d’envoi.
 * N’envoie aucun courriel : teste uniquement l’authentification SMTP.
 *
 *   npm run courriel:verifier
 */
import fs from "node:fs";
import nodemailer from "nodemailer";

const fichier = ".env.local";

if (!fs.existsSync(fichier)) {
  console.error(`✗ ${fichier} introuvable à la racine du projet.`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(fichier, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const expediteur = env.MAIL_EXPEDITEUR;
const motDePasse = (env.MAIL_APP_PASSWORD ?? "").replace(/\s/g, "");

console.log("Expéditeur   :", expediteur || "✗ absent");
console.log(
  "Mot de passe :",
  motDePasse ? `${motDePasse.length} caractères` : "✗ absent",
);

if (!expediteur || !motDePasse) {
  console.error("\n✗ Complétez MAIL_EXPEDITEUR et MAIL_APP_PASSWORD dans .env.local.");
  process.exit(1);
}

// Un mot de passe d’application Google fait toujours 16 caractères.
if (motDePasse.length !== 16) {
  console.warn(
    `\n⚠ Un mot de passe d’application Google fait 16 caractères, celui-ci en fait ${motDePasse.length}.`,
  );
  console.warn("  Recopiez les 4 groupes de 4 lettres, sans les espaces.");
}

try {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: expediteur, pass: motDePasse },
  });
  await transport.verify();
  console.log("\n✓ Gmail accepte les identifiants. Aucun courriel n’a été envoyé.");
} catch (erreur) {
  console.error("\n✗ Gmail refuse les identifiants.");
  console.error(" ", erreur.message.split("\n")[0]);
  console.error(
    "\n  Pistes : mot de passe d’application (pas celui du compte),",
    "\n           validation en deux étapes activée,",
    "\n           16 caractères sans espaces.",
  );
  process.exit(1);
}
