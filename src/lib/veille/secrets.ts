/**
 * Ce que La Veille a besoin de savoir, et qu'elle ne peut pas deviner.
 *
 * ── Une seule porte, et elle se plaint tôt ──
 *
 * Un secret absent ne doit pas se découvrir au bout de huit minutes de ronde,
 * dans le collecteur qui en avait besoin. Tout est relu au démarrage, et la
 * ronde s'arrête net en nommant ce qui manque.
 *
 * ⚠️ **Aucune valeur n'est jamais écrite dans un journal, ni dans une erreur.**
 * Le dépôt est public, donc les journaux d'exécution des Actions le sont
 * aussi : un message d'erreur qui citerait une chaîne de connexion la
 * publierait pour de bon, et un secret publié ne se dépublie pas. On ne nomme
 * que la VARIABLE, jamais son contenu.
 */

export type Secrets = {
  /** Le rôle qui ne sait que lire. */
  base: string;
  /** L'adresse publique du site à surveiller. */
  site: string;
  /** Le compte de service qui traverse les écrans. */
  compte: { courriel: string; motDePasse: string };
  /** Le SMTP du site, celui des accusés de réception. */
  courriel: { expediteur: string; motDePasse: string; destinataire: string };
  /** La clé de l'API. Absente, le rapport part sans ses suggestions. */
  cleApi: string | null;
};

/** Les variables qu'il faut, et la phrase qui dit à quoi chacune sert. */
const OBLIGATOIRES = {
  VEILLE_DATABASE_URL: "la connexion en lecture seule (scripts/veille-identifiants.mjs)",
  VEILLE_COURRIEL: "l’adresse du compte de service (scripts/veille-compte.mjs)",
  VEILLE_MOT_DE_PASSE: "le mot de passe du compte de service",
  MAIL_EXPEDITEUR: "l’adresse d’envoi du site",
  MAIL_APP_PASSWORD: "le mot de passe d’application Google",
} as const;

/** L'adresse du site, si personne ne la donne. */
const SITE_PAR_DEFAUT = "https://ravenshallow.com";

export function lireLesSecrets(env: NodeJS.ProcessEnv = process.env): Secrets {
  const manquants = Object.entries(OBLIGATOIRES)
    .filter(([nom]) => !env[nom]?.trim())
    .map(([nom, role]) => `  ${nom} — ${role}`);

  if (manquants.length > 0) {
    throw new Error(
      `La ronde ne peut pas partir, il manque ${manquants.length} secret(s) :\n` +
        manquants.join("\n"),
    );
  }

  const expediteur = env.MAIL_EXPEDITEUR!.trim();

  return {
    base: env.VEILLE_DATABASE_URL!.trim(),
    site: (env.VEILLE_SITE_URL?.trim() || SITE_PAR_DEFAUT).replace(/\/+$/, ""),
    compte: {
      courriel: env.VEILLE_COURRIEL!.trim(),
      motDePasse: env.VEILLE_MOT_DE_PASSE!.trim(),
    },
    courriel: {
      expediteur,
      motDePasse: env.MAIL_APP_PASSWORD!.trim(),
      // Par défaut, le site s'écrit à lui-même : c'est l'adresse que le joueur
      // relève déjà, et il n'y a rien de plus à configurer.
      destinataire: env.VEILLE_DESTINATAIRE?.trim() || expediteur,
    },
    cleApi: env.ANTHROPIC_API_KEY?.trim() || null,
  };
}
