import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import EcranEtat from "@/components/dossier/EcranEtat";
import FormulaireNouveauMotDePasse from "@/components/connexion/FormulaireNouveauMotDePasse";
import { TEXTES_REINITIALISATION } from "@/lib/connexion/constantes";
import { lireJetonReinitialisation } from "@/lib/connexion/reinitialisation";
import { ROUTES } from "@/lib/ecole/menu";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — Ravenshallow",
  robots: { index: false, follow: false },
};

/** Le jeton se vérifie en base : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export default async function ReinitialisationPage({
  params,
}: {
  params: { jeton: string };
}) {
  const t = TEXTES_REINITIALISATION;

  // Vérifié sans être consommé : le lien ne meurt qu'à l'enregistrement.
  const lu = await lireJetonReinitialisation(decodeURIComponent(params.jeton));

  return (
    <>
      <Nav connecte={null} />
      <main className="relative flex min-h-[100svh] items-center bg-void px-6 py-28 sm:py-32">
        <div className="mx-auto flex w-full max-w-content flex-col items-center">
          {lu.valide ? (
            <>
              <p className="eyebrow flex items-center gap-3">
                <span aria-hidden="true" className="rune text-aurora-teal/80">
                  ᛒ
                </span>
                {t.page.eyebrow}
              </p>

              <h1 className="mt-5 text-center font-display text-[clamp(1.7rem,5vw,2.5rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
                {t.page.titre}
              </h1>

              <p className="mx-auto mt-5 max-w-[48ch] text-center font-body leading-[1.8] text-parchment-dim">
                {t.page.chapeau}
              </p>

              <div className="mt-12 flex w-full justify-center">
                <FormulaireNouveauMotDePasse jeton={params.jeton} />
              </div>
            </>
          ) : (
            <div className="w-full max-w-[42rem]">
              <EcranEtat
                ton="correction"
                titre={t.perime.titre}
                corps={t.perime.corps}
                badge={t.perime.badge}
              >
                <div className="mt-9">
                  <Link href={ROUTES.motDePasseOublie} className="btn btn-solid">
                    {t.perime.action}
                  </Link>
                </div>
              </EcranEtat>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
