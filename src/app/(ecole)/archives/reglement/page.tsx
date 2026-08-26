import type { Metadata } from "next";
import ReglementArticle from "@/components/ReglementArticle";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { CHARTE, REGLEMENT_PARTS, REGLEMENT_QUOTE } from "@/lib/reglement";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_ECOLE.archives.reglement;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Le règlement, **dans les archives de l’école**.
 *
 * Le même texte que la page publique `/reglement`, et surtout **la même
 * source** : `lib/reglement.ts`. Recopier les 87 points pour les mettre sous
 * le bandeau serait le meilleur moyen d’en avoir deux versions, dont une
 * fausse.
 *
 * Deux pages plutôt qu’un lien vers la page publique : celle-ci garde le
 * parchemin au-dessus, et le membre ne sort pas du château pour relire une
 * règle. La page publique, elle, reste ouverte à qui n’a pas de compte —
 * l’inscription vaut acceptation, encore faut-il pouvoir lire avant.
 */
export default async function Page() {
  await exigerAcces(ROUTES.archivesReglement);

  return (
    <main className="mx-auto max-w-[45rem] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᚱ
        </span>
        {TEXTES_ECOLE.archives.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[54ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      <blockquote className="mt-10 rounded-sm border border-aurora-teal/20 bg-fjord/70 px-6 py-7 text-center sm:px-10">
        <p className="font-body text-[clamp(1.05rem,3.2vw,1.3rem)] italic leading-relaxed text-parchment/90">
          «&nbsp;{REGLEMENT_QUOTE}&nbsp;»
        </p>
      </blockquote>

      {REGLEMENT_PARTS.map((part) => (
        <section
          key={part.id}
          id={part.id}
          aria-labelledby={`${part.id}-titre`}
          className="mt-16 scroll-mt-28"
        >
          <div aria-hidden="true" className="flex items-center gap-4">
            <span className="hairline flex-1" />
            <span className="rune text-xs text-aurora-teal/70">{part.rune}</span>
            <span className="hairline flex-1" />
          </div>

          <h2
            id={`${part.id}-titre`}
            className="mt-7 text-center font-display text-[clamp(1.35rem,5vw,1.8rem)] font-semibold leading-[1.25] tracking-[0.02em] text-parchment text-balance"
          >
            {part.title}
          </h2>

          {part.articles.map((article) => (
            <ReglementArticle key={article.id} article={article} />
          ))}
        </section>
      ))}

      <section
        id="charte"
        aria-labelledby="charte-titre"
        className="mt-16 rounded-sm border border-aurora-teal/20 bg-fjord/60 px-6 py-8 sm:px-9"
      >
        <div aria-hidden="true" className="flex items-center gap-4">
          <span className="hairline flex-1" />
          <span className="rune text-xs text-aurora-teal/70">{CHARTE.rune}</span>
          <span className="hairline flex-1" />
        </div>

        <h2
          id="charte-titre"
          className="mt-6 text-center font-display text-[clamp(1.2rem,4vw,1.55rem)] font-semibold leading-[1.3] tracking-[0.02em] text-parchment text-balance"
        >
          {CHARTE.title}
        </h2>

        <ul className="mt-7 space-y-4">
          {CHARTE.items.map((item) => (
            <li key={item} className="flex gap-3 leading-[1.8] text-parchment-dim">
              <span
                aria-hidden="true"
                className="mt-[0.7em] h-px w-4 shrink-0 bg-aurora-teal/50"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
