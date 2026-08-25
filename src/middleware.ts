import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSessionToken } from "@/lib/admin-auth";
import { PREFIXES_ECOLE, ROUTES } from "@/lib/ecole/menu";
import { COOKIE_SESSION, lireSession } from "@/lib/session/session";

/**
 * Premier tri, avant que la page ne soit rendue.
 *
 * Le middleware tourne en runtime Edge : il peut vérifier la **signature**
 * d'un cookie, jamais l'état d'un compte, faute de pouvoir joindre la base.
 * Il ne fait donc que renvoyer les visiteurs sans session ; c'est
 * `session/garde.ts`, côté serveur, qui décide ensuite qui a le droit
 * d'ouvrir quoi, en relisant l'état du dossier à chaque page.
 *
 * Le filtrage se fait ici plutôt que dans `config.matcher`, parce que la
 * liste des routes de l'école vit dans `ecole/menu.ts` et qu'un `matcher`
 * doit être analysable à la construction : la recopier serait le meilleur
 * moyen d'oublier un jour d'y ajouter une entrée.
 */

const PREFIXE_ADMIN = "/admin";
const CONNEXION_ADMIN = "/admin/login";

/** Les écrans d'état : connectés, mais hors de l'école. */
const ETATS_DOSSIER = [ROUTES.attente, ROUTES.correction, ROUTES.refus];

function commencePar(chemin: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (commencePar(pathname, [PREFIXE_ADMIN])) {
    return gardeAdmin(request, pathname);
  }

  if (commencePar(pathname, [...PREFIXES_ECOLE, ...ETATS_DOSSIER])) {
    const session = await lireSession(request.cookies.get(COOKIE_SESSION)?.value);
    if (session) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = ROUTES.connexion;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Zone d'administration : un mot de passe unique, sans compte. Un cookie
 * absent, expiré ou signé avec un ancien mot de passe renvoie au formulaire.
 */
async function gardeAdmin(request: NextRequest, pathname: string) {
  const authentifie = await isValidSessionToken(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (pathname === CONNEXION_ADMIN) {
    if (!authentifie) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = PREFIXE_ADMIN;
    return NextResponse.redirect(url);
  }

  if (authentifie) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = CONNEXION_ADMIN;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  /**
   * Tout, sauf les fichiers servis tels quels. Le tri fin se fait dans la
   * fonction ci-dessus, à partir d'une seule liste de routes.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|crests/|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|txt|xml)$).*)"],
};
