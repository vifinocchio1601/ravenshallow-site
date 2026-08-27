import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Panneau from "@/components/ecole/Panneau";
import PremiersPas from "@/components/ecole/PremiersPas";
import JournalDuNord from "@/components/ecole/JournalDuNord";
import TubesDesMaisons from "@/components/ecole/TubesDesMaisons";
import {
  annonces,
  courrierNonLu,
  premiersPas,
  progression,
  scenesEnCours,
  tournoi,
} from "@/lib/bureau/donnees";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { libellePlace } from "@/lib/dossier/etats";
import { aUneMaison, estConcerneParLeMiroir } from "@/lib/session/acces";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";
import type { Fonction, Genre } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Mon bureau — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

export default async function BureauPage() {
  const compte = await exigerAcces(ROUTES.bureau);
  const t = TEXTES_ECOLE.bureau;

  // Cinq sources, toutes lues en parallèle. Seul le Grand Hall rend encore
  // une liste vide — et le panneau sait quoi en faire.
  const [scenes, courrier, avancee, hall, pas, tournoiDesMaisons] =
    await Promise.all([
      scenesEnCours(compte),
      courrierNonLu(compte),
      progression(compte),
      annonces(),
      premiersPas(compte),
      tournoi(compte),
    ]);

  return (
    <main className="relative">
      {/* ── Le décor ──
          Purement décoratif : `alt` vide, `aria-hidden`, et surtout pas de
          `priority` — le texte des panneaux passe avant la photographie.
          Retiré sous 640 px, où il ne ferait que peser. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/bureau/bureau.jpg"
          alt=""
          fill
          sizes="100vw"
          className="hidden object-cover object-center opacity-60 sm:block"
        />
        {/* Le voile : sans lui, la chandelle rendrait le coin haut-gauche
            illisible. Il monte vers le bas, là où les panneaux s’empilent. */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/80 via-void/85 to-void" />
      </div>

      <div className="relative mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <p className="eyebrow flex items-center gap-3">
          <span aria-hidden="true" className="rune text-aurora-teal/80">
            ᛒ
          </span>
          {t.eyebrow}
        </p>

        <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
          {t.titre}
        </h1>
        <p className="mt-3 max-w-[52ch] font-body leading-[1.8] text-parchment-dim">
          {t.accueil}
        </p>

        {/* La note du nouvel arrivant, avant tout le reste : c’est ce qui
            l’attend. Elle n’est là que tant qu’il reste un pas à faire. */}
        {pas ? (
          <div className="mt-9 max-w-[34rem]">
            <PremiersPas pas={pas} />
          </div>
        ) : null}

        {/* ── La rangée haute : le journal et le tournoi, côte à côte ──

            Sa propre grille, et non les deux moitiés égales de la grille du
            bureau : le journal tient dans 42 %, les tubes ont besoin du reste.

            **L'ordre du document est celui du téléphone** — les tubes d'abord,
            le journal ensuite. C'est ce qu'un lecteur d'écran parcourt, et
            c'est le bon ordre : sur un petit écran le classement compte plus
            que les annonces. Sur grand écran, `lg:order-first` ramène le
            journal à gauche, sans toucher au document. */}
        <div className="mt-10 grid items-start gap-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
          {/* Le panneau disparaît entre deux saisons plutôt que d'afficher
              quatre tubes vides, qui laisseraient croire à un tournoi commencé
              que personne n'aurait joué. */}
          {tournoiDesMaisons ? (
            <Panneau
              titre={TEXTES_POINTS.tournoi.titre}
              aide={TEXTES_POINTS.tournoi.aide}
            >
              <TubesDesMaisons
                lignes={tournoiDesMaisons.lignes}
                maMaison={tournoiDesMaisons.maMaison}
              />
            </Panneau>
          ) : null}

          {/* Le journal n'est PAS dans un `Panneau` : le papier est son propre
              cadre, et une bordure autour d'une une de gazette ferait un cadre
              dans un cadre. Il se cale à gauche de sa colonne, comme un
              journal posé au coin du bureau. */}
          <div className="lg:order-first">
            <JournalDuNord annonces={hall} />
          </div>
        </div>

        {/* ── Le reste du bureau, sur les MÊMES deux colonnes ──

            La grille est celle de la rangée haute, 42 / 58 : « Mes scènes en
            cours » se retrouve donc exactement sous le tournoi, de la même
            largeur — d'où le `minmax(0, …)` des deux, sans quoi le journal,
            qui a une largeur intrinsèque, élargirait sa colonne et les deux
            grilles se décaleraient l'une de l'autre. Sur toute la page il faisait mille quatre-vingt-huit
            pixels pour une ligne de texte.

            Les deux colonnes se lisent alors chacune pour elle-même : à
            gauche ce qui m'arrive — le journal du château, mon courrier, ma
            progression —, à droite ce que je joue — le tournoi, mes scènes.

            **L'ordre du document reste celui du téléphone** : les scènes
            d'abord, ce qui attend une réponse passant avant le reste. Ce sont
            `col-start` et `row-start` qui les replacent sur grand écran, sans
            toucher au document. */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
          {/* 1 — Ce qui attend une réponse passe en premier. */}
          <Panneau
            titre={t.scenes.titre}
            aide={t.scenes.aide}
            vide={t.scenes.vide}
            className="lg:col-start-2 lg:row-start-1"
          >
            {scenes.length > 0 ? (
              <ul className="divide-y divide-silver/10">
                {scenes.map((scene) => (
                  <li key={scene.id} className="flex flex-wrap justify-between gap-2 py-3">
                    <span className="font-body text-parchment">{scene.titre}</span>
                    <span className="font-display text-[0.66rem] uppercase tracking-[0.12em] text-silver">
                      {t.scenes.dernierMessage} · {dateCourte(scene.dernierMessageLe)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panneau>

          {/* 2 — Le courrier.
              Le premier panneau du bureau à cesser d’être vide : il lit
              vraiment la Tour aux Corbeaux. Le raccourci vers la Tour reste
              là dans les deux cas — c’est aussi par ici qu’on va écrire,
              pas seulement lire. */}
          <Panneau
            titre={t.courrier.titre}
            aide={t.courrier.aide}
            className="lg:col-start-1 lg:row-start-1"
          >
            {courrier.length > 0 ? (
              <ul className="divide-y divide-silver/10">
                {courrier.map((corbeau) => (
                  <li key={corbeau.conversationId} className="py-3">
                    <Link
                      href={`${ROUTES.corbeaux}/${corbeau.conversationId}`}
                      className="group block"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-parchment">
                          {corbeau.expediteur}
                        </span>
                        <span className="font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                          {corbeau.nonLus === 1
                            ? TEXTES_CORBEAUX.liste.unNonLuAria
                            : TEXTES_CORBEAUX.liste.nonLusAria.replace(
                                "{n}",
                                String(corbeau.nonLus),
                              )}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-body text-sm text-parchment-dim group-hover:text-parchment">
                        {corbeau.extrait}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body leading-relaxed text-parchment-dim">
                {t.courrier.vide}
              </p>
            )}

            <Link
              href={ROUTES.corbeaux}
              className="mt-5 inline-block font-display text-[0.64rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              {TEXTES_CORBEAUX.liste.versLaTour} →
            </Link>
          </Panneau>

          {/* 3 — La progression. */}
          <Panneau
            titre={t.progression.titre}
            className="lg:col-start-1 lg:row-start-2"
          >
            <dl className="space-y-3 font-body">
              <Mesure
                terme={t.progression.pointsPersonnels}
                valeur={String(avancee.pointsPersonnels)}
              />
              {/* Le compteur de SA MAISON n’est plus ici : les tubes, en tête
                  de page, le disent bien mieux qu’une ligne de texte — et deux
                  affichages du même nombre finiraient par se contredire.
                  Reste la promesse du Miroir, pour qui l’attend : un zéro se
                  lirait comme un échec. */}
              {estConcerneParLeMiroir(avancee) && !aUneMaison(avancee) ? (
                <p className="font-body text-sm italic leading-relaxed text-silver">
                  {t.progression.maisonInconnue}
                </p>
              ) : null}
              {/* Même règle que sur la fiche : le rôle prend la place de
                  l’année, et le terme suit la valeur. */}
              <Mesure
                terme={
                  avancee.roleAffiche ? t.progression.role : t.progression.annee
                }
                valeur={libellePlace(
                  avancee.fonction as Fonction,
                  avancee.roleAffiche,
                )}
              />
              {/* Masquée tant que l’élève n’est pas passé à Kaldvik : la note
                  des premiers pas l’y envoie déjà, et le dire deux fois
                  n’aiderait personne. */}
              {avancee.baguette ? (
                <Mesure terme={t.progression.baguette} valeur={avancee.baguette} />
              ) : null}
              <Mesure
                terme={t.progression.prochainesEpreuves}
                valeur={avancee.prochainesEpreuves ?? t.progression.sansDate}
              />
            </dl>
          </Panneau>

        </div>
      </div>
    </main>
  );
}

function Mesure({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-silver/10 pb-2">
      <dt className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver">
        {terme}
      </dt>
      <dd className="text-right text-parchment">{valeur}</dd>
    </div>
  );
}
