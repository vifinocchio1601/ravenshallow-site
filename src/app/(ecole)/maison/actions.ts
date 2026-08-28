"use server";

import { revalidatePath } from "next/cache";
import { peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { ROUTES } from "@/lib/ecole/menu";
import { compteConnecte } from "@/lib/session/garde";
import { aUneMaison } from "@/lib/session/acces";
import { epinglerUnMot, retirerUnMot } from "@/lib/tableau/depot";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import { libellePlace, type Maison } from "@/lib/dossier/etats";

/**
 * Les gestes du tableau d'affichage.
 *
 * ⚠️ **Tout est refait ici, en entier.** Une action serveur reste une route
 * publique appelable directement : la session, la maison, et le droit
 * d'écrire sont relus à chaque appel. Ce que la page a déjà vérifié pour
 * afficher un bouton ne protège rien — un bouton absent n'a jamais gardé une
 * porte.
 *
 * **La maison n'est jamais reçue du formulaire.** Elle est relue sur la fiche
 * du compte connecté : la passer en champ caché laisserait épingler un mot au
 * tableau d'une autre maison en changeant une valeur.
 */

export type EtatMot = { erreur: string | null; fait: boolean };

/** Ce que tout geste doit établir avant de toucher au mur. */
async function auTableau() {
  const compte = await compteConnecte();
  if (!compte || !compte.eleveId || !aUneMaison(compte)) return null;

  // `aUneMaison` dit que sa maison s'affiche ; c'est bien la sienne qu'on lui
  // ouvre, et jamais celle qu'un formulaire annoncerait.
  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) return null;

  const pouvoirs = await pouvoirsDe(compte.id);
  return {
    eleveId: compte.eleveId,
    maison,
    nom: compte.prenomNom,
    place: libellePlace(compte.fonction, compte.roleAffiche),
    peutEcrire: peutEcrireLesAnnoncesDe(pouvoirs, maison),
  };
}

export async function epinglerAction(
  _precedent: EtatMot,
  donnees: FormData,
): Promise<EtatMot> {
  const au = await auTableau();
  if (!au) return { erreur: TEXTES_TABLEAU.erreurs.pasLeDroit, fait: false };

  const resultat = await epinglerUnMot({
    maison: au.maison,
    auteurId: au.eleveId,
    corps: donnees.get("corps"),
    aLeDroit: au.peutEcrire,
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  revalidatePath(ROUTES.maison);
  return { erreur: null, fait: true };
}

/**
 * Décrocher un mot.
 *
 * Deux droits mènent ici — **le sien**, toujours, et **le ménage** pour qui
 * tient le tableau. Le dépôt tranche entre les deux ; l'action ne fait que
 * lui passer ce qu'il faut pour le faire.
 */
export async function retirerAction(donnees: FormData) {
  const au = await auTableau();
  if (!au) return;

  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await retirerUnMot({
    id,
    maison: au.maison,
    parId: au.eleveId,
    // Un NOM, figé : voir la migration. Un identifiant serait vidé le jour où
    // ce compte disparaît, et la contrainte tomberait toute seule.
    parNom: au.nom,
    peutFaireLeMenage: au.peutEcrire,
  });

  revalidatePath(ROUTES.maison);
}
