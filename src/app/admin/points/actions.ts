"use server";

import { revalidatePath } from "next/cache";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import {
  accorderDesPointsAUnEleve,
  ajusterLaMaison,
  annulerLAjustement,
  reprendreLesPointsAccordes,
  saisonEnCours,
} from "@/lib/points/depot";

/**
 * Ajouter et retirer des points, **depuis la zone d’administration et de
 * nulle part ailleurs**.
 *
 * Protégées par le middleware, qui n’ouvre `/admin` qu’avec une session
 * valide — mais une action serveur reste une route publique, appelable
 * directement : rien de ce qui compte n’est décidé ici. Le dépôt revalide le
 * motif, la valeur et la saison, et c’est lui qui écrit.
 *
 * Une maison inconnue fait **renoncer à tout**, jamais deviner : créditer au
 * hasard une maison qu’on n’a pas comprise est pire que ne rien faire.
 *
 * ⚠️ **Aucune permission attribuable n’ouvre ce geste**, et il ne faut pas en
 * créer une. Un professeur ou un modérateur qui veut un ajustement en fait la
 * demande par la Tour aux Corbeaux — décision du joueur. Le jour où un bouton
 * apparaîtrait ailleurs, c’est cette note-ci qu’on aura oublié de lire.
 */

/** Le nom qui restera dans l’historique. La zone d’administration n’a pas de comptes. */
const AUTEUR = TEXTES_POINTS.ajustement.parDefautAuteur;

function maisonValide(brut: string): Maison | null {
  return (MAISONS as readonly string[]).includes(brut) ? (brut as Maison) : null;
}

/** Les deux écrans où un compteur se voit. Le bureau porte les tubes. */
function rafraichir() {
  revalidatePath("/admin/points");
  revalidatePath("/bureau");
}

export type EtatAjustement = { erreur: string | null; fait: boolean };

/**
 * Le formulaire renvoie son message plutôt qu’un silence.
 *
 * Un bouton qui ne fait rien parce que le motif était vide est le pire des
 * retours : on recommence, on ne comprend pas, et on finit par croire que
 * l’écran est cassé. La validation vit dans le dépôt, la phrase remonte ici.
 */
export async function ajusterAction(
  _precedent: EtatAjustement,
  donnees: FormData,
): Promise<EtatAjustement> {
  const maison = maisonValide(String(donnees.get("maison") ?? ""));
  const brut = String(donnees.get("points") ?? "").trim();
  const motif = String(donnees.get("motif") ?? "");

  const E = TEXTES_POINTS.ajustement.erreurs;
  if (!maison) return { erreur: E.valeurRequise, fait: false };

  // `Number()` rend `0` pour une chaîne vide : sans ce garde, un champ laissé
  // vide se lirait comme un ajustement de zéro point.
  const points = brut === "" ? Number.NaN : Number(brut);

  const saison = await saisonEnCours();
  if (!saison) return { erreur: E.saisonFermee, fait: false };

  const resultat = await ajusterLaMaison(saison.id, maison, points, motif, AUTEUR);
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

/**
 * Annuler, sans effacer : la ligne reste dans l’historique, barrée, et les
 * points reviennent au compteur.
 */
export async function annulerAjustementAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await annulerLAjustement(id, AUTEUR);
  rafraichir();
}

export type EtatDon = { erreur: string | null; fait: boolean };

/**
 * **Donner des points à un joueur** — art. 18.1.
 *
 * À ne pas confondre avec `ajusterAction`, juste au-dessus : celle-ci vise un
 * élève et alimente **les deux compteurs** (art. 18.2), celle-là vise une
 * maison et n’alimente que le sien. Deux gestes voisins, deux effets
 * différents, et c’est pour cela qu’ils portent deux formulaires distincts
 * plutôt qu’un seul avec un interrupteur.
 */
export async function donnerAction(
  _precedent: EtatDon,
  donnees: FormData,
): Promise<EtatDon> {
  const eleveId = String(donnees.get("eleveId") ?? "");
  const brut = String(donnees.get("points") ?? "").trim();
  const motif = String(donnees.get("motif") ?? "");

  const E = TEXTES_POINTS.ajustement.erreurs;
  if (!eleveId) return { erreur: E.eleveIntrouvable, fait: false };

  // `Number()` rend `0` pour une chaîne vide : sans ce garde, un champ laissé
  // vide se lirait comme un don de zéro point.
  const points = brut === "" ? Number.NaN : Number(brut);

  const resultat = await accorderDesPointsAUnEleve(eleveId, points, motif, AUTEUR);
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

/** Reprendre ce qui a été donné. La ligne reste, barrée. */
export async function reprendreDonAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await reprendreLesPointsAccordes(id);
  rafraichir();
}
