import { NextResponse } from "next/server";
import { compterNonLus } from "@/lib/corbeaux/depot";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Le seul compte des corbeaux non lus — rien d'autre.
 *
 * Une route à part, alors que `GET /api/corbeaux` rend déjà ce nombre : celle-là
 * rend aussi la liste entière des conversations, avec les noms et les extraits.
 * Or le bandeau est sur **toutes** les pages de l'école et se rafraîchit tout
 * seul : lui faire tirer les extraits de trente fils pour afficher un chiffre
 * serait un gâchis, et surtout des fragments de conversations qui traverseraient
 * le réseau sans que personne les regarde.
 *
 * Une session absente ou une Tour fermée rendent zéro plutôt qu'une erreur : le
 * bandeau n'a rien à afficher dans ces cas-là, et un compteur qui échoue ne
 * doit pas faire clignoter une erreur en haut de chaque page.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const compte = await compteConnecte();
  if (!compte) return NextResponse.json({ nonLus: 0 });

  return NextResponse.json({ nonLus: await compterNonLus(compte) });
}
