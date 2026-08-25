import { NextResponse } from "next/server";
import { MESSAGES } from "@/lib/dossier/constantes";
import { ConflitDossier, creerDossier, journaliserCourriel } from "@/lib/dossier/depot";
import { schemaDossier } from "@/lib/dossier/schema";
import { envoyerConfirmationDossier } from "@/lib/mail/envoyer";
import type { Genre } from "@/lib/dossier/etats";

/**
 * Envoi du dossier d’admission.
 *
 * Revalide avec **le même schéma Zod** que le formulaire : une seule source de
 * vérité, aucune règle réécrite ici. Ce que le client envoie n’est jamais cru
 * sur parole — y compris le bouton d’envoi, qu’une console peut réactiver.
 */
export async function POST(request: Request) {
  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: MESSAGES.envoiEchoue }, { status: 400 });
  }

  const resultat = schemaDossier.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json(
      {
        erreur: MESSAGES.envoiEchoue,
        details: resultat.error.issues.map((probleme) => ({
          champ: probleme.path.join("."),
          message: probleme.message,
        })),
      },
      { status: 422 },
    );
  }

  const donnees = resultat.data;

  // L’âge réel s’arrête ici : seul le booléen poursuit sa route (art. 2.3).
  const majeur16 = donnees.ageReel >= 16;

  let dossier: { id: string; email: string };
  try {
    dossier = await creerDossier({
      email: donnees.email,
      motDePasse: donnees.motDePasse,
      majeur16,
      reglementAccepteLe: donnees.reglementAccepteLe,
      limitesEcriture: donnees.limitesEcriture,
      limitesAutres: donnees.limitesAutres || null,
      prenomNom: donnees.prenomNom,
      genre: donnees.genre as Genre,
      famille: donnees.famille,
      portraitType: donnees.portraitType,
      acteurNom: donnees.acteurNom || null,
      portrait: donnees.portrait,
      biographie: donnees.biographie,
      qualites: donnees.qualites,
      defauts: donnees.defauts,
      plusGrandePeur: donnees.plusGrandePeur,
    });
  } catch (erreur) {
    // Une adresse déjà inscrite ou un visage déjà porté ne sont pas des
    // pannes : le joueur peut les corriger, et le formulaire sait les montrer.
    if (erreur instanceof ConflitDossier) {
      return NextResponse.json(
        {
          erreur:
            erreur.champ === "email" ? MESSAGES.emailPris : MESSAGES.acteurPris,
          details: [
            {
              champ: erreur.champ,
              message:
                erreur.champ === "email"
                  ? MESSAGES.emailPris
                  : MESSAGES.acteurPris,
            },
          ],
        },
        { status: 409 },
      );
    }
    console.error("[dossier] création impossible", erreur);
    return NextResponse.json(
      { erreur: MESSAGES.baseIndisponible },
      { status: 503 },
    );
  }

  // Un courriel qui ne part pas ne doit pas faire échouer le dépôt : le
  // dossier est enregistré, le joueur en est informé à l’écran — et
  // l’administration retrouve le sort de l’envoi dans le journal du dossier.
  const courriel = await envoyerConfirmationDossier(dossier.email, dossier.id);
  await journaliserCourriel(dossier.id, {
    envoye: courriel.envoye,
    ...(courriel.envoye ? {} : { raison: courriel.raison, detail: courriel.detail }),
  });

  return NextResponse.json({ ok: true, courrielEnvoye: courriel.envoye });
}
