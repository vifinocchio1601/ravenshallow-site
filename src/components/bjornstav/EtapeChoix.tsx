"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Carte } from "@/lib/bjornstav/constantes";

/**
 * Une étape du choix : cinq cartes, un vrai groupe de boutons radio.
 *
 * **Les flèches déplacent le focus sans choisir.**
 *
 * Dans un groupe de boutons radio ordinaire, une flèche sélectionne en même
 * temps qu’elle déplace. Ici, le choix est définitif : un joueur au clavier
 * verrouillerait son bois à la première touche, sans avoir lu les quatre
 * autres cartes. On sépare donc les deux gestes — les flèches parcourent,
 * Espace ou Entrée décide. C’est la « sélection manuelle » des pratiques
 * ARIA, prévue exactement pour les choix qui engagent.
 *
 * À la souris, rien ne change : un clic choisit, comme partout.
 */
export default function EtapeChoix({
  nom,
  legende,
  cartes,
  choisi,
  onChoisir,
  visible,
  prendLeFocus,
}: {
  /** Le `name` du groupe — « bois » ou « coeur ». */
  nom: string;
  legende: string;
  cartes: readonly Carte[];
  /** Le code retenu, ou `null` tant que l’étape est ouverte. */
  choisi: string | null;
  onChoisir: (code: string) => void;
  visible: boolean;
  /**
   * Vrai uniquement quand l’étape vient de **paraître**, et non à chaque
   * rendu : c’est ce qui empêche de voler le focus au joueur en cours de
   * lecture, ou de l’expédier aux cartes dès l’ouverture de la page.
   */
  prendLeFocus: boolean;
}) {
  const champs = useRef<(HTMLInputElement | null)[]>([]);
  const verrouillee = choisi !== null;

  /**
   * L’étape qui paraît prend le focus : sans quoi la navigation au clavier
   * resterait sur l’étape qu’on vient de fermer.
   *
   * `preventScroll` parce que le défilement est déjà mené ailleurs, sur le
   * paragraphe qui introduit l’étape — deux mouvements se disputeraient.
   */
  useEffect(() => {
    if (!prendLeFocus) return;
    champs.current[0]?.focus({ preventScroll: true });
  }, [prendLeFocus]);

  function auClavier(evenement: KeyboardEvent<HTMLFieldSetElement>) {
    if (verrouillee) return;

    const cible = evenement.target as HTMLElement;
    const rang = champs.current.findIndex((champ) => champ === cible);
    if (rang === -1) return;

    const dernier = cartes.length - 1;
    let vise: number | null = null;

    switch (evenement.key) {
      case "ArrowDown":
      case "ArrowRight":
        vise = rang === dernier ? 0 : rang + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        vise = rang === 0 ? dernier : rang - 1;
        break;
      case "Home":
        vise = 0;
        break;
      case "End":
        vise = dernier;
        break;
      case " ":
      case "Enter":
        /**
         * Les deux touches qui décident, et elles sont traitées ici toutes
         * les deux plutôt que laissées au navigateur.
         *
         * Entrée n’a aucun effet natif sur un bouton radio hors formulaire.
         * Espace en a un — il coche — mais il fait aussi défiler la page
         * quand rien ne l’intercepte. Sur un choix définitif, mieux vaut que
         * les deux passent exactement par le même chemin que le clic.
         */
        evenement.preventDefault();
        onChoisir(cartes[rang].code);
        return;
      default:
        return;
    }

    // Sans cela, le navigateur cocherait la carte en même temps qu’il y va.
    evenement.preventDefault();
    champs.current[vise]?.focus();
  }

  return (
    <fieldset
      className="choix"
      data-visible={visible}
      data-verrouillee={verrouillee}
      onKeyDown={auClavier}
    >
      <legend className="choix__legende">
        <span className="font-display text-[0.72rem] uppercase tracking-[0.34em] text-ember/85">
          {legende}
        </span>
      </legend>

      <ul className="grid list-none gap-[0.7rem] p-0">
        {cartes.map((carte, rang) => {
          const identifiant = `${nom}-${carte.code}`;
          return (
            <li key={carte.code} className="carte">
              <input
                type="radio"
                name={nom}
                id={identifiant}
                value={carte.code}
                checked={choisi === carte.code}
                // Une fois l’étape close, seule la carte retenue reste dans
                // l’ordre de tabulation.
                disabled={verrouillee && choisi !== carte.code}
                onChange={() => onChoisir(carte.code)}
                ref={(element) => {
                  champs.current[rang] = element;
                }}
              />
              <label htmlFor={identifiant}>
                <span className="carte__nom">{carte.nom}</span>
                <span className="carte__note font-body">{carte.description}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
