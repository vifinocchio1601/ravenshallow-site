import { PrismaClient } from "@prisma/client";

/**
 * La seule porte de La Veille vers PostgreSQL — et elle ne sait que lire.
 *
 * ── Pourquoi ce fichier existe, alors que `lib/prisma.ts` existe déjà ──
 *
 * Justement parce qu'il existe. `lib/prisma.ts` ouvre la connexion du SITE,
 * avec les identifiants du propriétaire : il peut tout écrire. Si un
 * collecteur l'importait — un `import` machinal, une complétion acceptée trop
 * vite —, La Veille se retrouverait avec les pleins pouvoirs sans que rien ne
 * le signale, et sa promesse de lecture seule ne vaudrait plus rien.
 *
 * ⚠️ **Aucun fichier de `lib/veille/` n'importe `lib/prisma`**, et
 * `etancheite.test.ts` relit le code source pour le vérifier — le procédé
 * d'`etancheite.test.ts` de la Tour et de `transaction.test.ts`, éprouvé deux
 * fois sur ce projet.
 *
 * ── Deux verrous, et il faut les deux ──
 *
 *   1. les identifiants n'ont que `SELECT` — c'est PostgreSQL qui refuse, pas
 *      une intention qu'on se donne. Éprouvé par `en-base.essai.ts`, qui
 *      envoie sept vraies écritures et exige sept refus ;
 *   2. rien ici n'expose de méthode d'écriture : `depot()` rend un client, et
 *      c'est au code de ne pas s'en servir pour écrire. Le premier verrou est
 *      celui qui compte — le second n'est qu'une politesse.
 *
 * ── Le réveil de Neon ──
 *
 * La base ne s'endort plus depuis la formule Launch, mais elle peut redémarrer
 * pour une autre raison — une mise à jour, un incident. On pose donc le même
 * `connect_timeout` que le site, par la même couture : voir `base/adresse.ts`.
 */

import { adresseAvecDelaiDeConnexion } from "@/lib/base/adresse";

/** Le nom du rôle attendu. La ronde s'arrête si ce n'est pas lui. */
export const ROLE_ATTENDU = "veille_lecture";

let client: PrismaClient | null = null;

/**
 * Le client de lecture, ouvert une fois.
 *
 * ⚠️ **Il n'est pas mis en cache sur `globalThis`** comme celui du site : la
 * ronde est un processus qui vit dix minutes et meurt. Le cache du site existe
 * pour survivre aux rechargements de Next en développement — un besoin qui
 * n'existe pas ici.
 */
export function depot(adresse: string): PrismaClient {
  if (!client) {
    client = new PrismaClient({
      // « error » et rien de plus : le dépôt est public, et les journaux
      // d'exécution avec lui. Une requête tracée y publierait des données.
      log: ["error"],
      datasourceUrl: adresseAvecDelaiDeConnexion(adresse),
    });
  }
  return client;
}

/**
 * Demande à la base **qui parle**, et refuse de continuer si ce n'est pas le
 * bon rôle.
 *
 * C'est la même garde que celle de `en-base.essai.ts`, et pour la même raison :
 * une variable recopiée trop vite, un secret mal collé, et La Veille tournerait
 * avec les droits du propriétaire. Elle ne le saurait pas, et nous non plus —
 * jusqu'au jour où un collecteur écrirait quelque chose.
 *
 * ⚠️ **Elle ne s'appuie pas sur ce que la chaîne de connexion contient**, mais
 * sur ce que la base répond. Une chaîne peut mentir sur son rôle ; `current_user`
 * non.
 */
export async function verifierLaLectureSeule(prisma: PrismaClient): Promise<void> {
  const [{ current_user: qui }] = await prisma.$queryRawUnsafe<
    { current_user: string }[]
  >(`SELECT current_user`);

  if (qui !== ROLE_ATTENDU) {
    // On nomme le rôle trouvé, jamais la chaîne de connexion : le journal
    // d'exécution est public.
    throw new Error(
      `La Veille se connecte en « ${qui} » et non « ${ROLE_ATTENDU} ». ` +
        "Ronde interrompue : elle doit lire, et seulement lire.",
    );
  }
}

/** Referme la connexion. Appelé une fois, à la toute fin de la ronde. */
export async function refermer(): Promise<void> {
  await client?.$disconnect();
  client = null;
}
