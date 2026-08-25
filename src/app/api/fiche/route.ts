import { NextResponse } from "next/server";
import { MESSAGES, TEXTES } from "@/lib/dossier/constantes";
import { lireDossier, modifierFiche } from "@/lib/dossier/depot";
import { verifierJeton } from "@/lib/dossier/jeton";
import { schemaFiche } from "@/lib/dossier/schema";
import type { Genre } from "@/lib/dossier/etats";

/** Seuls ces états laissent le joueur reprendre sa fiche. */
const ETATS_MODIFIABLES = ["EN_ATTENTE", "A_CORRIGER", "ACCEPTE"] as const;

/**
 * Reprise de la fiche par le joueur.
 *
 * Le jeton fait office d’identité : il dit de quel dossier il s’agit, et le
 * serveur ne prend l’identifiant que de là — jamais du corps de la requête.
 */
export async function POST(request: Request) {
  let corps: { jeton?: unknown; fiche?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: MESSAGES.envoiEchoue }, { status: 400 });
  }

  const verification = await verifierJeton(
    typeof corps.jeton === "string" ? corps.jeton : null,
  );
  if (!verification.valide) {
    return NextResponse.json(
      { erreur: TEXTES.fiche.lienInvalide.titre },
      { status: 401 },
    );
  }

  const dossier = await lireDossier(verification.contenu.id);
  if (!dossier) {
    return NextResponse.json(
      { erreur: TEXTES.fiche.lienInvalide.titre },
      { status: 404 },
    );
  }

  // Le lien a-t-il été périmé depuis son envoi ?
  if (verification.contenu.v !== dossier.jetonVersion) {
    return NextResponse.json(
      { erreur: TEXTES.fiche.lienInvalide.titre },
      { status: 401 },
    );
  }

  if (!ETATS_MODIFIABLES.includes(dossier.statut as "EN_ATTENTE")) {
    return NextResponse.json(
      { erreur: TEXTES.fiche.verrouillee.titre },
      { status: 409 },
    );
  }

  // La certification 10.4 a été donnée au dépôt : on ne la redemande pas,
  // mais le schéma l’attend — on la lui fournit.
  const resultat = schemaFiche.safeParse({
    ...(corps.fiche as Record<string, unknown>),
    certification104: true,
  });
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

  const fiche = resultat.data;
  await modifierFiche(verification.contenu.id, {
    prenomNom: fiche.prenomNom,
    genre: fiche.genre as Genre,
    famille: fiche.famille,
    portraitType: fiche.portraitType,
    acteurNom: fiche.acteurNom || null,
    portrait: fiche.portrait,
    biographie: fiche.biographie,
    qualites: fiche.qualites,
    defauts: fiche.defauts,
    plusGrandePeur: fiche.plusGrandePeur,
    limitesEcriture: fiche.limitesEcriture,
    limitesAutres: fiche.limitesAutres || null,
  });

  return NextResponse.json({ ok: true });
}
