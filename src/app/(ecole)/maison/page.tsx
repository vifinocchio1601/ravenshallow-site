import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ChampMot from "@/components/maison/ChampMot";
import TableauDAffichage from "@/components/maison/TableauDAffichage";
import TopDuMois from "@/components/maison/TopDuMois";
import TubesDesMaisons from "@/components/ecole/TubesDesMaisons";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { maisonQuiCompte } from "@/lib/ecole/tournoi";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import { lireLeTournoi, topDuMois } from "@/lib/points/depot";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import { lireLeTableau } from "@/lib/tableau/depot";
import { exigerAcces } from "@/lib/session/garde";
import type { Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Ma maison — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Ma maison** — le tableau d'affichage, le tournoi, et le top du mois.
 *
 * La route exige déjà une maison : `exigeUneMaison` ferme l'entrée du bandeau
 * **et** l'adresse, à l'élève que le Miroir attend comme à la directrice
 * qu'il ne concerne pas. La maison affichée est donc celle de la fiche, sans
 * autre question.
 *
 * ⚠️ **Deux questions distinctes sur la même maison**, et il faut les garder
 * séparées : `aUneMaison` — déjà posée par la garde — dit que le blason
 * s'affiche ; `maisonQuiCompte` dit qui marque au tournoi. Elles coïncident
 * aujourd'hui, et `tournoi.ts` prévoit lui-même qu'elles divergent un jour.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.maison);

  // La garde a déjà refermé la porte sur qui n'a pas de maison qui s'affiche ;
  // ce garde-ci ne rattrape qu'une valeur abîmée en base.
  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) notFound();

  const [tournoi, mots, top, pouvoirs] = await Promise.all([
    lireLeTournoi(),
    lireLeTableau(maison),
    topDuMois(maison, new Date()),
    pouvoirsDe(compte.id),
  ]);

  const peutEpingler = peutEcrireLesAnnoncesDe(pouvoirs, maison);
  const blason = blasonDe(maison);
  const nom = NOMS_MAISON[maison] ?? maison;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <div className="flex items-center gap-4">
        <Image
          src={blason.src}
          alt={TEXTES_ECOLE.maison.altBlason}
          width={blason.largeur}
          height={blason.hauteur}
          // Sans `sizes`, `next/image` réclame la pleine largeur pour un écu
          // de soixante pixels. Le trou déjà bouché sur le bandeau.
          sizes="60px"
          className="h-[60px] w-auto"
        />
        <div>
          <p className="eyebrow">{TEXTES_ECOLE.maison.eyebrow}</p>
          <h1 className="mt-1 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
            {nom}
          </h1>
        </div>
      </div>

      {/* ── Le tableau d'affichage ── */}
      <section aria-labelledby="tableau-titre" className="mt-10">
        <h2
          id="tableau-titre"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {TEXTES_TABLEAU.titre}
        </h2>
        <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
          {TEXTES_TABLEAU.chapeau}
        </p>

        <div className="mt-5">
          <TableauDAffichage
            mots={mots}
            moiId={compte.eleveId}
            peutFaireLeMenage={peutEpingler}
          />
        </div>

        {/* Le champ n'apparaît qu'à qui peut écrire — mais c'est l'action
            serveur qui protège : elle refait la question en entier. */}
        {peutEpingler ? <ChampMot /> : null}
      </section>

      {/* ── Le rappel des quatre tubes ── */}
      {tournoi ? (
        <section aria-labelledby="tubes-titre" className="mt-14">
          <h2
            id="tubes-titre"
            className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
          >
            {TEXTES_POINTS.tournoi.titre}
          </h2>
          <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
            {TEXTES_POINTS.tournoi.aide}
          </p>
          <div className="mt-6">
            {/* **Les quatre, et non le sien seul** : un tube isolé ne dit rien
                d'un tournoi. `maisonQuiCompte` décide du liseré — jamais la
                colonne, jamais la maison affichée en tête de page. */}
            <TubesDesMaisons
              lignes={tournoi.lignes}
              maMaison={maisonQuiCompte(compte)}
            />
          </div>
        </section>
      ) : null}

      {/* ── Le top du mois ── */}
      <TopDuMois lignes={top} />
    </main>
  );
}
