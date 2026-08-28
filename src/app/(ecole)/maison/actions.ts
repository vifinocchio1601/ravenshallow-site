"use server";

import { revalidatePath } from "next/cache";
import { peutEcrireLesAnnoncesDe, peutVisiterLaMaison } from "@/lib/forum/pouvoirs";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { ROUTES } from "@/lib/ecole/menu";
import { compteConnecte } from "@/lib/session/garde";
import { aUneMaison } from "@/lib/session/acces";
import { epinglerUnMot, retirerUnMot } from "@/lib/tableau/depot";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import {
  cleDeMaison,
  libellePlace,
  maisonDepuisCle,
  type Maison,
} from "@/lib/dossier/etats";

/**
 * Les gestes du tableau d'affichage.
 *
 * ⚠️ **Tout est refait ici, en entier.** Une action serveur reste une route
 * publique appelable directement : la session, la maison visée et le droit
 * d'écrire sont relus à chaque appel. Ce que la page a vérifié pour afficher
 * un bouton ne protège rien.
 *
 * ⚠️ **La maison vient bien de la requête maintenant — et le serveur vérifie
 * qu'on a le droit d'y être.** C'était l'inverse jusqu'au 28 août 2026 : elle
 * était relue sur la fiche, ce qui interdisait le tableau d'une autre maison à
 * tout le monde, staff compris. La directrice avait donc un pouvoir sans
 * chemin. Le sens de la garde n'a pas changé pour autant : **c'est
 * `peutVisiterLaMaison` qui décide**, jamais le formulaire.
 */

export type EtatMot = { erreur: string | null; fait: boolean };

/** Ce que tout geste doit établir avant de toucher au mur d'une maison. */
async function auTableau(cle: unknown) {
  const visee = typeof cle === "string" ? maisonDepuisCle(cle) : null;
  if (!visee) return null;

  const compte = await compteConnecte();
  if (!compte || !compte.eleveId) return null;

  const pouvoirs = await pouvoirsDe(compte.id);
  // Sa maison **au sens de l'affichage** : une directrice en `SANS_OBJET` n'en
  // a aucune, même si la colonne en garde une au chaud.
  const laSienne = aUneMaison(compte) ? ((compte.maison ?? null) as Maison) : null;

  if (!peutVisiterLaMaison(pouvoirs, laSienne, visee)) return null;

  return {
    eleveId: compte.eleveId,
    maison: visee,
    nom: compte.prenomNom,
    place: libellePlace(compte.fonction, compte.roleAffiche),
    peutEcrire: peutEcrireLesAnnoncesDe(pouvoirs, visee),
  };
}

/** Les deux adresses d'une maison : la sienne, et la visite. */
function rafraichir(maison: Maison) {
  revalidatePath(ROUTES.maison);
  revalidatePath(`${ROUTES.maisons}/${cleDeMaison(maison)}`);
}

export async function epinglerAction(
  _precedent: EtatMot,
  donnees: FormData,
): Promise<EtatMot> {
  const au = await auTableau(donnees.get("maison"));
  if (!au) return { erreur: TEXTES_TABLEAU.erreurs.pasLeDroit, fait: false };

  const resultat = await epinglerUnMot({
    maison: au.maison,
    auteurId: au.eleveId,
    corps: donnees.get("corps"),
    aLeDroit: au.peutEcrire,
  });

  if (!resultat.ok) return { erreur: resultat.message, fait: false };

  rafraichir(au.maison);
  return { erreur: null, fait: true };
}

/**
 * Décrocher un mot.
 *
 * Deux droits mènent ici — **le sien**, toujours, et **le ménage** pour qui
 * tient le tableau. Le dépôt tranche entre les deux.
 */
export async function retirerAction(donnees: FormData) {
  const au = await auTableau(donnees.get("maison"));
  if (!au) return;

  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await retirerUnMot({
    id,
    maison: au.maison,
    parId: au.eleveId,
    // Un NOM, figé : un identifiant serait vidé le jour où ce compte
    // disparaît, et la contrainte tomberait toute seule.
    parNom: au.nom,
    peutFaireLeMenage: au.peutEcrire,
  });

  rafraichir(au.maison);
}
