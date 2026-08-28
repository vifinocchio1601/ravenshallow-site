import { nettoyerTexteLibre } from "@/lib/texte";
import { TEXTES_SALON } from "./constantes";
import { MESSAGE_MAX } from "./limites";

/**
 * Ce qu'un message de salon a le droit d'être.
 *
 * **Partagé mot pour mot entre le champ et la route** — comme
 * `corbeaux/schema.ts` et `tableau/schema.ts`, et pour la même raison : deux
 * validations qui divergent, c'est quelqu'un à qui l'on refuse ce que l'écran
 * acceptait.
 *
 * Pas `server-only` : il n'y a pas de balisage à nettoyer, donc rien à cacher
 * au navigateur. Le texte est rendu par React, donc échappé d'office.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_SALON.erreurs;

export function validerMessage(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.vide };

  // Le ménage des corbeaux : les caractères de contrôle s'en vont, les
  // retours à la ligne restent — un message peut tenir en deux lignes.
  const net = nettoyerTexteLibre(brut).trim();

  if (net.length === 0) return { ok: false, message: E.vide };
  if (net.length > MESSAGE_MAX) {
    return {
      ok: false,
      message: E.tropLong.replace("{max}", String(MESSAGE_MAX)),
    };
  }
  return { ok: true, valeur: net };
}
