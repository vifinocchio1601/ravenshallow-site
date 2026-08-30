"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/ecole/menu";
import {
  corrigerChapitre,
  corrigerGrimoire,
  deplacerGrimoire,
  poserGrimoire,
  remettreGrimoire,
  retirerGrimoire,
} from "@/lib/grimoires/depot";

/**
 * Les gestes de la bibliothèque.
 *
 * Protégés par le middleware, qui n'ouvre `/admin` qu'avec une session
 * valide — mais **rien n'est validé ici** : une action serveur reste une
 * route publique appelable directement, et tout ce qui décide vit dans
 * `lib/grimoires/depot.ts`, qui appelle lui-même `schema.ts`. L'action ne
 * fait que traduire.
 */

export type EtatGrimoire = { erreur: string | null; fait: boolean };

/** Les écrans que toute écriture périme. */
function rafraichir() {
  revalidatePath("/admin/grimoires");
  revalidatePath(ROUTES.grimoires);
}

export async function poserAction(
  _precedent: EtatGrimoire,
  donnees: FormData,
): Promise<EtatGrimoire> {
  const resultat = await poserGrimoire({
    slug: donnees.get("slug"),
    titre: donnees.get("titre"),
    exergue: donnees.get("exergue"),
    description: donnees.get("description"),
    reliure: donnees.get("reliure"),
  });
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function corrigerAction(
  _precedent: EtatGrimoire,
  donnees: FormData,
): Promise<EtatGrimoire> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return { erreur: null, fait: false };

  const resultat = await corrigerGrimoire(id, {
    slug: donnees.get("slug"),
    titre: donnees.get("titre"),
    exergue: donnees.get("exergue"),
    description: donnees.get("description"),
    reliure: donnees.get("reliure"),
  });
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function chapitreAction(
  _precedent: EtatGrimoire,
  donnees: FormData,
): Promise<EtatGrimoire> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return { erreur: null, fait: false };

  const resultat = await corrigerChapitre(id, {
    titre: donnees.get("titre"),
    acces: donnees.get("acces"),
  });
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function retirerAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (id) await retirerGrimoire(id);
  rafraichir();
}

export async function remettreAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (id) await remettreGrimoire(id);
  rafraichir();
}

export async function deplacerAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  const sens = donnees.get("sens") === "-1" ? -1 : 1;
  if (id) await deplacerGrimoire(id, sens);
  rafraichir();
}
