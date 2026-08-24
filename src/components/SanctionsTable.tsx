import type { SanctionsTable as SanctionsTableData } from "@/lib/reglement";

/**
 * Tableau de l'article 8.3.
 * Il déborde horizontalement dans son propre conteneur défilant plutôt que
 * d'élargir la page sur mobile.
 */
export default function SanctionsTable({
  data,
}: {
  data: SanctionsTableData;
}) {
  return (
    <div className="-mx-6 mt-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <table className="rules-table w-full min-w-[32rem] border-collapse text-left text-base leading-relaxed">
        <caption className="sr-only">
          Échelle des sanctions : niveau, mesure et cas typiques
        </caption>
        <thead>
          <tr>
            {data.headers.map((header, i) => (
              <th
                key={header}
                scope="col"
                className={`font-display text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-parchment ${
                  i === 0 ? "w-[5.5rem]" : ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row[0]}>
              <th
                scope="row"
                className="font-display text-base font-semibold text-aurora-teal"
              >
                {row[0]}
              </th>
              {row.slice(1).map((cell, i) => (
                <td key={i} className="text-parchment-dim">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
