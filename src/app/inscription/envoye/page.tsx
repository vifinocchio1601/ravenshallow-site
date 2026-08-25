import type { Metadata } from "next";
import Link from "next/link";
import EcranEtat from "@/components/dossier/EcranEtat";
import Nav from "@/components/Nav";
import { TEXTES_ETATS } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Dossier envoyé — Ravenshallow",
  robots: { index: false, follow: false },
};

export default function DossierEnvoyePage() {
  const t = TEXTES_ETATS.envoye;

  return (
    <>
      <Nav />
      <main className="relative flex min-h-[100svh] items-center bg-void px-6 py-20">
        <div className="mx-auto w-full max-w-[42rem]">
          <EcranEtat titre={t.titre} corps={t.corps} badge={t.badge} />

          <p className="mt-10 text-center">
            <Link
              href="/"
              className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              Retour à l’accueil
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
