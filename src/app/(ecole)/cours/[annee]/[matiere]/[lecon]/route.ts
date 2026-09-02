import { cookies } from "next/headers";
import { LECON_RUNOLOGIE_L1_1 } from "@/contenu/cours/runologie-l1-1";
import { LECON_SORTILEGES_L1_1 } from "@/contenu/cours/sortileges-l1-1";
import { estUneAnnee, peutOuvrirLAnnee, type Annee } from "@/lib/cours/cursus";
import { lecon, peutOuvrirLaLecon } from "@/lib/cours/lecons";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff } from "@/lib/forum/pouvoirs";
import { prisma } from "@/lib/prisma";
import type { Fonction } from "@/lib/dossier/etats";
import { COOKIE_SESSION, lireSession } from "@/lib/session/session";

/**
 * Une leçon — servie **telle que le joueur l'a écrite**.
 *
 * ── Pourquoi une route et non une page ──
 *
 * Une leçon est une page complète et autonome : son propre `<head>`, ses
 * 456 Ko de style, son script de mise en scène. L'insérer dans le gabarit de
 * l'école ferait entrer en collision deux feuilles de style qui n'ont pas été
 * écrites l'une pour l'autre, et c'est le travail du joueur qui en pâtirait.
 *
 * On la sert donc entière, à son adresse, comme le fichier qu'elle est. Elle
 * porte son propre retour vers le site.
 *
 * ⚠️ **C'est le seul endroit du site qui rende du HTML non passé par React.**
 * Il n'y a rien à assainir : ce HTML ne vient pas d'un joueur mais du dépôt,
 * relu et versionné. Ne jamais faire servir par cette route un contenu qui
 * viendrait de la base ou d'un formulaire — ce serait rouvrir en grand ce que
 * `nettoyerHtml` ferme partout ailleurs.
 *
 * ── La garde, refaite ici en entier ──
 *
 * Une route se contourne en l'appelant. Elle ne se contente donc pas du
 * middleware, qui ne sait lire qu'une signature de cookie : elle relit l'état
 * du compte en base, comme `garde.ts` le fait pour les pages.
 *
 * ⚠️ **404 pour ce qu'on n'a pas le droit d'ouvrir**, jamais 403 : « elle
 * existe, mais pas pour vous » se lit comme une confirmation. Même choix que
 * le forum, la Tour, le Grand Hall, les maisons et les grimoires.
 */

export const dynamic = "force-dynamic";

/** Le contenu de chaque leçon, par sa clé. */
const CONTENUS: Record<string, string> = {
  "sortileges/1": LECON_SORTILEGES_L1_1,
  "runologie/1": LECON_RUNOLOGIE_L1_1,
};

function introuvable(): Response {
  // Pas de corps : la page « Ce couloir ne mène nulle part » est celle du
  // site, et l'on n'y arrive pas depuis une route qui rend du HTML brut.
  return new Response(null, { status: 404 });
}

export async function GET(
  _requete: Request,
  { params }: { params: { annee: string; matiere: string; lecon: string } },
): Promise<Response> {
  // ── Qui regarde ? ──
  const session = await lireSession(cookies().get(COOKIE_SESSION)?.value);
  if (!session) return introuvable();

  const compte = await prisma.utilisateur.findUnique({
    where: { id: session.id },
    select: {
      sessionVersion: true,
      statutAcces: true,
      eleve: { select: { statut: true, fonction: true } },
    },
  });

  // Le cookie porte la version qu'il avait à la connexion : un changement de
  // mot de passe ferme les sessions ouvertes, y compris celle d'un intrus.
  if (!compte || compte.sessionVersion !== session.v) return introuvable();
  if (compte.statutAcces !== "VALIDE") return introuvable();
  if (compte.eleve?.statut !== "ACCEPTE") return introuvable();

  // ── Quelle leçon ? ──
  if (!estUneAnnee(params.annee)) return introuvable();
  const annee = Number(params.annee) as Annee;

  const laLecon = lecon(params.matiere, params.lecon);
  // ⚠️ L'année de l'adresse doit être celle de la leçon : sans cette égalité,
  // `/cours/7/sortileges/1` désignerait une leçon de première année, et la
  // garde d'année ne voudrait plus rien dire.
  if (!laLecon || laLecon.annee !== annee) return introuvable();

  const contenu = CONTENUS[`${laLecon.matiereId}/${laLecon.rang}`];
  if (!contenu) return introuvable();

  // ── A-t-il le droit ? ──
  const pouvoirs = await pouvoirsDe(session.id);
  const staff = estStaff(pouvoirs);
  const anneeOuverte = peutOuvrirLAnnee(
    compte.eleve.fonction as Fonction,
    annee,
    staff,
  );

  if (!peutOuvrirLaLecon(laLecon, anneeOuverte, staff)) return introuvable();

  return new Response(contenu, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // ⚠️ Jamais de cache : le droit d'ouvrir cette page dépend du compte, et
      // une leçon gardée en cache partagé serait servie à qui n'y a pas droit.
      // L'IMAGE, elle, se met en cache — c'est tout l'intérêt de l'avoir
      // sortie de la page.
      "cache-control": "private, no-store",
      // La page est servie telle quelle ; rien ne doit l'encadrer.
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
