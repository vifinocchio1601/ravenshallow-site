import type { Metadata } from "next";
import PageDuSujet from "@/components/forum/PageDuSujet";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.nonMages.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Un fil hors RP — le même écran qu'une scène du château. */
export default async function Page({
  params,
}: {
  params: { section: string; sujet: string };
}) {
  const compte = await exigerAcces(ROUTES.nonMages);
  return (
    <PageDuSujet
      compte={compte}
      slug={params.section}
      sujetId={params.sujet}
      mots={TEXTES_FORUM.motsHorsRp}
      racine={ROUTES.nonMages}
    />
  );
}
