"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_LINKS, type SiteLink } from "@/lib/content";

/**
 * Navigation fixe : transparente en haut de page, opaque + floutée au scroll.
 * Masquée sous md (pas de menu hamburger pour l'instant) — les ancres restent
 * accessibles depuis le hero et le footer.
 *
 * L'entrée « Inscription » pointe vers une vraie route et se distingue des
 * ancres de l'accueil par sa graisse.
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
        <NavItem
          link={{ href: "/#top", label: "" }}
          className="group flex items-center gap-3 font-display text-sm font-semibold uppercase tracking-[0.34em] text-parchment transition-colors duration-300 hover:text-aurora-teal"
        >
          <span
            aria-hidden="true"
            className="rune text-base text-aurora-teal transition-opacity duration-300 group-hover:opacity-80"
          >
            ᚱ
          </span>
          Ravenshallow
        </NavItem>

        <ul className="flex items-center gap-9">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavItem
                link={link}
                className={`relative font-display text-[0.7rem] uppercase transition-colors duration-300
                            after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-aurora-teal after:transition-[width] after:duration-300 hover:after:w-full ${
                              link.emphasis
                                ? "font-bold tracking-[0.24em] text-parchment hover:text-aurora-teal"
                                : "tracking-[0.22em] text-parchment-dim hover:text-parchment"
                            }`}
              >
                {link.label}
              </NavItem>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/**
 * Les ancres passent par un `<a>` natif : le routeur de l'App Router met bien
 * l'URL à jour sur un lien `/#ancre`, mais ne défile pas jusqu'à la cible
 * quand on est déjà sur la route. Le saut natif, lui, respecte le
 * `scroll-padding-top` qui compense la nav fixe.
 * Les vraies routes (comme /inscription) gardent la navigation client.
 */
function NavItem({
  link,
  className,
  children,
}: {
  link: SiteLink;
  className: string;
  children: React.ReactNode;
}) {
  if (link.href.includes("#")) {
    return (
      <a href={link.href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {children}
    </Link>
  );
}
