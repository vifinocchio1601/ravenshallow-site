"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { epinglerAction, type EtatMot } from "@/app/(ecole)/maison/actions";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import { MOT_MAX } from "@/lib/tableau/limites";
import { validerMot } from "@/lib/tableau/schema";

/**
 * **Épingler un mot au tableau.**
 *
 * Le champ n'apparaît qu'à qui peut écrire — préfet, permission, staff —, et
 * **c'est l'action serveur qui protège** : elle refait la question en entier.
 * Un champ absent n'a jamais gardé une porte.
 *
 * **Le compteur lit le même fichier que l'action** — `tableau/schema.ts`,
 * partagé mot pour mot. Deux validations qui divergent, c'est quelqu'un à qui
 * l'on refuse ce que l'écran acceptait. Le procédé de `ChampCorbeau`, et
 * celui du compteur de lignes du forum.
 *
 * ⚠️ **Ce schéma-là n'est pas `server-only`**, à la différence de celui des
 * annonces : il n'y a pas de balisage à nettoyer, donc rien à cacher au
 * navigateur.
 */
export default function ChampMot() {
  const t = TEXTES_TABLEAU.ecrire;
  const [etat, envoyer] = useFormState<EtatMot, FormData>(epinglerAction, {
    erreur: null,
    fait: false,
  });

  const formulaire = useRef<HTMLFormElement>(null);
  const idChamp = useId();
  const idAide = useId();
  const idErreur = useId();

  const [corps, setCorps] = useState("");
  const verdict = validerMot(corps);
  const restants = MOT_MAX - corps.trim().length;

  // Vidé seulement quand le mot est parti : un refus doit laisser le texte en
  // place, sinon on le retape en entier pour une virgule.
  useEffect(() => {
    if (etat.fait) {
      formulaire.current?.reset();
      setCorps("");
    }
  }, [etat.fait]);

  return (
    <form ref={formulaire} action={envoyer} className="mt-6">
      <label
        htmlFor={idChamp}
        className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-parchment-dim"
      >
        {t.libelle}
      </label>

      <textarea
        id={idChamp}
        name="corps"
        rows={3}
        value={corps}
        onChange={(e) => setCorps(e.target.value)}
        aria-describedby={etat.erreur ? `${idAide} ${idErreur}` : idAide}
        aria-invalid={etat.erreur ? true : undefined}
        className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base leading-[1.7] text-parchment placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
      />

      {/* Le décompte vit dans une région polie, et ne change qu'au signe près
          — un lecteur d'écran qui réciterait un nombre à chaque frappe serait
          inutilisable. La phrase du bas dit déjà l'essentiel. */}
      <p
        id={idAide}
        aria-live="polite"
        className="mt-1 font-body text-xs italic leading-relaxed text-silver"
      >
        {corps.trim().length === 0
          ? t.aide.replace("{max}", String(MOT_MAX))
          : restants === 1
            ? t.restantUn
            : t.restant.replace("{n}", String(restants))}
      </p>

      {etat.erreur ? (
        <p
          id={idErreur}
          role="alert"
          className="mt-2 font-body text-sm leading-relaxed text-ember"
        >
          {etat.erreur}
        </p>
      ) : null}

      <Envoyer pret={verdict.ok} libelle={t.envoyer} />
    </form>
  );
}

/**
 * Le bouton se ferme pendant l'envoi.
 *
 * Neon peut mettre une seconde ou deux à répondre après une accalmie : sans
 * cela, un second clic épinglerait deux fois le même mot.
 */
function Envoyer({ pret, libelle }: { pret: boolean; libelle: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !pret}
      className="btn btn-ghost mt-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {libelle}
    </button>
  );
}
