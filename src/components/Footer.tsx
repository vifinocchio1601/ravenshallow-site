import RuneDivider from "./RuneDivider";
import WaitlistForm from "./WaitlistForm";
import { FOOTER_LINKS } from "@/lib/content";

export default function Footer() {
  return (
    <footer
      id="rejoindre"
      className="relative border-t border-silver/10 bg-fjord"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(63,217,199,0.09)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-content px-6 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          {/* — Identité — */}
          <div>
            <p className="flex items-center gap-3 font-display text-lg font-semibold uppercase tracking-[0.3em] text-parchment">
              <span aria-hidden="true" className="rune text-aurora-teal">
                ᚱ
              </span>
              Ravenshallow
            </p>
            <p className="mt-4 max-w-sm font-body text-base italic leading-relaxed text-parchment-dim">
              Ce que la brume scelle, la sagesse le garde.
            </p>

            <nav aria-label="Navigation de pied de page" className="mt-8">
              <ul className="flex flex-wrap gap-x-7 gap-y-3">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* — Liste d'attente — */}
          <div className="flex flex-col">
            <h2 className="eyebrow flex items-center gap-3">
              <span aria-hidden="true" className="rune text-aurora-teal/80">
                ᛊ
              </span>
              Rejoindre
            </h2>
            <p className="mt-4 font-display text-2xl font-semibold tracking-[0.03em] text-parchment">
              Se présenter devant le miroir
            </p>
            <div className="mt-6">
              <WaitlistForm />
            </div>
          </div>
        </div>

        <RuneDivider className="mt-16" />

        <p className="mt-8 text-center text-xs tracking-[0.06em] text-silver/70">
          Ravenshallow — document évolutif. Le monde continue de s&apos;écrire.
        </p>
      </div>
    </footer>
  );
}
