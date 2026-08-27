import Link from "next/link";
import Nav from "./Nav";
import { CONTACT_LEGAL, type DocumentLegal } from "@/lib/legal";

/**
 * Gabarit commun aux mentions légales et à la politique de confidentialité.
 *
 * Un seul gabarit pour deux pages : elles se lisent de la même façon, et
 * deux mises en forme qui divergent finiraient par se contredire à l’œil.
 *
 * La date est rendue par un `<time>` porteur de la valeur brute — c’est la
 * même précaution que partout ailleurs sur le site : l’instant voyage tel
 * quel, la mise en forme revient au navigateur de qui lit.
 */
export default function PageLegale({ document }: { document: DocumentLegal }) {
  const dateLisible = new Date(`${document.miseAJour}T00:00:00Z`).toLocaleDateString(
    "fr-FR",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );

  return (
    <>
      <Nav />

      <main className="relative bg-void">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.08)_0%,rgba(138,111,214,0.05)_45%,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-3xl px-6 pb-28 pt-36 sm:px-8 sm:pt-44">
          <header>
            <p aria-hidden="true" className="rune text-2xl text-aurora-teal">
              {document.rune}
            </p>

            <p className="mt-5 font-display text-[0.68rem] uppercase tracking-[0.3em] text-silver">
              {document.eyebrow}
            </p>

            <h1 className="mt-4 font-display text-3xl font-semibold text-parchment sm:text-4xl">
              {document.titre}
            </h1>

            <p className="mt-6 font-body text-lg leading-relaxed text-parchment-dim">
              {document.chapeau}
            </p>

            <p className="mt-6 font-display text-[0.62rem] uppercase tracking-[0.22em] text-silver/70">
              Dernière mise à jour :{" "}
              <time dateTime={document.miseAJour}>{dateLisible}</time>
            </p>
          </header>

          {document.sections.map((section) => (
            <section key={section.titre} className="mt-14">
              <h2 className="font-display text-xl font-semibold text-parchment-2">
                {section.titre}
              </h2>

              <div className="mt-5 space-y-4">
                {section.paragraphes.map((paragraphe) => (
                  <p
                    key={paragraphe}
                    className="font-body leading-[1.8] text-parchment-dim"
                  >
                    {paragraphe}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <footer className="mt-16 border-t border-silver/10 pt-8">
            <p className="font-body text-parchment-dim">
              Une question sur cette page ?{" "}
              <a
                href={`mailto:${CONTACT_LEGAL}`}
                className="text-aurora-teal underline decoration-aurora-teal/40 underline-offset-4 transition-colors hover:decoration-aurora-teal"
              >
                {CONTACT_LEGAL}
              </a>
            </p>

            <nav aria-label="Autres pages légales" className="mt-6">
              <ul className="flex flex-wrap gap-x-7 gap-y-3">
                <li>
                  <Link
                    href="/mentions-legales"
                    className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/confidentialite"
                    className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
                  >
                    Données personnelles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reglement"
                    className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
                  >
                    Règlement
                  </Link>
                </li>
              </ul>
            </nav>
          </footer>
        </div>
      </main>
    </>
  );
}
