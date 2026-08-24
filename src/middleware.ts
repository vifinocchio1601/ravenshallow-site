import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin-auth";

const LOGIN_PATH = "/admin/login";

/**
 * Protège tout ce qui vit sous /admin, sauf la page de connexion elle-même.
 * Un cookie absent, expiré ou signé avec un ancien mot de passe renvoie vers
 * le formulaire.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = await isValidSessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (pathname === LOGIN_PATH) {
    // Déjà connecté : inutile de repasser par le formulaire.
    if (authenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (authenticated) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
