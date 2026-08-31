import nodemailer from "nodemailer";
import { TEXTES } from "./constantes";
import type { Secrets } from "./secrets";

/**
 * L'envoi du rapport — **par le transport que le site utilise déjà**.
 *
 * ── Pourquoi pas d'import de `lib/mail/envoyer.ts` ──
 *
 * On aurait aimé. Ce module est `server-only` : il lève dès qu'il est chargé
 * hors d'un composant serveur de Next, et la ronde est un simple processus
 * Node. Le lever pour La Veille reviendrait à ouvrir au reste du monde une
 * porte fermée pour de bonnes raisons.
 *
 * Ce qui est repris à l'identique, c'est **le service** : le SMTP de Gmail, le
 * même expéditeur, le même mot de passe d'application. Aucun second service à
 * configurer, comme le veut la règle du projet — et le jour où le site
 * changera de transport, il n'y aura qu'un endroit de plus à suivre, nommé ici
 * en toutes lettres.
 *
 * ── Texte seul ──
 *
 * Pas de version HTML, à la différence des courriels du site. Le rapport est
 * fait pour être lu, pas regardé ; une version HTML doublerait la mise en
 * forme et finirait par dire autre chose que la version texte.
 */

export type ResultatEnvoi =
  | { envoye: true }
  | { envoye: false; raison: string };

export async function envoyerLeRapport(
  secrets: Secrets,
  objet: string,
  corps: string,
): Promise<ResultatEnvoi> {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: secrets.courriel.expediteur, pass: secrets.courriel.motDePasse },
    });

    await transport.sendMail({
      from: `"${TEXTES.signature}" <${secrets.courriel.expediteur}>`,
      to: secrets.courriel.destinataire,
      subject: objet,
      text: corps,
    });

    return { envoye: true };
  } catch (erreur) {
    // ⚠️ Le message d'erreur de nodemailer porte volontiers l'adresse du
    // destinataire. Il ne part nulle part : il ne sert qu'à faire échouer la
    // ronde bruyamment, et le journal d'exécution est public.
    return {
      envoye: false,
      raison: erreur instanceof Error ? erreur.message : String(erreur),
    };
  }
}
