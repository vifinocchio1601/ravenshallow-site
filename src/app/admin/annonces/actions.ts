"use server";

import { revalidatePath } from "next/cache";
import {
  corrigerAnnonce,
  publierAnnonce,
  remettreAnnonce,
  retirerAnnonce,
} from "@/lib/annonces/depot";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Les gestes du Grand Hall.
 *
 * Protégés par le middleware, qui n'ouvre `/admin` qu'avec une session valide
 * — mais **rien n'est validé ici** : une action serveur reste une route
 * publique appelable directement, et tout ce qui décide vit dans
 * `lib/annonces/depot.ts`, qui appelle lui-même `schema.ts`. L'action ne fait
 * que traduire.
 *
 * ⚠️ **Trois pages à revalider, et l'oubli ne se voit pas.** Une annonce
 * affichée qui ne paraîtrait pas au bureau, ou une annonce retirée qui y
 * resterait, se lit comme une panne : le journal est sur toutes les pages de
 * l'école.
 */

/** Ce que le formulaire sait de son dernier envoi. */
export type EtatAnnonce = { erreur: string | null; fait: boolean };

/** Les trois écrans que toute écriture périme. */
function rafraichir() {
  revalidatePath("/admin/annonces");
  revalidatePath(ROUTES.annonces);
  revalidatePath(ROUTES.bureau);
}

export async function publierAction(
  _precedent: EtatAnnonce,
  donnees: FormData,
): Promise<EtatAnnonce> {
  const resultat = await publierAnnonce({
    titre: donnees.get("titre"),
    corps: donnees.get("corps"),
    entreeEnVigueur: donnees.get("entreeEnVigueur"),
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function corrigerAction(
  _precedent: EtatAnnonce,
  donnees: FormData,
): Promise<EtatAnnonce> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return { erreur: null, fait: false };

  const resultat = await corrigerAnnonce(id, {
    titre: donnees.get("titre"),
    corps: donnees.get("corps"),
    entreeEnVigueur: donnees.get("entreeEnVigueur"),
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

/**
 * Retirer, et remettre.
 *
 * **Le retrait n'efface rien** — il pose une date —, et c'est justement ce qui
 * permet à `remettreAction` d'exister. Sans elle, un clic malheureux serait
 * définitif alors que la ligne est intacte.
 */
export async function retirerAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;
  await retirerAnnonce(id);
  rafraichir();
}

export async function remettreAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;
  await remettreAnnonce(id);
  rafraichir();
}
