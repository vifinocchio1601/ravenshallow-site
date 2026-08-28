import type { Metadata } from "next";
import PageDuLieu from "@/components/forum/PageDuLieu";
import { ROUTES } from "@/lib/ecole/menu";
import { MOTS_ALENTOURS, TEXTES_FORUM } from "@/lib/forum/constantes";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.alentours.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Un lieu des alentours.
 *
 * L’écran est celui du château et du hors RP — `PageDuLieu` —, et cette page
 * ne porte que ce qui distingue les trois : la route à garder, l’espace où
 * chercher le lieu, et le mot du retour.
 */
export default async function Page({ params }: { params: { lieu: string } }) {
  const compte = await exigerAcces(ROUTES.alentours);
  return (
    <PageDuLieu
      compte={compte}
      cleEspace="alentours"
      slug={params.lieu}
      mots={MOTS_ALENTOURS}
      racine={ROUTES.alentours}
    />
  );
}
