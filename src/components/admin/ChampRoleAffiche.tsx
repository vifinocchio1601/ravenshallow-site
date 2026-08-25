"use client";

import { useId, useRef, useState } from "react";
import {
  ROLE_AFFICHE_MAX,
  TEXTES_ROLE_AFFICHE,
  validerRoleAffiche,
} from "@/lib/dossier/role-affiche";

/**
 * Le rôle particulier d’un membre, dans la liste de l’administration.
 *
 * Composant client pour une seule raison : valider pendant la frappe, avec
 * **le même fichier que l’action serveur** — `lib/dossier/role-affiche.ts`.
 * Aucune règle n’est réécrite ici. Celle du serveur reste la seule qui
 * protège : une action serveur est une route publique, et ce composant peut
 * être contourné en fermant JavaScript.
 *
 * `setCustomValidity` double le message affiché : il empêche le navigateur
 * d’envoyer le formulaire, sans quoi une saisie fautive partirait quand même
 * pour se faire refuser en silence côté serveur.
 *
 * Rappel affiché sous le champ : **ce titre n’ouvre aucun droit.** Il ne fait
 * que remplacer l’année à l’écran.
 */
export default function ChampRoleAffiche({
  id,
  valeur,
  suggestions,
  provenance,
}: {
  /** L’identifiant du membre — le champ est répété une fois par ligne. */
  id: string;
  valeur: string | null;
  /** Les titres déjà portés ailleurs. Une aide, jamais une contrainte. */
  suggestions: readonly string[];
  /** « Posé par l’Administration le 25 août 2026 », ou null si aucun rôle. */
  provenance: string | null;
}) {
  const champId = `role-${id}`;
  const listeId = useId();
  const aideId = `${champId}-aide`;
  const erreurId = `${champId}-erreur`;
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);

  function examiner(saisie: string) {
    const lu = validerRoleAffiche(saisie);
    setErreur(lu.ok ? null : lu.message);
    champ.current?.setCustomValidity(lu.ok ? "" : lu.message);
  }

  return (
    <div>
      <label
        htmlFor={champId}
        className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
      >
        {TEXTES_ROLE_AFFICHE.libelle}
      </label>

      <input
        ref={champ}
        id={champId}
        name="roleAffiche"
        type="text"
        defaultValue={valeur ?? ""}
        list={listeId}
        // Le compte se fait sur la valeur nettoyée, côté validation : cet
        // attribut n'est qu'un premier arrêt, il ne remplace rien.
        maxLength={ROLE_AFFICHE_MAX}
        placeholder={TEXTES_ROLE_AFFICHE.placeholder}
        aria-describedby={`${aideId} ${erreurId}`}
        aria-invalid={erreur ? true : undefined}
        onChange={(e) => examiner(e.target.value)}
        className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70 aria-[invalid]:border-ember/70"
      />

      {/* Les titres déjà portés sur le site, pour éviter trois orthographes du
          même rôle. Une `datalist` ne ferme rien : toute autre valeur passe. */}
      <datalist id={listeId}>
        {suggestions.map((titre) => (
          <option key={titre} value={titre} />
        ))}
      </datalist>

      {/* Hauteur réservée : le message ne doit pas faire sauter la ligne du
          membre au premier caractère refusé. */}
      <p
        id={erreurId}
        role="alert"
        className="mt-1 min-h-[1.15rem] font-body text-xs text-ember"
      >
        {erreur}
      </p>

      <p id={aideId} className="font-body text-xs italic text-silver">
        {TEXTES_ROLE_AFFICHE.aide}{" "}
        <span className="text-silver/80">{TEXTES_ROLE_AFFICHE.sansDroit}</span>
        {provenance ? (
          <>
            <br />
            {provenance}
          </>
        ) : null}
      </p>
    </div>
  );
}
