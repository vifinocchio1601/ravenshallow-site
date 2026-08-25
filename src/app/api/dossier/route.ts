import { NextResponse } from "next/server";
import { MESSAGES } from "@/lib/dossier/constantes";
import { schemaDossier } from "@/lib/dossier/schema";

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

  // L’âge réel s’arrête ici : seul le booléen poursuit sa route (art. 2.3).
  const { ageReel } = resultat.data;
  const majeur16 = ageReel >= 16;
  void majeur16;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { erreur: MESSAGES.baseIndisponible },
      { status: 503 },
    );
  }

  // TODO (lot base de données) : hachage argon2, envoi du portrait sur Blob,
  // création du compte + de la fiche, réservation du visage, journal.
  return NextResponse.json(
    { erreur: MESSAGES.baseIndisponible },
    { status: 503 },
  );
}
