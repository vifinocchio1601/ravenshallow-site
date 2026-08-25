import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { schemaOubli } from "@/lib/connexion/schema";
import {
  creerLienReinitialisation,
  lienReinitialisation,
} from "@/lib/connexion/reinitialisation";
import {
  adresseAppelante,
  attenteRestante,
  noterEchec,
} from "@/lib/connexion/tentatives";
import { adresseDuSite, envoyerLienReinitialisation } from "@/lib/mail/envoyer";

/**
 * Demande de réinitialisation.
 *
 * **La réponse est toujours la même**, que l’adresse soit connue ou non :
 * une confirmation. Répondre « cette adresse n’existe pas » transformerait
 * ce formulaire en annuaire des inscrits, ouvert à tous.
 *
 * Le comptage des demandes est propre à cette route : trop de demandes
 * d’affilée cessent d’envoyer, sans que la réponse change pour autant. Sans
 * ce garde-fou, n’importe qui pourrait inonder la boîte d’un joueur.
 */

/** Une seule réponse possible — voir le commentaire ci-dessus. */
function confirmation() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return confirmation();
  }

  const lecture = schemaOubli.safeParse(corps);
  // Adresse mal formée : on n’envoie rien, mais on ne le dit pas non plus.
  if (!lecture.success) return confirmation();

  const email = lecture.data.email.trim().toLowerCase();
  const ip = adresseAppelante(request);

  try {
    if ((await attenteRestante("oubli", email, ip)) > 0) return confirmation();
    await noterEchec("oubli", email, ip);

    const compte = await prisma.utilisateur.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!compte) return confirmation();

    const jeton = await creerLienReinitialisation(compte.id);
    const resultat = await envoyerLienReinitialisation(
      compte.email,
      lienReinitialisation(jeton, adresseDuSite()),
    );

    if (!resultat.envoye) {
      // Le joueur voit la même confirmation ; à nous de savoir pourquoi rien
      // n’est parti, sans quoi la panne resterait invisible.
      console.error("[oubli] courriel non parti", resultat);
    }
    return confirmation();
  } catch (erreur) {
    console.error("[oubli] échec technique", erreur);
    return confirmation();
  }
}
