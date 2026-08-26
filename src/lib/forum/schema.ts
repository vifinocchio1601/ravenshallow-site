import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import { TEXTES_FORUM } from "./constantes";
import { lignesManquantes, respecteLeMinimum } from "./longueur";

/**
 * Ce qu’un titre, un post et un avertissement ont le droit d’être.
 *
 * **Seule source de vérité de la validation**, partagée mot pour mot entre le
 * champ de saisie et la route d’API. Pas de `server-only` : le champ en a
 * besoin pour compter les lignes pendant la frappe, et une règle recopiée des
 * deux côtés finit toujours par diverger — un joueur verrait « 10 lignes » à
 * l’écran et se ferait refuser son post.
 *
 * La base porte les mêmes limites, **en plus grossier** : au moins un signe
 * qui ne soit pas un blanc, et pas plus de tant. Elle n’arrête que ce qui
 * casserait l’affichage, et le fait pour tous les chemins — le site, un
 * script, une commande tapée à la main. Le travail fin est ici.
 */

/** Alignés sur les contraintes `CHECK` de `20260826120000_forum`. */
export const TITRE_MAX = 140;
export const POST_MAX = 60000;
/** Une mention, pas une explication : « violence », « deuil ». */
export const AVERTISSEMENT_MAX = 120;

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_FORUM.erreurs;

/**
 * Le titre d’une scène.
 *
 * Ramené à une seule ligne : un titre sur deux lignes casse l’alignement des
 * listes, et personne ne verrait pourquoi.
 *
 * **Le mode de participation n’est pas vérifié ici**, et ne doit pas l’être :
 * « (RÉSERVÉ Sigrid) » est une convention entre joueurs, pas une syntaxe. Un
 * titre sans mention passe, un titre avec une mention fantaisiste aussi.
 */
export function validerTitre(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.titreVide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: E.titreVide };
  if (net.length > TITRE_MAX) {
    return {
      ok: false,
      message: E.titreTropLong.replace("{max}", String(TITRE_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * Le corps d’un post, et **le minimum de lignes du lieu**.
 *
 * `lignesMinimum` vient de l’espace : dix dans le domaine (art. 12.2), aucun
 * ailleurs. Le message dit combien il en manque plutôt que « trop court » —
 * un compteur qui ne compte pas n’aide personne.
 */
export function validerPost(
  brut: unknown,
  lignesMinimum: number | null,
): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.corpsVide };
  const net = nettoyerTexteLibre(brut);

  if (net.length === 0) return { ok: false, message: E.corpsVide };
  if (net.length > POST_MAX) {
    return {
      ok: false,
      message: E.corpsTropLong.replace("{max}", String(POST_MAX)),
    };
  }
  if (!respecteLeMinimum(net, lignesMinimum)) {
    return {
      ok: false,
      message: E.tropCourt
        .replace("{n}", String(lignesManquantes(net, lignesMinimum)))
        .replace("{min}", String(lignesMinimum)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * L’avertissement de contenu — art. 16.3.
 *
 * **Facultatif, et il doit le rester.** Un champ vide, absent ou fait
 * d’espaces rend `null`, jamais une erreur : on le propose au moment de
 * publier, on ne le réclame pas. Quelqu’un qui écrit une scène difficile ne
 * doit pas avoir à négocier avec un formulaire.
 */
export function validerAvertissement(brut: unknown): Resultat<string | null> {
  if (brut === null || brut === undefined) return { ok: true, valeur: null };
  if (typeof brut !== "string") return { ok: true, valeur: null };

  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: true, valeur: null };
  if (net.length > AVERTISSEMENT_MAX) {
    return {
      ok: false,
      message: E.avertissementTropLong.replace(
        "{max}",
        String(AVERTISSEMENT_MAX),
      ),
    };
  }
  return { ok: true, valeur: net };
}
