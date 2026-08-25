import type { ReactNode } from "react";

/**
 * Un panneau du bureau.
 *
 * Posé **par-dessus** le décor, jamais dessiné dedans : fond opaque à 85 %,
 * bordure claire et flou d’arrière-plan, pour que le texte reste lisible
 * quelle que soit la zone de l’image derrière — la chandelle est claire, le
 * bois presque noir.
 */
export default function Panneau({
  titre,
  aide,
  vide,
  children,
  className = "",
}: {
  titre: string;
  aide?: string;
  /** Message affiché quand il n’y a rien à montrer. Jamais une erreur. */
  vide?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-sm border border-silver/20 bg-void/85 p-6 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.95)] backdrop-blur-sm sm:p-7 ${className}`}
    >
      <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
        {titre}
      </h2>
      {aide ? (
        <p className="mt-1.5 font-body text-sm italic leading-relaxed text-silver">
          {aide}
        </p>
      ) : null}

      <div className="mt-5">
        {children ?? (
          <p className="font-body leading-relaxed text-parchment-dim">{vide}</p>
        )}
      </div>
    </section>
  );
}
