"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NUEES, REVELATIONS, TEXTES_CEREMONIE } from "@/lib/ceremonie/constantes";
import type { Maison } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Ce que le Miroir montre.
 *
 * La maison arrive **déjà décidée et déjà inscrite en base** : ce composant
 * ne calcule rien, il met en scène. Rien de ce qu’il reçoit ne permettrait de
 * reconstituer le barème — ni les points, ni le départage ne traversent.
 *
 * La brume de toute la page vire à la couleur de la maison parce qu’on
 * réécrit une seule variable, `--brume-teinte`, sur la racine du document.
 * Les nappes la suivent par transition : c’est ce que permet le fait que la
 * texture soit un masque posé sur un aplat, et non une image colorée.
 */
export default function Revelation({ maison }: { maison: Maison }) {
  const revelation = REVELATIONS[maison];
  const t = TEXTES_CEREMONIE.revelation;

  const [ouverte, setOuverte] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);

  /**
   * Teinte la page, puis ouvre — un instant plus tard, pour que le navigateur
   * ait quelque chose à interpoler.
   *
   * `setTimeout` et non `requestAnimationFrame` : un onglet en arrière-plan
   * ne peint pas, donc n’appelle jamais ses `requestAnimationFrame`. Le
   * joueur qui laisse la page de côté le temps que le Miroir réponde
   * retrouverait une révélation restée invisible pour toujours.
   */
  useEffect(() => {
    const racine = document.documentElement;
    racine.style.setProperty("--brume-teinte", revelation.teinteBrume);
    racine.dataset.revelation = "true";

    const ouverture = window.setTimeout(() => setOuverte(true), 30);

    return () => {
      window.clearTimeout(ouverture);
      racine.style.removeProperty("--brume-teinte");
      delete racine.dataset.revelation;
    };
  }, [revelation.teinteBrume]);

  /**
   * Le focus attend la fin de la mise en scène. Le poser tout de suite ferait
   * annoncer le bouton avant même que la maison ne soit dite.
   */
  useEffect(() => {
    if (!ouverte) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const attente = window.setTimeout(
      () => bouton.current?.focus(),
      reduit ? 0 : 2600,
    );
    return () => window.clearTimeout(attente);
  }, [ouverte]);

  /**
   * Rechargement complet plutôt que navigation côté client : le gabarit de
   * l’école relit la session en base, et c’est ce qui fait apparaître le
   * blason de la maison dans le bandeau et le compteur de points au bureau.
   */
  function terminer() {
    window.location.href = ROUTES.bureau;
  }

  return (
    <div
      className="revelation"
      data-ouverte={ouverte}
      role="dialog"
      aria-modal="true"
      aria-label={t.aria}
      style={{
        ["--halo-1" as string]: revelation.halo1,
        ["--halo-2" as string]: revelation.halo2,
      }}
    >
      <div className="brume" aria-hidden="true">
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
              animationDelay: `${nuee.retard}s`,
              ["--dx" as string]: `${nuee.dx}vw`,
              ["--dy" as string]: `${nuee.dy}vh`,
              ["--echelle" as string]: `${nuee.echelle}`,
            }}
          />
        ))}
      </div>

      <div className="revelation__contenu">
        <Image
          src={revelation.blason}
          alt={t.altBlason.replace("{maison}", revelation.nom)}
          width={300}
          height={300}
          priority
          className="revelation__blason"
        />

        <h2 className="revelation__maison">{revelation.nom}</h2>
        <p className="revelation__ligne font-body">{revelation.ligne}</p>

        <div className="revelation__action">
          <button
            ref={bouton}
            type="button"
            onClick={terminer}
            className="btn btn-ghost border-ember/75 hover:border-ember"
          >
            {t.bouton}
          </button>
        </div>
      </div>
    </div>
  );
}
