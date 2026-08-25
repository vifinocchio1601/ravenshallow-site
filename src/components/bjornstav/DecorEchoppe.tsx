"use client";

import { useEffect, useRef } from "react";
import { POUSSIERES } from "@/lib/bjornstav/decor";

/**
 * L’intérieur de l’échoppe : le mur d’étagères et les lumières de la pièce.
 *
 * Décor pur — `aria-hidden`, hors du flux, jamais cliquable. Un lecteur
 * d’écran n’en entend pas parler : il n’y a rien à y comprendre, et le récit
 * décrit déjà la boutique en toutes lettres.
 *
 * Le voile de lecture, lui, n’est pas de l’ambiance : sans lui, le texte
 * clair devient illisible dès que la colonne passe devant une étagère
 * éclairée.
 */
export default function DecorEchoppe() {
  const mur = useRef<HTMLDivElement>(null);

  /**
   * On longe les étagères en descendant — **et le glissement s’amortit**.
   *
   * Le `tanh` est la pièce maîtresse, comme sur la page du Miroir : le mur
   * avance au début du défilement, puis se stabilise. Sans lui, la
   * photographie finirait par remonter assez haut pour qu’on voie son bord
   * apparaître en bas de page.
   */
  useEffect(() => {
    const element = mur.current;
    if (!element) return;

    // Mouvement réduit : le mur reste où il est.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let enAttente = false;

    const auDefilement = () => {
      if (enAttente) return;
      enAttente = true;

      requestAnimationFrame(() => {
        const reserve = window.innerHeight * 0.22;
        const y = -reserve * Math.tanh((window.scrollY * 0.14) / reserve);
        element.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        enAttente = false;
      });
    };

    window.addEventListener("scroll", auDefilement, { passive: true });
    return () => window.removeEventListener("scroll", auDefilement);
  }, []);

  return (
    <>
      <div className="mur" ref={mur} aria-hidden="true" />
      <div className="poudre" aria-hidden="true" />
      <div className="fenetre" aria-hidden="true" />
      <div className="lampe" aria-hidden="true" />

      <div className="poussiere" aria-hidden="true">
        {POUSSIERES.map((grain, index) => (
          <span
            key={index}
            style={{
              left: `${grain.gauche}%`,
              opacity: grain.opacite,
              animationDuration: `${grain.duree}s`,
              // Un retard négatif démarre la montée en cours de route : les
              // grains ne partent pas tous du bas au chargement.
              animationDelay: `${grain.retard}s`,
              ["--dx" as string]: `${grain.dx}px`,
            }}
          />
        ))}
      </div>

      <div className="crasse" aria-hidden="true" />
      <div className="vignette-echoppe" aria-hidden="true" />
      <div className="voile-echoppe" aria-hidden="true" />
    </>
  );
}
