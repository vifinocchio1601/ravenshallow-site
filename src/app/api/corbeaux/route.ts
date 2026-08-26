import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import {
  compterNonLus,
  envoyerCorbeau,
  listerConversations,
  type Destinataire,
} from "@/lib/corbeaux/depot";
import { peutOuvrirLaTour, type RaisonRefus } from "@/lib/corbeaux/droits";
import { MESSAGE_REFUS } from "@/lib/corbeaux/refus";
import { validerCorbeau } from "@/lib/corbeaux/schema";
import { compteConnecte } from "@/lib/session/garde";

/**
 * La liste des conversations, et l’envoi d’un corbeau.
 *
 * **Les gardes sont refaites ici en entier**, sans se reposer sur la page :
 * une route d’API est publique, et rien n’oblige un joueur à passer par
 * `/corbeaux` avant de l’appeler. C’est la même discipline que pour la
 * boutique et le Miroir.
 *
 *   401 — pas de session
 *   403 — la Tour ne s’ouvre pas à ce compte, ou l’envoi est refusé
 *   422 — le corbeau est vide, ou trop long
 *
 * ⚠️ **Un corbeau bloqué reçoit 200, comme les autres.** La réponse est
 * identique au caractère près : même code, mêmes champs, même ordre. Un
 * joueur qui inspecterait le trafic de son navigateur ne doit rien pouvoir
 * en déduire — c’est la mesure de protection elle-même, pas un détail
 * d’implémentation.
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

  const [conversations, nonLus] = await Promise.all([
    listerConversations(compte),
    compterNonLus(compte),
  ]);

  return NextResponse.json({ conversations, nonLus });
}

export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  let corps: { destinataireId?: unknown; administration?: unknown; corps?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  // Le texte est validé AVANT les droits : c'est la seule vérification dont la
  // réponse ne dépend pas du destinataire, et donc la seule qui ne risque pas
  // de laisser filtrer quoi que ce soit sur lui.
  const lu = validerCorbeau(corps.corps);
  if (!lu.ok) {
    return NextResponse.json({ erreur: lu.message }, { status: 422 });
  }

  const destinataire: Destinataire | null =
    corps.administration === true
      ? { administration: true }
      : typeof corps.destinataireId === "string" && corps.destinataireId
        ? { membreId: corps.destinataireId }
        : null;

  if (!destinataire) {
    return NextResponse.json(
      { erreur: TEXTES_CORBEAUX.erreurs.destinataireInconnu },
      { status: 403 },
    );
  }

  const resultat = await envoyerCorbeau(compte, destinataire, lu.corps);

  if (!resultat.envoye) {
    // ── Une attente n'est pas un refus ──
    //
    // 429 et non 403, et une phrase qui donne le délai : le corbeau partira,
    // seulement pas maintenant. Répondre « accès refusé » à quelqu'un qui a
    // simplement écrit à quatre personnes en une heure serait faux, et il
    // écrirait à l'administration pour comprendre.
    if (resultat.verdict.sort === "ATTENDRE") {
      const { minutes } = resultat.verdict;
      return NextResponse.json(
        {
          erreur:
            minutes <= 1
              ? TEXTES_CORBEAUX.erreurs.plafondUneMinute
              : TEXTES_CORBEAUX.erreurs.plafond.replace(
                  "{minutes}",
                  String(minutes),
                ),
          minutes,
        },
        { status: 429 },
      );
    }

    const raison = (resultat.verdict as { raison: RaisonRefus }).raison;
    return NextResponse.json(
      { erreur: MESSAGE_REFUS[raison], raison },
      { status: 403 },
    );
  }

  // Le corbeau est parti — ou parti dans le vide. Cette réponse-ci ne fait
  // pas la différence, et c'est tout l'objet du dispositif.
  return NextResponse.json({
    conversationId: resultat.conversationId,
    corbeauId: resultat.corbeauId,
  });
}
