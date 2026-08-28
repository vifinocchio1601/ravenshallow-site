import "server-only";
import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import { TEXTES_FORUM } from "./constantes";
import { AVERTISSEMENT_MAX, POST_MAX, TITRE_MAX } from "./limites";
import {
  lignesManquantes,
  porteQuelqueChose,
  respecteLeMinimum,
} from "./longueur";
import { nettoyerHtml } from "./nettoyer-html";

/**
 * Ce qu’un titre, un post et un avertissement ont le droit d’être.
 *
 * **Seule source de vérité de la validation**, et **seule porte par laquelle
 * un post entre en base** : `validerPost` nettoie le balisage lui-même, si
 * bien qu’aucune route ne peut l’oublier. C’est le parti pris
 * d’`envoyerCorbeau`, appliqué au forum.
 *
 * **`server-only` depuis que le nettoyage y vit.** Ce que le champ de saisie
 * partage encore avec la route — le comptage — a été laissé dans
 * `longueur.ts`, et les plafonds dans `limites.ts` : ces deux-là restent
 * lisibles des deux côtés, et c’est ce qui empêche l’écran et le serveur de
 * se contredire.
 *
 * La base porte les mêmes limites, **en plus grossier** : au moins un signe
 * qui ne soit pas un blanc, et pas plus de tant. Elle n’arrête que ce qui
 * casserait l’affichage, et le fait pour tous les chemins — le site, un
 * script, une commande tapée à la main. Le travail fin est ici.
 */

export { AVERTISSEMENT_MAX, POST_MAX, TITRE_MAX };

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

  // Deux ménages, et l'ordre compte. Le premier retire les caractères de
  // contrôle, que le nettoyeur de balisage laisserait passer. Le second
  // réduit le balisage à la liste blanche — et c'est lui qui protège.
  const net = nettoyerHtml(nettoyerTexteLibre(brut));

  // Le vide se juge sur le CONTENU, pas sur la chaîne : « <p></p> » pèse sept
  // signes et ne dit rien. Sans cela, un post vide passerait chez les
  // non-mages, où aucun minimum ne le rattraperait.
  //
  // Une image compte ici — elle est du contenu —, et jamais dans le minimum
  // de lignes : sinon on atteindrait les dix lignes sans écrire une ligne de
  // jeu. Les deux questions ne sont pas la même.
  if (!porteQuelqueChose(net)) {
    return { ok: false, message: E.corpsVide };
  }
  if (net.length > POST_MAX) {
    return {
      ok: false,
      message: E.corpsTropLong.replace("{max}", String(POST_MAX)),
    };
  }
  if (!respecteLeMinimum(net, lignesMinimum)) {
    const manque = lignesManquantes(net, lignesMinimum);
    return {
      ok: false,
      // Une ligne au singulier : c’est le cas le plus fréquent — on est
      // presque toujours refusé à une ligne près — et « Il manque 1 lignes »
      // se lit mal au moment précis où l’on vient d’écrire.
      message: (manque === 1 ? E.tropCourtUneLigne : E.tropCourt)
        .replace("{n}", String(manque))
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
