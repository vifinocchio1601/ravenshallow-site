import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { memoireVide, type Memoire } from "./anomalies";

/**
 * Ce qu'une ronde laisse à la suivante.
 *
 * ── Pourquoi pas la base ──
 *
 * Ce serait le rangement naturel — et il est fermé. La Veille n'a que le droit
 * de lire, et lui ouvrir une table en écriture pour tenir son carnet
 * percerait le principe qui la fonde. Une exception « juste pour ça » est
 * exactement ce qui, six mois plus tard, s'étend à autre chose.
 *
 * ── Le cache de GitHub, et ce qu'il faut savoir ──
 *
 * La mémoire vit donc dans un fichier que le workflow range dans le cache des
 * Actions, restauré au début et sauvé à la fin.
 *
 * ⚠️ **Le dépôt est public, donc ce cache n'est pas un coffre.** Un workflow
 * lancé depuis une bifurcation peut atteindre les caches de la branche par
 * défaut. Le fichier ne porte donc que des **empreintes d'anomalies et des
 * compteurs** — aucun nom, aucune adresse, aucun texte de membre. C'est la
 * règle « le rapport ne contient que des nombres » qui rend ce rangement
 * acceptable, pas l'inverse.
 *
 * ── Une mémoire absente n'est pas une panne ──
 *
 * C'est le cas normal de la première ronde, et de toute ronde qui suit une
 * éviction du cache. On repart d'une mémoire vide : les anomalies datent
 * d'aujourd'hui, les chiffres n'ont pas de moyenne, et le rapport le dit. Une
 * ronde qui refuserait de partir faute de carnet serait une ronde qui ne part
 * jamais le jour où l'on en a le plus besoin.
 */

/** Où le fichier vit, sauf indication contraire du workflow. */
export const CHEMIN_PAR_DEFAUT = ".veille/memoire.json";

/**
 * La forme attendue, vérifiée à la lecture.
 *
 * ⚠️ **On ne fait jamais confiance au contenu du fichier.** Il vient d'un
 * cache, il peut être tronqué par une exécution coupée, écrit par une version
 * antérieure du code, ou simplement vide. Un `JSON.parse` suivi d'un accès
 * direct ferait tomber la ronde sur un carnet abîmé — c'est-à-dire au pire
 * moment.
 */
function estUneMemoire(valeur: unknown): valeur is Memoire {
  if (typeof valeur !== "object" || valeur === null) return false;
  const m = valeur as Partial<Memoire>;
  return (
    typeof m.anomalies === "object" &&
    m.anomalies !== null &&
    Array.isArray(m.vie)
  );
}

export function lireLaMemoire(chemin: string = CHEMIN_PAR_DEFAUT): Memoire {
  try {
    const brut = JSON.parse(readFileSync(chemin, "utf8")) as unknown;
    if (!estUneMemoire(brut)) return memoireVide();

    // Les entrées d'anomalies d'une version antérieure peuvent manquer
    // `dernier` : on les rend inoffensives plutôt que de les jeter toutes.
    const anomalies: Memoire["anomalies"] = {};
    for (const [cle, valeur] of Object.entries(brut.anomalies)) {
      if (
        typeof valeur?.depuis === "string" &&
        typeof valeur?.jours === "number"
      ) {
        anomalies[cle] = {
          depuis: valeur.depuis,
          dernier: typeof valeur.dernier === "string" ? valeur.dernier : valeur.depuis,
          jours: valeur.jours,
        };
      }
    }

    return { anomalies, vie: brut.vie.filter((v) => typeof v?.jour === "string") };
  } catch {
    // Fichier absent, illisible, tronqué : le cas normal de la première ronde.
    // On repart de zéro plutôt que de faire échouer la ronde — voir l'en-tête.
    return memoireVide();
  }
}

/**
 * Range la mémoire pour demain.
 *
 * ⚠️ **Écriture atomique** — fichier temporaire puis renommage. Une ronde
 * coupée en plein milieu de l'écriture laisserait sinon un JSON tronqué, que
 * la ronde suivante jetterait : on perdrait l'historique pour une coupure de
 * quelques millisecondes. Même précaution que la sauvegarde de la base et que
 * l'échafaudage des dossiers.
 */
export function ecrireLaMemoire(
  memoire: Memoire,
  chemin: string = CHEMIN_PAR_DEFAUT,
): void {
  mkdirSync(dirname(chemin), { recursive: true });
  const temporaire = `${chemin}.tmp`;
  writeFileSync(temporaire, JSON.stringify(memoire, null, 2), "utf8");
  renameSync(temporaire, chemin);
}
