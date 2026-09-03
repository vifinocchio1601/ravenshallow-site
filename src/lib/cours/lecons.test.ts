import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LECONS,
  lecon,
  leconsDe,
  nomDeLaMatiere,
  peutOuvrirLaLecon,
  estOuverteAuxEleves,
  type Lecon,
} from "./lecons";
import { matiereDe } from "./cursus";
import { clesDesQuestionnaires } from "./questionnaires";

/**
 * ⚠️ **On désigne une leçon par sa clé, jamais par sa place dans la liste.**
 * `LECONS[0]` était juste tant qu'il n'y en avait qu'une ; le jour où l'on
 * range la liste autrement, un indice en dur fait porter à ces essais autre
 * chose que ce qu'ils annoncent, sans rien casser.
 */
const laTorche = lecon("sortileges", "1")!;

/**
 * ⚠️ **Aucun essai ne lit l'horloge.** L'instant arrive en paramètre partout,
 * et l'on éprouve donc la veille et le lendemain de l'ouverture sans attendre
 * — c'est tout l'intérêt d'avoir remplacé le booléen par une date.
 */
const OUVERTURE = laTorche.ouverteAuxElevesLe!;
const AVANT = new Date(OUVERTURE.getTime() - 60_000);
const PILE = new Date(OUVERTURE.getTime());
const APRES = new Date(OUVERTURE.getTime() + 60_000);
const lesSignes = lecon("runologie", "1")!;
const laGarde = lecon("magie_defensive", "1")!;

describe("les leçons déclarées", () => {
  it("portent un identifiant de matière qui existe au cursus", () => {
    // ⚠️ Le libellé s'affiche depuis le cursus, qui est la source. Une leçon
    // qui nommerait une matière inconnue s'afficherait sans nom, et personne
    // ne verrait pourquoi.
    for (const l of LECONS) {
      expect(matiereDe(l.matiereId), l.matiereId).not.toBeNull();
    }
  });

  it("ont un rang qui tient dans le total annoncé", () => {
    for (const l of LECONS) {
      expect(l.rang, l.titre).toBeGreaterThanOrEqual(1);
      expect(l.rang, l.titre).toBeLessThanOrEqual(l.surCombien);
    }
  });

  it("n’ont pas deux fois le même rang dans une matière", () => {
    const vues = new Set<string>();
    for (const l of LECONS) {
      const cle = `${l.matiereId}/${l.annee}/${l.rang}`;
      expect(vues.has(cle), cle).toBe(false);
      vues.add(cle);
    }
  });

  /**
   * ⚠️ **La décision du joueur, figée ici.** Les six leçons de première année
   * sont ouvertes aux élèves depuis le 4 septembre 2026 à 9 h — heure qu'il a
   * fixée lui-même. Le test qui tenait la position inverse a bien tombé ce
   * jour-là, et c'était son rôle : l'ouverture est une décision, pas un effet
   * de bord.
   *
   * Ce qui la remplace n'est pas « toutes sont ouvertes » — ce serait figer
   * l'état plutôt que la règle, et une leçon posée demain pour relecture
   * ferait tomber le test sans rien avoir de fautif. C'est **la condition**
   * qui est figée : une leçon ouverte a son contrôle.
   */
  it("n’ouvrent jamais une leçon dont le contrôle n’existe pas", () => {
    const cles = clesDesQuestionnaires();
    for (const l of LECONS) {
      // ⚠️ **Une date, même future, compte comme une promesse d'ouverture** :
      // la leçon s'ouvrira toute seule ce jour-là, et son contrôle doit
      // exister avant. C'est le seul moment où l'on peut encore s'en apercevoir.
      if (l.ouverteAuxElevesLe === null) continue;
      expect(cles, `${l.matiereId} — ${l.titre}`).toContain(
        `${l.matiereId}/${l.annee}/${l.rang}`,
      );
    }
  });

  /**
   * Le pendant du précédent, dans l'autre sens : un questionnaire posé sans sa
   * leçon ne serait joignable par aucune adresse — la route du contrôle part
   * de la leçon. Il dormirait sans que rien ne le dise.
   */
  it("ont une leçon pour chaque questionnaire posé", () => {
    for (const cle of clesDesQuestionnaires()) {
      const [matiere, annee, rang] = cle.split("/");
      expect(
        LECONS.some(
          (l) =>
            l.matiereId === matiere &&
            String(l.annee) === annee &&
            String(l.rang) === rang,
        ),
        cle,
      ).toBe(true);
    }
  });

  /**
   * ⚠️ **Une leçon ouverte doit aussi avoir sa page de contrôle branchée.**
   * Le questionnaire et le HTML vivent à deux endroits ; le bouton « Passer le
   * contrôle » de la leçon mène à un 404 si le second manque, et l'élève en
   * conclut que le site est cassé. Même procédé que pour les leçons : on relit
   * le code source de la route.
   */
  it("ont toutes une page de contrôle branchée dans sa route", () => {
    const source = readFileSync(
      "src/app/(ecole)/cours/[annee]/[matiere]/[lecon]/controle/route.ts",
      "utf8",
    );
    const cles = source
      .slice(source.indexOf("const CONTENUS"))
      .split("};")[0]
      .match(/"([a-z_]+\/[0-9]+)"/g);

    for (const l of LECONS) {
      if (l.ouverteAuxElevesLe === null) continue;
      expect(cles, `${l.matiereId}/${l.rang}`).toContain(
        `"${l.matiereId}/${l.rang}"`,
      );
    }
  });

  /**
   * ⚠️ **Chaque page porte sa sortie, et elle doit désigner la BONNE année.**
   * Le lien du haut de page est écrit dans le HTML — il doit marcher sans une
   * ligne de script, une page de cours n'ayant aucune autre issue —, et il est
   * donc écrit en toutes lettres. Une leçon de deuxième année copiée sur
   * celle-ci ramènerait au programme de première sans que rien ne le dise :
   * le lien fonctionne, il ne mène simplement pas au bon endroit.
   *
   * La sortie du BOUTON, elle, est dérivée de l'année par la route — c'est
   * `ETAT.retour`, et elle ne peut pas se tromper.
   */
  it("portent une sortie, qui désigne l’année de la leçon", () => {
    for (const l of LECONS) {
      const slug = l.matiereId.replace(/_/g, "-");
      for (const chemin of [
        `src/contenu/cours/${slug}-l1-1.ts`,
        `src/contenu/cours/controles/${slug}-l1-1.ts`,
      ]) {
        const source = readFileSync(chemin, "utf8");
        expect(source.includes('class="retour"'), chemin).toBe(true);
        expect(source.includes(`href="/cours/${l.annee}"`), chemin).toBe(true);
      }
    }
  });

  /**
   * ⚠️ **La date d'ouverture, figée ici.** Le joueur l'avait fixée au vendredi
   * 4 septembre 2026 à 9 h ; il l'a avancée au 3 au soir, l'école n'ayant
   * encore aucun inscrit. Les deux fois, c'est une décision — et les deux
   * fois, ce test est venu la recueillir.
   *
   * C'était un booléen jusqu'au 3 septembre au soir — l'ouverture dépendait
   * donc du moment du déploiement, et un `git push` la veille a ouvert les
   * cours un jour trop tôt. **Ce test existe pour que cela ne se reproduise
   * pas en silence** : le jour où l'on touchera à cette date, il faudra venir
   * ici, et ce sera une décision.
   *
   * ⚠️ **L'instant est comparé en UTC**, jamais par sa forme locale : la
   * machine qui fait tourner les essais n'est pas forcément à Bruxelles, et
   * Vercel vit en UTC. 9 h à Bruxelles en septembre, c'est 7 h UTC.
   */
  it("s’ouvrent le 3 septembre 2026 à 20 h, heure de Bruxelles", () => {
    for (const l of LECONS) {
      // 20 h à Bruxelles en septembre (heure d'été) = 18 h UTC.
      expect(l.ouverteAuxElevesLe?.toISOString(), l.titre).toBe(
        "2026-09-03T18:00:00.000Z",
      );
    }
  });

  /**
   * ⚠️ **Une minute avant, c'est fermé ; à l'heure pile, c'est ouvert.**
   * L'heure annoncée est celle à laquelle on entre, pas celle après laquelle
   * on entrera — un `>` au lieu d'un `>=` ferait attendre une seconde de plus
   * tout le monde, et personne ne comprendrait pourquoi.
   */
  it("sont fermées la minute d’avant et ouvertes à l’heure pile", () => {
    for (const l of LECONS) {
      expect(estOuverteAuxEleves(l, AVANT), `${l.titre} — avant`).toBe(false);
      expect(estOuverteAuxEleves(l, PILE), `${l.titre} — pile`).toBe(true);
      expect(estOuverteAuxEleves(l, APRES), `${l.titre} — après`).toBe(true);
    }
  });

  /**
   * Et **le staff passe avant l'heure** : c'est ce qui lui permet de relire
   * une leçon la veille de son ouverture, ce que le joueur fait à chaque fois.
   */
  it("restent ouvertes au staff avant l’heure", () => {
    for (const l of LECONS) {
      expect(peutOuvrirLaLecon(l, true, true, AVANT), l.titre).toBe(true);
      expect(peutOuvrirLaLecon(l, true, false, AVANT), l.titre).toBe(false);
    }
  });

  it("rendent le nom de leur matière depuis le cursus", () => {
    expect(nomDeLaMatiere(laTorche)).toBe(matiereDe("sortileges")?.nom);
    expect(nomDeLaMatiere(lesSignes)).toBe(matiereDe("runologie")?.nom);
    expect(nomDeLaMatiere(laGarde)).toBe(matiereDe("magie_defensive")?.nom);
  });

  /**
   * ⚠️ **Une leçon déclarée sans contenu rend 404, en silence.** La liste vit
   * ici et le HTML est branché dans `CONTENUS`, à l'autre bout, dans la route
   * qui le sert : rien n'oblige les deux à s'accorder, et l'oubli ne se voit
   * qu'en ouvrant la page — c'est-à-dire jamais, tant que la leçon est fermée
   * aux élèves et que personne ne va la regarder.
   *
   * On relit donc le code source de la route, comme `etancheite.test.ts` relit
   * celui de l'administration. Éprouvé en retirant la ligne du contenu : il
   * tombe et nomme la clé qui manque.
   */
  it("ont toutes un contenu branché dans la route qui les sert", () => {
    const source = readFileSync(
      "src/app/(ecole)/cours/[annee]/[matiere]/[lecon]/route.ts",
      "utf8",
    );
    const cles = source
      .slice(source.indexOf("const CONTENUS"))
      .split("};")[0]
      .match(/"([a-z_]+\/[0-9]+)"/g);

    for (const l of LECONS) {
      expect(cles, `${l.matiereId}/${l.rang}`).toContain(
        `"${l.matiereId}/${l.rang}"`,
      );
    }
  });
});

describe("trouver une leçon", () => {
  it("par sa matière et son rang", () => {
    expect(lecon("sortileges", "1")?.titre).toBe("La Torche");
    expect(lecon("runologie", "1")?.titre).toBe(
      "Vingt-quatre signes, vingt-quatre sons",
    );
    expect(lecon("magie_defensive", "1")?.titre).toBe("La garde et la distance");
    expect(lecon("herboristerie", "1")?.titre).toBe("Reconnaître");
    expect(lecon("creatures", "1")?.titre).toBe("Regarder");
    expect(lecon("histoire", "1")?.titre).toBe("La côte avant l’école");
  });

  it("rend null pour ce qui n’existe pas", () => {
    expect(lecon("sortileges", "2")).toBeNull();
    expect(lecon("runologie", "2")).toBeNull();
    expect(lecon("magie_defensive", "2")).toBeNull();
    expect(lecon("herboristerie", "2")).toBeNull();
    // Le Duel n'ouvre qu'en quatrième année : il n'a pas de leçon de première.
    expect(lecon("duel", "1")).toBeNull();
    expect(lecon("matiere-inventee", "1")).toBeNull();
  });

  it("refuse un rang qui n’est pas un entier positif", () => {
    for (const rang of ["0", "-1", "1.5", "abc", "", "1e3", " 1"]) {
      expect(lecon("sortileges", rang), rang).toBeNull();
    }
  });

  it("liste les leçons d’une matière dans l’ordre", () => {
    expect(leconsDe("sortileges", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("runologie", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("magie_defensive", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("herboristerie", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("creatures", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("histoire", 1).map((l) => l.rang)).toEqual([1]);
    expect(leconsDe("sortileges", 2)).toEqual([]);
    expect(leconsDe("runologie", 2)).toEqual([]);
    expect(leconsDe("duel", 1)).toEqual([]);
  });
});

describe("qui peut ouvrir une leçon", () => {
  const fermee: Lecon = { ...laTorche, ouverteAuxElevesLe: null };
  const ouverte: Lecon = { ...laTorche, ouverteAuxElevesLe: AVANT };

  it("le staff passe partout, même sur une leçon fermée", () => {
    expect(peutOuvrirLaLecon(fermee, true, true, APRES)).toBe(true);
    // Et même si son année ne l'atteint pas : c'est le parti pris du forum.
    expect(peutOuvrirLaLecon(fermee, false, true, APRES)).toBe(true);
  });

  it("un élève n’ouvre pas une leçon fermée, même de son année", () => {
    expect(peutOuvrirLaLecon(fermee, true, false, APRES)).toBe(false);
  });

  it("un élève ouvre une leçon ouverte de son année", () => {
    expect(peutOuvrirLaLecon(ouverte, true, false, APRES)).toBe(true);
  });

  /**
   * Art. 14.4 — « les matières accessibles à un personnage sont celles de son
   * année en cours ». La question n'est pas reposée ici : elle arrive déjà
   * tranchée par `peutOuvrirLAnnee`, et la reposer en ferait une seconde
   * source qui divergerait.
   */
  it("un élève n’ouvre pas une leçon d’une année qu’il n’a pas atteinte", () => {
    expect(peutOuvrirLaLecon(ouverte, false, false, APRES)).toBe(false);
  });
});
