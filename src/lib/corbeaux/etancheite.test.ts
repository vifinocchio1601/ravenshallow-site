import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * **Aucun membre du staff ne lit les conversations privées.**
 *
 * C’est une règle posée par le joueur, et elle ne souffre aucune exception :
 * il n’existe aucun écran d’administration qui affiche la boîte d’un membre,
 * aucune recherche dans les messages, aucun export. Le seul accès du staff aux
 * échanges privés passe par un signalement, et se limite au contexte transmis
 * avec lui — une copie figée d’une dizaine de corbeaux, et rien d’autre.
 *
 * Une règle pareille ne tient pas par bonne volonté. Rien, dans le code,
 * n’empêche techniquement d’écrire `prisma.message.findMany()` dans une page
 * d’administration : `prisma` est importable partout côté serveur. Ce fichier
 * relit donc **le code source** de la zone d’administration et échoue si
 * quelque chose y touche aux conversations.
 *
 * C’est le même procédé que `role-affiche.test.ts`, qui vérifie de la même
 * façon qu’un libellé décoratif n’ouvre aucune porte. Le jour où quelqu’un —
 * moi compris — ajoutera par commodité une requête qui contourne la règle, la
 * suite de tests le refusera au lieu de la laisser passer.
 */

const RACINE_ADMIN = "src/app/admin";

/** Les fichiers de la zone d’administration, en profondeur. */
function fichiersDe(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiersDe(chemin);
    return chemin.endsWith(".ts") || chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

const FICHIERS_ADMIN = fichiersDe(RACINE_ADMIN);

/**
 * Les tables qu’aucun écran d’administration ne doit interroger.
 *
 * `signalements` n’y figure pas, et c’est tout l’objet du dispositif : c’est
 * la seule table par laquelle le staff voit quelque chose, et elle ne contient
 * que ce qu’un joueur a délibérément transmis.
 */
const TABLES_INTERDITES = [
  "prisma.message",
  "prisma.conversation",
  "prisma.participation",
  "prisma.messageMasque",
  "prisma.blocage",
  '"messages"',
  '"conversations"',
  '"participations"',
  '"messages_masques"',
];

/** Ce que la zone d’administration n’a aucune raison d’importer. */
const IMPORTS_INTERDITS = [
  "corbeaux/depot",
  "listerConversations",
  "lireFil",
  "compterNonLus",
  "chercherPersonnages",
  "envoyerCorbeau",
];

describe("le staff ne lit pas les conversations privées", () => {
  it("trouve bien la zone d’administration", () => {
    // Sans cette vérification, un renommage de dossier rendrait tous les
    // tests ci-dessous verts en ne lisant plus rien du tout.
    expect(FICHIERS_ADMIN.length).toBeGreaterThan(5);
  });

  it.each(TABLES_INTERDITES)(
    "aucun écran d’administration n’interroge %s",
    (table) => {
      const coupables = FICHIERS_ADMIN.filter((f) =>
        readFileSync(f, "utf8").includes(table),
      );
      expect(coupables).toEqual([]);
    },
  );

  it.each(IMPORTS_INTERDITS)(
    "aucun écran d’administration n’importe %s",
    (symbole) => {
      const coupables = FICHIERS_ADMIN.filter((f) =>
        readFileSync(f, "utf8").includes(symbole),
      );
      expect(coupables).toEqual([]);
    },
  );

  /**
   * **Le dépôt de la modération ne touche qu’à une table.**
   *
   * C’est ce qui rend la règle structurelle plutôt que disciplinaire : le
   * fichier que lisent les écrans d’administration n’a aucun moyen d’atteindre
   * une conversation, parce qu’il ne nomme aucune autre table.
   */
  it("le dépôt de modération ne lit que les signalements", () => {
    const source = readFileSync("src/lib/corbeaux/moderation.ts", "utf8");
    const tables = [...source.matchAll(/prisma\.(\w+)\./g)].map((m) => m[1]);

    expect(tables.length).toBeGreaterThan(0);
    expect([...new Set(tables)]).toEqual(["signalement"]);
  });

  /**
   * Et il n’emprunte au dépôt des conversations qu’un **type** — effacé à la
   * compilation, donc incapable d’exécuter quoi que ce soit. Un `import`
   * ordinaire ouvrirait la porte à `lireFil` d’un simple ajout de mot.
   */
  it("le dépôt de modération n’importe du dépôt qu’un type", () => {
    const source = readFileSync("src/lib/corbeaux/moderation.ts", "utf8");
    const imports = [...source.matchAll(/^import (type )?\{[^}]*\} from "([^"]+)"/gm)];

    for (const [, estType, cible] of imports) {
      if (cible.includes("depot")) {
        expect(estType, `l'import de ${cible} doit être un import type`).toBe(
          "type ",
        );
      }
    }
  });

  /**
   * Le dépôt de la Tour n’expose aucune fonction qui rendrait la boîte de
   * quelqu’un d’autre. Toutes prennent le compte qui regarde en premier
   * argument et filtrent sur lui — il n’existe pas de `lireLaBoiteDe(id)`.
   */
  it("le dépôt n’offre aucune lecture au nom d’un tiers", () => {
    const source = readFileSync("src/lib/corbeaux/depot.ts", "utf8");
    const exportees = [...source.matchAll(/export async function (\w+)\(/g)].map(
      (m) => m[1],
    );

    expect(exportees.length).toBeGreaterThan(3);

    for (const nom of exportees) {
      const signature = source.slice(
        source.indexOf(`export async function ${nom}(`),
      );
      const premierArgument = signature.slice(
        signature.indexOf("(") + 1,
        signature.indexOf(")") > 0 ? signature.indexOf("\n)") : undefined,
      );

      // Chaque lecture part de QUI REGARDE. `filAdministrationDe` fait
      // exception : elle ne rend qu'un identifiant de fil, jamais son contenu,
      // et sert à la page du membre lui-même.
      if (nom === "filAdministrationDe") continue;
      expect(premierArgument, `${nom} doit partir du compte qui regarde`).toMatch(
        /compte|expediteur/,
      );
    }
  });
});
