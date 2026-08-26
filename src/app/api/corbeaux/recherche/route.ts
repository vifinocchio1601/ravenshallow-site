import { NextResponse } from "next/server";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { chercherPersonnages } from "@/lib/corbeaux/depot";
import { peutOuvrirLaTour } from "@/lib/corbeaux/droits";
import { nettoyerRecherche } from "@/lib/corbeaux/schema";
import { compteConnecte } from "@/lib/session/garde";

/**
 * La recherche d’un personnage, interrogée au fil de la saisie.
 *
 * Elle ne rend **que** ce qui sert à écrire à quelqu’un : un nom, une maison,
 * un identifiant de compte. Ni adresse, ni année, ni fiche — cette route n’est
 * pas un annuaire, et le Registre magique, quand il viendra, sera un lot à
 * part avec ses propres règles d’affichage.
 *
 * Une requête trop courte rend une liste vide plutôt qu’une erreur : c’est
 * l’état normal des deux premières frappes.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const requete = nettoyerRecherche(
    new URL(request.url).searchParams.get("q"),
  );
  if (!requete) return NextResponse.json({ personnages: [] });

  return NextResponse.json({
    personnages: await chercherPersonnages(compte, requete),
  });
}
