/**
 * Contenu des courriels envoyés aux joueurs.
 * Comme le reste du site : rien en dur ailleurs, apostrophes typographiques.
 */

export const EXPEDITEUR_PAR_DEFAUT = "ravenshallow.rp@gmail.com";
export const NOM_EXPEDITEUR = "Ravenshallow";

export const MESSAGES_COURRIEL = {
  confirmation: {
    sujet: "Ton dossier d’admission est bien arrivé — Ravenshallow",
    titre: "Ton dossier est parti",
    corps: [
      "Ton dossier d’admission a bien été transmis à l’administration de Ravenshallow. Il attend maintenant une lecture.",
      "Si quelque chose devait être repris — un nom mal orthographié, un portrait à remplacer, une fiche à compléter — nous te recontacterons par ce même courriel.",
      "Tu peux revenir sur ta fiche à tout moment, sans mot de passe, en suivant ce lien :",
    ],
    bouton: "Accéder à mon dossier",
    pied: "Ce lien t’est personnel et reste valable trente jours. Passé ce délai, écris-nous et nous t’en renverrons un.",
  },

  correction: {
    sujet: "Ton dossier revient corrigé — Ravenshallow",
    titre: "Ton dossier revient corrigé",
    corps: [
      "L’administration a lu ton dossier et te demande de reprendre quelques points. Rien n’est perdu : tout ce que tu as écrit t’attend tel quel.",
      "Voici ce qui t’est demandé :",
    ],
    apresNote: "Reprends seulement ce qui est signalé, puis renvoie ton dossier :",
    bouton: "Reprendre mon dossier",
    pied: "Ce lien t’est personnel et reste valable trente jours.",
  },

  reinitialisation: {
    sujet: "Choisir un nouveau mot de passe — Ravenshallow",
    titre: "Un corbeau pour ton mot de passe",
    corps: [
      "Quelqu’un — toi, nous l’espérons — a demandé à choisir un nouveau mot de passe pour ce compte.",
      "<strong>Ce lien est valable une heure et ne fonctionne qu’une seule fois.</strong> Passé ce délai, il faudra en demander un autre.",
      "Si tu n’as rien demandé, ignore ce message : rien n’a changé, ton mot de passe actuel reste le seul valable.",
    ],
    bouton: "Choisir un nouveau mot de passe",
    pied: "Ce lien t’est personnel — il ouvre ton compte à qui le détient. Ne le transmets à personne, pas même à l’administration.",
  },

  motDePasseChange: {
    sujet: "Ton mot de passe a été changé — Ravenshallow",
    titre: "Ton mot de passe a changé",
    corps: [
      "Le mot de passe de ce compte vient d’être modifié, et toutes les sessions ouvertes ont été fermées.",
      "<strong>Si ce n’est pas toi</strong>, reprends la main immédiatement : demande un nouveau lien depuis le bouton ci-dessous, puis écris-nous.",
    ],
    bouton: "Ce n’est pas moi — reprendre la main",
    pied: "Ce message est automatique : il part à chaque changement de mot de passe, pour que rien ne se fasse dans ton dos.",
  },
} as const;

/** Version texte — celle que liront les clients qui refusent le HTML. */
export function versionTexte(
  message: { titre: string; corps: readonly string[]; bouton: string; pied: string },
  lien: string,
  note?: string | null,
): string {
  // Les gabarits portent quelques `<strong>` pour la version HTML : la version
  // texte les retire, plutôt que de les afficher en toutes lettres.
  const sansBalises = (texte: string) => texte.replace(/<[^>]+>/g, "");

  const lignes = [
    message.titre.toUpperCase(),
    "",
    ...message.corps.map(sansBalises),
    ...(note ? ["", `« ${note} »`] : []),
    "",
    `${message.bouton} : ${lien}`,
    "",
    message.pied,
    "",
    "— Ravenshallow, Côte Nordique.",
  ];
  return lignes.join("\n");
}

/**
 * Version HTML — sobre et en styles en ligne, seule chose que les clients de
 * messagerie interprètent de façon fiable. Palette du site.
 */
export function versionHtml(
  message: { titre: string; corps: readonly string[]; bouton: string; pied: string },
  lien: string,
  note?: string | null,
): string {
  const paragraphe = (texte: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#b9b09a;">${texte}</p>`;

  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#05070b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070b;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0d141c;border:1px solid rgba(142,160,179,0.15);">
        <tr><td style="padding:36px 32px;font-family:Georgia,'Times New Roman',serif;">

          <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8ea0b3;">Ravenshallow</p>
          <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;font-weight:600;color:#e9e1cd;">${message.titre}</h1>

          ${message.corps.map(paragraphe).join("\n          ")}

          ${
            note
              ? `<blockquote style="margin:0 0 20px;padding:4px 0 4px 18px;border-left:2px solid #c97b3d;font-style:italic;font-size:16px;line-height:1.7;color:#b9b09a;">${note}</blockquote>`
              : ""
          }

          <p style="margin:24px 0;">
            <a href="${lien}" style="display:inline-block;padding:14px 28px;background:#3fd9c7;color:#04211f;text-decoration:none;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;">${message.bouton}</a>
          </p>

          <p style="margin:0 0 18px;font-size:12px;line-height:1.6;color:#8ea0b3;">
            Si le bouton ne fonctionne pas, recopie cette adresse dans ton navigateur :<br>
            <span style="color:#b9b09a;word-break:break-all;">${lien}</span>
          </p>

          <p style="margin:0;font-size:13px;line-height:1.6;color:#8ea0b3;">${message.pied}</p>

          <hr style="margin:28px 0 16px;border:none;border-top:1px solid rgba(142,160,179,0.15);">
          <p style="margin:0;font-size:12px;color:#8ea0b3;font-style:italic;">Les mers murmurent, les falaises gardent, et Ravenshallow veille.</p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
