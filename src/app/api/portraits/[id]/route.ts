import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { peutEntrerDansLEcole } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * **Le portrait d'un élève, servi comme une vraie image.**
 *
 * ── Pourquoi cette route existe ──
 *
 * Les portraits sont stockés **dans la base**, en texte encodé — celui de la
 * directrice pèse 207 Ko. Tant qu'un portrait ne s'affichait qu'une fois, sur
 * sa propre fiche, cela ne se voyait pas. Dans une scène, chaque post porte
 * l'avatar de son auteur : le texte encodé serait recopié dans la page, à
 * chaque post et **à chaque chargement**, sans que le navigateur puisse rien
 * garder. Une scène à trois joueurs, c'est un demi-méga de page à chaque fois.
 *
 * Ici, le portrait redevient une adresse. Le navigateur en télécharge un par
 * personne, une fois, et le garde. La page ne porte plus qu'un lien.
 *
 * Rien du stockage ne change : c'est une couche devant. Le jour où les
 * portraits partiront sur un stockage externe, **c'est ce fichier seul qui
 * changera**.
 *
 * ── Le cache, et pourquoi il est sûr ──
 *
 * L'adresse porte une empreinte de la dernière modification de la fiche
 * (`?v=…`). Une fiche modifiée change d'adresse, donc le cache d'hier ne peut
 * pas resservir un portrait d'avant. C'est ce qui permet de le déclarer
 * `immutable` sans jamais montrer une image périmée.
 *
 * ── L'accès ──
 *
 * Réservé à qui entre dans l'école. Un portrait est un visage d'emprunt
 * (art. 6.2), jamais celui du joueur — mais il reste rattaché à un membre, et
 * n'a rien à faire en accès libre.
 */

export const dynamic = "force-dynamic";

/** Ce qu'un `data:` porte, et ce qu'on accepte d'en servir. */
const IMAGES_PERMISES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function GET(
  _requete: Request,
  { params }: { params: { id: string } },
) {
  const compte = await compteConnecte();
  if (!compte || !peutEntrerDansLEcole(compte)) {
    return new NextResponse(null, { status: 403 });
  }

  const eleve = await prisma.eleve.findUnique({
    where: { id: params.id },
    select: { portraitUrl: true },
  });

  const brut = eleve?.portraitUrl ?? "";
  // Un portrait absent n'est pas une erreur : la fiche peut être en cours.
  // L'écran affiche alors le blason seul.
  if (!brut) return new NextResponse(null, { status: 404 });

  // `data:image/jpeg;base64,……`
  // `[\s\S]` plutôt que le drapeau `s` : la cible du projet est ES2017,
  // qui ne le connaît pas encore.
  const decoupe = /^data:([^;,]+);base64,([\s\S]+)$/.exec(brut);
  if (!decoupe || !IMAGES_PERMISES.has(decoupe[1])) {
    return new NextResponse(null, { status: 404 });
  }

  const octets = Buffer.from(decoupe[2], "base64");

  return new NextResponse(octets, {
    headers: {
      "Content-Type": decoupe[1],
      "Content-Length": String(octets.byteLength),
      // Un an, et immuable : l'adresse change quand la fiche change.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
