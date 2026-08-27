import "server-only";
import sanitizeHtml from "sanitize-html";
import {
  CLASSES_DE_BLOC,
  CLASSES_DE_SPAN,
  CLASSES_D_IMAGE,
} from "./mise-en-forme";

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
 * `blockquote` portent l'alignement ; `img` porte sa largeur.
 *
 * Ni `div`, ni `style`, ni `script`, ni `iframe`, ni `video` : ce qui n'est
 * pas là ne passe pas, y compris ce qui n'existe pas encore.
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
  "img",
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

/**
 * Une image, refaite de zéro — comme les liens, et pour les mêmes raisons.
 *
 * On ne garde que l'adresse, la description et la largeur ; **tout le reste
 * est reposé ici**. Trois attributs sont ajoutés d'office, et aucun n'est
 * laissé au choix du joueur :
 *
 *   `referrerpolicy="no-referrer"` — **le seul qui protège quelqu'un.** Sans
 *   lui, l'hébergeur de l'image apprend quelle page du château est en train
 *   d'être lue, et par quelle adresse IP. Le site ne dépose aucun mouchard ;
 *   il n'a pas à en laisser poser un par la bande.
 *
 *   `loading="lazy"` — une scène de trente posts illustrés ne se télécharge
 *   pas d'un coup.
 *
 *   `decoding="async"` — le décodage ne bloque pas l'affichage du texte, qui
 *   est ce qu'on vient lire.
 *
 * `srcset` n'est **pas** permis : il porte des adresses, et une liste
 * d'adresses est une liste de choses à filtrer qu'on filtrerait moins bien.
 */
function refaireLImage(_balise: string, attributs: sanitizeHtml.Attributes) {
  const adresse = typeof attributs.src === "string" ? attributs.src : "";
  const description = typeof attributs.alt === "string" ? attributs.alt : "";
  const classe =
    typeof attributs.class === "string" ? attributs.class : "";

  return {
    tagName: "img",
    attribs: {
      src: adresse,
      // Une image sans description est décorative — `alt=""` le dit, et un
      // lecteur d'écran l'ignore alors au lieu d'annoncer une adresse.
      alt: description,
      class: classe,
      referrerpolicy: "no-referrer",
      loading: "lazy",
      decoding: "async",
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
    img: ["src", "alt", "class", "referrerpolicy", "loading", "decoding"],
  },

  // Les classes viennent de `mise-en-forme.ts`, déduites des listes d'outils.
  // Une classe inventée à la main ne figure dans aucune des trois, donc ne
  // passe pas — et une couleur ajoutée à la palette passe sans qu'on y pense.
  allowedClasses: {
    span: [...CLASSES_DE_SPAN],
    p: [...CLASSES_DE_BLOC],
    blockquote: [...CLASSES_DE_BLOC],
    img: [...CLASSES_D_IMAGE],
  },

  // Ni `javascript:`, ni `data:`, ni `vbscript:`, ni rien d'autre.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],

  /**
   * **Une image ne se charge qu'en `https`.** Le site est servi en `https` :
   * une image en `http` serait bloquée par le navigateur, et le joueur ne
   * verrait qu'un trou sans comprendre. `data:` est écarté du même geste —
   * une image encodée dans le texte pèserait le poids d'un post entier.
   */
  allowedSchemesByTag: { img: ["https"] },
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
    img: refaireLImage,
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
