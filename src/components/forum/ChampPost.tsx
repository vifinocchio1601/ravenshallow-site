"use client";

import { useId, useMemo } from "react";
import EditeurPost from "./EditeurPost";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import {
  lignesAffichees,
  proportion,
  respecteLeMinimum,
} from "@/lib/forum/longueur";

/**
 * Le champ d’un post, et son compteur de lignes.
 *
 * **Le compteur lit `forum/longueur.ts`**, le même fichier que la route :
 * deux comptages qui divergent, c’est un joueur qui voit « 10 » à l’écran et
 * se fait refuser son post. Le hors-RP entre balises `[HRP]` est retiré des
 * deux côtés, par la même fonction.
 *
 * **Le compteur est annoncé, pas seulement affiché** : il vit dans une région
 * `aria-live` polie, et le champ le désigne par `aria-describedby`. La phrase
 * ne change que lorsque le nombre de lignes change — soit toutes les
 * quatre-vingts frappes environ, jamais à chaque lettre : un lecteur d’écran
 * qui réciterait un compte à chaque signe serait inutilisable.
 *
 * **La barre existe pour cette raison-là.** Depuis que l’on compte les
 * caractères, la phrase reste identique pendant toute une ligne : sans elle,
 * un joueur qui écrit ne verrait rien bouger et croirait le compteur bloqué.
 * Elle est purement visuelle — `aria-hidden` —, la phrase disant déjà tout à
 * qui écoute.
 *
 * Rien n’est bloqué ici. Le bouton se grise, la route refuse — et c’est elle
 * qui a le dernier mot : le champ se contourne en fermant JavaScript.
 */
export default function ChampPost({
  valeur,
  onChange,
  lignesMinimum,
  avertissement,
  onAvertissement,
  reponse = false,
  desactive = false,
}: {
  valeur: string;
  onChange: (v: string) => void;
  /** Dix dans le domaine (art. 12.2), nul ailleurs. */
  lignesMinimum: number | null;
  avertissement: string;
  onAvertissement: (v: string) => void;
  /** Change le libellé : « Ton post » ou « Ta réponse ». */
  reponse?: boolean;
  desactive?: boolean;
}) {
  const t = TEXTES_FORUM.ecrire;
  const idCorps = useId();
  const idCompteur = useId();
  const idAide = useId();
  const idAvertissement = useId();
  const idAideAvertissement = useId();

  const lignes = useMemo(() => lignesAffichees(valeur), [valeur]);

  // Le verdict vient de `respecteLeMinimum`, jamais d'une comparaison sur les
  // lignes affichées : celles-ci sont arrondies, et l'arrondi ne doit pas
  // décider de ce que la route acceptera.
  const atteint = useMemo(
    () => respecteLeMinimum(valeur, lignesMinimum),
    [valeur, lignesMinimum],
  );

  const avancement = useMemo(
    () => proportion(valeur, lignesMinimum),
    [valeur, lignesMinimum],
  );

  const phrase =
    lignesMinimum === null
      ? t.compteur.sansMinimum.replace("{n}", String(lignes))
      : atteint
        ? t.compteur.atteint.replace("{n}", String(lignes))
        : t.compteur.surLeMinimum
            .replace("{n}", String(lignes))
            .replace("{min}", String(lignesMinimum));

  return (
    <div className="grid gap-5">
      <div>
        {/* Un `<label for>` ne désigne pas la zone d'écriture, qui n'est plus
            un `textarea` : c'est `aria-labelledby` qui fait le lien, et cet
            élément n'a donc pas à être un `<label>`. */}
        <span
          id={idCorps}
          className="block font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {reponse ? t.corps.libelleReponse : t.corps.libelle}
        </span>

        <EditeurPost
          valeur={valeur}
          onChange={onChange}
          idEtiquette={idCorps}
          idDescription={`${idCompteur} ${idAide}`}
          desactive={desactive}
          hauteur={reponse ? "min-h-[12rem]" : "min-h-[18rem]"}
        />

        {/* Le compteur. `role="status"` le rend poli : il ne coupe jamais la
            frappe, et il n'est relu que lorsque la phrase change — donc à
            chaque ligne, pas à chaque lettre. */}
        <p
          id={idCompteur}
          role="status"
          className={`mt-2 font-body text-xs ${
            atteint ? "text-aurora-teal/90" : "text-silver"
          }`}
        >
          <span className="sr-only">{t.compteur.aria} : </span>
          {phrase}
        </p>

        {lignesMinimum === null ? null : (
          <div
            aria-hidden="true"
            className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-silver/15"
          >
            <div
              className={`h-full transition-[width] duration-300 ${
                atteint ? "bg-aurora-teal/80" : "bg-silver/50"
              }`}
              style={{ width: `${Math.round(avancement * 100)}%` }}
            />
          </div>
        )}

        <p id={idAide} className="mt-1 font-body text-xs italic text-silver">
          {t.corps.aideHrp}
        </p>
      </div>

      {/* Art. 16.3 — proposé au moment de publier, jamais réclamé. */}
      <div>
        <label
          htmlFor={idAvertissement}
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
        >
          {t.avertissement.libelle}
        </label>
        <input
          id={idAvertissement}
          type="text"
          value={avertissement}
          onChange={(e) => onAvertissement(e.target.value)}
          disabled={desactive}
          placeholder={t.avertissement.exemple}
          aria-describedby={idAideAvertissement}
          className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-4 py-2 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70 disabled:opacity-60"
        />
        <p
          id={idAideAvertissement}
          className="mt-1 font-body text-xs italic text-silver"
        >
          {t.avertissement.aide}
        </p>
      </div>
    </div>
  );
}
