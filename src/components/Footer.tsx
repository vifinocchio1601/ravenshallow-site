import RuneDivider from "./RuneDivider";
import { DISCORD, FOOTER_LINKS } from "@/lib/content";

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

          {/* — Discord — */}
          <div className="flex flex-col">
            <h2 className="eyebrow flex items-center gap-3">
              <span aria-hidden="true" className="rune text-aurora-teal/80">
                ᛊ
              </span>
              {DISCORD.eyebrow}
            </h2>
            <p className="mt-4 font-display text-2xl font-semibold tracking-[0.03em] text-parchment">
              {DISCORD.titre}
            </p>

            <p className="mt-4 max-w-xl font-body leading-relaxed text-parchment-dim">
              {DISCORD.corps}
            </p>

            <a
              href={DISCORD.url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-solid mt-7 inline-flex items-center gap-3 self-start"
            >
              <LogoDiscord />
              {DISCORD.bouton}
            </a>
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

/** Marque Discord, tracée en `currentColor` pour suivre celle du bouton. */
function LogoDiscord() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-[1.15em] w-[1.15em] shrink-0"
    >
      <path d="M19.3 5.33A16.4 16.4 0 0 0 15.05 4a.06.06 0 0 0-.07.03c-.18.33-.39.76-.53 1.1a15.5 15.5 0 0 0-4.9 0c-.14-.35-.35-.77-.54-1.1A.06.06 0 0 0 8.94 4 16.4 16.4 0 0 0 4.7 5.33a.06.06 0 0 0-.03.02C1.95 9.42 1.2 13.38 1.57 17.3a.07.07 0 0 0 .3.05 16.6 16.6 0 0 0 5.03 2.55.06.06 0 0 0 .07-.03c.39-.53.73-1.09 1.03-1.68a.06.06 0 0 0-.04-.09c-.55-.2-1.07-.46-1.57-.75a.06.06 0 0 1 0-.11l.31-.24a.06.06 0 0 1 .07 0 11.8 11.8 0 0 0 10.05 0 .06.06 0 0 1 .07 0l.31.24a.06.06 0 0 1 0 .11c-.5.3-1.02.55-1.58.75a.06.06 0 0 0-.03.09c.3.59.65 1.15 1.03 1.68a.06.06 0 0 0 .07.03 16.5 16.5 0 0 0 5.03-2.55.06.06 0 0 0 .03-.05c.44-4.53-.73-8.46-3.1-11.95a.05.05 0 0 0-.03-.02ZM8.52 14.91c-1 0-1.82-.92-1.82-2.04 0-1.13.8-2.05 1.82-2.05 1.02 0 1.84.93 1.82 2.05 0 1.12-.8 2.04-1.82 2.04Zm6.72 0c-1 0-1.82-.92-1.82-2.04 0-1.13.8-2.05 1.82-2.05 1.02 0 1.84.93 1.82 2.05 0 1.12-.8 2.04-1.82 2.04Z" />
    </svg>
  );
}
