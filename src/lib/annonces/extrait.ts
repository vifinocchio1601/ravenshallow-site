import { EXTRAIT_MAX } from "./limites";

/**
 * **Les premiers mots d'une annonce**, pour le journal du bureau.
 *
 * L'extrait n'est **pas stocké** : deux textes qui disent la même chose
 * finissent toujours par se contredire — on corrige l'annonce, l'extrait
 * garde l'ancienne phrase, et le bureau annonce autre chose que le Grand
 * Hall. Il se calcule donc à la lecture, depuis le corps.
 *
 * ⚠️ **Retirer des balises pour résumer n'est pas nettoyer.** Cette fonction
 * ne protège de rien, exactement comme `texteQuiCompte` du forum : sa sortie
 * est du texte, rendue par React donc échappée d'office. **Ne jamais s'en
 * servir pour rendre un balisage sûr** — c'est `nettoyerHtml` qui le fait, et
 * lui seul.
 *
 * Elle est écrite ici plutôt qu'empruntée au forum : le jour où le forum
 * changera sa façon de compter les lignes, le journal du château n'a aucune
 * raison de changer avec lui.
 */
export function extrait(corps: string, maximum = EXTRAIT_MAX): string {
  const texte = enTexte(corps);
  if (texte.length <= maximum) return texte;

  // On coupe sur un mot, jamais au milieu — sauf s'il n'y a pas d'espace à
  // portée, auquel cas la coupe franche vaut mieux qu'une phrase entière.
  const tronque = texte.slice(0, maximum);
  const dernierEspace = tronque.lastIndexOf(" ");
  const garde = dernierEspace > maximum / 2 ? tronque.slice(0, dernierEspace) : tronque;

  // Les points de suspension en UN signe (U+2026) : trois points collés se
  // coupent en fin de ligne et se lisent mal à voix haute.
  return `${garde.replace(/[\s,;:.…]+$/u, "")}…`;
}

/**
 * Le balisage réduit à son texte.
 *
 * Trois passes, dans cet ordre : les blocs deviennent des espaces — sans quoi
 * « <p>fin</p><p>début</p> » donnerait « findébut » —, les balises tombent,
 * les entités se décodent, et les blancs se réduisent à un seul.
 */
function enTexte(corps: string): string {
  return corps
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6])\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    // L'esperluette EN DERNIER : la décoder avant les autres transformerait
    // « &amp;lt; » en « < », c'est-à-dire ferait réapparaître une balise que
    // l'auteur avait échappée.
    .replace(/&amp;/gi, "&")
    .replace(/\s+/gu, " ")
    .trim();
}
