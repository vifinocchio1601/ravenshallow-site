"use client";

import { useEffect, useRef } from "react";

/**
 * Le rafraîchissement de la Tour : une interrogation périodique, et rien de plus.
 *
 * **Pas de WebSocket dans ce lot**, et la porte reste ouverte : tout ce qui
 * l’utilise reçoit ses nouveautés par une fonction rappelée de temps en temps.
 * Le jour où une connexion permanente arriverait, c’est ce fichier-ci qui
 * changerait — et lui seul, sans qu’aucun écran bouge.
 *
 * Trois précautions, qui sont l’essentiel du fichier :
 *
 *   • **on s’arrête quand l’onglet est caché.** Un forum s’ouvre le matin et
 *     se laisse ouvert toute la journée ; interroger le serveur toutes les
 *     quinze secondes pendant huit heures dans un onglet que personne ne
 *     regarde réveillerait la base pour rien.
 *   • **on rattrape au retour.** Revenir sur l’onglet relance aussitôt, sans
 *     attendre le prochain tour : c’est le moment précis où l’on veut savoir.
 *   • **jamais deux appels en même temps.** Une réponse lente ne doit pas se
 *     faire doubler par la suivante, qui la rendrait périmée en arrivant
 *     avant elle.
 */

/** Quinze secondes. Assez vif pour une conversation, assez calme pour Neon. */
export const INTERVALLE_MS = 15_000;

export function useRafraichissement(
  tache: () => Promise<void>,
  intervalleMs: number = INTERVALLE_MS,
) {
  // La tâche change à chaque rendu (elle capture l'état) ; la garder dans une
  // référence évite de remonter la minuterie quinze fois par minute.
  const derniere = useRef(tache);
  derniere.current = tache;

  useEffect(() => {
    let vivant = true;
    let enCours = false;
    let minuterie: ReturnType<typeof setInterval> | null = null;

    async function tourner() {
      if (!vivant || enCours) return;
      if (typeof document !== "undefined" && document.hidden) return;
      enCours = true;
      try {
        await derniere.current();
      } catch {
        // Une panne de réseau ne casse pas la page : on retentera au tour
        // suivant, et l'écran garde ce qu'il affichait.
      } finally {
        enCours = false;
      }
    }

    function surVisibilite() {
      if (!document.hidden) void tourner();
    }

    minuterie = setInterval(tourner, intervalleMs);
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      vivant = false;
      if (minuterie) clearInterval(minuterie);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [intervalleMs]);
}
