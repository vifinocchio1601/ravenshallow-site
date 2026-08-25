import { NextResponse } from "next/server";

/**
 * Registre des visages — art. 6.3 : un visage, un seul personnage à la fois.
 *
 * Interrogée en direct pendant la saisie du nom d’acteur. Le nom arrive déjà
 * normalisé par `normaliserVisage`, la même fonction que celle qui alimente
 * `visages_pris.nomNormalise`.
 *
 * Tant que la base n’est pas branchée : en développement, un registre de
 * démonstration ; en production, un 503 — jamais un « disponible » par défaut,
 * qui laisserait passer des doublons.
 */

const REGISTRE_DEMO = new Set([
  "anya taylor joy",
  "timothee chalamet",
  "florence pugh",
]);

export async function GET(request: Request) {
  const nom = new URL(request.url).searchParams.get("nom")?.trim();
  if (!nom) {
    return NextResponse.json({ pris: false });
  }

  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { erreur: "Registre indisponible" },
        { status: 503 },
      );
    }
    return NextResponse.json({ pris: REGISTRE_DEMO.has(nom), demo: true });
  }

  // TODO (lot base de données) :
  // const visage = await prisma.visagePris.findUnique({
  //   where: { nomNormalise: nom },
  // });
  // return NextResponse.json({ pris: Boolean(visage) });
  return NextResponse.json(
    { erreur: "Registre indisponible" },
    { status: 503 },
  );
}
