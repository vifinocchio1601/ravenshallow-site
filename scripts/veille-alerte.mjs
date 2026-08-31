#!/usr/bin/env node
/**
 * Le dernier mot — quand la ronde n'a même pas pu tomber proprement.
 *
 * ── Ce qu'il couvre, et que `ronde.ts` ne couvre pas ──
 *
 * `ronde.ts` attrape ses propres échecs et envoie déjà un courriel court : la
 * base injoignable, un secret absent, un rapport retenu. Mais elle ne peut
 * rien dire de ce qui l'empêche de démarrer ou la tue en cours de route :
 *
 *   • un `npm ci` qui échoue ;
 *   • le délai de vingt minutes du workflow, qui tue le processus ;
 *   • une panne du poste d'exécution.
 *
 * Dans ces cas-là, rien ne partirait — et **l'absence de rapport se
 * confondrait avec « tout va bien »**, ce qui est exactement le silence que
 * tout ce dispositif cherche à rendre impossible.
 *
 * ── Volontairement minuscule ──
 *
 * Pas d'import du domaine, pas de TypeScript, pas de résolveur de chemins :
 * ce script tourne précisément quand quelque chose est cassé, et tout ce dont
 * il dépend est une chose de plus qui peut manquer. Il lui faut `nodemailer`,
 * et rien d'autre.
 *
 * ⚠️ **Il ne dit pas ce qui a échoué**, parce qu'il ne le sait pas : il donne
 * l'adresse de l'exécution, où le journal est lisible. Inventer une cause
 * serait pire que de n'en donner aucune.
 */

import nodemailer from "nodemailer";

const expediteur = process.env.MAIL_EXPEDITEUR?.trim();
const motDePasse = process.env.MAIL_APP_PASSWORD?.trim();
const destinataire = process.env.VEILLE_DESTINATAIRE?.trim() || expediteur;
const execution = process.env.VEILLE_EXECUTION?.trim();

if (!expediteur || !motDePasse) {
  // Rien à faire : sans le transport, on ne peut prévenir personne. On sort
  // en échec pour que l'exécution reste rouge dans la liste des Actions.
  console.log("Alerte impossible : le courriel n’est pas configuré.");
  process.exit(1);
}

const jour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Brussels",
  day: "numeric",
  month: "short",
}).format(new Date());

const corps = [
  `La ronde du ${jour} ne s’est pas terminée.`,
  "",
  "Elle n’a pas pu envoyer son rapport, ni même dire pourquoi : le processus",
  "s’est arrêté avant. Les causes ordinaires sont une installation qui échoue,",
  "un délai d’exécution atteint, ou une panne de la machine de GitHub.",
  "",
  "Rien n’a été vérifié ce matin. Ce message part quand même : sans lui,",
  "l’absence de rapport se confondrait avec « tout va bien ».",
  "",
  execution ? `Le journal de l’exécution :\n${execution}` : "",
  "",
  "Une ronde à la demande peut être relancée depuis l’onglet Actions du dépôt.",
]
  .filter((ligne) => ligne !== undefined)
  .join("\n");

try {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: expediteur, pass: motDePasse },
  });

  await transport.sendMail({
    from: `"La Veille de Ravenshallow" <${expediteur}>`,
    to: destinataire,
    subject: `Ravenshallow — la ronde est tombée — ${jour}`,
    text: corps,
  });

  console.log("Alerte envoyée.");
} catch (erreur) {
  // ⚠️ Le message d'erreur de nodemailer porte volontiers l'adresse du
  // destinataire, et le journal d'exécution est public : on ne l'affiche pas.
  console.log("L’alerte n’a pas pu être envoyée.");
  process.exit(1);
}
