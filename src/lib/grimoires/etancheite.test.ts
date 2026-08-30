import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * **Les grimoires ne se lisent que par leur dépôt.**
 *
 * Le filtrage des chapitres réservés vit dans `depot.ts`, qui appelle
 * `chapitresLisibles` et ne demande les blocs que des chapitres retenus. Une
 * requête écrite ailleurs — dans une page, une action serveur, un écran
 * d'administration — n'aurait aucune raison d'y penser, et le premier
 * oubli enverrait les quatre sortilèges interdits à un joueur.
 *
 * Même procédé que `corbeaux/etancheite.test.ts` et
 * `base/transaction.test.ts` : on relit le code source. Éprouvé en
 * introduisant la faute — un `prisma.blocGrimoire` dans une page le fait
 * tomber, et il nomme le fichier.
 */

const DEPOT = join("src", "lib", "grimoires", "depot.ts");

const TABLES = [
  "prisma.grimoire",
  "prisma.chapitreGrimoire",
  "prisma.blocGrimoire",
];

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) {
      trouves.push(...fichiers(chemin));
      continue;
    }
    if (!/\.tsx?$/.test(entree)) continue;
    if (/\.(test|essai)\.tsx?$/.test(entree)) continue;
    trouves.push(chemin);
  }
  return trouves;
}

describe("l’accès aux grimoires", () => {
  it("ne se compose nulle part ailleurs que dans le dépôt", () => {
    const fautifs = fichiers("src")
      .filter((chemin) => chemin !== DEPOT)
      .filter((chemin) => {
        const source = readFileSync(chemin, "utf8");
        return TABLES.some((table) => source.includes(table));
      });

    expect(fautifs).toEqual([]);
  });

  it("passe par la couture plutôt que de recopier sa condition", () => {
    const source = readFileSync(DEPOT, "utf8");

    // Le dépôt appelle le filtre…
    expect(source).toContain("chapitresLisibles");

    // …et ne réécrit jamais la condition dans un `where`, où elle
    // échapperait aux essais et divergerait au premier ajout.
    expect(source).not.toMatch(/acces:\s*["']TOUS["']/);
    expect(source).not.toMatch(/acces:\s*\{/);
  });
});
