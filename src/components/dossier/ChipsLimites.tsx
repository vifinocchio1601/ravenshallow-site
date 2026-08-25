"use client";

import { LIMITES_ECRITURE } from "@/lib/dossier/constantes";

/**
 * Limites d’écriture : puces cliquables, à choix multiple.
 * Des `<button aria-pressed>` plutôt que des cases — l’état « appuyé » se
 * lit bien au lecteur d’écran et le rendu reste celui d’une pastille.
 */
export default function ChipsLimites({
  choisies,
  onToggle,
  legende,
}: {
  choisies: string[];
  onToggle: (valeur: string) => void;
  legende: string;
}) {
  return (
    <div role="group" aria-label={legende} className="flex flex-wrap gap-2">
      {LIMITES_ECRITURE.map(({ valeur, libelle }) => {
        const active = choisies.includes(valeur);
        return (
          <button
            key={valeur}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(valeur)}
            className={`rounded-full border px-4 py-1.5 font-display text-[0.7rem] uppercase tracking-[0.12em] transition-[background-color,border-color,color] duration-300 ${
              active
                ? "border-aurora-teal/60 bg-aurora-teal/[0.12] text-aurora-teal"
                : "border-silver/20 bg-mist/50 text-parchment-dim hover:border-silver/40 hover:text-parchment"
            }`}
          >
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
