import SanctionsTable from "./SanctionsTable";
import type { Article } from "@/lib/reglement";

/**
 * Un article du règlement et ses points numérotés.
 * Le numéro déborde dans la marge (retrait négatif) : le texte reste aligné
 * et les points se repèrent d'un coup d'œil en scannant la page.
 */
export default function ReglementArticle({ article }: { article: Article }) {
  return (
    <article id={article.id} className="mt-12 scroll-mt-28 first:mt-10">
      <h3 className="font-display text-xl font-semibold tracking-[0.03em] text-parchment sm:text-[1.4rem]">
        {article.title}
      </h3>

      {article.lead ? (
        <p className="mt-5 leading-[1.8] text-parchment-dim">{article.lead}</p>
      ) : null}

      <div className="mt-5 space-y-4">
        {article.clauses.map((clause) => (
          <div key={clause.num}>
            <p className="-indent-11 pl-11 leading-[1.8] text-parchment-dim">
              <span className="inline-block w-11 font-semibold tabular-nums text-silver">
                {clause.num}
              </span>
              {clause.text}
            </p>
            {clause.table ? <SanctionsTable data={clause.table} /> : null}
          </div>
        ))}
      </div>
    </article>
  );
}
