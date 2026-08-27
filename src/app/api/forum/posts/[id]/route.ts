import { NextResponse } from "next/server";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import {
  demasquerPost,
  masquerPost,
  retirerSonPost,
} from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEntrerDansLEcole } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Masquer un post le temps d’une correction, ou le rendre visible — art. 19.3.
 *
 * **Réservé au staff, et à personne d’autre.** Aucune permission attribuable
 * ne donne ce droit : ce n’est pas un pouvoir qu’on accorde à la carte. C’est
 * le dépôt qui le vérifie, pas cette route.
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
    masque?: unknown;
    motif?: unknown;
    retire?: unknown;
  } | null;
  if (!corps) {
    return NextResponse.json({ erreur: "Requête vide." }, { status: 422 });
  }

  // **Retirer son post n'est pas masquer le post d'un autre.** Ce chemin-ci ne
  // regarde aucun pouvoir : il demande seulement si le post est le sien.
  if (corps.retire === true) {
    if (!compte.eleveId) {
      return NextResponse.json(
        { erreur: TEXTES_FORUM.erreurs.refuse },
        { status: 403 },
      );
    }
    const resultat = await retirerSonPost({ eleveId: compte.eleveId }, params.id);
    return resultat.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ erreur: resultat.message }, { status: 403 });
  }

  if (typeof corps.masque !== "boolean") {
    return NextResponse.json({ erreur: "Requête vide." }, { status: 422 });
  }

  const pouvoirs = await pouvoirsDe(compte.id);

  if (!corps.masque) {
    const fait = await demasquerPost(pouvoirs, params.id);
    return fait
      ? NextResponse.json({ ok: true })
      : NextResponse.json(
          { erreur: TEXTES_FORUM.erreurs.refuse },
          { status: 403 },
        );
  }

  const resultat = await masquerPost(
    pouvoirs,
    params.id,
    corps.motif,
    compte.prenomNom || "Administration",
  );
  if (!resultat.ok) {
    // Motif manquant = 422 : le staff a le droit, mais pas comme ça.
    const statut =
      resultat.message === TEXTES_FORUM.erreurs.refuse ? 403 : 422;
    return NextResponse.json({ erreur: resultat.message }, { status: statut });
  }
  // `prevenu` dit si le corbeau est parti. Un envoi raté ne défait pas le
  // masquage — mais l'écran doit pouvoir le dire.
  return NextResponse.json({ ok: true, prevenu: resultat.prevenu });
}
