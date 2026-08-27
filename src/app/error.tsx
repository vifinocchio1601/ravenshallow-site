"use client";

import Link from "next/link";
import { PAGE_ERREUR } from "@/lib/content";

/**
 * Servie quand une page échoue en cours de rendu — le plus souvent parce que
 * la base Neon dormait et n’a pas répondu à temps.
 *
 * Elle est **cliente** par obligation : Next lui passe une fonction `reset`
 * qui rejoue le rendu sans recharger la page, et c’est tout l’intérêt du
 * bouton — la seconde tentative tombe sur une base réveillée.
 *
 * `error.digest` n’est pas affiché : c’est une empreinte destinée aux
 * journaux de Vercel, illisible pour un joueur, et l’afficher donnerait
 * l’impression qu’il doit la recopier quelque part.
 */
export default function PageErreur({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(138,111,214,0.08)_0%,rgba(63,217,199,0.04)_45%,transparent_75%)]"
      />

      <div className="relative w-full max-w-xl text-center">
        <p aria-hidden="true" className="rune text-3xl text-aurora-violet">
          {PAGE_ERREUR.rune}
        </p>

        <p className="mt-6 font-display text-[0.68rem] uppercase tracking-[0.3em] text-silver">
          {PAGE_ERREUR.eyebrow}
        </p>

        <h1 className="mt-4 font-display text-3xl font-semibold text-parchment sm:text-4xl">
          {PAGE_ERREUR.titre}
        </h1>

        <p className="mt-6 font-body text-lg leading-relaxed text-parchment-dim">
          {PAGE_ERREUR.corps}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-aurora-teal/40 bg-aurora-teal/10 px-6 py-3 font-display text-[0.68rem] uppercase tracking-[0.22em] text-parchment transition-colors duration-300 hover:border-aurora-teal hover:bg-aurora-teal/20"
          >
            {PAGE_ERREUR.reessayer}
          </button>
          <Link
            href="/"
            className="rounded-sm border border-silver/20 px-6 py-3 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
          >
            {PAGE_ERREUR.accueil}
          </Link>
        </div>
      </div>
    </main>
  );
}
