"use client";

/**
 * Groupe de cartes exclusives (famille, type de portrait).
 * La case native reste dans le DOM, masquée : la navigation clavier par
 * flèches et l’annonce du groupe fonctionnent sans code supplémentaire.
 */
export default function CartesRadio({
  nom,
  legende,
  options,
  valeur,
  onChange,
  colonnes = 2,
}: {
  nom: string;
  legende: string;
  options: readonly { valeur: string; libelle: string; detail?: string }[];
  valeur: string;
  onChange: (valeur: string) => void;
  colonnes?: 2 | 3;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legende}</legend>
      <div
        className={`grid gap-3 ${
          colonnes === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {options.map((option) => {
          const choisi = valeur === option.valeur;
          return (
            <label key={option.valeur} className="relative min-w-0">
              <input
                type="radio"
                name={nom}
                value={option.valeur}
                checked={choisi}
                onChange={() => onChange(option.valeur)}
                className="peer sr-only"
              />
              <span
                className={`block h-full cursor-pointer rounded-sm border px-4 py-3 font-body text-base transition-[background-color,border-color,color] duration-300
                            peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-aurora-teal ${
                              choisi
                                ? "border-aurora-teal/60 bg-aurora-teal/[0.08] text-parchment"
                                : "border-silver/15 bg-mist/50 text-parchment-dim hover:border-silver/35"
                            }`}
              >
                {option.libelle}
                {option.detail ? (
                  <small className="mt-1 block font-body text-sm italic text-silver">
                    {option.detail}
                  </small>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
