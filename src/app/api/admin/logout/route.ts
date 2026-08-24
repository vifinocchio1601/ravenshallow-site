import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

/**
 * Supprime le cookie de session et renvoie vers l'accueil.
 *
 * En POST uniquement : une déconnexion modifie l'état, elle ne doit pas
 * pouvoir être déclenchée par une simple image ou un lien tiers.
 * Le statut 303 force le navigateur à repartir en GET sur `/`.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
