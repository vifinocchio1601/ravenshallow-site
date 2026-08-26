import type { Metadata } from "next";
import PageAVenir from "@/components/ecole/PageAVenir";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_ECOLE.aVenir.nonMages;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Salle non construite : elle existe pour que le menu soit complet. */
export default async function Page() {
  await exigerAcces(ROUTES.nonMages);
  return <PageAVenir rune={T.rune} titre={T.titre} corps={T.corps} />;
}
