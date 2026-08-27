import "server-only";
import sanitizeHtml from "sanitize-html";
import { CLASSES_DE_BLOC, CLASSES_DE_SPAN } from "./mise-en-forme";

/**
 * **Le nettoyage du balisage d'un post.** C'est la seule chose qui protège le
 * site du HTML qu'un joueur envoie, et il n'existe pas de second recours.
 *
 * ── Trois principes, et aucun n'est négociable ──
 *
 * 1. **Liste blanche, jamais liste noire.** On énumère ce qui passe ; tout le
 *    reste tombe, y compris ce qui n'existe pas encore. Une liste d'interdits
 *    serait à rallonger éternellement, et l'oubli y ouvrirait une porte. C'est
 *    le même parti pris que `robots.ts`.
 * 2. **Le serveur ne fait jamais confiance au navigateur.** La barre de mise
 *    en forme ne produit que du balisage permis — mais elle se contourne en
 *    envoyant la requête à la main, et c'est ici que ça s'arrête.
 * 3. **On nettoie à l'enregistrement ET à l'affichage.** Deux fois la même
 *    fonction, exprès : le premier passage protège la base, le second protège
 *    l'écran de tout ce qui aurait pu y entrer autrement — une reprise de
 *    données, une requête forgée, une règle assouplie un jour de fatigue.
 *
 * ⚠️ **Ne jamais rendre un `corps` sans être passé par ici**, et ne jamais
 * remplacer cet appel par `texteQuiCompte` de `longueur.ts`, qui retire des
 * balises pour compter et ne protège de rien.
 */

/**
 * Les balises permises. `span` porte les couleurs et les tailles ; `p` et
 * `blockquote` portent l'alignement.
 *
 * Ni `div`, ni `style`, ni `script`, ni `iframe`, ni `img` — les images sont
 * une autre affaire, avec ses propres règles (art. 6), et rien ne presse.
 */
const BALISES = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "hr",
  "a",
  "span",
] as const;

/**
 * Les vieilles balises d'apparence, ramenées à leur équivalent sémantique.
 *
 * Un navigateur qui met en gras produit encore `<b>` ici et `<strong>` là
 * selon sa version. Les jeter ferait perdre le gras du joueur sans qu'il
 * comprenne ; les accepter ferait deux façons d'écrire la même chose.
 */
const EQUIVALENCES: Record<string, string> = {
  b: "strong",
  i: "em",
  strike: "s",
  del: "s",
  ins: "u",
};

/**
 * Un lien, refait de zéro : on ne garde que l'adresse, et l'on repose les
 * attributs nous-mêmes.
 *
 * `rel="noopener noreferrer"` **sur tous les liens**, et non sur les seuls
 * liens externes : c'est un attribut sans effet de bord, et une condition en
 * moins est une condition qu'on ne peut pas se tromper à écrire.
 *
 * `target="_blank"` en revanche est réservé aux adresses extérieures — une
 * page du site qui s'ouvrirait dans un onglet neuf perdrait le joueur.
 *
 * L'adresse n'est pas validée ici : les schémas permis sont déclarés plus
 * bas, et `sanitize-html` écarte lui-même ce qui n'y figure pas — y compris
 * ce que cette fonction lui rendrait.
 */
function refaireLeLien(_balise: string, attributs: sanitizeHtml.Attributes) {
  const adresse = typeof attributs.href === "string" ? attributs.href : "";
  const exterieure = /^https?:\/\//i.test(adresse);

  return {
    tagName: "a",
    attribs: {
      href: adresse,
      rel: "noopener noreferrer",
      ...(exterieure ? { target: "_blank" } : {}),
    },
  };
}

const REGLAGES: sanitizeHtml.IOptions = {
  allowedTags: [...BALISES],

  allowedAttributes: {
    a: ["href", "rel", "target"],
    p: ["class"],
    blockquote: ["class"],
    span: ["class"],
  },

  // Les classes viennent de `mise-en-forme.ts`, déduites des listes d'outils.
  // Une classe inventée à la main ne figure dans aucune des trois, donc ne
  // passe pas — et une couleur ajoutée à la palette passe sans qu'on y pense.
  allowedClasses: {
    span: [...CLASSES_DE_SPAN],
    p: [...CLASSES_DE_BLOC],
    blockquote: [...CLASSES_DE_BLOC],
  },

  // Ni `javascript:`, ni `data:`, ni `vbscript:`, ni rien d'autre.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  // `//ailleurs.example` emprunte le schéma de la page : c'est une adresse
  // extérieure qui n'en a pas l'air.
  allowProtocolRelative: false,

  // Ce qui n'est pas permis disparaît, mais son TEXTE reste : quelqu'un qui
  // écrit « <not a tag> » dans son post doit le retrouver.
  disallowedTagsMode: "discard",

  // Sauf pour celles-ci, dont le contenu n'est pas du texte mais du code : on
  // jette la balise ET ce qu'elle porte.
  nonTextTags: [
    "script",
    "style",
    "textarea",
    "option",
    "noscript",
    "iframe",
    "svg",
    "math",
    "template",
  ],

  // Un document complet collé dans le champ ne doit pas faire sortir le
  // nettoyage de son cadre.
  enforceHtmlBoundary: true,

  transformTags: {
    a: refaireLeLien,
    ...Object.fromEntries(
      Object.entries(EQUIVALENCES).map(([ancienne, moderne]) => [
        ancienne,
        moderne,
      ]),
    ),
  },
};

/**
 * Le balisage d'un post, réduit à ce qui est permis.
 *
 * À appeler **avant d'écrire en base** et **avant de rendre à l'écran**.
 */
export function nettoyerHtml(brut: string): string {
  return sanitizeHtml(brut, REGLAGES);
}

/**
 * Les trois signes qui font du balisage, et **eux seuls**.
 *
 * Ni le guillemet ni l'apostrophe : ce texte devient le contenu d'un
 * paragraphe, jamais la valeur d'un attribut, et c'est là que ces deux-là
 * seraient dangereux. Les échapper quand même donnerait une forme que le
 * nettoyage ramènerait aussitôt à celle-ci — deux écritures pour le même
 * post, dont une seule serait stockée.
 */
const ECHAPPEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

/**
 * Du texte brut converti en balisage — pour les posts écrits **avant** que la
 * mise en forme existe.
 *
 * L'échappement vient en premier et sans exception : ce texte n'a jamais été
 * nettoyé, puisqu'il n'en avait pas besoin, et il peut contenir n'importe
 * quoi. Les paragraphes sont ensuite reconstitués comme `whitespace-pre-wrap`
 * les affichait — une ligne vide sépare, un simple retour va à la ligne.
 */
export function texteEnHtml(brut: string): string {
  const echappe = brut.replace(/[&<>]/g, (s) => ECHAPPEMENTS[s] ?? s);

  return echappe
    .split(/\n{2,}/)
    .map((bloc) => bloc.trim())
    .filter((bloc) => bloc.length > 0)
    .map((bloc) => `<p>${bloc.replace(/\n/g, "<br />")}</p>`)
    .join("");
}
