"use client";

import { useEffect, useRef } from "react";
import { NUEES } from "@/lib/ceremonie/constantes";

/**
 * La brume de la Cérémonie.
 *
 * Trois nappes d’une même texture raccordable, à trois échelles et trois
 * vitesses, **dont une à contresens** : leurs cycles ne se recalent jamais,
 * si bien que l’œil ne trouve pas de boucle. Par-dessus dérivent des nuées
 * plus floues, chacune à son rythme.
 *
 * La texture n’est pas peinte : elle est posée en `mask-image` sur un aplat
 * de couleur. C’est ce qui permet de teindre toute la brume aux couleurs
 * d’une maison en ne changeant qu’une variable CSS — voir `globals.css`.
 *
 * Décor pur : `aria-hidden`, hors du flux, jamais cliquable. Un lecteur
 * d’écran n’en entend pas parler.
 */
export default function BrumeDeFond() {
  const brume = useRef<HTMLDivElement>(null);

  /**
   * La brume glisse un peu au défilement, **et le glissement s’amortit**.
   *
   * Le `tanh` est la pièce maîtresse : il fait avancer la brume au début du
   * défilement, puis la stabilise. Sans lui, la nappe finirait par remonter
   * assez haut pour qu’on voie son bord franc apparaître en bas de page.
   */
  useEffect(() => {
    const element = brume.current;
    if (!element) return;

    // Mouvement réduit : la brume reste où elle est.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let enAttente = false;

    const auDefilement = () => {
      if (enAttente) return;
      enAttente = true;

      requestAnimationFrame(() => {
        const reserve = window.innerHeight * 0.18;
        const y = -reserve * Math.tanh((window.scrollY * 0.1) / reserve);
        element.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        enAttente = false;
      });
    };

    window.addEventListener("scroll", auDefilement, { passive: true });
    return () => window.removeEventListener("scroll", auDefilement);
  }, []);

  return (
    <>
      <div className="lune" aria-hidden="true" />

      <div className="brume" ref={brume} aria-hidden="true">
        <div className="brume__nappe brume__nappe--1" />
        <div className="brume__nappe brume__nappe--2" />
        <div className="brume__nappe brume__nappe--3" />

        {NUEES.map((nuee, index) => (
          <span
            key={index}
            className="brume__nuee"
            style={{
              width: `${nuee.taille}vmax`,
              height: `${nuee.taille}vmax`,
              left: `${nuee.gauche}%`,
              top: `${nuee.haut}%`,
              animationDuration: `${nuee.duree}s`,
              // Un retard négatif démarre l’animation en cours de route :
              // les nuées ne partent pas toutes ensemble au chargement.
              animationDelay: `${nuee.retard}s`,
              ["--dx" as string]: `${nuee.dx}vw`,
              ["--dy" as string]: `${nuee.dy}vh`,
              ["--echelle" as string]: `${nuee.echelle}`,
            }}
          />
        ))}
      </div>

      <div className="brume-sol" aria-hidden="true" />

      {/* Le grain : un bruit fractal, en surimpression. Il casse les aplats
          de la brume, qui sans lui montreraient des bandes de dégradé. */}
      <svg className="grain-ceremonie" aria-hidden="true" focusable="false">
        <filter id="grain-ceremonie-filtre">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#grain-ceremonie-filtre)"
          opacity=".2"
        />
      </svg>

      <div className="vignette-ceremonie" aria-hidden="true" />

      {/* Le voile de lecture : sans lui, le texte clair devient illisible
          dès qu’une nappe claire passe derrière la colonne. */}
      <div className="voile-lecture" aria-hidden="true" />
    </>
  );
}
