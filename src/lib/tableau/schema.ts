import { nettoyerTexteLibre } from "@/lib/texte";
import { TEXTES_TABLEAU } from "./constantes";
import { MOT_MAX } from "./limites";

/**
 * Ce qu'un mot du tableau a le droit d'être.
 *
 * **Partagé mot pour mot entre le champ de saisie et l'action serveur** —
 * comme `corbeaux/schema.ts`, et pour la même raison : deux validations qui
 * divergent, c'est un joueur à qui l'on refuse ce que l'écran acceptait.
 *
 * ⚠️ **Ce fichier n'est PAS `server-only`**, à la différence de
 * `annonces/schema.ts` et `forum/schema.ts`. Ceux-là embarquent le nettoyeur
 * de balisage ; ici il n'y a pas de balisage du tout — un mot est du texte
 * brut, rendu par React donc échappé d'office. Rien à cacher au navigateur.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_TABLEAU.erreurs;

export function validerMot(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.vide };

  // Le même ménage que sur un corbeau : les caractères de contrôle s'en vont,
  // les retours à la ligne restent — un mot peut tenir en deux lignes.
  const net = nettoyerTexteLibre(brut).trim();

  if (net.length === 0) return { ok: false, message: E.vide };
  if (net.length > MOT_MAX) {
    return { ok: false, message: E.tropLong.replace("{max}", String(MOT_MAX)) };
  }
  return { ok: true, valeur: net };
}
