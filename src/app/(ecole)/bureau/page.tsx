import type { Metadata } from "next";
import Image from "next/image";
import Panneau from "@/components/ecole/Panneau";
import PremiersPas from "@/components/ecole/PremiersPas";
import {
  annonces,
  courrierNonLu,
  premiersPas,
  progression,
  scenesEnCours,
} from "@/lib/bureau/donnees";
import { libelleFonction } from "@/lib/dossier/etats";
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

  // Quatre sources, aucune n’existe encore : elles rendent des listes vides,
  // et les panneaux savent quoi en faire.
  const [scenes, courrier, avancee, hall, pas] = await Promise.all([
    scenesEnCours(compte),
    courrierNonLu(compte),
    progression(compte),
    annonces(),
    premiersPas(compte),
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

          {/* 2 — Le courrier. */}
          <Panneau titre={t.courrier.titre} aide={t.courrier.aide} vide={t.courrier.vide}>
            {courrier.length > 0 ? (
              <ul className="divide-y divide-silver/10">
                {courrier.map((message) => (
                  <li key={message.id} className="flex flex-wrap justify-between gap-2 py-3">
                    <span className="font-body text-parchment">{message.sujet}</span>
                    <span className="font-display text-[0.66rem] uppercase tracking-[0.12em] text-silver">
                      {message.expediteur}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panneau>

          {/* 3 — La progression. */}
          <Panneau titre={t.progression.titre}>
            <dl className="space-y-3 font-body">
              <Mesure
                terme={t.progression.pointsPersonnels}
                valeur={String(avancee.pointsPersonnels)}
              />
              {/* Compteur de maison masqué avant la répartition, plutôt
                  qu’affiché à zéro : un zéro se lit comme un échec. */}
              {avancee.pointsMaison === null ? (
                <p className="font-body text-sm italic leading-relaxed text-silver">
                  {t.progression.maisonInconnue}
                </p>
              ) : (
                <Mesure
                  terme={t.progression.pointsMaison}
                  valeur={String(avancee.pointsMaison)}
                />
              )}
              <Mesure
                terme={t.progression.annee}
                valeur={libelleFonction(
                  avancee.fonction as Fonction,
                  avancee.genre as Genre,
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
