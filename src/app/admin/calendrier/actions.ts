"use server";

import { revalidatePath } from "next/cache";
import {
  corrigerEvenement,
  poserEvenement,
  remettreEvenement,
  retirerEvenement,
} from "@/lib/calendrier/depot";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Les gestes du calendrier.
 *
 * Protégés par le middleware, qui n'ouvre `/admin` qu'avec une session valide
 * — mais **rien n'est validé ici** : une action serveur reste une route
 * publique appelable directement, et tout ce qui décide vit dans
 * `lib/calendrier/depot.ts`, qui appelle lui-même `schema.ts`. L'action ne
 * fait que traduire.
 *
 * ⚠️ **Trois pages à revalider, et l'oubli ne se voit pas.** Le bureau en
 * fait partie : c'est lui qui annonce la prochaine épreuve, et une date
 * corrigée qui y resterait fausse se lit comme une panne.
 */

/** Ce que le formulaire sait de son dernier envoi. */
export type EtatEvenement = { erreur: string | null; fait: boolean };

/** Les trois écrans que toute écriture périme. */
function rafraichir() {
  revalidatePath("/admin/calendrier");
  revalidatePath(ROUTES.calendrier);
  revalidatePath(ROUTES.bureau);
}

export async function poserAction(
  _precedent: EtatEvenement,
  donnees: FormData,
): Promise<EtatEvenement> {
  const resultat = await poserEvenement({
    titre: donnees.get("titre"),
    description: donnees.get("description"),
    nature: donnees.get("nature"),
    debut: donnees.get("debut"),
    fin: donnees.get("fin"),
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function corrigerAction(
  _precedent: EtatEvenement,
  donnees: FormData,
): Promise<EtatEvenement> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return { erreur: null, fait: false };

  const resultat = await corrigerEvenement(id, {
    titre: donnees.get("titre"),
    description: donnees.get("description"),
    nature: donnees.get("nature"),
    debut: donnees.get("debut"),
    fin: donnees.get("fin"),
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

/**
 * Retirer, et remettre.
 *
 * **Le retrait n'efface rien** — il pose une date —, et c'est justement ce qui
 * permet à `remettreAction` d'exister. Même dispositif qu'au Grand Hall.
 */
export async function retirerAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;
  await retirerEvenement(id);
  rafraichir();
}

export async function remettreAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;
  await remettreEvenement(id);
  rafraichir();
}
