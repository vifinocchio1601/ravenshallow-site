import HouseCard from "./HouseCard";
import RuneDivider from "./RuneDivider";
import SectionHeading from "./SectionHeading";
import { HOUSES } from "@/lib/content";

export default function HousesSection() {
  return (
    <section
      id="les-maisons"
      aria-labelledby="les-maisons-titre"
      className="relative border-y border-silver/10 bg-fjord py-24 sm:py-28 md:py-36"
    >
      {/* Voile violacé, souvenir de la brume du miroir */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(138,111,214,0.12)_0%,transparent_65%)]"
      />

      <div className="relative mx-auto max-w-content px-6 sm:px-8">
        <SectionHeading
          id="les-maisons-titre"
          rune="ᛗᛁᚱ"
          eyebrow="Le Miroir de Brume"
          title="Quatre maisons, quatre héritages"
        />

        <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-parchment-dim text-balance">
          Chaque nouvel élève se place devant un miroir ancien. Son reflet se
          perd dans la brume — puis la brume se colore, et révèle la maison qui
          l&apos;accueillera. Personne ne choisit. Personne ne discute.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOUSES.map((house) => (
            <HouseCard key={house.slug} house={house} />
          ))}
        </div>

        <RuneDivider className="mx-auto mt-20 max-w-2xl" />

        <blockquote className="mx-auto mt-10 max-w-2xl text-center">
          <p className="font-body text-[clamp(1.15rem,2.6vw,1.5rem)] italic leading-relaxed text-parchment/90">
            «&nbsp;La brume ne ment jamais — elle choisit simplement de ne pas
            tout dire.&nbsp;»
          </p>
        </blockquote>
      </div>
    </section>
  );
}
