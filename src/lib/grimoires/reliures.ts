/**
 * **Les quatre reliures**, et leur ordre.
 *
 * Une liste courte plutôt qu'une couleur libre : les quatre se dessinent dans
 * la feuille de style, et un volume ne peut pas arriver avec une teinte qui
 * jure avec le reste de l'étagère. Même parti pris que les couleurs de la
 * barre de mise en forme, qui sont des classes et jamais des `style`.
 *
 * ⚠️ **Aucun import**, comme `calendrier/natures.ts` : les textes, le schéma
 * et le dépôt y puisent sans qu'un cycle se forme. La liste est la source, et
 * l'enum de la base la reflète — une cinquième reliure se poserait ici **et**
 * dans une migration.
 */

export const RELIURES = [
  "CUIR_SOMBRE",
  "CUIR_FAUVE",
  "TOILE_BLEUE",
  "PARCHEMIN",
] as const;

export type Reliure = (typeof RELIURES)[number];

/** Ce que le formulaire envoie est-il une reliure ? */
export function estUneReliure(brut: unknown): brut is Reliure {
  return (
    typeof brut === "string" && (RELIURES as readonly string[]).includes(brut)
  );
}

/**
 * **La classe qui peint le dos d'un volume.**
 *
 * Les quatre teintes vivent dans `globals.css`, jamais en ligne : une
 * couleur écrite dans un composant échappe à la relecture, et
 * `reliures.test.ts` vérifie que chacune est bien stylée — une reliure
 * acceptée mais sans effet serait un piège silencieux. Même procédé que les
 * couleurs de la barre de mise en forme.
 */
export const CLASSE_RELIURE: Record<Reliure, string> = {
  CUIR_SOMBRE: "reliure--cuir-sombre",
  CUIR_FAUVE: "reliure--cuir-fauve",
  TOILE_BLEUE: "reliure--toile-bleue",
  PARCHEMIN: "reliure--parchemin",
};
