import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * **Aucune transaction interactive ne doit contourner `transaction()`.**
 *
 * Le délai qui les protège du réveil de Neon est posé là et nulle part
 * ailleurs. Passer les réglages à chaque appel marcherait aujourd'hui et se
 * perdrait au dixième : cet essai relit le code source, comme
 * `etancheite.test.ts` relit la zone d'administration.
 *
 * Éprouvé en introduisant la faute : remettre `prisma.$transaction(async …)`
 * dans un dépôt le fait tomber.
 */

const simule = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: simule.transaction },
}));

const { transaction } = await import("./transaction");

/** Tous les fichiers TypeScript du code, essais exclus. */
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

describe("les délais d’une transaction", () => {
  it("attend plus longtemps que le réveil d’une base endormie", () => {
    transaction(async () => "peu importe");

    expect(simule.transaction).toHaveBeenCalledOnce();
    const reglages = simule.transaction.mock.calls[0][1];

    // Les valeurs par défaut de Prisma — 2 s et 5 s — ne couvrent pas un
    // réveil de Neon, qui prend couramment cinq à dix secondes.
    expect(reglages.maxWait).toBeGreaterThan(2_000);
    expect(reglages.timeout).toBeGreaterThan(5_000);
  });
});

describe("la couture est unique", () => {
  it("aucun fichier n’ouvre de transaction interactive dans son coin", () => {
    const fautifs = fichiers("src")
      .filter((chemin) => !chemin.endsWith(join("base", "transaction.ts")))
      .filter((chemin) =>
        /prisma\s*\.\s*\$transaction\s*\(\s*async/.test(
          readFileSync(chemin, "utf8"),
        ),
      );

    expect(fautifs).toEqual([]);
  });

  /**
   * La forme en tableau — `$transaction([…])` — n'est **pas** concernée :
   * Prisma ne lui laisse régler que le niveau d'isolation, jamais les délais.
   * Elle part en un seul aller-retour, ce qui la rend moins exposée. Le
   * rappeler ici évite qu'on croie l'avoir oubliée.
   */
  it("laisse la forme en tableau où elle est, faute de pouvoir la régler", () => {
    const enTableau = fichiers("src").filter((chemin) =>
      /prisma\s*\.\s*\$transaction\s*\(\s*\[/.test(readFileSync(chemin, "utf8")),
    );

    expect(enTableau.length).toBeGreaterThan(0);
  });
});
