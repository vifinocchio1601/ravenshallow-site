import type { Metadata } from "next";
import PageDuSujet from "@/components/forum/PageDuSujet";
import { ROUTES } from "@/lib/ecole/menu";
import { MOTS_ALENTOURS, TEXTES_FORUM } from "@/lib/forum/constantes";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.alentours.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Une scène des alentours — le même écran qu’au château. */
export default async function Page({
  params,
}: {
  params: { lieu: string; sujet: string };
}) {
  const compte = await exigerAcces(ROUTES.alentours);
  return (
    <PageDuSujet
      compte={compte}
      slug={params.lieu}
      sujetId={params.sujet}
      mots={MOTS_ALENTOURS}
      racine={ROUTES.alentours}
    />
  );
}
