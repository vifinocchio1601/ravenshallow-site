import { NextResponse } from "next/server";
import { visageEstPris } from "@/lib/dossier/depot-base";
import { verifierJeton } from "@/lib/dossier/jeton";
import { noterErreur } from "@/lib/erreurs/depot";

/**
 * Registre des visages — art. 6.3.
 *
 * Interrogé au fil de la saisie : le nom arrive déjà normalisé par le client,
 * avec la même fonction que celle utilisée à l’écriture.
 *
 * Faillit fermé : si le registre ne peut pas répondre, il répond 503 plutôt
 * que « libre ». Un visage attribué deux fois se répare beaucoup moins bien
 * qu’une vérification remise à plus tard.
 */

/** Le registre du mode démonstration, tant qu’aucune base n’est branchée. */
const REGISTRE_DEMO = new Set([
  "anya taylor joy",
  "timothee chalamet",
  "florence pugh",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nom = url.searchParams.get("nom")?.trim();
  if (!nom) return NextResponse.json({ pris: false });

  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ erreur: "Registre indisponible" }, { status: 503 });
    }
    return NextResponse.json({ pris: REGISTRE_DEMO.has(nom), demo: true });
  }

  // Le joueur qui reprend sa fiche porte son jeton : son propre visage ne
  // doit pas lui être opposé.
  const jeton = url.searchParams.get("jeton");
  let saufCompteId: string | undefined;
  if (jeton) {
    const verification = await verifierJeton(jeton);
    if (verification.valide) saufCompteId = verification.contenu.id;
  }

  try {
    return NextResponse.json({ pris: await visageEstPris(nom, saufCompteId) });
  } catch (erreur) {
    console.error("[visages] registre injoignable", erreur);
    await noterErreur("visages", erreur, "/api/visages");
    return NextResponse.json({ erreur: "Registre indisponible" }, { status: 503 });
  }
}
