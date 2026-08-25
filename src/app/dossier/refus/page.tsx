import type { Metadata } from "next";
import PageEtat from "@/components/dossier/PageEtat";
import { TEXTES_ETATS } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerEtat } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Ton dossier n’a pas été retenu — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DossierRefusPage() {
  const compte = await exigerEtat(ROUTES.refus);

  const t = TEXTES_ETATS.refuse;
  const p = TEXTES_ETATS.pages.refus;

  return (
    <PageEtat
      ton="correction"
      titre={t.titre}
      corps={compte.noteAdmin ? t.corps : p.sansNote}
      badge={t.badge}
      note={compte.noteAdmin}
      noteTitre={TEXTES_ETATS.correction.noteTitre}
      detail={<p>{p.detail}</p>}
    />
  );
}
