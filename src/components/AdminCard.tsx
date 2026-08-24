import type { ReactNode } from "react";

/**
 * Bloc du tableau de bord : eyebrow runique, titre, contenu.
 * Reprend le vocabulaire visuel des cartes du site public.
 */
export default function AdminCard({
  rune,
  eyebrow,
  title,
  children,
}: {
  rune: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-silver/12 bg-mist/50 p-6 sm:p-8">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          {rune}
        </span>
        <span>{eyebrow}</span>
      </p>

      <h2 className="mt-3 font-display text-xl font-semibold tracking-[0.03em] text-parchment">
        {title}
      </h2>

      <div className="mt-5">{children}</div>
    </section>
  );
}
