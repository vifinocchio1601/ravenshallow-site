import Image from "next/image";
import Link from "next/link";
import ChampMot from "@/components/maison/ChampMot";
import TableauDAffichage from "@/components/maison/TableauDAffichage";
import TopDuMois from "@/components/maison/TopDuMois";
import TubesDesMaisons from "@/components/ecole/TubesDesMaisons";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { maisonQuiCompte } from "@/lib/ecole/tournoi";
import { peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import type { Pouvoirs } from "@/lib/forum/pouvoirs";
import { lireLeTournoi, topDuMois } from "@/lib/points/depot";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import { lireLeTableau } from "@/lib/tableau/depot";
import { cleDeMaison, type Maison } from "@/lib/dossier/etats";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * **Une maison, telle qu'on la visite** — son tableau, le tournoi, son top.
 *
 * **Une seule implémentation, deux chemins pour y arriver** : `/maison` pour
 * la sienne, `/maisons/<clé>` pour n'importe laquelle. Deux copies de cet
 * écran finiraient par diverger, et c'est la copie oubliée qui montrerait un
 * jour le tableau à quelqu'un qui n'y a pas droit.
 *
 * ⚠️ **Ce composant ne décide d'aucun accès.** Les deux pages ont déjà tranché
 * — `peutVisiterLaMaison` — avant de l'appeler. Lui met en forme, et c'est
 * tout.
 *
 * ⚠️ **Deux questions distinctes sur la maison du lecteur**, et il faut les
 * garder séparées : `aUneMaison` — posée par les pages — dit que son blason
 * s'affiche ; `maisonQuiCompte` dit pour qui il marque au tournoi. Une
 * directrice en visite ne porte le liseré d'aucun tube.
 */
export default async function MaisonVisitee({
  maison,
  compte,
  pouvoirs,
  cheminSalon,
}: {
  maison: Maison;
  compte: CompteConnecte;
  pouvoirs: Pouvoirs;
  /** L'adresse du salon de CETTE maison — elle dépend du chemin d'arrivée. */
  cheminSalon: string;
}) {
  const [tournoi, mots, top] = await Promise.all([
    lireLeTournoi(),
    lireLeTableau(maison),
    topDuMois(maison, new Date()),
  ]);

  const peutEpingler = peutEcrireLesAnnoncesDe(pouvoirs, maison);
  const blason = blasonDe(maison);
  const nom = NOMS_MAISON[maison] ?? maison;

  return (
    <>
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
            maison={cleDeMaison(maison)}
            moiId={compte.eleveId}
            peutFaireLeMenage={peutEpingler}
          />
        </div>

        {/* Le champ n'apparaît qu'à qui peut écrire — mais c'est l'action
            serveur qui protège : elle refait la question en entier. */}
        {peutEpingler ? <ChampMot maison={cleDeMaison(maison)} /> : null}
      </section>

      {/* ── Le salon, dans sa propre pièce ── */}
      <p className="mt-8">
        <Link href={cheminSalon} className="btn btn-ghost">
          {TEXTES_SALON.lien}
        </Link>
        <span className="ml-4 font-body text-sm italic text-silver">
          {TEXTES_SALON.lienAide}
        </span>
      </p>

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
            {/* **Les quatre, et non celui de la maison visitée** : un tube
                isolé ne dit rien d'un tournoi. Le liseré suit `maisonQuiCompte`
                du LECTEUR — jamais la maison de la page. */}
            <TubesDesMaisons
              lignes={tournoi.lignes}
              maMaison={maisonQuiCompte(compte)}
            />
          </div>
        </section>
      ) : null}

      {/* ── Le top du mois ── */}
      <TopDuMois lignes={top} />
    </>
  );
}
