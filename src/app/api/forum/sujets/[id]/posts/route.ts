import { NextResponse } from "next/server";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { repondre } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEntrerDansLEcole } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Répondre dans une scène.
 *
 * Même discipline que l’ouverture : tout est refait ici, et c’est le dépôt qui
 * interroge la couture. L’année comparée est celle **figée à l’ouverture du
 * sujet** — une scène en cours ne se ferme pas si les règles du lieu changent.
 */

export const dynamic = "force-dynamic";

export async function POST(
  requete: Request,
  { params }: { params: { id: string } },
) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }
  if (!peutEntrerDansLEcole(compte) || !compte.eleveId) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.refuse },
      { status: 403 },
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    corps?: unknown;
    avertissement?: unknown;
  } | null;
  if (!corps) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.corpsVide },
      { status: 422 },
    );
  }

  const pouvoirs = await pouvoirsDe(compte.id);
  const resultat = await repondre(
    { ...compte, eleveId: compte.eleveId },
    pouvoirs,
    params.id,
    { corps: corps.corps, avertissement: corps.avertissement },
  );

  if (!resultat.ok) {
    const statut = resultat.verdict
      ? 403
      : resultat.message === TEXTES_FORUM.erreurs.sujetIntrouvable
        ? 404
        : 422;
    return NextResponse.json(
      { erreur: resultat.message, verdict: resultat.verdict },
      { status: statut },
    );
  }

  return NextResponse.json({ postId: resultat.postId }, { status: 201 });
}
