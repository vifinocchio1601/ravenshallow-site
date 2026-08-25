import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MESSAGES_CONNEXION } from "@/lib/connexion/constantes";
import { schemaConnexion } from "@/lib/connexion/schema";
import {
  adresseAppelante,
  attenteRestante,
  effacerTentatives,
  noterEchec,
} from "@/lib/connexion/tentatives";
import { destinationApres } from "@/lib/session/acces";
import { COOKIE_SESSION, creerSession, optionsCookie } from "@/lib/session/session";
import type { StatutAcces, StatutDossier } from "@/lib/dossier/etats";

/**
 * Connexion d’un joueur.
 *
 * Trois principes tiennent cette route :
 *
 * 1. **Une seule réponse d’échec.** Adresse inconnue, mot de passe faux ou
 *    trop de tentatives donnent le même message et le même code. Distinguer
 *    les cas dirait à un inconnu quelles adresses sont inscrites.
 * 2. **Un temps de réponse constant.** Sans compte trouvé, on vérifie quand
 *    même le mot de passe contre une empreinte factice : sinon la rapidité
 *    de la réponse trahirait l’existence de l’adresse aussi sûrement qu’un
 *    message explicite.
 * 3. **Aucun droit accordé ici.** La session dit qui c’est ; ce qu’il peut
 *    ouvrir est relu en base à chaque page — voir `session/garde.ts`.
 */

/**
 * Empreinte d’un mot de passe que personne ne connaît, vérifiée quand aucun
 * compte ne correspond, pour que les deux chemins coûtent le même temps.
 */
let empreinteFactice: Promise<string> | null = null;
async function factice(): Promise<string> {
  if (!empreinteFactice) {
    empreinteFactice = import("@node-rs/argon2").then(({ hash }) =>
      hash(crypto.randomUUID() + crypto.randomUUID()),
    );
  }
  return empreinteFactice;
}

function echec() {
  return NextResponse.json({ erreur: MESSAGES_CONNEXION.echec }, { status: 401 });
}

export async function POST(request: Request) {
  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return echec();
  }

  const lecture = schemaConnexion.safeParse(corps);
  if (!lecture.success) return echec();

  const email = lecture.data.email.trim().toLowerCase();
  const ip = adresseAppelante(request);

  try {
    if ((await attenteRestante("connexion", email, ip)) > 0) {
      await noterEchec("connexion", email, ip);
      return echec();
    }

    const compte = await prisma.utilisateur.findUnique({
      where: { email },
      select: {
        id: true,
        motDePasseHash: true,
        sessionVersion: true,
        statutAcces: true,
        banniJusquau: true,
        eleve: { select: { statut: true, maison: true } },
      },
    });

    const { verify } = await import("@node-rs/argon2");
    const correct = compte
      ? await verify(compte.motDePasseHash, lecture.data.motDePasse)
      : // Comptes inexistants : même travail, même durée, même réponse.
        await verify(await factice(), lecture.data.motDePasse).catch(() => false);

    if (!compte || !correct) {
      await noterEchec("connexion", email, ip);
      return echec();
    }

    await effacerTentatives("connexion", email, ip);

    const destination = destinationApres({
      statut: (compte.eleve?.statut ?? "BROUILLON") as StatutDossier,
      statutAcces: compte.statutAcces as StatutAcces,
      banniJusquau: compte.banniJusquau,
      maison: compte.eleve?.maison ?? null,
    });

    const reponse = NextResponse.json({ ok: true, destination });
    reponse.cookies.set({
      name: COOKIE_SESSION,
      value: await creerSession(compte.id, compte.sessionVersion),
      ...optionsCookie(),
    });
    return reponse;
  } catch (erreur) {
    console.error("[connexion] échec technique", erreur);
    return NextResponse.json(
      { erreur: MESSAGES_CONNEXION.indisponible },
      { status: 503 },
    );
  }
}
