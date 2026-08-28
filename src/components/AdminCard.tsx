import type { ReactNode } from "react";

/**
 * Bloc du tableau de bord : eyebrow runique, titre, contenu.
 * Reprend le vocabulaire visuel des cartes du site public.
 *
 * **La pastille est facultative, et zéro n'en affiche aucune** : sur un
 * tableau de bord, un rond vide à côté de chaque titre ne dit plus rien.
 */
export default function AdminCard({
  rune,
  eyebrow,
  title,
  compte,
  compteAria,
  children,
}: {
  rune: string;
  eyebrow: string;
  title: string;
  /** Ce qui attend une lecture. Absent ou nul : pas de pastille. */
  compte?: number;
  /**
   * Ce qu'un lecteur d'écran entend à la place du chiffre — « 3 dossiers à
   * lire », jamais « 3 ». La pastille elle-même est décorative : sans cela, le
   * nombre serait annoncé deux fois. Même dispositif que celle du bandeau.
   */
  compteAria?: string;
  children: ReactNode;
}) {
  const pastille = compte !== undefined && compte > 0;

  return (
    <section className="rounded-sm border border-silver/12 bg-mist/50 p-6 sm:p-8">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          {rune}
        </span>
        <span>{eyebrow}</span>
      </p>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h2 className="min-w-0 font-display text-xl font-semibold tracking-[0.03em] text-parchment">
          {title}
          {pastille ? <span className="sr-only">, {compteAria}</span> : null}
        </h2>

        {pastille ? (
          /* Le nombre EXACT, jamais « 9+ » comme au bandeau : là-bas on
             annonce des messages non lus, ici on jauge une file d'attente, et
             « 9+ » ne dirait pas s'il faut y passer dix minutes ou l'après-midi. */
          <span
            aria-hidden="true"
            className="mt-1 inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-aurora-teal px-2 py-0.5 font-display text-[0.72rem] font-bold leading-none text-void"
          >
            {compte}
          </span>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
