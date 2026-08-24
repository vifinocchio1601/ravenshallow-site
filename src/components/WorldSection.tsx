import Image from "next/image";
import SectionHeading from "./SectionHeading";
import { TERRITORIES } from "@/lib/content";

export default function WorldSection() {
  return (
    <section
      id="le-monde"
      aria-labelledby="le-monde-titre"
      className="relative bg-void py-24 sm:py-28 md:py-36"
    >
      <div className="relative mx-auto max-w-content px-6 sm:px-8">
        <SectionHeading
          id="le-monde-titre"
          rune="ᛗ"
          eyebrow="Le monde"
          title="Trois territoires, une seule école"
        />

        <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-parchment-dim text-balance">
          Le château surplombe une mer froide et profonde, un lac qui s&apos;y
          jette en contrebas, et une forêt sombre qui borde le domaine. Trois
          frontières, trois dangers — et une seule falaise pour les contenir.
        </p>

        {/* — Les trois territoires — */}
        <ul className="mt-16 grid gap-6 md:grid-cols-3">
          {TERRITORIES.map((territory) => (
            <li
              key={territory.name}
              className="group relative flex flex-col rounded-sm border border-silver/10 bg-mist/60 p-7 transition-[border-color,background-color,transform] duration-500 hover:-translate-y-1 hover:border-aurora-teal/30 hover:bg-mist"
            >
              {/* Filet supérieur qui s'allume au survol */}
              <span
                aria-hidden="true"
                className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-aurora-teal/45 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span
                aria-hidden="true"
                className="rune text-xl text-aurora-teal/70"
              >
                {territory.rune}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-[0.04em] text-parchment">
                {territory.name}
              </h3>
              <p className="mt-4 leading-relaxed text-parchment-dim">
                {territory.description}
              </p>
            </li>
          ))}
        </ul>

        {/* — La carte du domaine — */}
        <figure className="mt-20">
          <div className="relative overflow-hidden rounded-sm border border-silver/15 bg-fjord">
            <Image
              src="/crests/carte.jpg"
              alt="Carte illustrée du domaine de Ravenshallow : le château sur les falaises, le lac, la forêt sombre, le village-port de Kaldvik et la grotte scellée."
              width={1269}
              height={952}
              sizes="(min-width: 1152px) 1088px, 100vw"
              className="h-auto w-full"
            />
            {/* Vignettage : la carte se fond dans la nuit */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_45%,transparent_45%,rgba(5,7,11,0.55)_100%)]"
            />
          </div>
          <figcaption className="mt-4 flex items-center justify-center gap-3 text-center text-sm italic text-silver">
            <span aria-hidden="true" className="rune not-italic text-aurora-teal/60">
              ᚦ
            </span>
            Le domaine, tel qu&apos;il est relevé dans les archives de
            l&apos;école — la grotte scellée y figure, sans commentaire.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
