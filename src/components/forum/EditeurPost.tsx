"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import BarreMiseEnForme from "./BarreMiseEnForme";
import { EXTENSIONS } from "./extensions-tiptap";
import { CLASSE_CONTENEUR } from "@/lib/forum/mise-en-forme";

/**
 * **La zone d'écriture d'un post**, mise en forme comprise.
 *
 * Elle porte la classe `post-rendu` — celle qui habille un post publié : ce
 * qu'on voit en écrivant est exactement ce qu'on lira. Une couleur qui ne
 * ressemblerait pas à la couleur finale ne servirait à rien.
 *
 * ── Ce qu'il ne faut pas y toucher ──
 *
 * `immediatelyRender: false` est **obligatoire** sous Next : sans lui,
 * l'éditeur se rend une première fois côté serveur avec un contenu que le
 * navigateur reconstruit autrement, et React se plaint d'une hydratation qui
 * ne concorde pas.
 *
 * Le contenu n'est **pas** réinjecté à chaque frappe. `valeur` sert de point
 * de départ, puis l'éditeur devient maître de son texte et prévient le parent.
 * Le réécrire à chaque rendu replacerait le curseur en tête à chaque lettre.
 * Seul le retour à vide — après publication — est repris, et il l'est ici.
 *
 * ── L'accessibilité d'une zone qui n'est pas un `textarea` ──
 *
 * Un `<label for>` ne désigne pas un `div`. L'étiquette est donc reliée par
 * `aria-labelledby`, et le compteur par `aria-describedby` — c'est le parent
 * qui en fournit les identifiants, parce que c'est lui qui les possède.
 */
export default function EditeurPost({
  valeur,
  onChange,
  idEtiquette,
  idDescription,
  desactive = false,
  hauteur = "min-h-[16rem]",
}: {
  valeur: string;
  onChange: (html: string) => void;
  idEtiquette: string;
  idDescription: string;
  desactive?: boolean;
  hauteur?: string;
}) {
  const editeur = useEditor({
    extensions: EXTENSIONS,
    content: valeur,
    immediatelyRender: false,
    editable: !desactive,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": idEtiquette,
        "aria-describedby": idDescription,
        class: `${CLASSE_CONTENEUR} ${hauteur} w-full px-4 py-3 font-body text-base leading-[1.8] text-parchment focus:outline-none`,
      },
    },
  });

  // Le parent vide le champ après publication : l'éditeur doit suivre. On ne
  // reprend QUE ce cas — toute autre synchronisation ramènerait le curseur en
  // tête du texte à chaque frappe.
  useEffect(() => {
    if (!editeur || valeur !== "") return;
    if (editeur.isEmpty) return;
    editeur.commands.clearContent();
  }, [editeur, valeur]);

  useEffect(() => {
    editeur?.setEditable(!desactive);
  }, [editeur, desactive]);

  return (
    <div className="mt-2">
      <BarreMiseEnForme editeur={editeur} desactive={desactive} />

      <div
        className={`rounded-b-sm border border-silver/25 bg-mist/60 transition-colors duration-300 focus-within:border-aurora-teal/70 ${
          desactive ? "opacity-60" : "hover:border-silver/40"
        }`}
      >
        <EditorContent editor={editeur} />
      </div>
    </div>
  );
}
