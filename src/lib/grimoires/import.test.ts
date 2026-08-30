import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validerBloc } from "./schema";

/**
 * **Ce que l'import a produit passe par la vraie porte.**
 *
 * `scripts/poser-grimoire.mjs` écrit en base sans pouvoir appeler
 * `validerBloc` : un script Node n'importe pas un module `server-only` sans
 * un outillage qui n'est pas installé sur ce poste. Il refait donc les
 * vérifications que la base ne peut pas voir — matière du cursus, année,
 * runes, régularité d'un tableau — et **cet essai comble l'écart** : il
 * repasse chaque bloc du fichier produit dans le schéma, celui qu'emprunte
 * l'écran d'administration.
 *
 * Le jour où le schéma durcira une règle que l'import ne respecte pas, c'est
 * ici que ça tombera — avant d'écrire en base, et non six mois plus tard sur
 * une page blanche.
 *
 * ⚠️ **`.donnees/` n'est pas dans le dépôt** : ce sont des données, pas du
 * code. L'essai est donc silencieux quand le fichier n'a pas été produit —
 * il ne peut pas juger ce qu'il n'a pas.
 */

const DOSSIER = ".donnees";

function volumes(): string[] {
  if (!existsSync(DOSSIER)) return [];
  return readdirSync(DOSSIER)
    .filter((f) => /^grimoire-.*\.json$/.test(f))
    .map((f) => join(DOSSIER, f));
}

describe("les grimoires importés", () => {
  const fichiers = volumes();

  it.skipIf(fichiers.length === 0)(
    "n’ont aucun bloc que le schéma refuserait",
    () => {
      const refuses: string[] = [];

      for (const fichier of fichiers) {
        const volume = JSON.parse(readFileSync(fichier, "utf8")) as {
          slug: string;
          chapitres: {
            slug: string;
            blocs: { type: string; donnees: unknown; ancre: string | null }[];
          }[];
        };

        for (const chapitre of volume.chapitres) {
          for (const [i, bloc] of chapitre.blocs.entries()) {
            const r = validerBloc(bloc);
            if (!r.ok) {
              refuses.push(
                `${volume.slug}/${chapitre.slug} — bloc ${i} (${bloc.type}) : ${r.message}`,
              );
            }
          }
        }
      }

      expect(refuses).toEqual([]);
    },
  );
});
