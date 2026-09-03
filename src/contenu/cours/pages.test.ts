import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * **Le script de chaque page servie doit s'analyser.**
 *
 * ── Le défaut que cet essai attrape, et il l'a attrapé pour de bon ──
 *
 * Les douze pages de cours vivent dans des **littéraux de gabarit**, et un
 * littéral de gabarit mange les barres obliques inversées : `\/` écrit dans le
 * fichier arrive `/` dans le navigateur. Une ligne parfaitement correcte dans
 * l'éditeur —
 *
 *     location.pathname.replace(/\/$/, '')
 *
 * — est servie comme `location.pathname.replace(//$/, '')`, où `//` ouvre un
 * commentaire qui avale la fin de la ligne. Le script meurt sur une accolade
 * orpheline, **tout le reste de la page cesse de fonctionner**, et rien ne le
 * dit : la leçon s'affiche parfaitement, seuls ses boutons sont morts.
 *
 * Rencontré le 4 septembre 2026 sur les six leçons à la fois, et trouvé
 * seulement en cliquant. Aucun essai ne le voyait, `tsc` non plus — c'est du
 * texte pour TypeScript.
 *
 * ⚠️ **Tout ce qu'on écrit dans ces gabarits passe par cet échappement.** Le
 * générateur le fait bien ; ce sont les corrections posées après coup,
 * directement dans le `.ts`, qui l'oublient. Cet essai est le seul filet.
 */

/** Le HTML que porte un module, tel que le navigateur le recevra. */
function htmlServi(chemin: string): string {
  const source = readFileSync(chemin, "utf8");
  const ouverture = source.match(/export const [A-Z0-9_]+ = `/);
  expect(ouverture, chemin).not.toBeNull();
  const debut = ouverture!.index! + ouverture![0].length;
  const litteral = source.slice(debut, source.lastIndexOf("`"));

  // ⚠️ **On défait TOUS les échappements, pas seulement ceux qu'on a posés.**
  // Une première version de cette relecture ne connaissait que ``\` ``, `\$` et
  // `\\` — elle rendait donc `\/` inchangé et affirmait que la page était
  // saine. C'est ce qui a laissé passer le défaut.
  const echappements: Record<string, string> = { n: "\n", t: "\t", r: "\r" };
  return litteral.replace(/\\(.)/g, (_, c: string) => echappements[c] ?? c);
}

/** Les blocs `<script>` d'une page, sans les balises. */
function scriptsDe(html: string): string[] {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1]!,
  );
}

const PAGES = [
  ...readdirSync("src/contenu/cours")
    .filter((f) => f.endsWith("-l1-1.ts"))
    .map((f) => `src/contenu/cours/${f}`),
  ...readdirSync("src/contenu/cours/controles")
    .filter((f) => f.endsWith(".ts"))
    .map((f) => `src/contenu/cours/controles/${f}`),
];

describe("les pages de cours servies", () => {
  it("sont les six leçons et les six contrôles", () => {
    expect(PAGES.length).toBe(12);
  });

  it("portent chacune au moins un script", () => {
    for (const page of PAGES) {
      expect(scriptsDe(htmlServi(page)).length, page).toBeGreaterThanOrEqual(1);
    }
  });

  /**
   * ⚠️ **C'est l'essai qui compte.** `new Function` n'exécute rien : il
   * analyse, et lève sur une erreur de syntaxe. Éprouvé en remettant le
   * `\/` fautif dans une leçon : il tombe et nomme le fichier.
   *
   * Les deux marques des contrôles — `__DONNEES_QUESTIONS__` et
   * `__DONNEES_ETAT__` — sont des identifiants inconnus, pas des erreurs de
   * syntaxe : le script s'analyse très bien avec elles.
   */
  it("ont un script qui s’analyse, une fois l’échappement défait", () => {
    for (const page of PAGES) {
      for (const [i, script] of scriptsDe(htmlServi(page)).entries()) {
        expect(() => {
          // Le corps d'une fonction, parce qu'un script de haut niveau peut
          // porter un `await` — c'est le cas de l'envoi d'un contrôle.
          new Function(`async function _(){${script}\n}`);
        }, `${page} — script ${i + 1}`).not.toThrow();
      }
    }
  });

  /**
   * Le même piège, pris un cran plus tôt : une barre oblique inversée dans un
   * gabarit est presque toujours une erreur, sauf quand elle est doublée. On
   * ne peut pas l'interdire — les pages du joueur en portent de vraies, dans
   * leurs propres expressions régulières — mais on peut exiger qu'aucune ne
   * s'effondre en quelque chose d'autre.
   *
   * Ce que l'essai précédent vérifie sur le sens, celui-ci le vérifie sur la
   * forme : le script servi ne doit contenir aucun `//` là où le fichier
   * portait une expression régulière.
   */
  it("ne fabriquent jamais un commentaire à partir d’une expression régulière", () => {
    for (const page of PAGES) {
      expect(htmlServi(page).includes("replace(//"), page).toBe(false);
      expect(htmlServi(page).includes("match(//"), page).toBe(false);
      expect(htmlServi(page).includes("test(//"), page).toBe(false);
    }
  });
});
