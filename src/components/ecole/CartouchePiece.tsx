import Link from "next/link";
import { libelleAnnee } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import type { Verdict } from "@/lib/forum/lieux";

/**
 * Une pièce du château, telle qu’elle s’affiche dans une aile.
 *
 * **Un lieu verrouillé n’est jamais caché** : il apparaît, avec sa condition
 * écrite à côté. « Un site où l’on ne voit rien paraît vide, et voir une porte
 * fermée donne envie. »
 *
 * Et le verrou ne se signale **jamais par la seule couleur** : la raison est
 * un texte, précédé hors écran de « Écriture verrouillée : » pour qu’un
 * lecteur d’écran l’annonce comme tel plutôt que comme une remarque.
 */
export default function CartouchePiece({
  href,
  nom,
  description,
  sujets,
  ecriture,
}: {
  href: string;
  nom: string;
  description: string;
  sujets: number;
  /** Le verdict d’écriture. `null` quand on ne l’affiche pas. */
  ecriture: Verdict | null;
}) {
  const t = TEXTES_FORUM;
  const verrouille = ecriture !== null && !ecriture.peut;

  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group block rounded-sm border border-silver/12 bg-mist/40 px-5 py-4 transition-colors duration-300 hover:border-silver/30"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="min-w-0 font-display text-[0.78rem] uppercase tracking-[0.14em] text-parchment">
            {nom}
          </p>
          <p className="font-body text-xs text-silver">
            {sujets === 0
              ? t.lieu.aucunSujet
              : sujets === 1
                ? t.lieu.unSujet
                : t.lieu.sujets.replace("{n}", String(sujets))}
          </p>
        </div>

        <p className="mt-2 max-w-[68ch] font-body text-sm leading-[1.75] text-parchment-dim">
          {description}
        </p>

        {verrouille ? <Verrou verdict={ecriture} /> : null}
      </Link>
    </li>
  );
}

/**
 * La condition, en toutes lettres.
 *
 * Le losange est décoratif ; c’est la phrase qui porte l’information, et le
 * préfixe hors écran qui dit de quoi il s’agit.
 */
export function Verrou({ verdict }: { verdict: Verdict }) {
  if (verdict.peut) return null;
  const t = TEXTES_FORUM.verrou;

  const phrase = t[verdict.raison]
    .replace(
      "{annee}",
      verdict.anneeRequise ? libelleAnnee(verdict.anneeRequise) : "",
    )
    .replace(
      "{maison}",
      verdict.maison ? (NOMS_MAISON[verdict.maison] ?? verdict.maison) : "",
    );

  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-body text-xs italic text-silver">
      <span aria-hidden="true" className="not-italic text-silver/70">
        ✧
      </span>
      <span className="sr-only">{t.aria}</span>
      <span>{phrase}</span>
      <span className="text-silver/70">{t.lectureOuverte}</span>
    </p>
  );
}
