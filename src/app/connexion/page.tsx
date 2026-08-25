import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import FormulaireConnexion from "@/components/connexion/FormulaireConnexion";
import { TEXTES_CONNEXION } from "@/lib/connexion/constantes";
import { destinationApres } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Accès au château — Ravenshallow",
  robots: { index: false, follow: false },
};

/** La session se lit à chaque requête : rien à mettre en cache ici. */
export const dynamic = "force-dynamic";

export default async function ConnexionPage() {
  // Déjà connecté : inutile de repasser par le formulaire.
  const compte = await compteConnecte();
  if (compte) redirect(destinationApres(compte));

  const t = TEXTES_CONNEXION.page;

  return (
    <>
      <Nav connecte={null} />
      <main className="relative flex min-h-[100svh] items-center bg-void px-6 py-28 sm:py-32">
        <div className="mx-auto flex w-full max-w-content flex-col items-center">
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="rune text-aurora-teal/80">
              ᚨ
            </span>
            {t.eyebrow}
          </p>

          <h1 className="mt-5 text-center font-display text-[clamp(1.9rem,6vw,3rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
            Accès{" "}
            <span className="text-aurora-teal">{t.titreAccent}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[46ch] text-center font-body leading-[1.8] text-parchment-dim">
            {t.chapeau}
          </p>

          <div className="mt-12 flex w-full justify-center">
            <FormulaireConnexion />
          </div>
        </div>
      </main>
    </>
  );
}
