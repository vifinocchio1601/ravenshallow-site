import type { Metadata } from "next";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_ECOLE.aVenir.ecole.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Salle non construite : elle existe pour que le menu soit complet. */
export default async function Page() {
  await exigerAcces(ROUTES.ecole);
  const t = TEXTES_ECOLE.aVenir.ecole;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᚺ
        </span>
        {TEXTES_ECOLE.aVenir.badge}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {t.titre}
      </h1>

      <p className="mt-4 max-w-[54ch] font-body leading-[1.8] text-parchment-dim">
        {t.corps}
      </p>

      <div className="hairline mt-10 max-w-[28rem]" />
    </main>
  );
}
