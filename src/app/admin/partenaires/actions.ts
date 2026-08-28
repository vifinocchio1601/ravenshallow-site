"use server";

import { revalidatePath } from "next/cache";
import type { SuiteDemande } from "@prisma/client";
import {
  ajouterPartenaire,
  changerLaSuite,
  corrigerPartenaire,
  remettrePartenaire,
  retirerPartenaire,
} from "@/lib/partenariat/depot";

/**
 * Les gestes du bloc de partenaires.
 *
 * Protégés par le middleware, qui n'ouvre `/admin` qu'avec une session valide
 * — mais **rien n'est validé ici** : une action serveur reste une route
 * publique appelable directement, et tout ce qui décide vit dans
 * `lib/partenariat/depot.ts`, qui appelle lui-même `schema.ts`. L'action ne
 * fait que traduire.
 *
 * ⚠️ **Deux pages à revalider.** La page publique est rendue à chaque visite,
 * mais `revalidatePath` y reste posé : le jour où elle passerait en statique,
 * un partenaire ajouté n'y apparaîtrait jamais, et personne ne saurait
 * pourquoi.
 */

/** Ce que le formulaire sait de son dernier envoi. */
export type EtatPartenaire = { erreur: string | null; fait: boolean };

function rafraichir() {
  revalidatePath("/admin/partenaires");
  revalidatePath("/partenariat");
}

function entrees(donnees: FormData) {
  return {
    nom: donnees.get("nom"),
    url: donnees.get("url"),
    banniere: donnees.get("banniere"),
    description: donnees.get("description"),
    noue: donnees.get("noue"),
  };
}

export async function ajouterAction(
  _precedent: EtatPartenaire,
  donnees: FormData,
): Promise<EtatPartenaire> {
  const resultat = await ajouterPartenaire(entrees(donnees));
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

export async function corrigerAction(
  _precedent: EtatPartenaire,
  donnees: FormData,
): Promise<EtatPartenaire> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return { erreur: null, fait: false };

  const resultat = await corrigerPartenaire(id, entrees(donnees));
  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir();
  return { erreur: null, fait: true };
}

/**
 * Retirer, et remettre.
 *
 * **Le retrait n'efface rien** — il pose une date —, et c'est justement ce qui
 * permet à `remettreAction` d'exister. Même dispositif qu'au Grand Hall et au
 * calendrier.
 */
export async function retirerAction(donnees: FormData): Promise<void> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await retirerPartenaire(id);
  rafraichir();
}

export async function remettreAction(donnees: FormData): Promise<void> {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await remettrePartenaire(id);
  rafraichir();
}

/**
 * La suite donnée à une demande.
 *
 * ⚠️ **Ce geste n'ajoute personne au bloc**, et l'écran le dit : une demande
 * porte ce qu'ils ont écrit, le bloc ce que nous affichons. Les enchaîner
 * ferait entrer au bloc un nom à rallonge et une ligne sans bannière.
 */
export async function suiteAction(donnees: FormData): Promise<void> {
  const id = String(donnees.get("id") ?? "");
  const suite = String(donnees.get("suite") ?? "");
  if (!id) return;

  if (suite !== "EN_ATTENTE" && suite !== "ACCEPTEE" && suite !== "REFUSEE") {
    return;
  }

  await changerLaSuite(id, suite as SuiteDemande);
  revalidatePath("/admin/partenaires");
}
