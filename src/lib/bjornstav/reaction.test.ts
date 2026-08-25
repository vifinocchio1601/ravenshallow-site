import { describe, expect, it } from "vitest";
import { CODES_BOIS, CODES_COEUR, BOIS, COEURS } from "@/lib/ecole/baguette";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import {
  APRES_LA_REACTION,
  AVANT_LA_REACTION,
  CARTES_BOIS,
  CARTES_COEUR,
  ENTRE_LE_BOIS_ET_LE_COEUR,
  MAIN_SELON_LE_BOIS,
  PIECE_SELON_LE_COEUR,
  RECIT_APRES_ENSEIGNE,
  RECIT_AVANT_ENSEIGNE,
  SUITE_BOIS,
  SUITE_COEUR,
  VARIANTES,
} from "./constantes";
import {
  assemblerDenouement,
  assemblerReaction,
  aUneVarianteAssociee,
  verifierCodes,
} from "./reaction";

/**
 * La boutique Bjornstav — l’assemblage, avant toute interface.
 *
 * Trois règles du joueur se vérifient ici, et aucune n’est une règle de
 * code : la réaction est **complète** pour les vingt-cinq baguettes, les cinq
 * mariages particuliers **remplacent** le second fragment au lieu de s’y
 * ajouter, et **aucun texte de la boutique ne nomme une maison** — le Miroir
 * et l’échoppe sont indépendants.
 */

/** Les vingt-cinq baguettes, une bonne fois. */
const TOUTES = CODES_BOIS.flatMap((bois) =>
  CODES_COEUR.map((coeur) => ({ bois, coeur })),
);

const MARIAGES_PARTICULIERS = [
  { bois: "IF", coeur: "PLUME_DE_CORBEAU" },
  { bois: "IF", coeur: "CRISTAL_DE_GLACE" },
  { bois: "CHENE_DES_TEMPETES", coeur: "GRIFFE_OURS_DES_CAVERNES" },
  { bois: "SORBIER", coeur: "ECAILLE_ANGUILLE_ARGENTEE" },
  { bois: "BOULEAU", coeur: "NERF_LOUP_DES_FJORDS" },
] as const;

describe("les vingt-cinq baguettes", () => {
  it("en compte bien vingt-cinq, sans doublon", () => {
    expect(TOUTES).toHaveLength(25);
    expect(new Set(TOUTES.map((b) => `${b.bois}|${b.coeur}`)).size).toBe(25);
  });

  it.each(TOUTES)("$bois + $coeur donne un texte complet", ({ bois, coeur }) => {
    const fragments = assemblerReaction(bois, coeur);

    // Deux fragments au moins : ce que la main sent, ce que la pièce voit.
    expect(fragments.length).toBeGreaterThanOrEqual(2);

    for (const fragment of fragments) {
      expect(fragment.texte.trim().length).toBeGreaterThan(40);
      expect(["recit", "parole"]).toContain(fragment.ton);
    }
  });

  it.each(TOUTES)(
    "$bois + $coeur commence toujours par ce que la main sent",
    ({ bois, coeur }) => {
      const [premier] = assemblerReaction(bois, coeur);
      expect(premier.texte).toBe(MAIN_SELON_LE_BOIS[bois]);
      expect(premier.ton).toBe("recit");
    },
  );

  it("ne rend jamais deux fois la même réaction pour deux baguettes différentes", () => {
    const textes = TOUTES.map(({ bois, coeur }) =>
      assemblerReaction(bois, coeur)
        .map((f) => f.texte)
        .join(" "),
    );
    expect(new Set(textes).size).toBe(25);
  });
});

describe("les cinq mariages qui ont leur propre réaction", () => {
  it("sont exactement cinq", () => {
    expect(Object.keys(VARIANTES)).toHaveLength(5);
    expect(TOUTES.filter((b) => aUneVarianteAssociee(b.bois, b.coeur))).toHaveLength(5);
  });

  it.each(MARIAGES_PARTICULIERS)(
    "$bois + $coeur sort sa variante et REMPLACE ce que la pièce voit",
    ({ bois, coeur }) => {
      const fragments = assemblerReaction(bois, coeur);
      const variante = VARIANTES[`${bois}|${coeur}`];

      expect(variante).toBeDefined();
      expect(fragments.slice(1)).toEqual(variante);

      // Le fragment ordinaire du cœur ne doit pas s’y trouver en plus :
      // le joueur lirait deux fois ce que la pièce voit.
      const textes = fragments.map((f) => f.texte);
      expect(textes).not.toContain(PIECE_SELON_LE_COEUR[coeur]);

      // Le premier fragment, lui, n’a pas bougé.
      expect(textes[0]).toBe(MAIN_SELON_LE_BOIS[bois]);
    },
  );

  it("laisse les vingt autres sur le fragment ordinaire du cœur", () => {
    const particuliers = new Set(
      MARIAGES_PARTICULIERS.map((m) => `${m.bois}|${m.coeur}`),
    );
    const ordinaires = TOUTES.filter(
      (b) => !particuliers.has(`${b.bois}|${b.coeur}`),
    );

    expect(ordinaires).toHaveLength(20);

    for (const { bois, coeur } of ordinaires) {
      expect(assemblerReaction(bois, coeur)).toEqual([
        { ton: "recit", texte: MAIN_SELON_LE_BOIS[bois] },
        { ton: "recit", texte: PIECE_SELON_LE_COEUR[coeur] },
      ]);
    }
  });
});

describe("ce que le serveur refuse", () => {
  it("accepte les codes des deux listes", () => {
    for (const { bois, coeur } of TOUTES) {
      expect(verifierCodes(bois, coeur)).toEqual({ valide: true, bois, coeur });
    }
  });

  it.each([
    ["un bois inventé", "SAULE"],
    ["un code du brief, non retenu", "CHENE_TEMPETES"],
    ["la bonne valeur en minuscules", "frene"],
    ["un cœur à la place d’un bois", "PLUME_DE_CORBEAU"],
    ["rien du tout", null],
    ["une absence", undefined],
    ["un nombre", 3],
    ["un objet", { code: "FRENE" }],
    ["une liste", ["FRENE"]],
    ["une chaîne vide", ""],
  ])("refuse %s comme bois", (_libelle, valeur) => {
    expect(verifierCodes(valeur, "PLUME_DE_CORBEAU")).toEqual({
      valide: false,
      raison: "bois-inconnu",
    });
  });

  it.each([
    ["un cœur inventé", "PLUME_DE_MOUETTE"],
    ["un code du brief, non retenu", "CORBEAU"],
    ["la bonne valeur en minuscules", "cristal_de_glace"],
    ["un bois à la place d’un cœur", "FRENE"],
    ["rien du tout", null],
    ["un nombre", 0],
  ])("refuse %s comme cœur", (_libelle, valeur) => {
    expect(verifierCodes("FRENE", valeur)).toEqual({
      valide: false,
      raison: "coeur-inconnu",
    });
  });

  it("signale le bois d’abord quand les deux sont faux", () => {
    expect(verifierCodes("SAULE", "PLUME_DE_MOUETTE")).toEqual({
      valide: false,
      raison: "bois-inconnu",
    });
  });
});

describe("le dénouement, tel qu’il part vers le navigateur", () => {
  it.each(TOUTES)("$bois + $coeur : la photo coupe au bon endroit", ({ bois, coeur }) => {
    const { avantPhoto, apresPhoto, libelle } = assemblerDenouement(bois, coeur);

    // Avant la photo : ce qu’il dit du cœur, puis la fabrication.
    expect(avantPhoto.slice(0, SUITE_COEUR[coeur].length)).toEqual(
      SUITE_COEUR[coeur],
    );
    expect(avantPhoto.slice(-AVANT_LA_REACTION.length)).toEqual(AVANT_LA_REACTION);

    // Après la photo : la réaction, puis la sortie de l’échoppe.
    expect(apresPhoto.slice(0, 1)).toEqual([
      { ton: "recit", texte: MAIN_SELON_LE_BOIS[bois] },
    ]);
    expect(apresPhoto.slice(-APRES_LA_REACTION.length)).toEqual(APRES_LA_REACTION);

    expect(libelle).toBe(`${BOIS[bois]}, cœur de ${COEURS[coeur]}`);
  });

  it("n’emporte jamais la réaction d’une autre baguette", () => {
    const { apresPhoto } = assemblerDenouement("FRENE", "PLUME_DE_CORBEAU");
    const tout = apresPhoto.map((f) => f.texte).join(" ");

    expect(tout).toContain(MAIN_SELON_LE_BOIS.FRENE);
    expect(tout).not.toContain(MAIN_SELON_LE_BOIS.IF);
    expect(tout).not.toContain(PIECE_SELON_LE_COEUR.CRISTAL_DE_GLACE);
  });
});

describe("les cartes que le joueur lit", () => {
  it("en propose cinq de chaque, dans l’ordre des listes", () => {
    expect(CARTES_BOIS.map((c) => c.code)).toEqual([...CODES_BOIS]);
    expect(CARTES_COEUR.map((c) => c.code)).toEqual([...CODES_COEUR]);
  });

  it("reprend les noms de `ecole/baguette` sans les recopier", () => {
    for (const carte of CARTES_BOIS) {
      expect(carte.nom).toBe(BOIS[carte.code as keyof typeof BOIS]);
    }
    // Le cœur prend une majuscule en tête de carte, minuscule dans « cœur de ».
    for (const carte of CARTES_COEUR) {
      const nom = COEURS[carte.code as keyof typeof COEURS];
      expect(carte.nom.toLocaleLowerCase("fr")).toBe(nom);
      expect(carte.nom[0]).toBe(nom[0].toLocaleUpperCase("fr"));
    }
  });

  it("décrit chaque carte", () => {
    for (const carte of [...CARTES_BOIS, ...CARTES_COEUR]) {
      expect(carte.description.trim().length).toBeGreaterThan(40);
    }
  });
});

// ─────────────────────────────────────────────────────────────
//  Les règles du joueur, sur l’ensemble des textes
// ─────────────────────────────────────────────────────────────

/** Tout ce qui s’écrit dans la boutique, réactions comprises. */
const TOUS_LES_TEXTES: string[] = [
  ...RECIT_AVANT_ENSEIGNE.map((p) => p.texte),
  ...RECIT_APRES_ENSEIGNE.map((p) => p.texte),
  ...ENTRE_LE_BOIS_ET_LE_COEUR.map((p) => p.texte),
  ...AVANT_LA_REACTION.map((p) => p.texte),
  ...APRES_LA_REACTION.map((p) => p.texte),
  ...Object.values(SUITE_BOIS).flatMap((s) => s.map((p) => p.texte)),
  ...Object.values(SUITE_COEUR).flatMap((s) => s.map((p) => p.texte)),
  ...Object.values(MAIN_SELON_LE_BOIS),
  ...Object.values(PIECE_SELON_LE_COEUR),
  ...Object.values(VARIANTES).flatMap((v) => v.map((p) => p.texte)),
  ...CARTES_BOIS.flatMap((c) => [c.nom, c.description]),
  ...CARTES_COEUR.flatMap((c) => [c.nom, c.description]),
];

describe("les règles du joueur, sur tous les textes de la boutique", () => {
  it("n’écrit jamais d’apostrophe droite", () => {
    const fautifs = TOUS_LES_TEXTES.filter((t) => t.includes("'"));
    expect(fautifs).toEqual([]);
  });

  /**
   * Art. 11 et règle du brief : la boutique et le Miroir sont indépendants.
   * Un joueur ne doit jamais pouvoir croire qu’un bois oriente une maison.
   */
  it("ne nomme aucune maison, ni par son nom ni par son code", () => {
    /**
     * Les quatre noms, leurs codes, et les deux mots qui désignent la
     * cérémonie. Pas le mot « maison » tout court : le récit parle des
     * maisons de bois de Kaldvik, qui n’ont rien à voir.
     */
    const interdits = [
      ...Object.keys(NOMS_MAISON),
      ...Object.values(NOMS_MAISON),
      "répartition",
      "miroir de brume",
    ];

    // On rassemble les fautes plutôt que de tomber à la première : si un
    // texte dérive un jour, autant les voir toutes d’un coup.
    const fautes = TOUS_LES_TEXTES.flatMap((texte) =>
      interdits
        .filter((mot) =>
          texte.toLocaleLowerCase("fr").includes(mot.toLocaleLowerCase("fr")),
        )
        .map((mot) => `« ${mot} » dans : ${texte.slice(0, 70)}…`),
    );

    expect(fautes).toEqual([]);
  });

  it("ne promet aucun avantage de jeu", () => {
    // La magie courante n’a ni coût ni risque : un sort marche ou rate.
    // Le vocabulaire d’équipement n’a donc rien à faire dans cette scène.
    const interdits = ["bonus", "malus", "avantage", "puissance de sort", "statistique", "points de"];

    for (const texte of TOUS_LES_TEXTES) {
      for (const mot of interdits) {
        expect(texte.toLocaleLowerCase("fr")).not.toContain(mot);
      }
    }
  });

  it("n’écrit pas un texte vide", () => {
    for (const texte of TOUS_LES_TEXTES) {
      expect(texte.trim().length).toBeGreaterThan(0);
    }
  });
});
