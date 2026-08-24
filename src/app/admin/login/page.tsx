import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Accès restreint — Ravenshallow",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center bg-void px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(63,217,199,0.08)_0%,transparent_70%)]"
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-sm border border-silver/12 bg-fjord/70 p-7 sm:p-9">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
            <span aria-hidden="true" className="rune text-aurora-teal">
              ᚨᛞᛗᛁᚾ
            </span>
            <span>· Accès restreint</span>
          </p>

          <h1 className="mt-4 font-display text-[clamp(1.6rem,6vw,2rem)] font-semibold leading-[1.2] tracking-[0.03em] text-parchment">
            Administration
          </h1>

          <p className="mt-4 leading-[1.7] text-parchment-dim">
            Cette zone est réservée. Entre le mot de passe pour continuer.
          </p>

          <AdminLoginForm />
        </div>

        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-1"
          >
            ←
          </span>
          Retour au site
        </Link>
      </div>
    </main>
  );
}
