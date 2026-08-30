import Link from "next/link";
import BlocGrimoire from "@/components/grimoires/Bloc";
import Lecteur, {
  type ChapitreDuLecteur,
  type RepereBloc,
} from "@/components/grimoires/Lecteur";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import type { ChapitreLu, VolumeOuvert } from "@/lib/grimoires/depot";

const T = TEXTES_GRIMOIRES;

/**
 * **Un volume ouvert**, dans l'un de ses deux modes.
 *
 * Les blocs sont rendus **une seule fois, par le serveur**, et servent aux
 * deux : le lecteur les mesure et les distribue en pages, la lecture continue
 * les déroule. Les rendre deux fois, ce serait accepter qu'ils divergent — et
 * le mode continu doit montrer exactement ce que le mode paginé montre.
 *
 * ⚠️ **Le mode continu est une ADRESSE**, pas un interrupteur : `?lecture=
 * continue`. C'est ce qui le rend disponible sans une ligne de script, et
 * c'est ce qui en fait une vraie alternative — celle qu'un lecteur d'écran
 * parcourt, celle où l'on cherche un mot, celle qui reste si le script ne
 * s'exécute pas.
 */
export default function VueVolume({
  volume,
  chapitres,
  continu,
  chapitreInitial,
}: {
  volume: VolumeOuvert;
  chapitres: ChapitreLu[];
  continu: boolean;
  chapitreInitial: string | null;
}) {
  const hrefVolume = `${ROUTES.grimoires}/${volume.slug}`;

  // La suite à plat, et les repères qui vont avec : le lecteur n'a jamais
  // besoin du contenu d'un bloc, seulement de son type, de son ancre et du
  // chapitre auquel il appartient.
  const blocs = chapitres.flatMap((chapitre) =>
    chapitre.blocs.map((bloc) => <BlocGrimoire key={bloc.id} bloc={bloc} />),
  );

  const reperes: RepereBloc[] = chapitres.flatMap((chapitre, index) =>
    chapitre.blocs.map((bloc) => ({
      type: bloc.type,
      ancre: bloc.ancre,
      chapitre: index,
    })),
  );

  let compte = 0;
  const pourLeLecteur: ChapitreDuLecteur[] = chapitres.map((chapitre) => {
    const premier = compte;
    compte += chapitre.blocs.length;
    return { slug: chapitre.slug, titre: chapitre.titre, premier };
  });

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.grimoires}
        className="eyebrow inline-flex items-center gap-3 text-silver transition-colors hover:text-parchment"
      >
        <span aria-hidden="true">←</span>
        {T.lecteur.retour}
      </Link>

      <h1 className="mt-6 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {volume.titre}
      </h1>

      {volume.exergue ? (
        <p className="mt-3 font-body italic text-silver">{volume.exergue}</p>
      ) : null}

      {continu ? (
        <ModeContinu
          chapitres={chapitres}
          blocs={blocs}
          pourLeLecteur={pourLeLecteur}
          hrefPagine={hrefVolume}
        />
      ) : (
        <Lecteur
          blocs={blocs}
          reperes={reperes}
          chapitres={pourLeLecteur}
          hrefVolume={hrefVolume}
          hrefContinu={`${hrefVolume}?lecture=continue`}
          chapitreInitial={chapitreInitial}
          ancreInitiale={null}
        />
      )}
    </main>
  );
}

/** Tout le volume, dans une colonne, sans décor. */
function ModeContinu({
  chapitres,
  blocs,
  pourLeLecteur,
  hrefPagine,
}: {
  chapitres: ChapitreLu[];
  blocs: React.ReactNode[];
  pourLeLecteur: ChapitreDuLecteur[];
  hrefPagine: string;
}) {
  return (
    <div className="gr-nuit">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label={T.lecteur.sommaire}>
          <h2 className="font-display text-[0.7rem] uppercase tracking-[0.16em] text-parchment-dim">
            {T.lecteur.sommaire}
          </h2>
          <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-8">
            {chapitres.map((chapitre) => (
              <li key={chapitre.id} className="min-w-0">
                <a
                  href={`#${chapitre.slug}`}
                  className="font-body text-sm text-parchment-dim underline-offset-4 transition-colors hover:text-parchment hover:underline"
                >
                  {chapitre.titre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href={hrefPagine}
          className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver underline-offset-4 hover:text-parchment hover:underline"
        >
          {T.lecteur.modePagine}
        </Link>
      </div>

      <div className="hairline mt-8 max-w-[28rem]" />

      {chapitres.map((chapitre, index) => (
        <section key={chapitre.id} className="mt-12">
          <h2
            id={chapitre.slug}
            className="scroll-mt-24 font-display text-[clamp(1.2rem,3vw,1.6rem)] leading-snug text-parchment"
          >
            {chapitre.titre}
          </h2>

          <div className="mt-4">
            {blocs.slice(
              pourLeLecteur[index].premier,
              pourLeLecteur[index].premier + chapitre.blocs.length,
            )}
          </div>
        </section>
      ))}

      <div className="hairline mt-14 max-w-[28rem]" />
    </div>
  );
}
