import { NextResponse } from "next/server";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import {
  changerLaCloture,
  changerLEpingle,
  retirerLaScene,
} from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEntrerDansLEcole } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Clore, rouvrir, épingler.
 *
 * Deux permissions distinctes — `CLORE_SCENE` et `EPINGLER_SUJET` — et le
 * dépôt les vérifie lui-même : une route qui se contenterait de faire suivre
 * laisserait la porte ouverte à celle qu’on écrira plus tard sans y penser.
 */

export const dynamic = "force-dynamic";

export async function PATCH(
  requete: Request,
  { params }: { params: { id: string } },
) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }
  if (!peutEntrerDansLEcole(compte)) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.refuse },
      { status: 403 },
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    clos?: unknown;
    epingle?: unknown;
    supprime?: unknown;
    motif?: unknown;
  } | null;
  if (!corps) {
    return NextResponse.json({ erreur: "Requête vide." }, { status: 422 });
  }

  const pouvoirs = await pouvoirsDe(compte.id);

  // **Le retrait passe avant, et il sort d'ici.** Il ne se combine avec rien —
  // clore une scène qu'on retire n'aurait pas de sens —, et c'est le seul
  // geste de cette route qui distingue 403 et 422.
  if (corps.supprime === true) {
    if (!compte.eleveId) {
      return NextResponse.json(
        { erreur: TEXTES_FORUM.erreurs.refuse },
        { status: 403 },
      );
    }

    const resultat = await retirerLaScene(
      { eleveId: compte.eleveId, utilisateurId: compte.id },
      pouvoirs,
      params.id,
      corps.motif,
      compte.prenomNom || "Administration",
    );

    if (!resultat.ok) {
      // 422 quand le motif manque : le staff a le droit, mais pas comme ça.
      const statut =
        resultat.message === TEXTES_FORUM.suppression.erreurs.motifRequis
          ? 422
          : 403;
      return NextResponse.json({ erreur: resultat.message }, { status: statut });
    }

    // `prevenus` dit combien de corbeaux sont partis. Un envoi raté ne défait
    // pas le retrait — mais l'écran doit pouvoir le dire.
    return NextResponse.json({ ok: true, prevenus: resultat.prevenus });
  }

  let fait = false;

  if (typeof corps.clos === "boolean") {
    // « Administration » tant que la zone d'administration n'a pas de comptes
    // distincts — mais ici, c'est un membre du staff identifié qui agit.
    fait = await changerLaCloture(
      pouvoirs,
      params.id,
      corps.clos,
      compte.prenomNom || "Administration",
      // L'auteur clôt la sienne sans permission : le dépôt vérifie que la
      // scène est bien à lui.
      compte.eleveId ?? undefined,
    );
  }
  if (typeof corps.epingle === "boolean") {
    fait = (await changerLEpingle(pouvoirs, params.id, corps.epingle)) || fait;
  }

  if (!fait) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.refuse },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true });
}
