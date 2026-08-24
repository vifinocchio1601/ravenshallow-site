import Image from "next/image";
import SectionHeading from "./SectionHeading";

export default function FoundingSection() {
  return (
    <section
      id="la-fondation"
      aria-labelledby="la-fondation-titre"
      className="relative bg-void py-24 sm:py-28 md:py-36"
    >
      <div className="mx-auto max-w-content px-6 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
          {/* — Blason de l'école — */}
          <div className="relative flex justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(63,217,199,0.16)_0%,transparent_70%)]"
            />
            <Image
              src="/crests/ravenshallow.png"
              alt="Blason de Ravenshallow : le corbeau, le serpent noir, la salamandre et l'anguille réunis sur un même écu."
              width={679}
              height={900}
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 55vw, 78vw"
              className="relative h-auto w-[min(20rem,78vw)] lg:w-[min(26rem,100%)]"
              style={{
                filter:
                  "drop-shadow(0 26px 50px rgba(0,0,0,0.7)) drop-shadow(0 0 34px rgba(63,217,199,0.22))",
              }}
            />
          </div>

          {/* — Le récit, volontairement incomplet — */}
          <div>
            <SectionHeading
              id="la-fondation-titre"
              rune="ᚦᚢᚱᛊ"
              eyebrow="Il y a des siècles"
              title="Quatre inconnus. Une grotte scellée."
              align="left"
            />

            <div className="mt-8 space-y-6 text-lg leading-relaxed text-parchment-dim">
              <p>
                Une sage, un errant, un apothicaire et un jeune homme aux
                visions incontrôlées — quatre étrangers réunis par des
                disparitions le long de la côte, et par ce qu&apos;ils ont
                trouvé au fond d&apos;une grotte à flanc de falaise.
              </p>
              <p>
                Ce qu&apos;ils n&apos;ont pas réussi à détruire, ils l&apos;ont
                scellé. Le château a été bâti au-dessus, pour que la
                surveillance ne cesse jamais — et l&apos;école est née de la
                conviction qu&apos;un tel savoir ne devait plus jamais
                surprendre personne.
              </p>
            </div>

            <blockquote className="mt-10 border-l border-aurora-teal/40 pl-6">
              <p className="font-body text-lg italic leading-relaxed text-parchment/85">
                Certains chapitres de cette histoire ne s&apos;enseignent
                qu&apos;aux élèves des dernières années. Les autres devront
                attendre — ou écouter les rumeurs.
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
