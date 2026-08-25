import type { ReactNode } from "react";

/**
 * Écran d’état du dossier : sceau, titre, texte, pastille, et de quoi
 * repartir. Sert aux quatre états visibles par le joueur.
 */
export default function EcranEtat({
  ton = "attente",
  titre,
  corps,
  badge,
  children,
}: {
  ton?: "attente" | "correction" | "accepte";
  titre: string;
  corps: string;
  badge: string;
  children?: ReactNode;
}) {
  const couleurs = {
    attente: {
      bord: "border-aurora-teal/35",
      texte: "text-aurora-teal",
      voile: "rgba(63,217,199,0.10)",
    },
    correction: {
      bord: "border-ember/45",
      texte: "text-ember",
      voile: "rgba(201,123,61,0.10)",
    },
    accepte: {
      bord: "border-aurora-teal/50",
      texte: "text-aurora-teal",
      voile: "rgba(63,217,199,0.14)",
    },
  }[ton];

  return (
    <section
      className={`rounded-sm border ${couleurs.bord} px-6 py-12 text-center sm:px-10`}
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${couleurs.voile} 0%, transparent 70%)`,
      }}
    >
      <span aria-hidden="true" className={`rune text-2xl ${couleurs.texte}`}>
        ᛊ
      </span>

      <h1 className="mt-5 font-display text-[clamp(1.6rem,5vw,2.25rem)] font-semibold leading-[1.2] tracking-[0.03em] text-parchment">
        {titre}
      </h1>

      <p className="mx-auto mt-4 max-w-[44ch] leading-[1.8] text-parchment-dim">
        {corps}
      </p>

      {children}

      <span
        className={`mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-display text-[0.68rem] uppercase tracking-[0.16em] ${couleurs.bord} ${couleurs.texte}`}
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
        {badge}
      </span>
    </section>
  );
}
