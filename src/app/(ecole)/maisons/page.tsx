import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVisiterLaMaison } from "@/lib/forum/pouvoirs";
import { aUneMaison } from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";
import { cleDeMaison, MAISONS, type Maison } from "@/lib/dossier/etats";

const T = TEXTES_ECOLE.maison.toutes;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Les quatre maisons.**
 *
 * ⚠️ **Cette adresse existe parce que le middleware ne peut pas décider.** Il
 * tourne au bord du réseau et ne joint pas la base : il lit l'état d'un compte
 * dans son cookie, jamais ses permissions. « A-t-elle une maison ? » il sait ;
 * « est-elle directrice ? » il ne saura jamais. `/maison` est donc gardée par
 * `exigeUneMaison` et se referme sur une directrice ; celle-ci s'ouvre à tous,
 * et **c'est la page qui trie**, côté serveur, avec les vraies permissions.
 *
 * Un élève y voit les quatre maisons et trois portes closes — ce qui est vrai
 * d'une école. On ne cache pas les portes : une porte fermée dit où l'on n'est
 * pas chez soi, une absence ne dit rien.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.maisons);
  const pouvoirs = await pouvoirsDe(compte.id);

  // Sa maison **au sens de l'affichage** : une directrice en `SANS_OBJET` n'en
  // a aucune, même si la colonne en garde une au chaud.
  const laSienne = aUneMaison(compte) ? ((compte.maison ?? null) as Maison) : null;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow">{T.eyebrow}</p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>
      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {laSienne === null && MAISONS.some((m) => peutVisiterLaMaison(pouvoirs, null, m))
          ? T.aucuneSienne
          : T.chapeau}
      </p>

      {/* **Les quatre sortent toujours dans l'ordre de `MAISONS`**, jamais
          triées par quoi que ce soit : une maison qui change de place entre
          deux visites est désorientante. Même règle que les tubes. */}
      <ul
        aria-label={T.ariaListe}
        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {MAISONS.map((maison) => {
          const ouverte = peutVisiterLaMaison(pouvoirs, laSienne, maison);
          const blason = blasonDe(maison);
          const nom = NOMS_MAISON[maison] ?? maison;
          const adresse =
            maison === laSienne
              ? ROUTES.maison
              : `${ROUTES.maisons}/${cleDeMaison(maison)}`;

          return (
            <li
              key={maison}
              className={`min-w-0 rounded-md border p-5 ${
                ouverte
                  ? "border-silver/15 bg-void/40 transition-colors hover:border-aurora-teal/40"
                  : "border-dashed border-silver/12 bg-void/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <Image
                  src={blason.src}
                  alt={TEXTES_ECOLE.maison.altBlason}
                  width={blason.largeur}
                  height={blason.hauteur}
                  sizes="52px"
                  // Une porte close se voit à autre chose qu'à la couleur : le
                  // blason pâlit, ET la phrase du dessous le dit.
                  className={`h-[52px] w-auto ${ouverte ? "" : "opacity-40"}`}
                />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-snug text-parchment">
                    {ouverte ? <Link href={adresse}>{nom}</Link> : nom}
                  </p>
                  <p className="mt-1 font-body text-xs italic text-silver">
                    {maison === laSienne
                      ? T.laSienne
                      : ouverte
                        ? T.ouverte
                        : T.close}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
