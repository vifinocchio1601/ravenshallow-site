import { z } from "zod";
import { TEXTES_CORBEAUX } from "./constantes";

/**
 * Ce qu’un corbeau a le droit de porter.
 *
 * **Seule source de vérité de la validation**, partagée mot pour mot entre le
 * champ de saisie et la route d’API — comme `lib/dossier/role-affiche.ts`.
 * Pas de `server-only` : le champ en a besoin pour compter les signes pendant
 * la frappe, et une règle recopiée des deux côtés finit toujours par diverger.
 *
 * La base porte la même limite, en plus grossier : « au moins un signe qui ne
 * soit pas un blanc, et pas plus de 5 000 ». Elle n’arrête que ce qui
 * casserait l’affichage, et le fait pour tous les chemins — le site, un
 * script, une commande tapée à la main. Le travail fin est ici.
 */

export const CORBEAU_MAX = 5000;

/** En deçà, on n’interroge pas encore la recherche : trop de réponses. */
export const RECHERCHE_MIN = 2;
export const RECHERCHE_MAX = 60;

/**
 * Un caractère de contrôle, **sauf le saut de ligne et la tabulation**.
 *
 * Le saut de ligne est précisément ce qu’on veut garder : les retours à la
 * ligne d’un corbeau s’affichent tels quels. La tabulation reste elle aussi —
 * quelqu’un qui colle un bout de texte indenté doit le retrouver indenté.
 *
 * Écrit en toutes lettres plutôt qu’en classe de caractères : une plage comme
 * `[-]` se lit mal, et la variante qu’on écrit parfois à sa place
 * contient de vrais caractères de contrôle, invisibles dans un éditeur et
 * perdus au premier copier-coller.
 */
function estCaractereDeControle(signe: string): boolean {
  if (signe === "\n" || signe === "\t") return false;
  const code = signe.codePointAt(0) ?? 0;
  return code < 0x20 || code === 0x7f;
}

/**
 * Le ménage fait avant tout examen.
 *
 * **Ce qu’on ne touche PAS mérite d’être dit** : ni les apostrophes droites,
 * ni la ponctuation, ni la casse. Le site écrit ses propres textes avec des
 * apostrophes typographiques ; il n’a pas à réécrire ceux d’un joueur. Un
 * bout de code collé, une citation, une orthographe personnelle doivent
 * ressortir tels qu’ils sont entrés.
 *
 * Quatre passes, dans cet ordre :
 *   1. les fins de ligne de Windows deviennent des sauts simples
 *   2. les caractères de contrôle disparaissent, sauf ceux qui servent
 *   3. les espaces en fin de ligne s’en vont, invisibles et sans usage
 *   4. plus de deux sauts de ligne d’affilée se ramènent à deux : une ligne
 *      vide sépare deux paragraphes, quarante ne séparent rien et poussent
 *      simplement le reste de la conversation hors de l’écran
 */
export function nettoyerCorbeau(brut: string): string {
  const sansControle = [...brut.replace(/\r\n?/g, "\n")]
    .filter((signe) => !estCaractereDeControle(signe))
    .join("");

  return sansControle
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const corbeauSchema = z
  .string()
  .transform(nettoyerCorbeau)
  .refine((v) => v.length > 0, TEXTES_CORBEAUX.erreurs.corpsVide)
  .refine(
    (v) => v.length <= CORBEAU_MAX,
    TEXTES_CORBEAUX.erreurs.corpsTropLong.replace("{max}", String(CORBEAU_MAX)),
  );

export type ResultatCorbeau =
  | { ok: true; corps: string }
  | { ok: false; message: string };

/**
 * Valide un corbeau. Appelée des deux côtés : par le champ à chaque frappe
 * pour griser le bouton, et par la route avant d’écrire — une route d’API
 * reste publique, et le champ se contourne en fermant JavaScript.
 */
export function validerCorbeau(brut: unknown): ResultatCorbeau {
  if (typeof brut !== "string") {
    return { ok: false, message: TEXTES_CORBEAUX.erreurs.corpsVide };
  }
  const lu = corbeauSchema.safeParse(brut);
  return lu.success
    ? { ok: true, corps: lu.data }
    : {
        ok: false,
        message:
          lu.error.issues[0]?.message ?? TEXTES_CORBEAUX.erreurs.corpsVide,
      };
}

/**
 * Ce qu’on accepte comme recherche de personnage.
 *
 * Rendue vide plutôt que refusée quand elle est trop courte : c’est l’état
 * normal des deux premières frappes, pas une faute à signaler.
 */
export function nettoyerRecherche(brut: unknown): string {
  if (typeof brut !== "string") return "";
  const nette = brut.replace(/\s+/g, " ").trim().slice(0, RECHERCHE_MAX);
  return nette.length >= RECHERCHE_MIN ? nette : "";
}

/** Le motif d’un signalement : facultatif, et court. */
export const MOTIF_MAX = 1000;

export type ResultatMotif =
  | { ok: true; valeur: string | null }
  | { ok: false; message: string };

/**
 * Le motif accompagne le signalement, il ne le conditionne pas.
 *
 * Un champ vide, absent ou fait d’espaces rend `null` — jamais une erreur :
 * **signaler doit rester un clic.** Quelqu’un qui subit des messages pénibles
 * n’a pas à rédiger un dossier pour être entendu.
 */
export function validerMotif(brut: unknown): ResultatMotif {
  if (brut === null || brut === undefined) return { ok: true, valeur: null };
  if (typeof brut !== "string") return { ok: true, valeur: null };

  const net = nettoyerCorbeau(brut);
  if (net.length === 0) return { ok: true, valeur: null };
  if (net.length > MOTIF_MAX) {
    return {
      ok: false,
      message: TEXTES_CORBEAUX.erreurs.corpsTropLong.replace(
        "{max}",
        String(MOTIF_MAX),
      ),
    };
  }
  return { ok: true, valeur: net };
}
