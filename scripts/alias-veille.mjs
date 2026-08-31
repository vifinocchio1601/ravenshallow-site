/**
 * Apprend à Node les chemins du projet, le temps d'une ronde.
 *
 * ── Pourquoi ce fichier existe ──
 *
 * La Veille est du TypeScript ordinaire du projet, et elle importe les
 * coutures du site : `maisonQuiCompte` pour savoir qui marque, `effectifsParMaison`
 * pour l'effectif, `PLANCHER_EFFECTIF` pour le classement. **C'est
 * indispensable** : une surveillance qui recopierait ces règles finirait par
 * vérifier ses propres calculs au lieu de ceux du site, et le jour où l'une
 * changerait, La Veille signalerait une anomalie qui n'en est pas — ou pire,
 * n'en signalerait plus une qui en est une.
 *
 * Node 24 exécute le TypeScript sans outil supplémentaire. Ce qu'il ne sait
 * pas faire, c'est résoudre les trois formes d'import que TypeScript autorise
 * et que tout le projet emploie :
 *
 *   import … from "@/lib/ecole/tournoi"     l'alias du tsconfig
 *   import … from "./constantes"            un relatif sans extension
 *   import … from "@/config/points.json"    un JSON, qui réclame un attribut
 *
 * Une trentaine de lignes suffisent, et c'est pourquoi le projet ne gagne
 * aucune dépendance : ni `tsx`, ni `ts-node`, ni `esbuild`. Même parti pris
 * que `sharp`, installé le temps d'une conversion et jamais gardé.
 *
 * ── Ce qu'il ne fait pas ──
 *
 * Il ne type rien. `npx tsc --noEmit` reste le seul juge des types, et
 * `npm test` le seul juge du comportement. Ceci n'est qu'un aiguilleur.
 *
 *   node --import ./scripts/alias-veille.mjs src/lib/veille/ronde.ts
 */

import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = pathToFileURL(`${process.cwd()}/src/`);

/**
 * Les suffixes essayés, dans l'ordre.
 *
 * ⚠️ **La chaîne vide vient en premier**, pour qu'un import qui porte déjà son
 * extension ne se fasse pas doubler par un homonyme. `./constantes.ts` doit
 * rester `./constantes.ts`, jamais devenir `./constantes.ts.ts`.
 */
const SUFFIXES = ["", ".ts", ".tsx", ".json", "/index.ts"];

/** L'adresse du fichier réel, ou `null` si aucun suffixe ne tombe juste. */
function fichier(base) {
  for (const bout of SUFFIXES) {
    if (existsSync(fileURLToPath(base + bout))) return base + bout;
  }
  return null;
}

registerHooks({
  resolve(specifier, contexte, suivant) {
    /**
     * ⚠️ **On ne touche jamais à ce qui vient de `node_modules`.**
     *
     * Le hook attrapait les imports relatifs des paquets installés, y compris
     * ceux qui sont en CommonJS. `nodemailer` demande `./lib/mailer` ; on lui
     * rendait une URL `file://…`, que le chargeur CommonJS ne sait pas lire, et
     * la ronde tombait sur un « Cannot find module » qui accusait nodemailer
     * d'un défaut qui venait d'ici.
     *
     * Ce résolveur existe pour les conventions de TypeScript, qui ne valent
     * que dans le code du projet. Hors de là, Node sait déjà faire.
     */
    if (contexte.parentURL?.includes("/node_modules/")) {
      return suivant(specifier, contexte);
    }

    let base = null;

    if (specifier.startsWith("@/")) {
      base = new URL(specifier.slice(2), RACINE).href;
    } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
      if (!contexte.parentURL) return suivant(specifier, contexte);
      base = new URL(specifier, contexte.parentURL).href;
    } else {
      // Un paquet de `node_modules` : Node sait déjà.
      return suivant(specifier, contexte);
    }

    const trouve = fichier(base);
    // Rien trouvé : on laisse Node se plaindre lui-même, il le fait mieux.
    if (!trouve) return suivant(specifier, contexte);

    const resolu = suivant(trouve, contexte);

    // ⚠️ L'attribut se pose sur le RÉSULTAT, pas sur le contexte transmis :
    // le chargeur ne relit pas celui-ci, et refuse alors le JSON avec un
    // « needs an import attribute » qui ne dit pas d'où il vient.
    return trouve.endsWith(".json")
      ? { ...resolu, importAttributes: { type: "json" } }
      : resolu;
  },
});
