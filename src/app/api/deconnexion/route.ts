import { NextResponse } from "next/server";
import { COOKIE_SESSION, optionsCookie } from "@/lib/session/session";

/**
 * Déconnexion : le cookie est effacé côté navigateur.
 *
 * Le jeton reste techniquement valide jusqu’à son expiration — c’est le prix
 * d’une session sans état. Ce qui le tue vraiment, c’est le changement de mot
 * de passe, qui incrémente `sessionVersion` et invalide d’un coup tout ce qui
 * a été émis avant.
 */
export async function POST() {
  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.set({ name: COOKIE_SESSION, value: "", ...optionsCookie(0) });
  return reponse;
}
