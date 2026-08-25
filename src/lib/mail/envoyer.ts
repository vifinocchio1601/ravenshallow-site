import "server-only";
import nodemailer from "nodemailer";
import {
  EXPEDITEUR_PAR_DEFAUT,
  MESSAGES_COURRIEL,
  NOM_EXPEDITEUR,
  versionHtml,
  versionTexte,
} from "./messages";
import { creerJeton, lienDossier } from "@/lib/dossier/jeton";

/**
 * Envoi des courriels aux joueurs.
 *
 * Passe par le SMTP de Gmail, seule façon d’envoyer réellement **depuis**
 * `ravenshallow.rp@gmail.com` : un service transactionnel tiers exige un
 * domaine dont on peut prouver la propriété, ce que gmail.com n’est pas.
 * Il faut donc un mot de passe d’application Google (`MAIL_APP_PASSWORD`).
 *
 * Sans ce mot de passe, en développement, le courriel est écrit dans la
 * console plutôt que d’être simulé silencieusement.
 */

export type ResultatEnvoi =
  | { envoye: true }
  | { envoye: false; raison: "non-configure" | "echec"; detail?: string };

function expediteur(): string {
  return process.env.MAIL_EXPEDITEUR?.trim() || EXPEDITEUR_PAR_DEFAUT;
}

/** Adresse publique du site, pour construire les liens des courriels. */
function baseSite(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

async function poster(
  destinataire: string,
  sujet: string,
  texte: string,
  html: string,
): Promise<ResultatEnvoi> {
  const motDePasse = process.env.MAIL_APP_PASSWORD;

  if (!motDePasse) {
    if (process.env.NODE_ENV === "production") {
      return { envoye: false, raison: "non-configure" };
    }
    // En développement : on montre ce qui serait parti, sans faire semblant.
    console.info(
      [
        "",
        "──────── courriel non envoyé (MAIL_APP_PASSWORD absent) ────────",
        `De    : ${NOM_EXPEDITEUR} <${expediteur()}>`,
        `À     : ${destinataire}`,
        `Sujet : ${sujet}`,
        "",
        texte,
        "────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { envoye: false, raison: "non-configure" };
  }

  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: expediteur(), pass: motDePasse },
    });

    await transport.sendMail({
      from: `"${NOM_EXPEDITEUR}" <${expediteur()}>`,
      to: destinataire,
      subject: sujet,
      text: texte,
      html,
    });
    return { envoye: true };
  } catch (erreur) {
    // Un envoi raté ne doit jamais faire échouer le dépôt d’un dossier.
    console.error("[courriel] échec d’envoi", erreur);
    return {
      envoye: false,
      raison: "echec",
      detail: erreur instanceof Error ? erreur.message : undefined,
    };
  }
}

/**
 * Prépare et poste un courriel porteur d’un lien de retour.
 *
 * Rien de ce qui se passe ici ne doit remonter : la fabrication du jeton
 * échoue si `AUTH_SECRET` manque, et un dossier déjà enregistré ne peut pas
 * être perdu parce que son accusé de réception n’a pas pu partir.
 */
async function posterAvecLien(
  destinataire: string,
  identifiantCompte: string,
  jetonVersion: number,
  message: {
    sujet: string;
    titre: string;
    corps: readonly string[];
    bouton: string;
    pied: string;
  },
  note?: string | null,
): Promise<ResultatEnvoi> {
  try {
    const lien = lienDossier(
      await creerJeton(identifiantCompte, jetonVersion),
      baseSite(),
    );
    return await poster(
      destinataire,
      message.sujet,
      versionTexte(message, lien, note),
      versionHtml(message, lien, note),
    );
  } catch (erreur) {
    console.error("[courriel] préparation impossible", erreur);
    return {
      envoye: false,
      raison: "echec",
      detail: erreur instanceof Error ? erreur.message : undefined,
    };
  }
}

/** « Ton dossier est bien arrivé », avec le lien de retour. */
export async function envoyerConfirmationDossier(
  destinataire: string,
  identifiantCompte: string,
  jetonVersion = 0,
): Promise<ResultatEnvoi> {
  return posterAvecLien(
    destinataire,
    identifiantCompte,
    jetonVersion,
    MESSAGES_COURRIEL.confirmation,
  );
}

/** « Ton dossier revient corrigé », avec la note de l’administration. */
export async function envoyerRenvoiEnCorrection(
  destinataire: string,
  identifiantCompte: string,
  note: string,
  jetonVersion = 0,
): Promise<ResultatEnvoi> {
  return posterAvecLien(
    destinataire,
    identifiantCompte,
    jetonVersion,
    MESSAGES_COURRIEL.correction,
    note,
  );
}
