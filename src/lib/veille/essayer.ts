import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lancer un collecteur seul, et regarder ce qu'il trouve.
 *
 * ── À quoi ça sert ──
 *
 * Un collecteur qui ne s'éprouve qu'à travers la ronde entière ne s'éprouve
 * pas : on attend huit minutes pour voir une ligne, et l'on finit par ne plus
 * regarder. Ici, chacun se lance en quelques secondes, contre la vraie base et
 * le vrai site.
 *
 *   npm run veille:essayer                  la liste
 *   npm run veille:essayer coherence        un seul
 *   npm run veille:essayer disponibilite
 *
 * ⚠️ **Cet outil AFFICHE ce qu'il trouve, et la ronde non.** Le dépôt est
 * public, donc les journaux d'exécution des Actions le sont : la ronde ne dit
 * rien à l'écran, tout part par courriel. Celui-ci se lance à la main, sur le
 * poste du joueur, et peut donc montrer.
 *
 * ⚠️ **Il ne lance jamais l'envoi d'un courriel** — voir `ronde.ts` pour cela.
 */

// `.env.local` d'abord : la CLI de Node ne le lit pas plus que celle de Prisma.
for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
  const nette = ligne.trim();
  if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
  const coupure = nette.indexOf("=");
  process.env[nette.slice(0, coupure).trim()] ??= nette
    .slice(coupure + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const { depot, refermer, verifierLaLectureSeule } = await import("./base");
const { lireLesSecrets } = await import("./secrets");
const { collecterLaCoherence } = await import("./collecteurs/coherence");
const { collecterLaDisponibilite, ouvrirUneSession, parLeReseau } = await import(
  "./collecteurs/disponibilite"
);
const { collecterCeQuiAttend } = await import("./collecteurs/attente");
const { collecterLaVie } = await import("./collecteurs/vie");
const { collecterLesErreurs } = await import("./collecteurs/erreurs");
const { collecterLeParcours } = await import("./collecteurs/parcours");

const secrets = lireLesSecrets();
const instant = new Date();
const racine = resolve(".");

/**
 * ⚠️ **Le site visé peut être le poste local**, et c'est souvent ce qu'on veut
 * en essayant : `VEILLE_SITE_URL=http://localhost:3000 npm run veille:essayer`.
 * Sans cela, l'essai tape sur la production — ce qui est sans danger (il ne
 * fait que lire) mais mesure autre chose que ce qu'on croit.
 */
const COLLECTEURS: Record<string, () => Promise<unknown>> = {
  async disponibilite() {
    const cookie = await ouvrirUneSession(
      secrets.site,
      secrets.compte.courriel,
      secrets.compte.motDePasse,
    );
    return collecterLaDisponibilite({
      demandeur: parLeReseau(secrets.site),
      cookie,
    });
  },

  async coherence() {
    const base = depot(secrets.base);
    await verifierLaLectureSeule(base);
    return collecterLaCoherence({ base, instant, racine });
  },

  async attente() {
    const base = depot(secrets.base);
    await verifierLaLectureSeule(base);
    return collecterCeQuiAttend({ base, instant });
  },

  async vie() {
    const base = depot(secrets.base);
    await verifierLaLectureSeule(base);
    return collecterLaVie({ base, instant, memoire: { anomalies: {}, vie: [] } });
  },

  async erreurs() {
    const base = depot(secrets.base);
    await verifierLaLectureSeule(base);
    return collecterLesErreurs({ base, instant });
  },

  async parcours() {
    return collecterLeParcours({
      site: secrets.site,
      courriel: secrets.compte.courriel,
      motDePasse: secrets.compte.motDePasse,
      playwright: await chargerPlaywright(),
    });
  },
};

/**
 * Playwright, s'il est là.
 *
 * ⚠️ **Ce n'est pas une dépendance du projet**, et il ne doit pas le devenir :
 * il est installé dans le CI seulement, comme `sharp` l'a été pour les
 * bannières et le tableau d'affichage. Absent, le collecteur le dit et la
 * ronde continue sans lui.
 *
 * Pour l'essayer sur ce poste :
 *   npm install --no-save playwright && npx playwright install chromium
 */
async function chargerPlaywright(): Promise<unknown | null> {
  try {
    // ⚠️ Le nom passe par une variable, et ce n'est pas un tic : écrit en
    // clair, `npx tsc --noEmit` échouerait sur le poste du joueur, où
    // Playwright n'est pas installé. La ronde ne doit pas rendre le projet
    // impossible à vérifier.
    const nom = "playwright";
    return await import(nom);
  } catch {
    return null;
  }
}

const demande = process.argv[2];

if (!demande || !(demande in COLLECTEURS)) {
  console.log("Collecteurs :", Object.keys(COLLECTEURS).join(", "));
  console.log("  npm run veille:essayer <nom>");
  process.exit(demande ? 1 : 0);
}

console.log(`Site  : ${secrets.site}`);
console.log(`Ronde : ${instant.toISOString()}`);
console.log("");

const debut = Date.now();
try {
  const resultat = await COLLECTEURS[demande]();
  console.log(JSON.stringify(resultat, null, 2));
  console.log("");
  console.log(`— ${demande} en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
} catch (erreur) {
  // Un collecteur lève librement : c'est `ronde.ts` qui sait quoi en faire.
  // Ici, on montre la raison sans la pile — la même règle que le rapport.
  console.log(`— ${demande} n’a pas abouti :`);
  console.log(`  ${erreur instanceof Error ? erreur.message : String(erreur)}`);
  process.exitCode = 1;
} finally {
  await refermer();
}
