import "server-only";
import { prisma } from "@/lib/prisma";
import { empreinteSecrete } from "@/lib/signature";

/**
 * Limitation des tentatives de connexion.
 *
 * Compte les échecs récents et impose une attente qui s’allonge. Le comptage
 * est fait **par adresse et par IP séparément** : sans la seconde clé, il
 * suffirait d’essayer une adresse différente à chaque coup ; sans la
 * première, un immeuble entier derrière la même IP se bloquerait mutuellement.
 * Le verrou retenu est le plus strict des deux.
 *
 * La table ne conserve ni adresse ni IP, seulement des empreintes HMAC : on
 * peut retrouver la ligne d’une valeur connue, jamais la valeur d’une ligne.
 * Même principe que l’âge réel du dossier, qu’on ne conserve pas non plus.
 */

/** Au-delà, un échec est trop vieux pour compter — et sa ligne est effacée. */
const FENETRE_MS = 60 * 60 * 1000;

/**
 * Attente imposée selon le nombre d’échecs dans la fenêtre. Les quatre
 * premiers essais passent sans friction : se tromper de mot de passe est
 * banal, et punir l’étourderie ferait fuir plus de joueurs qu’elle
 * n’arrêterait d’intrus.
 */
function attenteSecondes(echecs: number): number {
  if (echecs < 5) return 0;
  if (echecs === 5) return 30;
  if (echecs === 6) return 60;
  if (echecs === 7) return 120;
  if (echecs === 8) return 300;
  return 900;
}

async function cles(email: string, ip: string | null): Promise<string[]> {
  const liste = [await empreinteSecrete(`email:${email.trim().toLowerCase()}`)];
  if (ip) liste.push(await empreinteSecrete(`ip:${ip}`));
  return liste;
}

/**
 * Secondes d’attente restantes, 0 si la voie est libre.
 *
 * Balaie au passage les lignes trop vieilles : pas de tâche planifiée à
 * prévoir, la table se nettoie d’elle-même au fil des connexions.
 */
export async function attenteRestante(
  email: string,
  ip: string | null,
): Promise<number> {
  const depuis = new Date(Date.now() - FENETRE_MS);

  await prisma.tentativeConnexion.deleteMany({ where: { creeLe: { lt: depuis } } });

  const lignes = await prisma.tentativeConnexion.findMany({
    where: { cle: { in: await cles(email, ip) }, creeLe: { gte: depuis } },
    select: { cle: true, creeLe: true },
  });
  if (lignes.length === 0) return 0;

  const parCle = new Map<string, { echecs: number; dernier: number }>();
  for (const ligne of lignes) {
    const courant = parCle.get(ligne.cle) ?? { echecs: 0, dernier: 0 };
    courant.echecs += 1;
    courant.dernier = Math.max(courant.dernier, ligne.creeLe.getTime());
    parCle.set(ligne.cle, courant);
  }

  let restante = 0;
  for (const { echecs, dernier } of parCle.values()) {
    const attente = attenteSecondes(echecs) * 1000;
    if (attente === 0) continue;
    restante = Math.max(restante, Math.ceil((dernier + attente - Date.now()) / 1000));
  }
  return Math.max(0, restante);
}

export async function noterEchec(email: string, ip: string | null): Promise<void> {
  const liste = await cles(email, ip);
  await prisma.tentativeConnexion.createMany({
    data: liste.map((cle) => ({ cle })),
  });
}

/** Une connexion réussie remet les compteurs de ses deux clés à zéro. */
export async function effacerTentatives(
  email: string,
  ip: string | null,
): Promise<void> {
  await prisma.tentativeConnexion.deleteMany({
    where: { cle: { in: await cles(email, ip) } },
  });
}

/** L’adresse du visiteur, telle que la transmet le proxy de Vercel. */
export function adresseAppelante(requete: Request): string | null {
  const transmise = requete.headers.get("x-forwarded-for");
  if (transmise) return transmise.split(",")[0]?.trim() || null;
  return requete.headers.get("x-real-ip");
}
