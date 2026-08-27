import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_INTROUVABLE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Adresse introuvable — Ravenshallow",
  robots: { index: false, follow: false },
};

/**
 * Servie pour toute adresse qui ne correspond à rien, du site vitrine comme
 * de l’école — et pour chaque `notFound()` appelé dans une page.
 */
export default function PageIntrouvable() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.07)_0%,rgba(138,111,214,0.05)_45%,transparent_75%)]"
      />

      <div className="relative w-full max-w-xl text-center">
        <p aria-hidden="true" className="rune text-3xl text-aurora-teal">
          {PAGE_INTROUVABLE.rune}
        </p>

        <p className="mt-6 font-display text-[0.68rem] uppercase tracking-[0.3em] text-silver">
          {PAGE_INTROUVABLE.eyebrow}
        </p>

        <h1 className="mt-4 font-display text-3xl font-semibold text-parchment sm:text-4xl">
          {PAGE_INTROUVABLE.titre}
        </h1>

        <p className="mt-6 font-body text-lg leading-relaxed text-parchment-dim">
          {PAGE_INTROUVABLE.corps}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-sm border border-aurora-teal/40 bg-aurora-teal/10 px-6 py-3 font-display text-[0.68rem] uppercase tracking-[0.22em] text-parchment transition-colors duration-300 hover:border-aurora-teal hover:bg-aurora-teal/20"
          >
            {PAGE_INTROUVABLE.accueil}
          </Link>
          <Link
            href="/connexion"
            className="rounded-sm border border-silver/20 px-6 py-3 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
          >
            {PAGE_INTROUVABLE.chateau}
          </Link>
        </div>
      </div>
    </main>
  );
}
