import type { Metadata } from "next";
import Link from "next/link";
import ConsentGate from "@/components/ConsentGate";
import Nav from "@/components/Nav";
import ReglementArticle from "@/components/ReglementArticle";
import {
  CHARTE,
  REGLEMENT_FOOTER,
  REGLEMENT_INTRO,
  REGLEMENT_PARTS,
  REGLEMENT_QUOTE,
} from "@/lib/reglement";

export const metadata: Metadata = {
  title: "Règlement — Ravenshallow",
  description:
    "Le règlement de Ravenshallow : la vie du site entre joueurs, et les règles du jeu de rôle. L'inscription vaut acceptation des deux parties.",
};

export default function InscriptionPage() {
  return (
    <>
      <Nav />

      <main className="relative bg-void">
        {/* Voile d'aurore très discret en haut de page */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.08)_0%,rgba(138,111,214,0.05)_45%,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-[45rem] px-6 pb-24 pt-16 sm:px-8 sm:pb-28 md:pt-28">
          {/* — En-tête — */}
          <header>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-x-1"
              >
                ←
              </span>
              Retour à l&apos;accueil
            </Link>

            {/* Reprend l'en-tête du document : le nom, puis la mention de lieu. */}
            <p className="eyebrow mt-10 flex items-center gap-3">
              <span aria-hidden="true" className="rune text-aurora-teal">
                ᚱᚨᚡᛖᚾ
              </span>
              <span>Ravenshallow</span>
            </p>
            <p className="mt-2 font-body text-base italic text-parchment-dim">
              Côte Nordique — Terres oubliées du Nord
            </p>

            <h1 className="mt-4 font-display text-[clamp(2.5rem,10vw,4.25rem)] font-bold leading-[1.05] tracking-[0.05em] text-parchment">
              Règlement
            </h1>
          </header>

          {/* — Citation d'ouverture — */}
          <blockquote className="mt-10 rounded-sm border border-aurora-teal/20 bg-fjord/70 px-6 py-7 text-center sm:px-10">
            <p className="font-body text-[clamp(1.1rem,3.2vw,1.35rem)] italic leading-relaxed text-parchment/90">
              «&nbsp;{REGLEMENT_QUOTE}&nbsp;»
            </p>
          </blockquote>

          {/* — Préambule — */}
          <div className="mt-12">
            <p className="leading-[1.8] text-parchment-dim">
              {REGLEMENT_INTRO.lead}
            </p>

            <ul className="mt-4 space-y-3">
              {REGLEMENT_INTRO.parts.map((part) => (
                <li
                  key={part}
                  className="flex gap-3 leading-[1.8] text-parchment-dim"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.7em] h-px w-4 shrink-0 bg-silver/45"
                  />
                  <span>{part}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 leading-[1.8] text-parchment-dim">
              {REGLEMENT_INTRO.acceptance}
            </p>
          </div>

          {/* — Les deux parties — */}
          {REGLEMENT_PARTS.map((part) => (
            <section
              key={part.id}
              id={part.id}
              aria-labelledby={`${part.id}-titre`}
              className="mt-20 scroll-mt-28"
            >
              {/* Séparateur runique au-dessus du titre de partie */}
              <div aria-hidden="true" className="flex items-center gap-4">
                <span className="hairline flex-1" />
                <span className="rune text-xs text-aurora-teal/70">
                  {part.rune}
                </span>
                <span className="hairline flex-1" />
              </div>

              <h2
                id={`${part.id}-titre`}
                className="mt-7 text-center font-display text-[clamp(1.5rem,5vw,2rem)] font-semibold leading-[1.25] tracking-[0.02em] text-parchment text-balance"
              >
                {part.title}
              </h2>

              {part.articles.map((article) => (
                <ReglementArticle key={article.id} article={article} />
              ))}
            </section>
          ))}

          {/* — La charte, mise en avant — */}
          <section
            id="charte"
            aria-labelledby="charte-titre"
            className="mt-20 scroll-mt-28 rounded-sm border border-silver/12 bg-fjord/70 p-7 sm:p-9"
          >
            <p className="eyebrow flex items-center gap-3">
              <span aria-hidden="true" className="rune text-aurora-teal/80">
                {CHARTE.rune}
              </span>
              <span>La charte du joueur</span>
            </p>

            <h2
              id="charte-titre"
              className="mt-4 font-display text-[clamp(1.35rem,4.5vw,1.75rem)] font-semibold leading-[1.25] tracking-[0.02em] text-parchment text-balance"
            >
              {CHARTE.title}
            </h2>

            <ul className="mt-7 space-y-4">
              {CHARTE.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 leading-[1.8] text-parchment-dim"
                >
                  <span
                    aria-hidden="true"
                    className="rune mt-[0.35em] shrink-0 text-xs text-aurora-teal/70"
                  >
                    ᛞ
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-12 text-center font-display text-[0.68rem] uppercase tracking-[0.2em] text-silver/70">
            {REGLEMENT_FOOTER}
          </p>

          {/* — Consentement puis inscription — */}
          <ConsentGate />
        </div>
      </main>
    </>
  );
}
