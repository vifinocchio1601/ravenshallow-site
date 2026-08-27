"use server";

import { revalidatePath } from "next/cache";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import { cloturerLaSaison } from "@/lib/points/cloture";
import { recalculerLesCompteurs, saisonEnCours } from "@/lib/points/depot";

/**
 * Clore une session, et refaire les compteurs.
 *
 * Deux gestes qui n’ont rien à voir, dans le même fichier parce qu’ils
 * partagent le même écran : l’un ferme une année, l’autre répare un total.
 *
 * ⚠️ **La clôture est le geste le plus irréversible du site.** Le classement
 * est figé — la base refuse ensuite de le réécrire —, et la session ne se
 * rouvre pas. Rien ici ne le décide : le dépôt revalide tout, et l’écran
 * demande confirmation avant d’envoyer.
 */

const AUTEUR = TEXTES_POINTS.ajustement.parDefautAuteur;

export type EtatCloture = { erreur: string | null; message: string | null };

export async function cloturerAction(
  _precedent: EtatCloture,
  donnees: FormData,
): Promise<EtatCloture> {
  const nom = String(donnees.get("nom") ?? "");
  // `getAll` et non `get` : une case cochée par élève, et il y en a autant
  // que de fiches. `get` n'en rendrait qu'une, la première, et tous les
  // autres passages seraient perdus en silence.
  const passages = donnees.getAll("passe").map(String).filter(Boolean);

  const resultat = await cloturerLaSaison(nom, passages, AUTEUR);
  if (!resultat.ok) return { erreur: resultat.message, message: null };

  revalidatePath("/admin/cloture");
  revalidatePath("/admin/points");
  revalidatePath("/bureau");

  const T = TEXTES_POINTS.cloture.resultat;
  const passes =
    resultat.passes === 0
      ? T.aucunPasse
      : resultat.passes === 1
        ? T.unPasse
        : T.desPasses.replace("{n}", String(resultat.passes));

  const message = resultat.gagnante
    ? T.fait
        .replace("{gagnante}", NOMS_MAISON[resultat.gagnante] ?? resultat.gagnante)
        .replace("{passes}", passes)
    : T.faitSansGagnante.replace("{passes}", passes);

  return { erreur: null, message };
}

/**
 * **Refaire les quatre compteurs depuis le carnet.**
 *
 * Le filet du lot entier : le jour où un total serait faux — un bug, une
 * transaction à moitié passée, une commande tapée à la main —, ce bouton le
 * reconstruit à partir de ce qui s’est réellement produit.
 *
 * Il ne peut rien casser : il n’écrit que des totaux déduits, et ne touche ni
 * au carnet, ni aux ajustements, ni aux points personnels. On peut le presser
 * sans rien risquer, et deux fois de suite sans rien changer.
 */
export async function recalculerAction() {
  const saison = await saisonEnCours();
  if (!saison) return;

  await recalculerLesCompteurs(saison.id);
  revalidatePath("/admin/points");
  revalidatePath("/admin/cloture");
  revalidatePath("/bureau");
}
