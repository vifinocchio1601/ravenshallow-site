import type { Metadata } from "next";
import PageDuLieu from "@/components/forum/PageDuLieu";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.nonMages.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Une section hors RP — le même écran qu'une pièce du château. */
export default async function Page({
  params,
}: {
  params: { section: string };
}) {
  const compte = await exigerAcces(ROUTES.nonMages);
  return (
    <PageDuLieu
      compte={compte}
      cleEspace="non-mages"
      slug={params.section}
      mots={TEXTES_FORUM.motsHorsRp}
      racine={ROUTES.nonMages}
    />
  );
}
