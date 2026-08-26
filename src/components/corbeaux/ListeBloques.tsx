"use client";

import { useState } from "react";
import BlasonCorrespondant from "@/components/corbeaux/BlasonCorrespondant";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { quandDansUnePhrase } from "@/lib/corbeaux/dates";
import type { PersonneBloquee } from "@/lib/corbeaux/depot";

/**
 * Les personnes bloquées, et de quoi les débloquer.
 *
 * Le déblocage est immédiat et sans confirmation : c’est le geste qui rouvre
 * une porte, pas celui qui la ferme. Une confirmation ne protégerait de rien
 * — au pire on rebloque — et ferait hésiter là où il n’y a pas lieu.
 *
 * En revanche, ce que le déblocage **ne fait pas** est annoncé aussitôt après :
 * les corbeaux partis dans le vide pendant le blocage ne reviennent pas. Sans
 * cette phrase, on attendrait un rattrapage qui n’arrivera jamais.
 */
export default function ListeBloques({
  initiales,
}: {
  initiales: PersonneBloquee[];
}) {
  const [bloquees, setBloquees] = useState(initiales);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const t = TEXTES_CORBEAUX.bloques;

  async function debloquer(personne: PersonneBloquee) {
    setEnCours(personne.id);

    const reponse = await fetch("/api/corbeaux/blocages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membreId: personne.id, action: "DEBLOQUER" }),
    });

    setEnCours(null);
    if (!reponse.ok) return;

    setBloquees((liste) => liste.filter((p) => p.id !== personne.id));
    setAnnonce(t.apresDeblocage);
  }

  if (bloquees.length === 0) {
    return (
      <>
        {/* L’annonce survit à la disparition de la ligne : quelqu’un qui vient
            de débloquer la dernière personne doit lire ce que cela change. */}
        <Annonce texte={annonce} />
        <div className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-12 text-center">
          <p className="font-body text-lg leading-relaxed text-parchment-dim">
            {t.vide}
          </p>
          <p className="mt-2 font-body text-sm italic leading-relaxed text-silver">
            {t.videAide}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Annonce texte={annonce} />

      {/* `grid-cols-1` et `min-w-0` : sans eux, un nom long élargit la liste
          au-delà de l’écran sur téléphone. */}
      <ul className="grid grid-cols-1 gap-2">
        {bloquees.map((personne) => (
          <li key={personne.id} className="min-w-0">
            <div className="flex items-center gap-4 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3 sm:px-5">
              <BlasonCorrespondant correspondant={personne} taille="petit" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[0.8rem] uppercase tracking-[0.1em] text-parchment">
                  {personne.prenomNom}
                </p>
                <time
                  dateTime={personne.bloqueeLe}
                  suppressHydrationWarning
                  className="font-body text-xs italic text-silver"
                >
                  {t.depuis.replace("{quand}", quandDansUnePhrase(personne.bloqueeLe))}
                </time>
              </div>

              <button
                type="button"
                onClick={() => debloquer(personne)}
                disabled={enCours === personne.id}
                aria-label={t.debloquerAria.replace("{nom}", personne.prenomNom)}
                className="btn btn-ghost shrink-0 text-[0.62rem] disabled:opacity-50"
              >
                {t.debloquer}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Ce qui vient de se passer, annoncé aux lecteurs d’écran **sans voler le
 * focus** : `polite`, comme le fil. Quelqu’un qui débloque trois personnes
 * d’affilée ne doit pas se faire renvoyer en haut de page à chaque fois.
 */
function Annonce({ texte }: { texte: string | null }) {
  return (
    <p
      aria-live="polite"
      className="mb-4 min-h-[1.5rem] font-body text-sm italic leading-relaxed text-aurora-teal"
    >
      {texte ?? ""}
    </p>
  );
}
