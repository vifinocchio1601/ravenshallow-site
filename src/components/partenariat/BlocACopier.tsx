"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_PARTENARIAT } from "@/lib/partenariat/constantes";

/**
 * **Un bloc de code, et le bouton qui le copie.**
 *
 * C'est la seule chose que cette page doit vraiment réussir : un
 * administrateur de forum vient chercher un code, et repart avec. Un texte
 * qu'il faut sélectionner à la souris dans une zone qui défile, c'est déjà
 * une demande sur deux perdue.
 *
 * ⚠️ **Le presse-papiers peut refuser**, et il faut le prévoir : hors
 * connexion sécurisée, ou sous une politique de permissions serrée,
 * `navigator.clipboard` n'existe pas ou lève. Le texte reste alors
 * sélectionnable, et le bouton le sélectionne pour qu'il n'y ait plus qu'à
 * faire la copie soi-même.
 *
 * Composant client, et il ne peut pas être autre chose : rien de tout cela ne
 * se fait sur le serveur.
 */
export default function BlocACopier({
  etiquette,
  valeur,
  quoi,
}: {
  /** Ce qui s'affiche au-dessus — « HTML », « BBCode ». */
  etiquette: string;
  valeur: string;
  /** Ce que le bouton dit copier, en toutes lettres, pour qui écoute. */
  quoi: string;
}) {
  const t = TEXTES_PARTENARIAT.bannieres;
  const idEtiquette = useId();
  const champ = useRef<HTMLTextAreaElement>(null);
  const [etat, setEtat] = useState<"repos" | "copie" | "selection">("repos");

  // Le retour à « Copier » se fait tout seul : un bouton qui reste bloqué sur
  // « Copié » ne dit plus si le second clic a marché.
  useEffect(() => {
    if (etat === "repos") return;
    const minuteur = setTimeout(() => setEtat("repos"), 2400);
    return () => clearTimeout(minuteur);
  }, [etat]);

  async function copier() {
    try {
      await navigator.clipboard.writeText(valeur);
      setEtat("copie");
    } catch {
      champ.current?.select();
      setEtat("selection");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-4">
        <span
          id={idEtiquette}
          className="font-display text-[0.62rem] uppercase tracking-[0.22em] text-silver"
        >
          {etiquette}
        </span>

        <button
          type="button"
          onClick={copier}
          className="font-display text-[0.62rem] uppercase tracking-[0.2em] text-aurora-teal transition-opacity duration-300 hover:opacity-75"
        >
          {/* Le nom accessible porte ce qui est copié : dans une page qui
              offre six boutons « Copier », le libellé seul ne dit pas lequel. */}
          <span aria-hidden="true">
            {etat === "copie" ? t.copie : etat === "selection" ? "⌘C" : "Copier"}
          </span>
          <span className="sr-only">{t.copier.replace("{quoi}", quoi)}</span>
        </button>
      </div>

      {/* Un `textarea` en lecture seule plutôt qu'un `<pre>` : il se
          sélectionne au clavier, se copie à la main quand le presse-papiers
          refuse, et ne casse pas la mise en page sur un code long. */}
      <textarea
        ref={champ}
        readOnly
        rows={2}
        value={valeur}
        aria-labelledby={idEtiquette}
        onFocus={(evenement) => evenement.currentTarget.select()}
        className="mt-2 w-full resize-y rounded-sm border border-silver/12 bg-void/70 p-3 font-mono text-[0.72rem] leading-relaxed text-parchment-dim"
      />

      {/* Ce que le lecteur d'écran entend au moment du clic, et lui seul. */}
      <p aria-live="polite" className="sr-only">
        {etat === "copie" ? t.copie : etat === "selection" ? t.copieImpossible : ""}
      </p>
    </div>
  );
}
