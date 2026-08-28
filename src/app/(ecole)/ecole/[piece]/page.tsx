import type { Metadata } from "next";
import PageDuLieu from "@/components/forum/PageDuLieu";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.ecole.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Une pièce du château.
 *
 * L'écran est partagé avec les sections hors RP — `PageDuLieu` —, et cette
 * page ne porte que ce qui distingue les deux : la route à garder, et
 * l'espace où chercher le lieu.
 */
export default async function Page({ params }: { params: { piece: string } }) {
  const compte = await exigerAcces(ROUTES.ecole);
  return (
    <PageDuLieu
      compte={compte}
      cleEspace="domaine"
      slug={params.piece}
      mots={TEXTES_FORUM.motsRp}
      racine={ROUTES.ecole}
    />
  );
}
