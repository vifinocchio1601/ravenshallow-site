import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  passwordMatches,
} from "@/lib/admin-auth";

/**
 * Vérifie le mot de passe soumis et pose le cookie de session.
 * `ADMIN_PASSWORD` n'est lu qu'ici, côté serveur.
 */
export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "L'accès n'est pas configuré sur ce serveur." },
      { status: 500 },
    );
  }

  let submitted = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "password" in body) {
      const value = (body as { password: unknown }).password;
      if (typeof value === "string") submitted = value;
    }
  } catch {
    // Corps illisible : traité comme un mot de passe vide.
  }

  if (!passwordMatches(submitted)) {
    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "L'accès n'est pas configuré sur ce serveur." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
