import type { Metadata } from "next";
import Link from "next/link";
import AdminLink from "@/components/AdminLink";
import DossierForm from "@/components/dossier/DossierForm";
import Nav from "@/components/Nav";
import { TEXTES } from "@/lib/dossier/constantes";

export const metadata: Metadata = {
  title: "Dossier d’admission — Ravenshallow",
  description:
    "Le dossier d’admission de Ravenshallow, lu par l’administration avant toute entrée au château.",
};

export default function InscriptionPage() {
  return (
    <>
      <Nav />

      <main className="relative bg-void">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.08)_0%,rgba(138,111,214,0.05)_45%,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-[48rem] px-6 pb-24 pt-16 sm:px-8 sm:pb-28 md:pt-28">
          <Link
            href="/reglement"
            className="group inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-1"
            >
              ←
            </span>
            {TEXTES.page.retour}
          </Link>

          <header className="mt-10 border-y border-silver/15 py-9 text-center">
            <h1 className="font-display text-[clamp(2.1rem,7vw,3.2rem)] font-bold leading-[1.08] tracking-[0.03em] text-parchment">
              Dossier{" "}
              <em className="not-italic text-aurora-teal">
                {TEXTES.page.titreAccent}
              </em>
            </h1>
            <p className="mx-auto mt-4 max-w-xl leading-[1.75] text-parchment-dim text-balance">
              {TEXTES.page.chapeau}
            </p>
          </header>

          <div className="mt-10">
            <DossierForm />
          </div>
        </div>
      </main>

      <AdminLink />
    </>
  );
}
