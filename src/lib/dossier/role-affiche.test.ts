import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTREES_MENU,
  PREFIXES_ECOLE,
  ROUTES,
  ROUTES_HORS_MENU,
} from "@/lib/ecole/menu";
import {
  aFiniLesPremiersPas,
  destinationApres,
  liensVisibles,
  estBanni,
  peutEntrerDansLEcole,
  routeAutorisee,
  type EtatAcces,
} from "@/lib/session/acces";
import type { CompteConnecte } from "@/lib/session/garde";
import { libelleAnnee, libellePlace } from "./etats";
import {
  nettoyerRoleAffiche,
  ROLE_AFFICHE_MAX,
  validerRoleAffiche,
} from "./role-affiche";

/**
 * Le rôle particulier — un titre au château, écrit à la main.
 *
 * Deux choses se vérifient ici, et la seconde est la seule qui compte
 * vraiment.
 *
 * La première : ce qu’on peut écrire dans le champ. Elle tient en une
 * poignée de cas, et la même fonction sert au navigateur et au serveur.
 *
 * La seconde : **que ce titre n’ouvre rien.** C’est un texte libre, affiché
 * publiquement, que l’administration peut remplir de n’importe quoi — y
 * compris « Administratrice ». Le jour où une condition d’accès se mettrait à
 * le lire, le site accorderait des droits à qui sait taper un mot. Les tests
 * du dernier bloc ne décrivent donc pas un cas : ils décrivent une propriété,
 * et ils tiendront pour les routes qui n’existent pas encore.
 */

// ─────────────────────────────────────────────────────────────
//  Ce qu’on peut écrire
// ─────────────────────────────────────────────────────────────

describe("ce que le champ accepte", () => {
  it("rend `null` sur un champ vide — l’année reprend sa place", () => {
    for (const vide of ["", "   ", "\n", "\t  \n"]) {
      const lu = validerRoleAffiche(vide);
      expect(lu.ok).toBe(true);
      if (lu.ok) expect(lu.valeur).toBeNull();
    }
  });

  it("garde un titre ordinaire", () => {
    for (const titre of [
      "Directrice",
      "Bibliothécaire",
      "Intendant du château",
      "Sous-directeur",
      "Professeur J. Vance",
      "Gardienne des clés",
    ]) {
      const lu = validerRoleAffiche(titre);
      expect(lu.ok, titre).toBe(true);
      if (lu.ok) expect(lu.valeur).toBe(titre);
    }
  });

  it("retire les espaces parasites, y compris au milieu", () => {
    const lu = validerRoleAffiche("   Intendant   du    château   ");
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toBe("Intendant du château");
  });

  it("ramène un collage sur plusieurs lignes à une seule", () => {
    // Un champ d’une seule ligne ne reçoit un retour à la ligne que par
    // collage. Le joindre vaut mieux que refuser une saisie sans expliquer
    // ce qu’on lui reproche — et la base, elle, n’en verra jamais.
    const lu = validerRoleAffiche("Biblio\nthécaire");
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toBe("Biblio thécaire");
  });

  it("écrit l’apostrophe comme le reste du site", () => {
    const lu = validerRoleAffiche("Professeur d'alchimie");
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toBe("Professeur d’alchimie");
  });

  it("accepte 40 signes, refuse le quarante-et-unième", () => {
    expect(validerRoleAffiche("D".repeat(ROLE_AFFICHE_MAX)).ok).toBe(true);
    expect(validerRoleAffiche("D".repeat(ROLE_AFFICHE_MAX + 1)).ok).toBe(false);
  });

  it("compte la longueur APRÈS nettoyage", () => {
    // Sinon « Directrice » entourée de trente espaces serait refusée pour un
    // dépassement qui n’existe plus une fois le champ rogné.
    const large = `${" ".repeat(30)}Directrice${" ".repeat(30)}`;
    const lu = validerRoleAffiche(large);
    expect(lu.ok).toBe(true);
    if (lu.ok) expect(lu.valeur).toBe("Directrice");
  });

  it("refuse toute tentative de balise", () => {
    for (const attaque of [
      "<script>alert(1)</script>",
      "Directrice <b>",
      "<img src=x onerror=alert(1)>",
      "Directrice</td><td>",
      "&lt;script&gt;",
      "Directrice <",
      "> Directrice",
    ]) {
      expect(validerRoleAffiche(attaque).ok, attaque).toBe(false);
    }
  });

  it("refuse ce qui n’est ni lettre, ni espace, ni apostrophe, tiret ou point", () => {
    for (const refus of [
      "Professeur 2",
      "Directrice !",
      "Rôle #1",
      "a@b",
      "Directrice_en_chef",
      "Directrice (par intérim)",
    ]) {
      expect(validerRoleAffiche(refus).ok, refus).toBe(false);
    }
  });

  it("veut une lettre en premier", () => {
    for (const refus of [".Directrice", "-Directrice", "’Directrice"]) {
      expect(validerRoleAffiche(refus).ok, refus).toBe(false);
    }
  });

  it("donne toujours un message quand elle refuse", () => {
    const lu = validerRoleAffiche("<script>");
    expect(lu.ok).toBe(false);
    if (!lu.ok) expect(lu.message.length).toBeGreaterThan(0);
  });

  it("nettoie de façon idempotente", () => {
    // Le champ rejoue le nettoyage à chaque frappe, et le serveur une fois de
    // plus : repasser dessus ne doit jamais changer le résultat.
    const une = nettoyerRoleAffiche("  Professeur  d'alchimie  ");
    expect(nettoyerRoleAffiche(une)).toBe(une);
  });
});

// ─────────────────────────────────────────────────────────────
//  Ce qui s’affiche
// ─────────────────────────────────────────────────────────────

describe("le rôle remplace l’année", () => {
  it("affiche le rôle quand il y en a un", () => {
    expect(libellePlace("TROISIEME_ANNEE", "Directrice")).toBe("Directrice");
    expect(libellePlace("PREMIERE_ANNEE", "Intendant du château")).toBe(
      "Intendant du château",
    );
  });

  it("rend l’année dès que le rôle est vide", () => {
    expect(libellePlace("TROISIEME_ANNEE", null)).toBe("3e année");
    expect(libellePlace("SEPTIEME_ANNEE", null)).toBe("7e année");
  });

  it("ne masque pas l’année : elle reste lisible à côté", () => {
    // La règle du joueur : « L’année reste stockée en base et modifiable,
    // elle est simplement masquée. » L’administration doit pouvoir la voir.
    expect(libelleAnnee("QUATRIEME_ANNEE")).toBe("4e année");
  });

  it("sait encore relire les deux valeurs retirées de la liste", () => {
    // Le journal d’Elena garde « 1re année → Direction ». Cette trace doit
    // rester lisible même si plus personne ne peut choisir la valeur.
    expect(libelleAnnee("DIRECTION" as never)).toBe("Direction");
    expect(libelleAnnee("PROFESSEUR" as never)).toBe("Professeur");
  });
});

// ─────────────────────────────────────────────────────────────
//  Le tour complet : poser, tracer, effacer
// ─────────────────────────────────────────────────────────────

describe("poser puis effacer un rôle", () => {
  beforeEach(() => {
    // Sans `DATABASE_URL`, le dépôt travaille sur son jeu de démonstration,
    // en mémoire : ce test n’approche jamais la vraie base.
    vi.stubEnv("DATABASE_URL", "");
  });

  it("écrit le titre, sa date et son auteur — puis les retire ensemble", async () => {
    const { listerMembres, lireDossier, modifierMembre, listerRolesAffiches } =
      await import("./depot");

    const [membre] = await listerMembres();
    expect(membre.roleAffiche).toBeNull();

    await modifierMembre(membre.id, { roleAffiche: "Directrice" }, null);

    const pose = await lireDossier(membre.id);
    expect(pose!.roleAffiche).toBe("Directrice");
    // Les trois vont ensemble — la base l’exige, le code doit s’y tenir.
    expect(pose!.roleAffichePoseLe).not.toBeNull();
    expect(pose!.roleAffichePosePar).toBe("Administration");

    // Le titre distingue publiquement un membre : le changement se retrouve
    // au journal, comme un âge ou un bannissement.
    const trace = pose!.journal[0];
    expect(trace.type).toBe("ROLE_AFFICHE_MODIFIE");
    expect(trace.valeurAvant).toBeNull();
    expect(trace.valeurApres).toBe("Directrice");
    expect(trace.parNom).toBe("Administration");

    // Et il est proposé à la saisie suivante, pour éviter une seconde
    // orthographe du même rôle.
    expect(await listerRolesAffiches()).toContain("Directrice");

    // ── Effacé : l’année reprend sa place, et rien ne traîne ──
    await modifierMembre(membre.id, { roleAffiche: null }, null);

    const efface = await lireDossier(membre.id);
    expect(efface!.roleAffiche).toBeNull();
    expect(efface!.roleAffichePoseLe).toBeNull();
    expect(efface!.roleAffichePosePar).toBeNull();
    expect(libellePlace(efface!.fonction, efface!.roleAffiche)).toBe(
      libelleAnnee(efface!.fonction),
    );
    expect(efface!.journal[0].valeurApres).toBeNull();
  });

  it("ne touche pas au rôle quand on ne le lui demande pas", async () => {
    const { listerMembres, lireDossier, modifierMembre } = await import("./depot");
    const [membre] = await listerMembres();

    await modifierMembre(membre.id, { roleAffiche: "Bibliothécaire" }, null);
    // `undefined` — et non `null` — laisse le titre en place : un formulaire
    // qui ne porte pas le champ ne doit pas l’effacer au passage.
    await modifierMembre(membre.id, { age: 17 }, null);

    const apres = await lireDossier(membre.id);
    expect(apres!.roleAffiche).toBe("Bibliothécaire");
    expect(apres!.age).toBe(17);
  });
});

// ─────────────────────────────────────────────────────────────
//  Le point le plus important : ce titre n’ouvre rien
// ─────────────────────────────────────────────────────────────

/** Le compte tel que `garde.ts` le rend, rôle compris. */
function compte(modifications: Partial<CompteConnecte> = {}): CompteConnecte {
  return {
    id: "compte-1",
    eleveId: "eleve-1",
    email: "essai@ravenshallow.invalid",
    sessionVersion: 0,
    jetonVersion: 0,
    noteAdmin: null,
    statut: "ACCEPTE",
    statutAcces: "VALIDE",
    banniJusquau: null,
    maison: null,
    etatMaison: "NON_FAIT",
    etatBaguette: "NON_FAIT",
    baguetteBois: null,
    baguetteCoeur: null,
    baguetteChoisieLe: null,
    prenomNom: "Sigrid Vale",
    genre: "FEMININ",
    fonction: "PREMIERE_ANNEE",
    roleAffiche: null,
    age: 13,
    ...modifications,
  };
}

/** Les titres les plus tentants — ceux qui ressemblent à un droit. */
const TITRES_TROMPEURS = [
  "Administratrice",
  "Administrateur",
  "Modératrice",
  "Directrice",
  "Admin",
  "ADMIN",
  "Directrice et administratrice",
];

/** Tous les chemins de l’école, plus quelques-uns qui n’existent pas encore. */
const TOUS_LES_CHEMINS = [
  ...PREFIXES_ECOLE,
  "/scenes",
  "/messagerie",
  "/grand-hall",
  "/admin",
  "/admin/membres",
  "/n-importe-quoi",
];

describe("« Administratrice » n’accorde aucun droit", () => {
  it("le fichier qui décide de l’accès ne connaît même pas ce champ", () => {
    // Test de structure, dans l’esprit de celui de la baguette : il ne
    // vérifie pas un comportement, il vérifie qu’une porte n’a pas été
    // ouverte. Le jour où quelqu’un écrira une condition sur le libellé
    // affiché, c’est ici que ça s’arrêtera.
    for (const fichier of [
      "../session/acces.ts",
      "../ecole/menu.ts",
      "../admin-auth.ts",
      "../../middleware.ts",
    ]) {
      const source = readFileSync(new URL(fichier, import.meta.url), "utf8");
      expect(source, fichier).not.toContain("roleAffiche");
    }
  });

  it("le type qui décide de l’accès ne porte pas le rôle", () => {
    // @ts-expect-error — `EtatAcces` ne connaît pas `roleAffiche`, et ne doit
    // jamais le connaître. Le jour où quelqu’un l’y ajoute, cette ligne cesse
    // d’être une erreur, et la compilation s’arrête sur cette directive.
    const jamais: EtatAcces["roleAffiche"] = null;
    expect(jamais).toBeNull();
  });

  it("donne exactement les mêmes réponses avec et sans titre, sur tout chemin", () => {
    const etats: Partial<CompteConnecte>[] = [
      {}, // nouvel arrivant : ni baguette ni maison
      { baguetteChoisieLe: new Date() }, // baguette faite, Miroir à venir
      { baguetteChoisieLe: new Date(), maison: "KALDRAFN" }, // membre complet
      { statutAcces: "EN_BANNISSEMENT" }, // suspendu
      { statut: "EN_ATTENTE", statutAcces: "EN_ATTENTE" }, // dossier en lecture
      { statut: "REFUSE" },
      { statut: "A_CORRIGER" },
    ];

    for (const etat of etats) {
      const sans = compte(etat);

      for (const titre of TITRES_TROMPEURS) {
        const avec = compte({ ...etat, roleAffiche: titre });

        expect(peutEntrerDansLEcole(avec)).toBe(peutEntrerDansLEcole(sans));
        expect(estBanni(avec)).toBe(estBanni(sans));
        expect(aFiniLesPremiersPas(avec)).toBe(aFiniLesPremiersPas(sans));
        expect(destinationApres(avec)).toBe(destinationApres(sans));
        expect(liensVisibles(avec)).toEqual(liensVisibles(sans));

        for (const chemin of TOUS_LES_CHEMINS) {
          expect(
            routeAutorisee(avec, chemin),
            `${titre} sur ${chemin} (${JSON.stringify(etat)})`,
          ).toBe(routeAutorisee(sans, chemin));
        }
      }
    }
  });

  it("un membre suspendu nommé « Administratrice » garde son bureau et sa fiche, rien d’autre", () => {
    // La règle du joueur, mot pour mot — et le titre n’y change rien.
    const suspendue = compte({
      statutAcces: "EN_BANNISSEMENT",
      roleAffiche: "Administratrice",
      baguetteChoisieLe: new Date(),
      maison: "TIDEAL",
    });

    expect(routeAutorisee(suspendue, ROUTES.bureau)).toBe(true);
    expect(routeAutorisee(suspendue, ROUTES.fiche)).toBe(true);

    for (const ferme of [ROUTES.cours, ROUTES.ecole, ROUTES.bjornstav, ROUTES.ceremonie]) {
      expect(routeAutorisee(suspendue, ferme), ferme).toBe(false);
    }

    // Les corbeaux restent ouverts à un membre suspendu — c’est par là qu’on
    // conteste une sanction (art. 8.5). Le titre « Administratrice » n’y est
    // pour rien : un élève suspendu sans aucun rôle a exactement les mêmes
    // trois entrées.
    expect(liensVisibles(suspendue).map((e) => e.href)).toEqual([
      ROUTES.bureau,
      ROUTES.fiche,
      ROUTES.corbeaux,
    ]);
  });

  it("un nouvel arrivant nommé « Administratrice » n’avance pas plus vite", () => {
    const arrivante = compte({ roleAffiche: "Administratrice" });

    // Ses deux premiers pas restent devant elle.
    expect(aFiniLesPremiersPas(arrivante)).toBe(false);
    expect(routeAutorisee(arrivante, ROUTES.cours)).toBe(false);
    expect(routeAutorisee(arrivante, ROUTES.ecole)).toBe(false);
    // Et le bureau, qui porte la note des premiers pas, reste ouvert.
    expect(routeAutorisee(arrivante, ROUTES.bureau)).toBe(true);
  });

  it("un dossier en attente nommé « Administratrice » n’entre pas dans l’école", () => {
    const attente = compte({
      statut: "EN_ATTENTE",
      statutAcces: "EN_ATTENTE",
      roleAffiche: "Administratrice",
    });

    expect(peutEntrerDansLEcole(attente)).toBe(false);
    expect(destinationApres(attente)).toBe(ROUTES.attente);
    for (const chemin of [...ENTREES_MENU, ...ROUTES_HORS_MENU]) {
      expect(routeAutorisee(attente, chemin.href), chemin.href).toBe(false);
    }
  });
});
