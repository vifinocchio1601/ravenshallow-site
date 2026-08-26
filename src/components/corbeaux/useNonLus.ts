"use client";

import { useCallback, useEffect, useState } from "react";
import { useRafraichissement } from "./useRafraichissement";

/**
 * Le compte des corbeaux non lus, tenu à jour dans le bandeau.
 *
 * ── Pourquoi ce fichier existe ──
 *
 * Le bandeau vit dans un **layout**, et un layout d’App Router n’est pas
 * rendu à nouveau quand on navigue entre deux pages du même segment : c’est
 * précisément ce qui le rend rapide. Le compteur calculé côté serveur restait
 * donc figé sur la valeur du premier chargement — on lisait ses corbeaux, et
 * la pastille restait là.
 *
 * Il doit donc vivre par lui-même, et il le fait de deux façons :
 *
 *   • **l’événement**, pour l’immédiat. Lire un fil éteint la pastille à
 *     l’instant, sans attendre le prochain tour de la minuterie. Sans lui, on
 *     verrait un « 1 » persister jusqu’à quinze secondes après avoir lu — ce
 *     qui est exactement le défaut qu’on corrige.
 *   • **l’interrogation périodique**, pour ce qui arrive. Un corbeau reçu
 *     pendant qu’on est ailleurs sur le site allume la pastille tout seul.
 *
 * La valeur du serveur reste le point de départ : la page s’affiche avec le
 * bon chiffre, sans attendre une requête.
 */

/**
 * L’événement qu’émet tout écran qui vient de changer le nombre de non-lus.
 *
 * Un événement de fenêtre plutôt qu’un contexte React, et ce n’est pas de la
 * paresse : le bandeau vit dans un layout, les fils dans des pages, et les
 * deux ne partagent aucun arbre commun où poser un fournisseur. Passer par la
 * fenêtre est ici le chemin le plus court **et** le plus honnête — personne ne
 * dépend de personne, chacun annonce ou écoute.
 */
export const EVENEMENT_NON_LUS = "ravenshallow:corbeaux-lus";

/** À appeler après avoir lu, envoyé, ou retiré quelque chose de sa vue. */
export function signalerLectureCorbeaux() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENEMENT_NON_LUS));
}

export function useNonLus(initial: number): number {
  const [nonLus, setNonLus] = useState(initial);

  // Le serveur reprend la main quand il rend une nouvelle valeur — un
  // rechargement complet de la page, par exemple.
  useEffect(() => setNonLus(initial), [initial]);

  const relire = useCallback(async () => {
    const reponse = await fetch("/api/corbeaux/non-lus", { cache: "no-store" });
    if (!reponse.ok) return;
    const lu = (await reponse.json()) as { nonLus?: unknown };
    if (typeof lu.nonLus === "number") setNonLus(lu.nonLus);
  }, []);

  useRafraichissement(relire);

  useEffect(() => {
    const surLecture = () => void relire();
    window.addEventListener(EVENEMENT_NON_LUS, surLecture);
    return () => window.removeEventListener(EVENEMENT_NON_LUS, surLecture);
  }, [relire]);

  return nonLus;
}
