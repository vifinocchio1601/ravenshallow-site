import { ReactNode } from "react";

type Props = {
  /** Rune(s) affichée(s) avant le libellé — écho aux cours de Runologie. */
  rune: string;
  eyebrow: string;
  title: ReactNode;
  /** Centre le bloc (par défaut) ou l'aligne à gauche. */
  align?: "center" | "left";
  id?: string;
};

/**
 * Titre de section : eyebrow runique + titre en Cinzel.
 * La rune est décorative — masquée aux lecteurs d'écran.
 */
export default function SectionHeading({
  rune,
  eyebrow,
  title,
  align = "center",
  id,
}: Props) {
  const isCenter = align === "center";

  return (
    <header className={isCenter ? "text-center" : "text-left"}>
      <p
        className={`eyebrow flex items-center gap-3 ${
          isCenter ? "justify-center" : "justify-start"
        }`}
      >
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          {rune}
        </span>
        <span>{eyebrow}</span>
      </p>

      <h2
        id={id}
        className="mt-4 font-display text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-[1.15] tracking-[0.02em] text-parchment text-balance"
      >
        {title}
      </h2>
    </header>
  );
}
