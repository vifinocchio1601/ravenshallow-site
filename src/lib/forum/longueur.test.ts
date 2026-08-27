import { describe, expect, it } from "vitest";
import {
  CARACTERES_PAR_LIGNE,
  LIGNES_MINIMUM_RP,
  caracteresUtiles,
  lignesAffichees,
  lignesManquantes,
  proportion,
  respecteLeMinimum,
  sansHorsRP,
  seuilEnCaracteres,
  texteQuiCompte,
} from "./longueur";

const SEUIL = seuilEnCaracteres(LIGNES_MINIMUM_RP);

/** Un texte d’exactement `n` caractères utiles, sans blanc à réduire. */
const exactement = (n: number) => "m".repeat(n);

/**
 * Un paragraphe d’un seul tenant, d’au moins `n` caractères utiles — **sans
 * aucun retour à la ligne**. C’est tout l’objet de l’essai qui s’en sert :
 * l’ancien compteur découpait sur les sauts de ligne, et un paragraphe, si
 * long soit-il, ne valait qu’une ligne à ses yeux.
 */
function paragraphe(n: number): string {
  const phrase =
    "La brume monte du lac et se prend dans les arches, et l’on n’entend plus que le vent.";
  let texte = phrase;
  while (caracteresUtiles(texte) < n) texte += " " + phrase;
  return texte;
}

describe("le seuil", () => {
  it("vaut dix lignes de quatre-vingts signes, soit huit cents", () => {
    expect(LIGNES_MINIMUM_RP).toBe(10);
    expect(CARACTERES_PAR_LIGNE).toBe(80);
    expect(SEUIL).toBe(800);
  });
});

describe("ce qui compte", () => {
  it("réduit les blancs répétés à un seul espace", () => {
    expect(texteQuiCompte("un   \n\n\t  mot")).toBe("un mot");
  });

  it("ne compte pas le balisage de mise en forme", () => {
    const orne = "<p><strong>Sigrid</strong> se tait.</p>";
    expect(texteQuiCompte(orne)).toBe("Sigrid se tait.");
  });

  it("ne laisse pas deux paragraphes se coller l’un à l’autre", () => {
    // Sans traitement, « <p>mot</p><p>autre</p> » se lirait « motautre » et
    // le compte perdrait un signe par paragraphe.
    expect(texteQuiCompte("<p>mot</p><p>autre</p>")).toBe("mot autre");
  });

  it("ne se laisse pas gonfler par les entités", () => {
    // Cinq esperluettes écrites à la main, que le nettoyage encode : cinq
    // signes comptés, jamais vingt-cinq.
    expect(caracteresUtiles("&amp;&amp;&amp;&amp;&amp;")).toBe(5);
    expect(texteQuiCompte("&lt;script&gt;")).toBe("<script>");
  });

  it("traite l’espace insécable comme un blanc", () => {
    expect(texteQuiCompte("un&nbsp;&nbsp;&nbsp;mot")).toBe("un mot");
  });
});

describe("le hors-RP ne compte pas", () => {
  it("retire les blocs fermés", () => {
    expect(sansHorsRP("avant [HRP]note[/HRP] après")).toBe("avant  après");
  });

  it("coupe un bloc jamais refermé jusqu’à la fin", () => {
    expect(texteQuiCompte("du jeu [HRP] et un commentaire sans fin")).toBe(
      "du jeu",
    );
  });

  it("le retrouve même quand du balisage le coupe en deux", () => {
    const coupe = "<p>[HRP]</p><p>un aparté</p><p>[/HRP]</p><p>Le jeu.</p>";
    expect(texteQuiCompte(coupe)).toBe("Le jeu.");
  });

  it("un hors-RP volumineux ne fait pas passer un post trop court", () => {
    const corps = `Il entre. [HRP]${exactement(5000)}[/HRP]`;
    expect(caracteresUtiles(corps)).toBe("Il entre.".length);
    expect(respecteLeMinimum(corps, LIGNES_MINIMUM_RP)).toBe(false);
  });
});

describe("le minimum", () => {
  it("refuse dix lignes d’une seule lettre — le contournement d’origine", () => {
    const triche = "a\n".repeat(10);
    expect(respecteLeMinimum(triche, LIGNES_MINIMUM_RP)).toBe(false);
  });

  it("refuse le post réellement écrit sur le site : dix lignes, vingt-six signes", () => {
    // Relevé en base le 27 août 2026, et c’est ce qui a motivé le changement.
    const reel = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm\n";
    expect(caracteresUtiles(reel)).toBeLessThan(SEUIL);
    expect(respecteLeMinimum(reel, LIGNES_MINIMUM_RP)).toBe(false);
  });

  it("accepte huit cents caractères réels", () => {
    expect(caracteresUtiles(exactement(SEUIL))).toBe(SEUIL);
    expect(respecteLeMinimum(exactement(SEUIL), LIGNES_MINIMUM_RP)).toBe(true);
  });

  it("refuse un signe de moins, accepte le compte juste", () => {
    expect(respecteLeMinimum(exactement(SEUIL - 1), LIGNES_MINIMUM_RP)).toBe(
      false,
    );
    expect(respecteLeMinimum(exactement(SEUIL), LIGNES_MINIMUM_RP)).toBe(true);
  });

  /**
   * La régression que l’ancien compteur provoquait, et qui était le plus
   * grave des deux défauts : il découpait sur les retours à la ligne, donc un
   * long post en trois paragraphes valait trois lignes et se faisait refuser.
   */
  it("accepte de la prose en trois paragraphes, que l’ancien compteur refusait", () => {
    const trois = [paragraphe(300), paragraphe(300), paragraphe(300)].join(
      "\n\n",
    );
    expect(trois.split("\n").filter((l) => /\S/.test(l)).length).toBeLessThan(
      LIGNES_MINIMUM_RP,
    );
    expect(respecteLeMinimum(trois, LIGNES_MINIMUM_RP)).toBe(true);
  });

  it("sans minimum, tout passe sauf le vide", () => {
    expect(respecteLeMinimum("Un mot.", null)).toBe(true);
    expect(respecteLeMinimum("   \n\t\n ", null)).toBe(false);
    expect(respecteLeMinimum("<p></p>", null)).toBe(false);
    expect(respecteLeMinimum("[HRP]tout en hors-RP[/HRP]", null)).toBe(false);
  });
});

describe("ce que le joueur lit", () => {
  it("s’exprime en lignes, arrondies vers le bas", () => {
    expect(lignesAffichees(exactement(0))).toBe(0);
    expect(lignesAffichees(exactement(CARACTERES_PAR_LIGNE - 1))).toBe(0);
    expect(lignesAffichees(exactement(CARACTERES_PAR_LIGNE))).toBe(1);
    expect(lignesAffichees(exactement(SEUIL))).toBe(LIGNES_MINIMUM_RP);
  });

  it("n’annonce jamais dix lignes à un post qui va être refusé", () => {
    const presque = exactement(SEUIL - 1);
    expect(respecteLeMinimum(presque, LIGNES_MINIMUM_RP)).toBe(false);
    expect(lignesAffichees(presque)).toBeLessThan(LIGNES_MINIMUM_RP);
  });

  it("compte les lignes qui restent, et jamais zéro tant que c’est refusé", () => {
    expect(lignesManquantes(exactement(0), LIGNES_MINIMUM_RP)).toBe(10);
    expect(lignesManquantes(exactement(SEUIL - 1), LIGNES_MINIMUM_RP)).toBe(1);
    expect(lignesManquantes(exactement(SEUIL), LIGNES_MINIMUM_RP)).toBe(0);
    expect(lignesManquantes(exactement(5), null)).toBe(0);
  });

  it("avance à chaque frappe, et se borne à un", () => {
    expect(proportion("", LIGNES_MINIMUM_RP)).toBe(0);
    expect(proportion(exactement(SEUIL / 2), LIGNES_MINIMUM_RP)).toBe(0.5);
    expect(proportion(exactement(SEUIL * 3), LIGNES_MINIMUM_RP)).toBe(1);
    expect(proportion("n’importe quoi", null)).toBe(1);
  });
});
