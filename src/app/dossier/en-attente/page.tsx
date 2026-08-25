import type { Metadata } from "next";
import PageEtat from "@/components/dossier/PageEtat";
import { TEXTES_ETATS } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerEtat } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Ton dossier est en lecture — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DossierEnAttentePage() {
  await exigerEtat(ROUTES.attente);

  const t = TEXTES_ETATS.envoye;
  const p = TEXTES_ETATS.pages.attente;

  return (
    <PageEtat
      ton="attente"
      titre={t.titre}
      corps={t.corps}
      badge={t.badge}
      detail={
        <>
          <p>{p.detail}</p>
          <p className="text-silver">{p.rappel}</p>
        </>
      }
    />
  );
}
