import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  ALIGNEMENTS,
  LARGEURS_IMAGE,
  COULEURS,
  TAILLES,
  classeAlignement,
  classeCouleur,
  classeLargeur,
  classeTaille,
  type Alignement,
  type LargeurImage,
  type Couleur,
  type Taille,
} from "@/lib/forum/mise-en-forme";

/**
 * **Les deux marques que Tiptap ne fournit pas** : la couleur et la taille.
 *
 * Ses extensions officielles existent — et posent un `style="color:…"` sur
 * chaque fragment. C'est exactement ce que le nettoyage refuse, et ce serait
 * aussi la porte ouverte au nuancier libre : un joueur choisirait un rouge
 * sombre illisible sur ce fond-là, et personne ne pourrait le lire.
 *
 * Ces deux marques-ci ne savent poser qu'**une classe prise dans la palette**.
 * Une valeur qui n'y figure pas n'est ni écrite ni relue : l'éditeur ne peut
 * pas produire ce que le serveur refuserait.
 */

const PREFIXE_COULEUR = "rs-c-";
const PREFIXE_TAILLE = "rs-t-";
const PREFIXE_ALIGNEMENT = "rs-a-";
const PREFIXE_LARGEUR = "rs-i-";

/** La classe reconnue sur un élément, si elle appartient bien à la liste. */
function valeurReconnue(
  element: HTMLElement,
  prefixe: string,
  permises: readonly string[],
): string | null {
  for (const classe of Array.from(element.classList)) {
    if (!classe.startsWith(prefixe)) continue;
    const valeur = classe.slice(prefixe.length);
    if (permises.includes(valeur)) return valeur;
  }
  return null;
}

export const CouleurTexte = Mark.create({
  name: "couleurTexte",

  addAttributes() {
    return {
      couleur: {
        default: null as Couleur | null,
        // Le rendu ne sait produire qu'une classe. Une valeur hors palette
        // — impossible par la barre, possible par un collage — ne rend rien
        // plutôt que d'inventer un attribut.
        renderHTML: (attributs) => {
          const couleur = attributs.couleur as Couleur | null;
          return couleur && (COULEURS as readonly string[]).includes(couleur)
            ? { class: classeCouleur(couleur) }
            : {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[class]",
        getAttrs: (element) => {
          const couleur = valeurReconnue(
            element as HTMLElement,
            PREFIXE_COULEUR,
            COULEURS,
          );
          // `false` = cette marque ne s'applique pas. Sans ce refus, elle
          // avalerait tous les `span` de la page collée.
          return couleur ? { couleur } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const TAILLES_NOMMEES = TAILLES.filter(
  (t): t is Exclude<Taille, "normal"> => t !== "normal",
);

export const TailleTexte = Mark.create({
  name: "tailleTexte",

  addAttributes() {
    return {
      taille: {
        default: null as Exclude<Taille, "normal"> | null,
        renderHTML: (attributs) => {
          const taille = attributs.taille as Exclude<Taille, "normal"> | null;
          return taille && (TAILLES_NOMMEES as readonly string[]).includes(taille)
            ? { class: classeTaille(taille) }
            : {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[class]",
        getAttrs: (element) => {
          const taille = valeurReconnue(
            element as HTMLElement,
            PREFIXE_TAILLE,
            TAILLES_NOMMEES,
          );
          return taille ? { taille } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * **L'alignement, posé en classe et non en style.**
 *
 * L'extension officielle de Tiptap écrit `style="text-align:center"`. Le
 * nettoyage refuse l'attribut `style` — et il a raison de le refuser : le
 * jour où on l'accepterait « juste pour l'alignement », il accepterait aussi
 * tout le reste. Vingt lignes ici valent mieux qu'une exception là-bas.
 *
 * L'attribut vit sur le **paragraphe** seulement. Une citation contient des
 * paragraphes : les aligner suffit, et cela évite d'avoir deux endroits où la
 * même décision se prend.
 */
export const AlignementTexte = Extension.create({
  name: "alignementTexte",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          alignement: {
            default: null as Alignement | null,
            parseHTML: (element) =>
              valeurReconnue(element, PREFIXE_ALIGNEMENT, ALIGNEMENTS),
            renderHTML: (attributs) => {
              const alignement = attributs.alignement as Alignement | null;
              return alignement &&
                (ALIGNEMENTS as readonly string[]).includes(alignement)
                ? { class: classeAlignement(alignement) }
                : {};
            },
          },
        },
      },
    ];
  },
});

/**
 * **Ce que l'éditeur sait faire, et rien de plus.**
 *
 * Cette liste est le pendant exact de la liste blanche du nettoyage : ce
 * qu'on retire ici ne peut pas être produit, ce qu'on retire là-bas ne peut
 * pas être enregistré. Les deux doivent rester d'accord — un outil qui
 * produirait une balise refusée ferait disparaître le travail du joueur à la
 * publication, sans un mot d'explication.
 *
 * D'où les retraits : **ni titres, ni listes, ni code**. Ils ne figurent pas
 * dans les outils demandés, donc pas dans la liste blanche ; les laisser
 * accessibles au clavier — `#` en début de ligne, `- ` pour une puce — serait
 * un piège tendu à qui écrit vite.
 */
/**
 * **L'image d'un post.**
 *
 * Écrite ici plutôt que reprise de `@tiptap/extension-image`, pour la même
 * raison que la couleur et l'alignement : l'extension officielle laisse
 * passer `width`, `height` et le reste, quand celle-ci ne sait poser qu'une
 * **classe de la palette**. L'éditeur ne peut donc pas produire ce que le
 * serveur refuserait.
 *
 * C'est un bloc, et non une image dans le fil du texte : une illustration au
 * milieu d'une phrase se comporte mal à toutes les largeurs, et personne ne
 * l'a demandé.
 *
 * L'adresse et la description sont les seuls attributs venus du joueur. Les
 * trois autres — `referrerpolicy`, `loading`, `decoding` — sont reposés par le
 * nettoyage à l'enregistrement : les écrire ici ne servirait qu'à l'aperçu.
 */
export const ImagePost = Node.create({
  name: "imagePost",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      largeur: {
        default: "moyenne" as LargeurImage,
        renderHTML: (attributs) => {
          const largeur = attributs.largeur as LargeurImage | null;
          return largeur && (LARGEURS_IMAGE as readonly string[]).includes(largeur)
            ? { class: classeLargeur(largeur) }
            : {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const src = el.getAttribute("src") ?? "";
          // Ce que l'éditeur ne peut pas produire, il ne le relit pas non
          // plus : une adresse hors https serait refusée à l'enregistrement.
          if (!/^https:\/\//i.test(src)) return false;
          return {
            src,
            alt: el.getAttribute("alt") ?? "",
            largeur:
              valeurReconnue(el, PREFIXE_LARGEUR, LARGEURS_IMAGE) ?? "moyenne",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },
});

export const EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    code: false,
    codeBlock: false,
    link: {
      // Le lien ne s'ouvre pas pendant qu'on écrit : un clic dans l'éditeur
      // sert à placer le curseur, jamais à quitter la page en cours de post.
      openOnClick: false,
      // Le serveur repose `rel` et `target` lui-même, sur tous les liens.
      // Ce qui est écrit ici n'est qu'un confort d'aperçu.
      autolink: false,
    },
  }),
  CouleurTexte,
  TailleTexte,
  AlignementTexte,
  ImagePost,
];
