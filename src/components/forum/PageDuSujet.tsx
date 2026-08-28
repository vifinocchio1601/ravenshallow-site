import Link from "next/link";
import { notFound } from "next/navigation";
import { Verrou } from "@/components/ecole/CartouchePiece";
import FormulaireScene from "@/components/forum/FormulaireScene";
import Post from "@/components/forum/Post";
import { ActionsSujet } from "@/components/forum/ActionsStaff";
import BoutonRetirerScene from "@/components/forum/BoutonRetirerScene";
import { TEXTES_FORUM, type MotsDuLieu } from "@/lib/forum/constantes";
import { lireSujet } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutRepondre } from "@/lib/forum/lieux";
import {
  estStaff,
  peutCloreUneScene,
  peutEpinglerUnSujet,
} from "@/lib/forum/pouvoirs";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * **Un sujet, et ce qui s’y est écrit** — une scène du château, un fil hors RP.
 *
 * **Une seule implémentation, deux espaces** : `/ecole/…` et `/non-mages/…`
 * l’appellent tous deux. Deux copies finiraient par diverger.
 *
 * ⚠️ **Ce composant ne garde rien.** L’appelant a déjà appelé `exigerAcces`
 * sur SA route.
 *
 *
 * `lireSujet` rend `null` si le sujet n’existe pas **ou** si le lieu n’est pas
 * lisible : la même réponse dans les deux cas.
 *
 * **Toutes les scènes sont lisibles**, quel que soit le mode écrit dans leur
 * titre. Le mode est une convention entre joueurs et ne concerne que
 * l’écriture — le site ne l’applique pas.
 */
export default async function PageDuSujet({
  compte,
  slug,
  sujetId,
  racine,
  mots,
}: {
  compte: CompteConnecte;
  /** Le slug du lieu, pour le lien de retour. */
  slug: string;
  /** Le vocabulaire de l’espace — voir `PageDuLieu`. */
  mots: MotsDuLieu;
  sujetId: string;
  /** L’adresse de l’espace : « /ecole », « /non-mages ». */
  racine: string;
}) {
  const pouvoirs = await pouvoirsDe(compte.id);

  const charge = await lireSujet(sujetId, { membre: compte, pouvoirs });
  if (!charge) notFound();

  const { section, sujet, posts } = charge;
  const reponse = peutRepondre(compte, pouvoirs, section.regles, {
    clos: sujet.clos,
    anneeRequiseALOuverture: sujet.anneeRequiseALOuverture,
  });
  const t = TEXTES_FORUM;
  const staff = estStaff(pouvoirs);

  // **Qui d'autre a écrit ici.** Les auteurs distincts des posts et celui de
  // la scène, moi retiré : c'est ce dont dépend le droit de retirer, et c'est
  // la page qui a la liste sous les yeux. Le serveur le recalcule, comme
  // toujours — ce compte-ci ne sert qu'à savoir quoi proposer.
  const ecrivains = new Set<string>();
  for (const p of posts) {
    if (p.auteurId && p.auteurId !== compte.eleveId) ecrivains.add(p.auteurId);
  }
  if (sujet.auteurId && sujet.auteurId !== compte.eleveId) {
    ecrivains.add(sujet.auteurId);
  }

  const estLAuteurDeLaScene =
    sujet.auteurId !== null && sujet.auteurId === compte.eleveId;

  /** Le dernier post encore là : au-delà, retirer ne troue rien. */
  const dernierVisible = posts.filter((p) => !p.retire).at(-1)?.id ?? null;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={`${racine}/${slug}`}
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ActionsSujet
          mots={mots}
          sujetId={sujet.id}
          clos={sujet.clos}
          epingle={sujet.epingle}
          // **L'auteur clôt la sienne**, sans permission particulière : c'est
          // la contrepartie du retrait, refusé dès qu'un autre a écrit.
          peutClore={peutCloreUneScene(pouvoirs) || estLAuteurDeLaScene}
          peutEpingler={peutEpinglerUnSujet(pouvoirs)}
        />

        <BoutonRetirerScene
          mots={mots}
          sujetId={sujet.id}
          estStaff={staff}
          estLAuteur={estLAuteurDeLaScene}
          auteursAutres={ecrivains.size}
        />
      </div>

      <section aria-label="Les posts" className="mt-10 grid gap-5">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            estLAuteur={post.auteurId !== null && post.auteurId === compte.eleveId}
            estStaff={staff}
            // Retirer le dernier post encore là ne troue rien ; retirer un
            // post suivi d'une réponse laisse sa place.
            aDesPostsApres={dernierVisible !== null && post.id !== dernierVisible}
            estDuJeuDeRole={mots.estDuJeuDeRole}
            // Le champ de reprise compte comme la route : le minimum du lieu,
            // jamais une valeur recopiée.
            lignesMinimum={section.regles.lignesMinimum}
          />
        ))}
      </section>

      {/* — Répondre, ou la raison de ne pas pouvoir — */}
      <section aria-label={t.ecrire.repondre} className="mt-12">
        {reponse.peut ? (
          <FormulaireScene
            mots={mots}
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
