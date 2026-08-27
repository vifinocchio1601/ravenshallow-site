"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AArrowDown,
  AArrowUp,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Italic,
  Link as LienIcone,
  Link2Off,
  Minus,
  Quote,
  Strikethrough,
  Type,
  Underline,
  X,
} from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import {
  ALIGNEMENTS,
  COULEURS,
  TEXTES_MISE_EN_FORME,
  type Alignement,
  type Couleur,
} from "@/lib/forum/mise-en-forme";

/**
 * **La barre de mise en forme**, et surtout : un vrai `toolbar`.
 *
 * ── Ce que l'accessibilité impose, et pourquoi ──
 *
 * Un `role="toolbar"` ne se parcourt pas à la tabulation bouton par bouton :
 * vingt-trois arrêts entre le champ et le bouton « Publier » rendraient
 * l'écriture au clavier insupportable. Le motif attendu est le **tabindex
 * glissant** — la barre entière est une seule étape, et les flèches y
 * circulent. C'est ce qui est fait ici.
 *
 * Chaque bouton porte **un nom d'action en toutes lettres** — « Mettre en
 * gras », jamais « B » — et les bascules annoncent leur état par
 * `aria-pressed`. Un état signalé par la seule couleur ne dirait rien à qui
 * ne la voit pas, et rien du tout à qui écoute.
 *
 * Les couleurs sont **posées à plat**, sans menu déroulant. Un menu aurait
 * demandé de piéger le focus, de le rendre, de gérer Échap : de quoi se
 * tromper trois fois pour épargner quelques pixels.
 *
 * ── Ce que la barre ne décide pas ──
 *
 * Rien. Elle ne sait produire que ce que la palette contient, et le serveur
 * refait le tri de toute façon. Un joueur qui contournerait la barre
 * n'obtiendrait rien de plus : voir `nettoyer-html.ts`.
 */

type Outil = {
  cle: string;
  libelle: string;
  icone: ReactNode;
  actif?: boolean;
  agir: () => void;
  /** Une pastille de couleur plutôt qu'une icône. */
  pastille?: Couleur | "aucune";
};

type Groupe = { titre: string; outils: Outil[] };

const ICONES_ALIGNEMENT: Record<Alignement, ReactNode> = {
  gauche: <AlignLeft aria-hidden="true" className="h-4 w-4" />,
  centre: <AlignCenter aria-hidden="true" className="h-4 w-4" />,
  droite: <AlignRight aria-hidden="true" className="h-4 w-4" />,
  justifie: <AlignJustify aria-hidden="true" className="h-4 w-4" />,
};

/**
 * Ce qu'on accepte de poser comme lien, **côté confort**. Le serveur refait
 * le tri, et c'est lui qui compte : voir `nettoyer-html.ts`.
 */
const ADRESSE_ACCEPTABLE =
  /^(?:https?:\/\/\S+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+|\/\S*)$/i;

export default function BarreMiseEnForme({
  editeur,
  desactive = false,
}: {
  editeur: Editor | null;
  desactive?: boolean;
}) {
  const t = TEXTES_MISE_EN_FORME;
  const barre = useRef<HTMLDivElement>(null);
  const idChampLien = useId();

  const [poseLien, setPoseLien] = useState(false);
  const [adresse, setAdresse] = useState("");
  const [erreurLien, setErreurLien] = useState<string | null>(null);

  /**
   * Le bouton qui porte le tabindex glissant. Déclaré **avant** le retour
   * anticipé plus bas : un hook posé après lui ne serait pas appelé au
   * premier rendu, et React perdrait l'ordre de ses états dès que l'éditeur
   * finit de se monter.
   */
  const [focus, setFocus] = useState("");

  /**
   * L'état de la sélection, relu à chaque transaction. Sans lui, les bascules
   * ne diraient jamais qu'elles sont enfoncées.
   */
  const etat = useEditorState({
    editor: editeur,
    selector: ({ editor }) =>
      editor
        ? {
            gras: editor.isActive("bold"),
            italique: editor.isActive("italic"),
            souligne: editor.isActive("underline"),
            barre: editor.isActive("strike"),
            citation: editor.isActive("blockquote"),
            lien: editor.isActive("link"),
            couleur:
              (editor.getAttributes("couleurTexte").couleur as Couleur | null) ??
              null,
            taille:
              (editor.getAttributes("tailleTexte").taille as string | null) ??
              null,
            alignement:
              (editor.getAttributes("paragraph").alignement as
                | Alignement
                | null) ?? null,
          }
        : null,
  });

  if (!editeur) return null;

  // Repris dans une constante : l'affinage d'un paramètre ne survit pas à une
  // fermeture, et tout ce qui suit en pose.
  const actif = editeur;
  const enchaine = () => actif.chain().focus();

  const groupes: Groupe[] = [
    {
      titre: t.barre,
      outils: [
        {
          cle: "gras",
          libelle: t.marques.gras,
          icone: <Bold aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.gras,
          agir: () => enchaine().toggleBold().run(),
        },
        {
          cle: "italique",
          libelle: t.marques.italique,
          icone: <Italic aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.italique,
          agir: () => enchaine().toggleItalic().run(),
        },
        {
          cle: "souligne",
          libelle: t.marques.souligne,
          icone: <Underline aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.souligne,
          agir: () => enchaine().toggleUnderline().run(),
        },
        {
          cle: "barre",
          libelle: t.marques.barre,
          icone: <Strikethrough aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.barre,
          agir: () => enchaine().toggleStrike().run(),
        },
      ],
    },

    {
      titre: t.tailles.libelle,
      outils: [
        {
          cle: "taille-normal",
          libelle: t.tailles.normal,
          icone: <Type aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.taille === null,
          agir: () => enchaine().unsetMark("tailleTexte").run(),
        },
        {
          cle: "taille-grand",
          libelle: t.tailles.grand,
          icone: <AArrowUp aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.taille === "grand",
          agir: () =>
            enchaine().setMark("tailleTexte", { taille: "grand" }).run(),
        },
        {
          cle: "taille-petit",
          libelle: t.tailles.petit,
          icone: <AArrowDown aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.taille === "petit",
          agir: () =>
            enchaine().setMark("tailleTexte", { taille: "petit" }).run(),
        },
      ],
    },

    {
      titre: t.couleurs.libelle,
      outils: [
        {
          cle: "couleur-aucune",
          libelle: t.couleurs.aucune,
          icone: null,
          pastille: "aucune",
          actif: etat?.couleur === null,
          agir: () => enchaine().unsetMark("couleurTexte").run(),
        },
        ...COULEURS.map((couleur) => ({
          cle: `couleur-${couleur}`,
          libelle: t.couleurs[couleur],
          icone: null,
          pastille: couleur,
          actif: etat?.couleur === couleur,
          agir: () => enchaine().setMark("couleurTexte", { couleur }).run(),
        })),
      ],
    },

    {
      titre: t.alignements.libelle,
      outils: ALIGNEMENTS.map((alignement) => ({
        cle: `align-${alignement}`,
        libelle: t.alignements[alignement],
        icone: ICONES_ALIGNEMENT[alignement],
        actif:
          etat?.alignement === alignement ||
          (alignement === "gauche" && etat?.alignement === null),
        agir: () =>
          enchaine().updateAttributes("paragraph", { alignement }).run(),
      })),
    },

    {
      titre: t.barre,
      outils: [
        {
          cle: "citation",
          libelle: t.citation,
          icone: <Quote aria-hidden="true" className="h-4 w-4" />,
          actif: etat?.citation,
          agir: () => enchaine().toggleBlockquote().run(),
        },
        {
          cle: "separateur",
          libelle: t.separateur,
          icone: <Minus aria-hidden="true" className="h-4 w-4" />,
          agir: () => enchaine().setHorizontalRule().run(),
        },
        etat?.lien
          ? {
              cle: "lien-retirer",
              libelle: t.lien.retirer,
              icone: <Link2Off aria-hidden="true" className="h-4 w-4" />,
              agir: () => enchaine().unsetLink().run(),
            }
          : {
              cle: "lien-poser",
              libelle: t.lien.poser,
              icone: <LienIcone aria-hidden="true" className="h-4 w-4" />,
              actif: poseLien,
              agir: () => {
                setErreurLien(null);
                setPoseLien((ouvert) => !ouvert);
              },
            },
      ],
    },
  ];

  /** L'ordre de parcours aux flèches : tous les boutons, à plat. */
  const ordre = groupes.flatMap((g) => g.outils.map((o) => o.cle));
  const indexFocus = Math.max(0, ordre.indexOf(focus));

  function deplacer(evenement: React.KeyboardEvent) {
    const pas =
      evenement.key === "ArrowRight" || evenement.key === "ArrowDown"
        ? 1
        : evenement.key === "ArrowLeft" || evenement.key === "ArrowUp"
          ? -1
          : evenement.key === "Home"
            ? -indexFocus
            : evenement.key === "End"
              ? ordre.length - 1 - indexFocus
              : null;
    if (pas === null) return;

    evenement.preventDefault();
    const suivant =
      ordre[(indexFocus + pas + ordre.length) % ordre.length] ?? ordre[0];
    setFocus(suivant);
    barre.current
      ?.querySelector<HTMLButtonElement>(`[data-outil="${suivant}"]`)
      ?.focus();
  }

  function poserLeLien() {
    const nette = adresse.trim();
    if (!ADRESSE_ACCEPTABLE.test(nette)) {
      setErreurLien(t.lien.invalide);
      return;
    }
    actif
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: nette })
      .run();
    setAdresse("");
    setErreurLien(null);
    setPoseLien(false);
  }

  return (
    <div>
      <div
        ref={barre}
        role="toolbar"
        aria-label={t.barre}
        aria-orientation="horizontal"
        onKeyDown={deplacer}
        className="flex flex-wrap items-center gap-1 rounded-t-sm border border-b-0 border-silver/25 bg-mist/70 px-2 py-1.5"
      >
        {groupes.map((groupe, rang) => (
          <div
            key={`${groupe.titre}-${rang}`}
            role="group"
            aria-label={groupe.titre}
            className="flex items-center gap-1 border-silver/15 pr-1 [&:not(:last-child)]:border-r [&:not(:last-child)]:mr-1"
          >
            {groupe.outils.map((outil) => (
              <button
                key={outil.cle}
                type="button"
                data-outil={outil.cle}
                title={outil.libelle}
                aria-label={outil.libelle}
                aria-pressed={outil.actif === undefined ? undefined : outil.actif}
                disabled={desactive}
                tabIndex={outil.cle === ordre[indexFocus] ? 0 : -1}
                onFocus={() => setFocus(outil.cle)}
                // **Le focus ne doit pas quitter la zone d'écriture.** Sans
                // ce refus, le clic donne le focus au bouton : la sélection
                // est perdue, la commande s'applique à côté, et la frappe
                // suivante part dans le bouton au lieu du texte. Constaté à
                // l'écran le 27 août 2026 — une phrase entière disparaissait.
                //
                // Le clic se déclenche quand même : il naît du relâchement,
                // pas de l'appui. Le parcours au clavier n'en souffre pas non
                // plus : les flèches donnent le focus elles-mêmes.
                onMouseDown={(evenement) => evenement.preventDefault()}
                onClick={outil.agir}
                className={`flex h-8 w-8 items-center justify-center rounded-sm border transition-colors duration-200 disabled:opacity-40 ${
                  outil.actif
                    ? "border-aurora-teal/60 bg-aurora-teal/15 text-parchment"
                    : "border-transparent text-silver hover:border-silver/30 hover:text-parchment"
                }`}
              >
                {outil.pastille ? (
                  // La pastille prend sa teinte dans la variable CSS, et non
                  // dans la classe de la palette : celle-ci est bornée à
                  // l'intérieur d'un post rendu — c'est ce qui l'empêche de
                  // peindre le reste de la page —, et la barre n'en fait pas
                  // partie. Une couleur en clair ici et une valeur là-bas se
                  // contrediraient : la variable est la seule source.
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full border border-silver/40"
                    style={
                      outil.pastille === "aucune"
                        ? undefined
                        : { backgroundColor: `var(--rs-c-${outil.pastille})` }
                    }
                  />
                ) : (
                  outil.icone
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {poseLien ? (
        <div className="flex flex-wrap items-center gap-2 border-x border-silver/25 bg-mist/50 px-2 py-2">
          <label
            htmlFor={idChampLien}
            className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-parchment-dim"
          >
            {t.lien.adresse}
          </label>
          <input
            id={idChampLien}
            type="text"
            value={adresse}
            autoFocus
            onChange={(e) => {
              setAdresse(e.target.value);
              setErreurLien(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                poserLeLien();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setPoseLien(false);
                actif.chain().focus().run();
              }
            }}
            aria-describedby={`${idChampLien}-aide`}
            aria-invalid={erreurLien !== null}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-sm border border-silver/25 bg-void/40 px-3 py-1.5 font-body text-sm text-parchment placeholder:text-silver/50 focus:border-aurora-teal/70"
          />
          <button
            type="button"
            onClick={poserLeLien}
            aria-label={t.lien.poser}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-aurora-teal/40 text-parchment hover:bg-aurora-teal/15"
          >
            <Check aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPoseLien(false);
              actif.chain().focus().run();
            }}
            aria-label={TEXTES_MISE_EN_FORME.lien.retirer}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-silver/25 text-silver hover:text-parchment"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>

          <p
            id={`${idChampLien}-aide`}
            role={erreurLien ? "alert" : undefined}
            className={`w-full font-body text-xs ${
              erreurLien ? "text-ember" : "italic text-silver"
            }`}
          >
            {erreurLien ?? t.lien.aide}
          </p>
        </div>
      ) : null}
    </div>
  );
}
