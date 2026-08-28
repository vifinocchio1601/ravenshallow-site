"use server";

import { deposerDemande } from "@/lib/partenariat/depot";

/**
 * Le geste du formulaire public de partenariat.
 *
 * **Rien n'est validé ici** : une action serveur reste une route publique
 * appelable directement, et tout ce qui décide — les freins comme la saisie —
 * vit dans `lib/partenariat/depot.ts`, qui appelle lui-même `freins.ts` et
 * `schema.ts`. L'action ne fait que traduire.
 *
 * ⚠️ **Rien à revalider.** Une demande déposée ne change aucune page publique :
 * elle n'apparaît que dans `/admin/partenaires`, qui est rendu à chaque
 * visite. Ajouter un `revalidatePath` ici donnerait à croire le contraire.
 */

/** Ce que le formulaire sait de son dernier envoi. */
export type EtatDemande = { erreur: string | null; envoye: boolean };

export async function demanderAction(
  _precedent: EtatDemande,
  donnees: FormData,
): Promise<EtatDemande> {
  const resultat = await deposerDemande({
    nom: donnees.get("nom"),
    url: donnees.get("url"),
    courriel: donnees.get("courriel"),
    message: donnees.get("message"),
    pot: donnees.get("site"),
    ouvertLe: donnees.get("ouvertLe"),
  });

  if (!resultat.ok) return { erreur: resultat.message, envoye: false };
  return { erreur: null, envoye: true };
}
