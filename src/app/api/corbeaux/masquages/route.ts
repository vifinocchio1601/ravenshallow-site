import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { retirerDeMaVue, retirerLeFilDeMaVue } from "@/lib/corbeaux/depot";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Retirer un corbeau — ou un fil entier — de **sa propre vue**.
 *
 * Le nom de la route dit ce qu’elle fait : elle masque, elle ne supprime pas.
 * Aucun `DELETE` ici, et c’est délibéré : rien n’est effacé, la copie de
 * l’autre reste intacte. Un verbe HTTP qui promettrait une suppression
 * mentirait sur ce qui se passe.
 *
 *   401 — pas de session
 *   403 — le corbeau ou le fil ne concerne pas ce compte
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  let corps: { messageId?: unknown; conversationId?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const messageId =
    typeof corps.messageId === "string" && corps.messageId
      ? corps.messageId
      : null;
  const conversationId =
    typeof corps.conversationId === "string" && corps.conversationId
      ? corps.conversationId
      : null;

  const fait = messageId
    ? await retirerDeMaVue(compte, messageId)
    : conversationId
      ? await retirerLeFilDeMaVue(compte, conversationId)
      : false;

  if (!fait) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.introuvable },
      { status: 403 },
    );
  }

  return NextResponse.json({ retire: true });
}
