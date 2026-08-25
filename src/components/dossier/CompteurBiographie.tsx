"use client";

import { BIOGRAPHIE_MINIMUM, TEXTES } from "@/lib/dossier/constantes";

/** Compteur et barre de progression de la biographie. */
export default function CompteurBiographie({ nombre }: { nombre: number }) {
  const atteint = nombre >= BIOGRAPHIE_MINIMUM;
  const progression = Math.min(100, (nombre / BIOGRAPHIE_MINIMUM) * 100);

  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between font-display text-[0.68rem] uppercase tracking-[0.12em] text-silver">
        <span>{TEXTES.champs.biographie.minimum}</span>
        <span aria-live="polite">
          <b
            className={`font-medium tabular-nums ${
              atteint ? "text-aurora-teal" : "text-parchment-dim"
            }`}
          >
            {nombre}
          </b>{" "}
          / {BIOGRAPHIE_MINIMUM}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(progression)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={TEXTES.champs.biographie.minimum}
        className="mt-2 h-px w-full overflow-hidden bg-silver/15"
      >
        <div
          className={`h-full transition-[width] duration-300 ${
            atteint ? "bg-aurora-teal" : "bg-aurora-violet"
          }`}
          style={{ width: `${progression}%` }}
        />
      </div>
    </div>
  );
}
