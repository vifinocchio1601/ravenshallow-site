"use server";

import { revalidatePath } from "next/cache";
import { archiverLeCompte, restaurerLeCompte } from "@/lib/dossier/archivage";

/**
 * Archiver et restaurer un compte — art. 7.3.
 *
 * **Le même geste dans les deux sens**, et c’est la règle : « le retour reste
 * possible ». Un archivage qu’on ne saurait pas défaire serait une exclusion
 * déguisée.
 *
 * Ni l’un ni l’autre ne touche à `statutAcces` : le compte garde son accès.
 * Le dépôt le tient, et la journalisation part dans la même transaction.
 */
const AUTEUR = "Administration";

function rafraichir() {
  revalidatePath("/admin/absences");
  // L'effectif des maisons change : les tubes et le tableau des compteurs
  // s'en trouvent modifiés, et un tournoi qui garderait l'ancien effectif
  // afficherait des moyennes fausses.
  revalidatePath("/admin/points");
  revalidatePath("/bureau");
}

export async function archiverAction(donnees: FormData) {
  const id = String(donnees.get("utilisateurId") ?? "");
  if (!id) return;
  await archiverLeCompte(id, AUTEUR);
  rafraichir();
}

export async function restaurerAction(donnees: FormData) {
  const id = String(donnees.get("utilisateurId") ?? "");
  if (!id) return;
  await restaurerLeCompte(id, AUTEUR);
  rafraichir();
}
