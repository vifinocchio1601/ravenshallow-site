import Image from "next/image";
import type { House } from "@/lib/content";

/**
 * Carte de maison : bordure supérieure et ombre au survol dans la couleur de
 * la maison. Le blason garde ses proportions naturelles (fond déjà détouré),
 * jamais recadré en cercle.
 */
export default function HouseCard({ house }: { house: House }) {
  return (
    <article
      className="house-card group relative flex flex-col overflow-hidden rounded-sm border border-silver/10 bg-mist/70 transition-[transform,box-shadow,border-color,background-color] duration-500 hover:-translate-y-2 hover:bg-mist"
      /* `--house` alimente l'élévation et l'ombre colorée du survol,
         définies dans globals.css (`.house-card`). */
      style={{ "--house": house.color } as React.CSSProperties}
    >
      {/* Bordure de couleur en haut de la carte */}
      <span
        aria-hidden="true"
        className="h-[3px] w-full shrink-0"
        style={{ backgroundColor: house.color }}
      />

      {/* Halo coloré au survol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(90% 55% at 50% 0%, color-mix(in srgb, ${house.color} 22%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-1 flex-col items-center p-7 text-center sm:p-8">
        {/* Boîte de hauteur fixe : les blasons n'ont pas tous le même ratio,
            on aligne ainsi les noms d'une carte à l'autre. */}
        <div className="flex h-40 w-full items-end justify-center sm:h-52">
          <Image
            src={house.crest}
            alt={`Blason de la maison ${house.name} — ${house.totem}`}
            width={house.crestWidth}
            height={house.crestHeight}
            sizes="(min-width: 640px) 150px, 115px"
            className="h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
            style={{
              filter: `drop-shadow(0 14px 26px rgba(0,0,0,0.55)) drop-shadow(0 0 18px color-mix(in srgb, ${house.color} 35%, transparent))`,
            }}
          />
        </div>

        <span
          aria-hidden="true"
          className="rune mt-6 text-sm"
          style={{ color: house.color }}
        >
          {house.rune}
        </span>

        <h3 className="mt-2 font-display text-2xl font-semibold tracking-[0.08em] text-parchment">
          {house.name}
        </h3>

        <p className="mt-1 font-body text-base italic text-parchment-dim">
          {house.totem}
        </p>

        <p className="eyebrow mt-3 text-[0.62rem]" style={{ color: house.color }}>
          {house.founder}
        </p>

        <span
          aria-hidden="true"
          className="mt-5 h-px w-12"
          style={{
            background: `linear-gradient(to right, transparent, ${house.color}, transparent)`,
          }}
        />

        <p className="mt-5 leading-relaxed text-parchment-dim">
          {house.description}
        </p>
      </div>
    </article>
  );
}
