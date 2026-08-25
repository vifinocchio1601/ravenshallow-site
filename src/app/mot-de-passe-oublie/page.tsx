import type { Metadata } from "next";
import Nav from "@/components/Nav";
import FormulaireOubli from "@/components/connexion/FormulaireOubli";
import { TEXTES_OUBLI } from "@/lib/connexion/constantes";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Ravenshallow",
  robots: { index: false, follow: false },
};

export default function MotDePasseOubliePage() {
  const t = TEXTES_OUBLI.page;

  return (
    <>
      <Nav connecte={null} />
      <main className="relative flex min-h-[100svh] items-center bg-void px-6 py-28 sm:py-32">
        <div className="mx-auto flex w-full max-w-content flex-col items-center">
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="rune text-aurora-teal/80">
              ᚲ
            </span>
            {t.eyebrow}
          </p>

          <h1 className="mt-5 text-center font-display text-[clamp(1.8rem,5.5vw,2.7rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
            {t.titre}
          </h1>

          <p className="mx-auto mt-5 max-w-[46ch] text-center font-body leading-[1.8] text-parchment-dim">
            {t.chapeau}
          </p>

          <div className="mt-12 flex w-full justify-center">
            <FormulaireOubli />
          </div>
        </div>
      </main>
    </>
  );
}
