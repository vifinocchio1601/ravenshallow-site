import "server-only";
import { cookies } from "next/headers";
import type { Fonction } from "@/lib/dossier/etats";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff } from "@/lib/forum/pouvoirs";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSION, lireSession } from "@/lib/session/session";
import { peutOuvrirLAnnee, type Annee } from "./cursus";
import { lecon, peutOuvrirLaLecon, type Lecon } from "./lecons";

/**
 * **La garde des cours, refaite en entier.**
 *
 * ── Pourquoi elle existe ──
 *
 * Trois routes servent maintenant du contenu de cours — la leçon, la page du
 * contrôle, l'envoi du contrôle — et elles posent **exactement les mêmes six
 * questions** : la session est-elle valide, le compte accepté, la leçon
 * existe-t-elle, l'année de l'adresse est-elle la sienne, l'année est-elle
 * ouverte à ce compte, la leçon l'est-elle.
 *
 * Recopier cette suite trois fois, c'est garantir qu'un jour l'une des trois
 * oubliera une ligne — et une route se contourne en l'appelant. Elle vit donc
 * ici, une fois.
 *
 * ⚠️ **Elle ne se contente pas du middleware**, qui tourne en runtime Edge et
 * ne sait lire qu'une signature de cookie. Elle relit l'état du compte en
 * base, comme `garde.ts` le fait pour les pages.
 *
 * ⚠️ **Elle rend `null` pour tout ce qui se refuse**, sans dire pourquoi.
 * L'appelant répond 404 : « elle existe, mais pas pour vous » se lit comme une
 * confirmation. Même choix que le forum, la Tour, le Grand Hall, les maisons
 * et les grimoires.
 */

/** Ce qu'un appelant a besoin de savoir une fois la porte franchie. */
export type LecteurDeLecon = {
  utilisateurId: string;
  /** La fiche, et non le compte : c'est elle qui passe un contrôle. */
  eleveId: string;
  laLecon: Lecon;
  annee: Annee;
  staff: boolean;
  /** Le strict nécessaire pour décider à qui les points reviennent. */
  auteur: {
    eleveId: string;
    maison: string | null;
    etatMaison: "NON_FAIT" | "FAIT" | "SANS_OBJET";
  };
};

/**
 * Qui regarde, et a-t-il le droit d'ouvrir cette leçon ?
 *
 * `annee` arrive de l'adresse, en toutes lettres. ⚠️ **Elle doit être celle
 * de la leçon** : sans cette égalité, `/cours/7/sortileges/1` désignerait une
 * leçon de première année, et la garde d'année ne voudrait plus rien dire.
 */
export async function lecteurDeLaLecon(
  anneeBrute: string,
  matiere: string,
  rang: string,
): Promise<LecteurDeLecon | null> {
  // ── Qui regarde ? ──
  const session = await lireSession(cookies().get(COOKIE_SESSION)?.value);
  if (!session) return null;

  const compte = await prisma.utilisateur.findUnique({
    where: { id: session.id },
    select: {
      sessionVersion: true,
      statutAcces: true,
      eleve: {
        select: {
          id: true,
          statut: true,
          fonction: true,
          maison: true,
          etatMaison: true,
        },
      },
    },
  });

  // Le cookie porte la version qu'il avait à la connexion : un changement de
  // mot de passe ferme les sessions ouvertes, y compris celle d'un intrus.
  if (!compte || compte.sessionVersion !== session.v) return null;
  if (compte.statutAcces !== "VALIDE") return null;
  if (compte.eleve?.statut !== "ACCEPTE") return null;

  // ── Quelle leçon ? ──
  // ⚠️ Le rang et l'année s'écrivent en chiffres, et rien d'autre : `lecon`
  // le vérifie, et l'on ne s'en remet pas à `Number(" 1")`, qui vaut 1 et
  // rendrait la même leçon joignable par une seconde adresse.
  if (!/^[1-7]$/.test(anneeBrute)) return null;
  const annee = Number(anneeBrute) as Annee;

  const laLecon = lecon(matiere, rang);
  if (!laLecon || laLecon.annee !== annee) return null;

  // ── A-t-il le droit ? ──
  const pouvoirs = await pouvoirsDe(session.id);
  const staff = estStaff(pouvoirs);
  const anneeOuverte = peutOuvrirLAnnee(
    compte.eleve.fonction as Fonction,
    annee,
    staff,
  );
  // ⚠️ **L'instant est pris ICI, une seule fois**, et passé à la couture : elle
  // reste pure, et les trois routes des cours posent la même question au même
  // moment. Une leçon ouverte à 9 h ne doit pas s'ouvrir à 8 h 59 sur une
  // route et à 9 h 00 sur une autre.
  if (!peutOuvrirLaLecon(laLecon, anneeOuverte, staff, new Date())) return null;

  return {
    utilisateurId: session.id,
    eleveId: compte.eleve.id,
    laLecon,
    annee,
    staff,
    auteur: {
      eleveId: compte.eleve.id,
      maison: compte.eleve.maison,
      etatMaison: compte.eleve.etatMaison,
    },
  };
}
