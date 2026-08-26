import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Verrou } from "@/components/ecole/CartouchePiece";
import FormulaireScene from "@/components/forum/FormulaireScene";
import Post from "@/components/forum/Post";
import { ActionsSujet } from "@/components/forum/ActionsStaff";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { lireSujet } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutRepondre } from "@/lib/forum/lieux";
import {
  estStaff,
  peutCloreUneScene,
  peutEpinglerUnSujet,
} from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.ecole.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Une scène, et ce qui s’y est écrit.
 *
 * `lireSujet` rend `null` si le sujet n’existe pas **ou** si le lieu n’est pas
 * lisible : la même réponse dans les deux cas.
 *
 * **Toutes les scènes sont lisibles**, quel que soit le mode écrit dans leur
 * titre. Le mode est une convention entre joueurs et ne concerne que
 * l’écriture — le site ne l’applique pas.
 */
export default async function Page({
  params,
}: {
  params: { piece: string; sujet: string };
}) {
  const compte = await exigerAcces(ROUTES.ecole);
  const pouvoirs = await pouvoirsDe(compte.id);

  const charge = await lireSujet(params.sujet, { membre: compte, pouvoirs });
  if (!charge) notFound();

  const { section, sujet, posts } = charge;
  const reponse = peutRepondre(compte, pouvoirs, section.regles, {
    clos: sujet.clos,
    anneeRequiseALOuverture: sujet.anneeRequiseALOuverture,
  });
  const t = TEXTES_FORUM;
  const staff = estStaff(pouvoirs);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={`${ROUTES.ecole}/${params.piece}`}
        className="eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-aurora-teal"
      >
        <span aria-hidden="true">←</span>
        {section.nom}
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="font-display text-[clamp(1.5rem,4vw,2.1rem)] font-semibold leading-[1.2] tracking-[0.02em] text-parchment">
          {sujet.titre}
        </h1>
        {sujet.epingle ? (
          <span className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-aurora-teal/90">
            {t.moderation.epinglee}
          </span>
        ) : null}
      </div>

      <p className="mt-2 font-body text-sm text-silver">
        {sujet.auteur ?? "—"}
      </p>

      {/* Une scène close reste lisible. « Les points acquis restent acquis. » */}
      {sujet.clos ? (
        <p className="mt-4 max-w-[68ch] rounded-sm border border-silver/20 bg-mist/40 px-5 py-3 font-body text-sm italic text-silver">
          {t.moderation.close}
        </p>
      ) : null}

      <ActionsSujet
        sujetId={sujet.id}
        clos={sujet.clos}
        epingle={sujet.epingle}
        peutClore={peutCloreUneScene(pouvoirs)}
        peutEpingler={peutEpinglerUnSujet(pouvoirs)}
      />

      <section aria-label="Les posts" className="mt-10 grid gap-5">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            estLAuteur={post.auteurId !== null && post.auteurId === compte.eleveId}
            estStaff={staff}
          />
        ))}
      </section>

      {/* — Répondre, ou la raison de ne pas pouvoir — */}
      <section aria-label={t.ecrire.repondre} className="mt-12">
        {reponse.peut ? (
          <FormulaireScene
            sujetId={sujet.id}
            lignesMinimum={section.regles.lignesMinimum}
          />
        ) : (
          <div className="max-w-[68ch] rounded-sm border border-silver/15 bg-mist/40 px-5 py-3">
            <Verrou verdict={reponse} />
          </div>
        )}
      </section>
    </main>
  );
}
