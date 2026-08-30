import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff } from "@/lib/forum/pouvoirs";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { listerLEtagere, type VolumeSurLEtagere } from "@/lib/grimoires/depot";
import { CLASSE_RELIURE } from "@/lib/grimoires/reliures";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_GRIMOIRES.etagere;

export const metadata: Metadata = {
  title: `${TEXTES_GRIMOIRES.nom} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **L'étagère.**
 *
 * ⚠️ **Aucun volume grisé ici**, à la différence des années de cours et des
 * quatre maisons : le joueur a tranché le 30 août 2026 que tout est lisible.
 * Ce qui ne s'ouvre pas ne s'affiche pas du tout — un chapitre réservé à
 * l'administration n'existe pas pour un joueur, et un volume dont rien ne
 * s'ouvrirait ne figure pas sur l'étagère. « Il existe, mais pas pour vous »
 * se lit comme une confirmation.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.grimoires);
  const pouvoirs = await pouvoirsDe(compte.id);
  const volumes = await listerLEtagere(estStaff(pouvoirs));

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛒ
        </span>
        {T.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.intro}
      </p>

      {volumes.length === 0 ? (
        <p className="mt-12 font-body italic text-silver">{T.vide}</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {volumes.map((volume) => (
            <Volume key={volume.id} volume={volume} />
          ))}
        </ul>
      )}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}

/** Un livre posé de trois quarts : le dos peint, la tranche, puis le texte. */
function Volume({ volume }: { volume: VolumeSurLEtagere }) {
  const chapitres =
    volume.chapitres === 1
      ? T.chapitreUn
      : T.chapitres.replace("{n}", String(volume.chapitres));

  return (
    <li className="min-w-0">
      <Link
        href={`${ROUTES.grimoires}/${volume.slug}`}
        // Le dos et la tranche sont peints par `.livre`, qui lit la teinte de
        // la reliure. Tout ce qui compte reste du vrai texte, à côté.
        className={`livre ${CLASSE_RELIURE[volume.reliure]} flex h-full flex-col gap-1 rounded-md border border-silver/15 bg-void/40 p-5 pl-11 transition-colors hover:border-aurora-teal/40`}
      >
        <span className="font-display text-lg leading-snug text-parchment">
          {volume.titre}
        </span>

        {volume.exergue ? (
          <span className="font-body text-sm italic text-silver">
            {volume.exergue}
          </span>
        ) : null}

        <span className="mt-2 max-w-[52ch] font-body text-sm leading-[1.75] text-parchment-dim">
          {volume.description}
        </span>

        <span className="mt-3 font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver">
          {chapitres}
        </span>
      </Link>
    </li>
  );
}
