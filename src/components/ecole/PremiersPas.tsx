import Link from "next/link";
import type { PremierPas } from "@/lib/bureau/donnees";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";

/**
 * La note des premiers pas, épinglée sur le bureau.
 *
 * Elle n’est affichée qu’au nouvel arrivant, et **disparaît d’elle-même**
 * quand les deux lignes sont cochées : `premiersPas()` rend alors `null` et
 * le bureau ne l’appelle plus.
 *
 * L’écriture manuscrite est un décor et rien de plus. Aucun état ne repose
 * sur elle : la case cochée se voit, le texte fait est biffé, et la raison
 * d’un verrou est écrite en toutes lettres à côté de la ligne. Les lecteurs
 * d’écran reçoivent en tête de chaque ligne « Fait : », « À faire : » ou
 * « Verrouillé : ».
 */
export default function PremiersPas({ pas }: { pas: readonly PremierPas[] }) {
  const t = TEXTES_ECOLE.bureau.premiersPas;

  return (
    <section className="note-parchemin rounded-[2px] px-6 py-6 sm:px-8 sm:py-7">
      <h2 className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink">
        {t.titre}
      </h2>
      <p className="mt-1.5 font-body text-sm italic leading-relaxed text-ink/70">
        {t.aide}
      </p>

      <ul className="mt-5 space-y-3">
        {pas.map((etape) => {
          const etat = etape.fait
            ? "fait"
            : etape.verrou
              ? "verrouille"
              : "a-faire";

          const annonce = etape.fait
            ? t.etatFait
            : etape.verrou
              ? t.etatVerrouille
              : t.etatAFaire;

          return (
            <li
              key={etape.id}
              data-etat={etat}
              className="note-parchemin__ligne flex items-start gap-3"
            >
              <span aria-hidden="true" className="note-parchemin__case">
                {etape.fait ? "✓" : ""}
              </span>

              <span className="min-w-0">
                <span className="sr-only">{annonce} </span>

                {etape.href ? (
                  <Link
                    href={etape.href}
                    className="note-parchemin__texte border-b border-ink/40 pb-px transition-colors duration-300 hover:border-ink"
                  >
                    {etape.libelle}
                  </Link>
                ) : (
                  <span className="note-parchemin__texte">{etape.libelle}</span>
                )}

                {/* La raison du verrou, en clair. Sans elle, la ligne grisée
                    ne dirait pas pourquoi elle ne s’ouvre pas. */}
                {etape.verrou ? (
                  <span className="note-parchemin__raison">
                    {" "}
                    — {etape.verrou}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
