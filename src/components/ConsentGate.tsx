"use client";

import Link from "next/link";
import { useId, useState } from "react";

/**
 * Case « Lu et approuvé » puis bouton d'inscription qui se matérialise
 * en sortant de la brume.
 *
 * Tant que la case n'est pas cochée, le bouton est flouté, transparent et
 * hors du parcours clavier (`pointer-events: none` + `tabIndex={-1}`).
 */
export default function ConsentGate() {
  const [accepted, setAccepted] = useState(false);
  const checkboxId = useId();

  return (
    <section
      id="sceau"
      aria-labelledby={`${checkboxId}-titre`}
      className="mt-16 scroll-mt-28 rounded-sm border border-silver/12 bg-fjord/70 p-7 sm:p-9"
    >
      <h2 id={`${checkboxId}-titre`} className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛊᛖᚷᛚ
        </span>
        Le sceau
      </h2>

      <p className="mt-4 leading-[1.8] text-parchment-dim">
        L&apos;inscription vaut acceptation pleine et entière des deux parties
        du règlement.
      </p>

      {/* — Case à cocher — la case native est masquée, la coche est dessinée — */}
      <label
        htmlFor={checkboxId}
        className="mt-7 flex w-fit cursor-pointer items-center gap-4"
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border transition-[background-color,border-color] duration-300
                      peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-aurora-teal ${
                        accepted
                          ? "border-aurora-teal/70 bg-aurora-teal/10"
                          : "border-silver/35 bg-mist/60"
                      }`}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className={`h-4 w-4 transition-[opacity,transform] duration-300 ${
              accepted ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="var(--aurora-teal)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="font-display text-xs uppercase tracking-[0.2em] text-parchment sm:text-sm">
          Lu et approuvé
        </span>
      </label>

      {/* — Bouton qui se dissipe hors de la brume — */}
      <div
        aria-hidden={!accepted}
        className={`mt-8 w-fit ${accepted ? "mist-reveal mist-reveal--visible" : "mist-reveal"}`}
      >
        <Link
          href="/#rejoindre"
          tabIndex={accepted ? 0 : -1}
          className="btn btn-solid"
        >
          Inscription
        </Link>
      </div>
    </section>
  );
}
