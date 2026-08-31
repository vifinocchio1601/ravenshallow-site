import { NextResponse } from "next/server";
import { schemaNouveauMotDePasse } from "@/lib/connexion/schema";
import { TEXTES_REINITIALISATION } from "@/lib/connexion/constantes";
import {
  appliquerNouveauMotDePasse,
  lireJetonReinitialisation,
} from "@/lib/connexion/reinitialisation";
import { MESSAGES_CONNEXION } from "@/lib/connexion/constantes";
import { adresseDuSite, envoyerChangementMotDePasse } from "@/lib/mail/envoyer";
import { COOKIE_SESSION, optionsCookie } from "@/lib/session/session";
import { ROUTES } from "@/lib/ecole/menu";
import { noterErreur } from "@/lib/erreurs/depot";

/**
 * Enregistrement du nouveau mot de passe.
 *
 * Le jeton est relu ici, et non pris sur parole depuis la page : entre
 * l’affichage du formulaire et l’envoi, il a pu expirer, servir ailleurs, ou
 * être remplacé par une demande plus récente.
 */
export async function POST(request: Request) {
  let corps: { jeton?: unknown; motDePasse?: unknown; confirmation?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json(
      { erreur: MESSAGES_CONNEXION.indisponible },
      { status: 400 },
    );
  }

  const lecture = schemaNouveauMotDePasse.safeParse({
    motDePasse: corps.motDePasse,
    confirmation: corps.confirmation,
  });
  if (!lecture.success) {
    return NextResponse.json(
      {
        erreur: lecture.error.issues[0]?.message,
        details: lecture.error.issues.map((p) => ({
          champ: p.path.join("."),
          message: p.message,
        })),
      },
      { status: 422 },
    );
  }

  const jeton = typeof corps.jeton === "string" ? corps.jeton : null;

  try {
    const lu = await lireJetonReinitialisation(jeton);
    if (!lu.valide) {
      return NextResponse.json(
        { erreur: TEXTES_REINITIALISATION.perime.titre, perime: true },
        { status: 410 },
      );
    }

    const { hash } = await import("@node-rs/argon2");
    const compte = await appliquerNouveauMotDePasse(
      lu.jetonId,
      lu.utilisateurId,
      await hash(lecture.data.motDePasse),
    );

    // Prévenir passe après avoir refermé : si l’envoi échoue, le mot de passe
    // est quand même changé et les sessions déjà fermées.
    const resultat = await envoyerChangementMotDePasse(
      compte.email,
      `${adresseDuSite().replace(/\/$/, "")}${ROUTES.motDePasseOublie}`,
    );
    if (!resultat.envoye) {
      console.error("[réinitialisation] notification non partie", resultat);
      await noterErreur(
        "reinitialisation",
        new Error(`notification non partie : ${resultat.raison}`),
        "/api/reinitialisation",
      );
    }

    // La session courante tombe avec les autres : `sessionVersion` a changé.
    // On efface le cookie pour que le navigateur n’en garde pas un mort.
    const reponse = NextResponse.json({ ok: true, destination: ROUTES.connexion });
    reponse.cookies.set({ name: COOKIE_SESSION, value: "", ...optionsCookie(0) });
    return reponse;
  } catch (erreur) {
    console.error("[réinitialisation] échec technique", erreur);
    await noterErreur("reinitialisation", erreur, "/api/reinitialisation");
    return NextResponse.json(
      { erreur: MESSAGES_CONNEXION.indisponible },
      { status: 503 },
    );
  }
}
