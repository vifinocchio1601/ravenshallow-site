import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { lireFil } from "@/lib/corbeaux/depot";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Le fil d’une conversation, et le passé qu’on charge en remontant.
 *
 * `?avant=<id>` désigne le corbeau le plus ancien déjà affiché : la réponse
 * rend ceux qui le précèdent.
 *
 *   401 — pas de session
 *   404 — le fil n’existe pas, **ou ne concerne pas ce compte**
 *
 * Les deux cas rendent la même chose, à dessein. Répondre 403 pour un fil qui
 * existe et 404 pour un qui n’existe pas permettrait, en essayant des
 * identifiants, de savoir lesquels sont réels — et donc qui écrit à qui.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  const avant = new URL(request.url).searchParams.get("avant") ?? undefined;
  const fil = await lireFil(compte, params.id, avant);

  if (!fil) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.introuvable },
      { status: 404 },
    );
  }

  return NextResponse.json(fil);
}
