import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { signaler } from "@/lib/corbeaux/depot";
import { validerMotif } from "@/lib/corbeaux/schema";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Signaler un corbeau.
 *
 * La route ne rend **rien** du signalement créé : ni identifiant, ni date, ni
 * état. Un accusé de réception suffit, et tout ce qui reviendrait au joueur
 * serait autant de matière pour deviner ce que la modération voit.
 *
 *   401 — pas de session
 *   403 — la Tour est fermée, le corbeau est introuvable, ou c’est le fil du
 *         staff
 *   422 — le motif est trop long
 *
 * « Introuvable » couvre trois cas — le corbeau n’existe pas, il est dans un
 * fil qui ne concerne pas ce compte, ou il est masqué pour lui. Les trois
 * répondent pareil : distinguer permettrait, en essayant des identifiants, de
 * savoir lesquels sont réels.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  let corps: { messageId?: unknown; motif?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const messageId =
    typeof corps.messageId === "string" && corps.messageId
      ? corps.messageId
      : null;
  if (!messageId) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.introuvable },
      { status: 403 },
    );
  }

  const motif = validerMotif(corps.motif);
  if (!motif.ok) {
    return NextResponse.json({ erreur: motif.message }, { status: 422 });
  }

  const resultat = await signaler(compte, messageId, motif.valeur);

  if (!resultat.signale) {
    return NextResponse.json(
      {
        erreur:
          resultat.raison === "ADMINISTRATION"
            ? TEXTES_CORBEAUX.signaler.pasIci
            : resultat.raison === "TOUR_FERMEE"
              ? TEXTES_CORBEAUX.erreurs.tourFermee
              : TEXTES_CORBEAUX.erreurs.introuvable,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ signale: true });
}
