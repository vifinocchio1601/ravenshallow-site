import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { lireFil, marquerLu } from "@/lib/corbeaux/depot";
import { compteConnecte } from "@/lib/session/garde";

/**
 * « J’ai lu jusqu’ici. »
 *
 * En POST, et non en GET : marquer comme lu change l’état du compte, et une
 * requête qui change quelque chose ne doit jamais pouvoir être déclenchée par
 * un simple lien — un préchargeur de navigateur viderait le compteur de
 * quelqu’un qui n’a rien ouvert.
 *
 * On relit le fil avant d’écrire plutôt que d’appeler `marquerLu` à l’aveugle :
 * c’est ce qui vérifie que ce compte y figure vraiment, et que la portée de sa
 * Tour l’y autorise.
 */

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  const fil = await lireFil(compte, params.id);
  if (!fil) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.introuvable },
      { status: 404 },
    );
  }

  await marquerLu(compte, params.id);
  return NextResponse.json({ lu: true });
}
