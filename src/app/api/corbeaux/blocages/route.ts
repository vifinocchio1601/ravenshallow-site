import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { bloquer, debloquer, listerBlocages } from "@/lib/corbeaux/depot";
import { peutOuvrirLaTour } from "@/lib/corbeaux/droits";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Bloquer, débloquer, et la liste de ceux qu’on a bloqués.
 *
 * **La liste ne va que dans un sens.** Elle rend les personnes que CE compte a
 * bloquées, jamais celles qui l’ont bloqué : la seconde question n’a de
 * réponse nulle part sur ce site, et c’est ce qui fait tenir le reste.
 *
 *   401 — pas de session
 *   403 — la Tour ne s’ouvre pas à ce compte, ou la cible ne peut être bloquée
 *
 * Un blocage déjà posé rend 200, comme un blocage neuf : un double clic ou un
 * rechargement ne doit pas produire une erreur pour un état qui est déjà celui
 * qu’on voulait.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  if (!peutOuvrirLaTour(compte)) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.tourFermee },
      { status: 403 },
    );
  }

  return NextResponse.json({ bloquees: await listerBlocages(compte) });
}

export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  let corps: { membreId?: unknown; action?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const membreId =
    typeof corps.membreId === "string" && corps.membreId ? corps.membreId : null;
  const action = corps.action === "DEBLOQUER" ? "DEBLOQUER" : "BLOQUER";

  if (!membreId) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.blocageImpossible },
      { status: 403 },
    );
  }

  const resultat =
    action === "BLOQUER"
      ? await bloquer(compte, membreId)
      : await debloquer(compte, membreId);

  if (resultat === "REFUSE") {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.blocageImpossible },
      { status: 403 },
    );
  }

  // « Fait » et « c'était déjà fait » se répondent pareil : dans les deux cas,
  // l'état voulu est celui qu'on a.
  return NextResponse.json({ bloque: action === "BLOQUER" });
}
