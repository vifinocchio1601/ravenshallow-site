import { NextResponse } from "next/server";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { ouvrirSujet } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEntrerDansLEcole } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Ouvrir une scène.
 *
 * **Les gardes sont refaites ici en entier**, sans se reposer sur la page :
 * une route d’API est publique, et rien n’oblige un joueur à passer par
 * l’écran avant de l’appeler. Le contrôle du lieu, de l’année, de la maison et
 * de la longueur vit dans `forum/depot.ts`, qui interroge la couture — une
 * seule porte, qu’aucune route ne contourne.
 *
 *   401 — pas de session
 *   403 — le lieu se refuse à ce compte (année, maison, convocation, fermé)
 *   404 — le lieu n’existe pas, ou n’est pas lisible par ce compte
 *   422 — le titre ou le post ne passent pas
 */

export const dynamic = "force-dynamic";

export async function POST(requete: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }
  // Le forum n'existe pas pour un dossier non accepté, ni pour un suspendu :
  // un membre banni garde son bureau et sa fiche, rien d'autre.
  if (!peutEntrerDansLEcole(compte) || !compte.eleveId) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.refuse },
      { status: 403 },
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    espace?: unknown;
    lieu?: unknown;
    titre?: unknown;
    corps?: unknown;
    avertissement?: unknown;
  } | null;
  if (!corps) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.corpsVide },
      { status: 422 },
    );
  }

  const espace = typeof corps.espace === "string" ? corps.espace : "";
  const lieu = typeof corps.lieu === "string" ? corps.lieu : "";
  if (!espace || !lieu) {
    return NextResponse.json(
      { erreur: TEXTES_FORUM.erreurs.lieuIntrouvable },
      { status: 404 },
    );
  }

  const pouvoirs = await pouvoirsDe(compte.id);
  const resultat = await ouvrirSujet(
    { ...compte, eleveId: compte.eleveId },
    pouvoirs,
    espace,
    lieu,
    { titre: corps.titre, corps: corps.corps, avertissement: corps.avertissement },
  );

  if (!resultat.ok) {
    // Un refus de la couture est un 403 — le compte n'a pas le droit ; une
    // saisie fautive est un 422 — il a le droit, mais pas comme ça. Les
    // confondre ferait lire « vous n'avez pas le droit » à quelqu'un qui a
    // seulement écrit trois lignes.
    const statut = resultat.verdict
      ? 403
      : resultat.message === TEXTES_FORUM.erreurs.lieuIntrouvable
        ? 404
        : 422;
    return NextResponse.json(
      { erreur: resultat.message, verdict: resultat.verdict },
      { status: statut },
    );
  }

  return NextResponse.json(
    { sujetId: resultat.sujetId, postId: resultat.postId },
    { status: 201 },
  );
}
