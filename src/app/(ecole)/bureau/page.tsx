import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Panneau from "@/components/ecole/Panneau";
import PremiersPas from "@/components/ecole/PremiersPas";
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

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {/* 0 — Le tournoi, en tête et sur toute la largeur.
              Quatre tubes ne se partagent pas en deux colonnes, et c'est ce
              qu'on veut voir en arrivant : où en est sa maison.
              Le panneau disparaît entre deux saisons plutôt que d'afficher
              quatre tubes vides, qui laisseraient croire à un tournoi commencé
              que personne n'aurait joué. */}
          {tournoiDesMaisons ? (
            <Panneau
              titre={TEXTES_POINTS.tournoi.titre}
              aide={TEXTES_POINTS.tournoi.aide}
              className="lg:col-span-2"
            >
              <TubesDesMaisons
                lignes={tournoiDesMaisons.lignes}
                maMaison={tournoiDesMaisons.maMaison}
              />
            </Panneau>
          ) : null}

          {/* 1 — Ce qui attend une réponse passe en premier. */}
          <Panneau
            titre={t.scenes.titre}
            aide={t.scenes.aide}
            vide={t.scenes.vide}
            className="lg:col-span-2"
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
          <Panneau titre={t.courrier.titre} aide={t.courrier.aide}>
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
          <Panneau titre={t.progression.titre}>
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

          {/* 4 — Le Grand Hall. */}
          <Panneau
            titre={t.annonces.titre}
            aide={t.annonces.aide}
            vide={t.annonces.vide}
            className="lg:col-span-2"
          >
            {hall.length > 0 ? (
              <ul className="space-y-4">
                {hall.map((annonce) => (
                  <li key={annonce.id}>
                    <p className="font-display text-[0.7rem] uppercase tracking-[0.14em] text-parchment">
                      {annonce.titre}
                      <span className="text-silver"> · {dateCourte(annonce.publieeLe)}</span>
                    </p>
                    <p className="mt-1 font-body leading-relaxed text-parchment-dim">
                      {annonce.extrait}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
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
