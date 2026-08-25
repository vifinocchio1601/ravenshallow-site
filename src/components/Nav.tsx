"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  NAV_LINKS,
  PORTE_CONNECTE,
  PORTES,
  type SiteLink,
} from "@/lib/content";

/**
 * Navigation fixe : transparente en haut de page, opaque et floutée au scroll.
 *
 * Les ancres de l'accueil se replient sous `md`, mais **les deux portes
 * restent visibles sur téléphone** : sans elles, un visiteur sur mobile
 * n'aurait aucun moyen d'entrer ni de s'inscrire.
 *
 * `connecte` porte la destination du visiteur déjà identifié — calculée par
 * la page serveur avec `destinationApres`, jamais devinée ici. Les deux
 * portes cèdent alors la place à un accès direct.
 */
export default function Nav({
  connecte,
}: {
  connecte?: { destination: string } | null;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const classePorte = `relative font-display text-[0.66rem] sm:text-[0.7rem] font-bold uppercase tracking-[0.18em] sm:tracking-[0.24em] text-parchment transition-colors duration-300
     after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-aurora-teal after:transition-[width] after:duration-300 hover:text-aurora-teal hover:after:w-full`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 ${
        scrolled
          ? "border-b border-silver/10 bg-void/80 shadow-[0_16px_40px_-32px_rgba(0,0,0,0.9)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5 sm:h-20 sm:px-8"
      >
        <NavItem
          link={{ href: "/#top", label: "" }}
          className="group flex shrink-0 items-center gap-3 font-display text-sm font-semibold uppercase tracking-[0.34em] text-parchment transition-colors duration-300 hover:text-aurora-teal"
        >
          <span
            aria-hidden="true"
            className="rune text-base text-aurora-teal transition-opacity duration-300 group-hover:opacity-80"
          >
            ᚱ
          </span>
          {/* Le mot cède la place aux portes sur les petits écrans. */}
          <span className="hidden sm:inline">Ravenshallow</span>
        </NavItem>

        <ul className="flex items-center gap-5 sm:gap-7 md:gap-9">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="hidden md:block">
              <NavItem
                link={link}
                className="relative font-display text-[0.7rem] uppercase tracking-[0.22em] text-parchment-dim transition-colors duration-300 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-aurora-teal after:transition-[width] after:duration-300 hover:text-parchment hover:after:w-full"
              >
                {link.label}
              </NavItem>
            </li>
          ))}

          {connecte ? (
            <li>
              <Link href={connecte.destination} className={classePorte}>
                {PORTE_CONNECTE.label}
              </Link>
            </li>
          ) : (
            PORTES.map((porte) => (
              <li key={porte.href}>
                <NavItem link={porte} className={classePorte}>
                  {porte.label}
                </NavItem>
              </li>
            ))
          )}
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
