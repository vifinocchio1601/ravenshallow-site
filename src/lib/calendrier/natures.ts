/**
 * **Les trois natures d'un événement**, et leur ordre d'affichage.
 *
 * Un fichier à part, **sans aucun import**, pour la même raison que
 * `corbeaux/constantes.ts` : les textes s'y réfèrent, le schéma de validation
 * aussi, et le dépôt encore — un cycle se formerait au premier raccourci.
 *
 * ⚠️ **La liste est la source, et l'enum de la base la reflète.** Le jour où
 * une quatrième nature apparaîtrait, elle se pose ici ET dans une migration :
 * Postgres ne sait pas ajouter une valeur d'enum depuis le code.
 */

export const NATURES = ["EPREUVE", "FETE", "SESSION"] as const;

export type NatureEvenement = (typeof NATURES)[number];

/** Ce que le navigateur envoie est-il une nature ? */
export function estUneNature(brut: unknown): brut is NatureEvenement {
  return (
    typeof brut === "string" && (NATURES as readonly string[]).includes(brut)
  );
}
