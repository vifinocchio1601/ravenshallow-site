"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/content";

/**
 * Navigation fixe : transparente en haut de page, opaque + floutée au scroll.
 * Masquée sous md (pas de menu hamburger pour l'instant) — les ancres restent
 * accessibles depuis le hero et le footer.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 hidden transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 md:block ${
        scrolled
          ? "border-b border-silver/10 bg-void/80 shadow-[0_16px_40px_-32px_rgba(0,0,0,0.9)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-20 max-w-content items-center justify-between px-8"
      >
        <a
          href="#top"
          className="group flex items-center gap-3 font-display text-sm font-semibold uppercase tracking-[0.34em] text-parchment transition-colors duration-300 hover:text-aurora-teal"
        >
          <span
            aria-hidden="true"
            className="rune text-base text-aurora-teal transition-opacity duration-300 group-hover:opacity-80"
          >
            ᚱ
          </span>
          Ravenshallow
        </a>

        <ul className="flex items-center gap-9">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative font-display text-[0.7rem] uppercase tracking-[0.22em] text-parchment-dim transition-colors duration-300 hover:text-parchment
                           after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-aurora-teal after:transition-[width] after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
