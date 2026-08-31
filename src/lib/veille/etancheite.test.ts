import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ce que le code de La Veille n'a pas le droit de faire.
 *
 * ── Pourquoi relire le code source plutôt que de tester le comportement ──
 *
 * Parce qu'un comportement se teste sur les chemins qu'on a pensé à écrire, et
 * que le risque est ici dans le chemin auquel personne n'a pensé : un `import`
 * machinal, une complétion acceptée trop vite, une requête ajoutée un soir pour
 * « juste voir ». Relire le source attrape ce que l'exécution ne verra jamais.
 *
 * C'est le procédé d'`etancheite.test.ts` de la Tour aux Corbeaux, de
 * `transaction.test.ts` et de `role-affiche.test.ts` — trois fois éprouvé sur
 * ce projet. **Les règles ci-dessous ont chacune été vérifiées en introduisant
 * la faute** : chacune tombe.
 */

const VEILLE = resolve(__dirname);

function fichiersDe(dossier: string): string[] {
  const trouves: string[] = [];
  const parcourir = (ou: string) => {
    for (const entree of readdirSync(ou)) {
      const chemin = resolve(ou, entree);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (entree.endsWith(".ts")) trouves.push(chemin);
    }
  };
  parcourir(dossier);
  return trouves;
}

const FICHIERS = fichiersDe(VEILLE);
const CODE = FICHIERS.filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".essai.ts"));

const lire = (chemin: string) => readFileSync(chemin, "utf8");
const nom = (chemin: string) => chemin.slice(VEILLE.length + 1);

describe("La Veille ne peut pas écrire", () => {
  /**
   * ⚠️ **Le verrou principal est ailleurs** — les identifiants n'ont que
   * `SELECT`, et c'est PostgreSQL qui refuse. Celui-ci en est le second : il
   * empêche qu'un fichier de La Veille récupère par mégarde la connexion du
   * SITE, qui peut tout écrire.
   */
  it("n’importe jamais le client Prisma du site", () => {
    for (const fichier of CODE) {
      expect(lire(fichier), nom(fichier)).not.toMatch(/from\s+["']@\/lib\/prisma["']/);
    }
  });

  /**
   * ⚠️ **Le motif vise une écriture PRISMA, pas n'importe quel `.create(`.**
   *
   * La première version interdisait le verbe seul, et elle a immédiatement
   * accusé `client.messages.create(...)` — l'appel à l'API Claude, qui n'écrit
   * rien nulle part. Un test qui crie sur du code juste finit désactivé, et
   * c'est alors la vraie règle qu'on perd.
   *
   * On exige donc la forme complète de Prisma : un receveur connu, un modèle,
   * puis le verbe. `base.utilisateur.update(...)` tombe ;
   * `client.messages.create(...)` non.
   */
  const RECEVEURS = "base|prisma|tx|lecture|depot";
  const VERBES =
    "create|createMany|createManyAndReturn|update|updateMany|upsert|delete|deleteMany";

  it("n’appelle aucune méthode d’écriture de Prisma", () => {
    const ECRITURE = new RegExp(
      `\\b(${RECEVEURS})\\s*\\.\\s*\\w+\\s*\\.\\s*(${VERBES})\\s*\\(`,
    );

    for (const fichier of CODE) {
      const fautives = lire(fichier)
        .split("\n")
        .map((ligne, i) => ({ ligne: ligne.trim(), numero: i + 1 }))
        // Les commentaires parlent librement de ce qui est interdit : c'est
        // même leur travail.
        .filter(({ ligne }) => !ligne.startsWith("*") && !ligne.startsWith("//"))
        .filter(({ ligne }) => ECRITURE.test(ligne));

      expect(
        fautives.map((f) => `${nom(fichier)}:${f.numero} — ${f.ligne}`),
        "une écriture dans le code de La Veille",
      ).toEqual([]);
    }
  });

  /**
   * Le SQL brut contourne les modèles : `$executeRaw` s'interdit partout, sans
   * receveur ni verbe à reconnaître. `$queryRaw` reste permis — c'est une
   * lecture, et plusieurs contrôles s'en servent pour faire juger un texte par
   * Postgres sans le rapatrier.
   */
  it("n’exécute jamais de SQL brut en écriture", () => {
    for (const fichier of CODE) {
      const fautives = lire(fichier)
        .split("\n")
        .map((ligne, i) => ({ ligne: ligne.trim(), numero: i + 1 }))
        .filter(({ ligne }) => !ligne.startsWith("*") && !ligne.startsWith("//"))
        .filter(({ ligne }) => /\$executeRaw/.test(ligne));

      expect(
        fautives.map((f) => `${nom(fichier)}:${f.numero}`),
        "du SQL brut en écriture",
      ).toEqual([]);
    }
  });

  it("n’ouvre aucune transaction", () => {
    for (const fichier of CODE) {
      expect(lire(fichier), nom(fichier)).not.toMatch(/\$transaction\s*\(/);
    }
  });
});

describe("La Veille ne collecte aucune donnée personnelle", () => {
  /**
   * ⚠️ **La règle est de ne jamais DEMANDER ces colonnes**, pas de les masquer
   * après coup. Le caviardage du rapport est un filet ; la vraie protection
   * est ici. « 3 dossiers attendent une lecture », jamais qui les a déposés.
   *
   * `secrets.ts` est écarté : il lit l'adresse d'envoi du courriel, qui est
   * celle du site lui-même, et le mot de passe du compte de service. Ce sont
   * les identifiants de la ronde, pas des données de membres.
   */
  const INTERDITES = [
    "prenomNom",
    "biographie",
    "plusGrandePeur",
    "acteurNom",
    "motDePasseHash",
    "limitesAutres",
  ];

  const AUTORISES = new Set(["secrets.ts"]);

  /** Les lignes de code, sans les commentaires — qui parlent librement. */
  const lignesDeCode = (chemin: string) =>
    lire(chemin)
      .split("\n")
      .map((ligne, i) => ({ ligne: ligne.trim(), numero: i + 1 }))
      .filter(({ ligne }) => !ligne.startsWith("*") && !ligne.startsWith("//"));

  for (const colonne of INTERDITES) {
    it(`ne nomme jamais « ${colonne} »`, () => {
      for (const fichier of CODE) {
        if (AUTORISES.has(nom(fichier))) continue;
        const fautives = lignesDeCode(fichier).filter(({ ligne }) =>
          ligne.includes(colonne),
        );
        expect(
          fautives.map((f) => `${nom(fichier)}:${f.numero} — ${f.ligne}`),
          `${colonne} n’a rien à faire dans un rapport`,
        ).toEqual([]);
      }
    });
  }

  /**
   * ⚠️ **`portraitUrl` est un cas à part, et la nuance est celle qui compte.**
   *
   * On a le droit de DEMANDER À POSTGRES DE LE JUGER — « y en a-t-il un, et
   * commence-t-il par `data:image/` ? » —, jamais de le faire sortir. Ce n'est
   * pas de la pudeur : un portrait pèse deux cents kilo-octets en base, et une
   * ronde qui en lirait sept tirerait un méga-octet et demi pour compter des
   * cadres cassés. C'est exactement le piège déjà payé sur la carte de
   * l'auteur d'un post et sur le Registre.
   *
   * Le test interdit donc la PROJECTION, pas la condition.
   */
  it("ne fait jamais SORTIR « portraitUrl » d’une requête", () => {
    for (const fichier of CODE) {
      const fautives = lignesDeCode(fichier).filter(
        ({ ligne }) =>
          // La projection de Prisma…
          /portraitUrl\s*:\s*true/.test(ligne) ||
          // …et celle du SQL brut, entre SELECT et FROM.
          /SELECT[^;]*"portraitUrl"[^;]*FROM/i.test(ligne),
      );
      expect(
        fautives.map((f) => `${nom(fichier)}:${f.numero} — ${f.ligne}`),
        "un portrait pèse 200 Ko : on le juge en base, on ne le lit pas",
      ).toEqual([]);
    }
  });

  /**
   * ⚠️ Le corps d'un message est le plus sensible de tous : la Tour aux
   * Corbeaux est privée, et « le staff ne lit pas les conversations privées »
   * est une règle dure de ce site. La Veille compte des fils, elle n'en ouvre
   * aucun.
   */
  it("ne lit jamais le corps d’un message ni d’un post", () => {
    for (const fichier of CODE) {
      const texte = lire(fichier);
      const fautives = texte
        .split("\n")
        .map((ligne, i) => ({ ligne: ligne.trim(), numero: i + 1 }))
        .filter(({ ligne }) => !ligne.startsWith("*") && !ligne.startsWith("//"))
        .filter(({ ligne }) => /\bcorps\s*:\s*true\b|select.*\bcorps\b/.test(ligne));

      expect(fautives.map((f) => `${nom(fichier)}:${f.numero}`), "corps de message").toEqual(
        [],
      );
    }
  });

  /**
   * Le courrier du château est la seule conversation que le site autorise à
   * lire — et encore, La Veille n'en compte que les fils.
   *
   * ⚠️ **`AVEC_ADMINISTRATION` est écrit en toutes lettres** dans chaque
   * requête qui touche aux conversations, jamais tiré d'une constante : le
   * sortir des `where` le rendrait invisible. C'est la règle posée par
   * `lib/corbeaux/courrier.ts`, et elle vaut ici aussi.
   */
  it("ne touche aux conversations qu’en nommant AVEC_ADMINISTRATION", () => {
    for (const fichier of CODE) {
      const texte = lire(fichier);
      const parleDeConversations = /\bconversations?\b/i.test(
        texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, ""),
      );
      if (!parleDeConversations) continue;
      expect(texte, nom(fichier)).toContain("AVEC_ADMINISTRATION");
    }
  });
});

describe("La Veille ne se tait pas quand elle tombe", () => {
  /**
   * Un `catch` vide dans un collecteur ferait passer une panne pour un calme.
   * Seuls trois fichiers ont le droit d'avaler une erreur, et chacun explique
   * pourquoi en commentaire.
   */
  const PEUVENT_AVALER = new Set([
    "collecte.ts", // c'est son travail : il emballe et rapporte
    "collecteurs/disponibilite.ts", // la connexion ratée devient une anomalie
    "memoire.ts", // une mémoire absente est le cas normal du premier jour
  ]);

  it("n’avale une erreur que là où c’est expliqué", () => {
    for (const fichier of CODE) {
      if (PEUVENT_AVALER.has(nom(fichier))) continue;
      const texte = lire(fichier);
      // `catch {}` ou `catch (e) {}` sans rien dedans.
      expect(texte, nom(fichier)).not.toMatch(/catch\s*(\([^)]*\))?\s*\{\s*\}/);
    }
  });
});
