/**
 * Les poussières en suspension dans la lumière de la lampe.
 *
 * **Tirées d’une suite reproductible, et non de `Math.random()`.** Un tirage
 * au hasard donnerait au serveur et au navigateur deux résultats différents,
 * et React refuserait d’hydrater la page en signalant une divergence à chaque
 * chargement. La même graine des deux côtés produit la même poussière — le
 * décor n’y perd rien, personne ne remarque qu’un grain est toujours au même
 * endroit.
 *
 * Les valeurs sont celles de la maquette : cinquante-huit grains, montée de
 * vingt-deux à cinquante-deux secondes, dérive latérale de quarante pixels de
 * part et d’autre.
 */

/**
 * Générateur reproductible (mulberry32) — celui de la maquette.
 *
 * Il n’a rien de cryptographique et n’a pas à l’être : il ne décide de rien
 * d’autre que de la place d’un grain de poussière.
 */
function suite(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Poussiere = {
  /** En pourcentage de la largeur. */
  gauche: number;
  /** Dérive latérale sur toute la montée, en pixels. */
  dx: number;
  /** Durée de la montée, en secondes. */
  duree: number;
  /** Retard négatif : les grains ne partent pas tous ensemble au chargement. */
  retard: number;
  opacite: number;
};

const arrondi = (valeur: number, decimales = 2) =>
  Number(valeur.toFixed(decimales));

const tirage = suite(0x62_6a_6f_72);

export const POUSSIERES: readonly Poussiere[] = Array.from(
  { length: 58 },
  () => ({
    gauche: arrondi(tirage() * 100),
    dx: arrondi(tirage() * 80 - 40, 1),
    duree: arrondi(22 + tirage() * 30, 1),
    retard: arrondi(-tirage() * 40, 1),
    opacite: arrondi(0.25 + tirage() * 0.5),
  }),
);
