import { enPoints } from "@/lib/points/affichage";
import type { LigneDuTop } from "@/lib/points/depot";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";

/**
 * **Le top du mois d'une maison** — les cinq qui lui ont le plus rapporté.
 *
 * Cinq lignes quoi qu'il arrive, zéros compris : décision du joueur. Dans une
 * maison de six, le tableau est donc presque le classement de tout le monde —
 * c'est assumé, et ça s'estompera quand ils seront trente.
 *
 * **Les nombres passent par `points/affichage.ts`**, et jamais par un
 * `toFixed` local : la mise en forme était recopiée dans trois écrans, et
 * chacun arrondissait pour son compte. `enPoints` accorde — et « 0 point »
 * est au singulier en français, la faute que tout le monde fait.
 */
export default function TopDuMois({ lignes }: { lignes: LigneDuTop[] }) {
  const t = TEXTES_TABLEAU.top;

  return (
    <section aria-labelledby="top-titre" className="mt-12">
      <h2
        id="top-titre"
        className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
      >
        {t.titre}
      </h2>
      <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
        {t.aide}
      </p>

      {lignes.length === 0 ? (
        <p className="mt-4 font-body italic leading-[1.8] text-silver">
          {t.personne}
        </p>
      ) : (
        <ol
          aria-label={t.ariaListe}
          className="mt-5 grid grid-cols-1 gap-2 p-0"
        >
          {lignes.map((ligne) => (
            // `min-w-0` sur l'élément ET `grid-cols-1` sur la liste : sans les
            // deux, un nom long élargit la ligne au-delà de l'écran, et sur
            // téléphone les points sortent du cadre.
            <li
              key={ligne.eleveId}
              className="flex min-w-0 items-baseline gap-3 border-b border-silver/10 pb-2"
            >
              {/* Le rang est écrit, jamais rendu par la seule position : une
                  liste lue à voix haute ne dit pas les ex æquo. */}
              <span className="w-8 shrink-0 font-display text-[0.72rem] uppercase tracking-[0.14em] text-ember/85">
                {ligne.rang === 1 ? t.premier : t.rang.replace("{n}", String(ligne.rang))}
              </span>

              <span className="min-w-0 flex-1">
                {/* Le nom ne se coupe pas : c'est la seule chose que cette
                    ligne doit dire à coup sûr. */}
                <span className="font-body text-parchment">{ligne.prenomNom}</span>
                {/* Une VRAIE espace, et non une marge : deux éléments en ligne
                    collés sont lus d'une traite — « Halvard Brekke1re année ».
                    La marge ne se lit pas à voix haute. */}{" "}
                <span className="font-body text-xs italic text-silver">
                  {ligne.place}
                </span>
              </span>

              <span className="shrink-0 font-body text-sm text-parchment-dim">
                {enPoints(ligne.points)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
