import { RAVENSHALLOW_RUNES } from "@/lib/content";

/**
 * Séparateur : deux filets encadrant une frise runique.
 * Purement décoratif.
 */
export default function RuneDivider({
  runes = RAVENSHALLOW_RUNES,
  className = "",
}: {
  runes?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-4 sm:gap-6 ${className}`}
    >
      <span className="hairline flex-1" />
      <span className="rune select-none whitespace-nowrap text-[0.7rem] text-silver/55 sm:text-sm">
        {runes}
      </span>
      <span className="hairline flex-1" />
    </div>
  );
}
