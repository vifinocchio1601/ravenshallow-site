import { describe, expect, it } from "vitest";
import { nettoyerHtml, texteEnHtml } from "./nettoyer-html";

describe("ce qui passe", () => {
  it("laisse le balisage permis intact", () => {
    const bon =
      '<p class="rs-a-centre">Elle entre, <strong>trempée</strong> et <em>muette</em>.</p>' +
      '<blockquote>Ce que la brume scelle.</blockquote><hr />' +
      '<p><span class="rs-c-tideal">Sarcelle</span>, et <u>souligné</u>, et <s>barré</s>.</p>';
    expect(nettoyerHtml(bon)).toBe(bon);
  });

  it("ramène les vieilles balises d’apparence à leur équivalent", () => {
    expect(nettoyerHtml("<b>gras</b> <i>italique</i> <strike>barré</strike>")).toBe(
      "<strong>gras</strong> <em>italique</em> <s>barré</s>",
    );
  });

  it("garde le texte d’une balise refusée, sans la balise", () => {
    // Quelqu'un qui écrit « <ceci> » dans son post doit le retrouver.
    expect(nettoyerHtml("<article>Le jeu.</article>")).toBe("Le jeu.");
  });

  it("ne change plus rien au second passage", () => {
    // On nettoie à l'enregistrement ET à l'affichage : si le second passage
    // modifiait le résultat du premier, le post changerait à chaque lecture.
    const brut =
      '<p class="rs-a-droite">Un <a href="https://exemple.net">lien</a> et <b>du gras</b>.</p>';
    const une = nettoyerHtml(brut);
    expect(nettoyerHtml(une)).toBe(une);
  });
});

describe("ce qui tombe", () => {
  it("retire une balise script insérée à la main, contenu compris", () => {
    const attaque = '<p>Bonjour</p><script>alert("pris")</script>';
    const propre = nettoyerHtml(attaque);
    expect(propre).toBe("<p>Bonjour</p>");
    expect(propre).not.toContain("alert");
    expect(propre).not.toContain("script");
  });

  it("retire style, iframe, svg et leur contenu", () => {
    expect(nettoyerHtml("<style>body{display:none}</style>a")).toBe("a");
    expect(nettoyerHtml('<iframe src="https://ailleurs.example"></iframe>a')).toBe("a");
    expect(nettoyerHtml("<svg><script>alert(1)</script></svg>a")).toBe("a");
  });

  it("retire les attributs d’événement", () => {
    expect(nettoyerHtml('<p onclick="voler()">Texte</p>')).toBe("<p>Texte</p>");
    expect(nettoyerHtml('<span onmouseover="x" class="rs-c-tideal">a</span>')).toBe(
      '<span class="rs-c-tideal">a</span>',
    );
  });

  it("retire l’attribut style", () => {
    expect(nettoyerHtml('<p style="color:#800000">illisible</p>')).toBe(
      "<p>illisible</p>",
    );
  });

  it("refuse une classe qui n’est pas de la palette", () => {
    expect(nettoyerHtml('<span class="rs-c-rouge-sang">a</span>')).toBe(
      "<span>a</span>",
    );
    expect(nettoyerHtml('<p class="fixed inset-0 z-50">a</p>')).toBe("<p>a</p>");
  });
});

describe("les liens", () => {
  it("refuse une adresse en javascript:", () => {
    const propre = nettoyerHtml('<a href="javascript:alert(1)">clic</a>');
    expect(propre).not.toContain("javascript");
    expect(propre).toContain("clic");
  });

  it("refuse une adresse en data:", () => {
    const propre = nettoyerHtml(
      '<a href="data:text/html;base64,PHNjcmlwdD4=">clic</a>',
    );
    expect(propre).not.toContain("data:");
  });

  it("refuse une adresse sans schéma explicite", () => {
    // « //ailleurs.example » emprunte le schéma de la page : c'est une adresse
    // extérieure qui n'en a pas l'air.
    const propre = nettoyerHtml('<a href="//ailleurs.example">clic</a>');
    expect(propre).not.toContain("ailleurs.example");
  });

  it("ouvre une adresse extérieure dans un onglet neuf, protégée", () => {
    const propre = nettoyerHtml('<a href="https://exemple.net/page">là</a>');
    expect(propre).toContain('href="https://exemple.net/page"');
    expect(propre).toContain('rel="noopener noreferrer"');
    expect(propre).toContain('target="_blank"');
  });

  it("garde une adresse du site dans le même onglet", () => {
    const propre = nettoyerHtml('<a href="/ecole/la-bibliotheque">là</a>');
    expect(propre).toContain('href="/ecole/la-bibliotheque"');
    expect(propre).toContain('rel="noopener noreferrer"');
    expect(propre).not.toContain("target");
  });

  it("accepte une adresse de courriel", () => {
    expect(nettoyerHtml('<a href="mailto:a@exemple.net">écrire</a>')).toContain(
      "mailto:a@exemple.net",
    );
  });

  it("ne se laisse pas berner par la casse ni les blancs", () => {
    for (const ruse of [
      '<a href="JaVaScRiPt:alert(1)">a</a>',
      '<a href=" javascript:alert(1)">a</a>',
      '<a href="java\tscript:alert(1)">a</a>',
    ]) {
      expect(nettoyerHtml(ruse).toLowerCase()).not.toContain("alert");
    }
  });
});

describe("le texte d’avant la mise en forme", () => {
  it("échappe tout ce qui pourrait être pris pour du balisage", () => {
    const html = texteEnHtml('Il a dit <script>alert("x")</script> & rien.');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("laisse les guillemets tels quels — c’est du texte, pas un attribut", () => {
    // Les échapper donnerait une forme que le nettoyage ramènerait aussitôt à
    // celle-ci : deux écritures du même post, dont une seule serait stockée.
    expect(texteEnHtml('Il a dit "non".')).toBe('<p>Il a dit "non".</p>');
  });

  it("rend les paragraphes comme ils s’affichaient", () => {
    expect(texteEnHtml("Un.\nDeux.\n\nTrois.")).toBe(
      "<p>Un.<br />Deux.</p><p>Trois.</p>",
    );
  });

  it("ne fabrique pas de paragraphe vide", () => {
    expect(texteEnHtml("\n\n\n Seul. \n\n\n")).toBe("<p>Seul.</p>");
    expect(texteEnHtml("   ")).toBe("");
  });

  /**
   * La migration `20260827150000_posts_en_balisage` refait cette conversion
   * en SQL, faute de pouvoir appeler du TypeScript. Cet essai fige le seul
   * post que le site portait au moment de la bascule, avec le résultat que la
   * migration a réellement écrit en base : si les deux devaient diverger, on
   * le saurait ici plutôt qu'en relisant une vieille scène.
   */
  it("donne le même résultat que la migration qui a converti l’existant", () => {
    expect(texteEnHtml("test\nert\nt\ntt\ntt\n\nt\nt\nt\nt\nt")).toBe(
      "<p>test<br />ert<br />t<br />tt<br />tt</p><p>t<br />t<br />t<br />t<br />t</p>",
    );
  });

  it("survit au nettoyage sans rien perdre", () => {
    const brut = 'Le sceau & le <sceau>. "Rien" n’y entre.';
    expect(nettoyerHtml(texteEnHtml(brut))).toBe(texteEnHtml(brut));
  });
});
