import Image from "next/image";
import { ActionsPost } from "@/components/forum/ActionsStaff";
import BoutonRetirerPost from "@/components/forum/BoutonRetirerPost";
import { blasonDe } from "@/lib/ecole/blasons";
import { CLASSE_CONTENEUR } from "@/lib/forum/mise-en-forme";
import { nettoyerHtml } from "@/lib/forum/nettoyer-html";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import type { PostAffiche } from "@/lib/forum/depot";

/**
 * Un post.
 *
 * **Le texte est rendu par React, donc échappé d’office.** Les retours à la
 * ligne sont conservés par `whitespace-pre-wrap`, jamais par une conversion en
 * `<br>` — qui obligerait à assembler du HTML à la main, c’est-à-dire
 * exactement ce qu’on veut éviter. Les liens ne sont pas rendus cliquables.
 * Même règle que dans la Tour.
 *
 * ── Un post masqué (art. 19.3) ──
 *
 * Il est **masqué, pas supprimé**, le temps d’une correction. Trois vues :
 *
 *   son auteur — le texte, le motif, et la date limite. C’est lui qui corrige.
 *   le staff    — le texte et le motif.
 *   les autres  — une ligne qui dit qu’il est masqué, et rien de plus.
 *
 * Montrer le texte aux autres viderait la mesure de son sens ; le cacher à son
 * auteur l’empêcherait de le reprendre.
 *
 * ── Un post retiré par son auteur ──
 *
 * **À ne pas confondre avec le masquage.** Ici le texte n’est lu de personne,
 * pas même de son auteur : il n’arrive pas jusqu’ici, le dépôt ne l’envoie
 * plus. La ligne qui reste n’est là que pour que la suite de la scène se
 * comprenne — un post retiré qui ne gardait pas sa place n’est pas rendu du
 * tout.
 */
export default function Post({
  post,
  estLAuteur,
  estStaff,
  aDesPostsApres = false,
}: {
  post: PostAffiche;
  estLAuteur: boolean;
  estStaff: boolean;
  /** Pour dire à son auteur ce qu’il restera du sien s’il le retire. */
  aDesPostsApres?: boolean;
}) {
  const t = TEXTES_FORUM;
  const peutLireLeTexte = !post.retire && (!post.masque || estLAuteur || estStaff);
  const blason = blasonDe(post.maisonAuteur);

  return (
    <article className="rounded-sm border border-silver/12 bg-mist/40">
      {/* — Qui écrit — */}
      <header className="flex flex-wrap items-center gap-3 border-b border-silver/10 px-5 py-3">
        <Image
          src={blason.src}
          alt={blason.alt}
          width={blason.largeur}
          height={blason.hauteur}
          sizes="24px"
          className="h-7 w-auto shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-[0.7rem] uppercase tracking-[0.12em] text-parchment">
            {/* Nul = le compte a été supprimé. Le post reste lisible : effacer
                un compte n'efface pas ce qu'on a écrit chez autrui. */}
            {post.auteur ?? "—"}
          </p>
          {post.place ? (
            <p className="font-body text-xs italic text-silver">{post.place}</p>
          ) : null}
        </div>
        <time
          dateTime={post.publieLe}
          suppressHydrationWarning
          className="ml-auto font-body text-xs italic text-silver"
        >
          {new Date(post.publieLe).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </header>

      <div className="px-5 py-4">
        {/* Art. 16.3 — l'avertissement se met en TÊTE de post. */}
        {post.avertissementContenu ? (
          <p className="mb-4 inline-block rounded-sm border border-ember/40 bg-ember/10 px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.12em] text-parchment">
            {t.ecrire.avertissement.prefixe} : {post.avertissementContenu}
          </p>
        ) : null}

        {post.masque ? (
          <p className="mb-4 rounded-sm border border-silver/25 bg-void/40 px-4 py-3 font-body text-sm leading-relaxed text-silver">
            {estLAuteur && post.corrigerAvantLe
              ? t.masquage.masquePourMoi.replace(
                  "{date}",
                  new Date(post.corrigerAvantLe).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                )
              : t.masquage.masquePourTous}
            {post.motifMasquage && (estLAuteur || estStaff) ? (
              <span className="mt-2 block italic text-parchment-dim">
                {post.motifMasquage}
              </span>
            ) : null}
          </p>
        ) : null}

        {/* ── Le second nettoyage, et il n'est pas superflu ──

            Le premier a eu lieu à l'enregistrement, dans `validerPost`. Celui-ci
            protège l'écran de tout ce qui aurait pu entrer autrement : une
            reprise de données, une requête forgée contre une version plus
            ancienne, une règle assouplie un jour de fatigue. C'est le seul
            `dangerouslySetInnerHTML` du projet, et il ne reçoit jamais que la
            sortie de `nettoyerHtml`.

            La classe `post-rendu` porte les styles de la mise en forme, et
            **les borne** : hors d'elle, une classe de post ne peint rien. */}
        {post.retire ? (
          <p className="font-body text-sm italic text-silver">
            {t.suppression.post.marque}
          </p>
        ) : null}

        {peutLireLeTexte ? (
          <div
            className={`${CLASSE_CONTENEUR} font-body leading-[1.85] text-parchment-dim`}
            dangerouslySetInnerHTML={{ __html: nettoyerHtml(post.corps) }}
          />
        ) : null}
      </div>

      {/* Les commandes du staff. Le composant est caché aux autres, mais c'est
          la route qui protège — un composant absent n'a jamais gardé une
          adresse. */}
      {estStaff || (estLAuteur && !post.retire) ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-silver/10 px-5 py-3">
          {estStaff ? (
            <ActionsPost postId={post.id} masque={post.masque} />
          ) : null}

          {/* Retirer le sien n'est pas masquer celui d'un autre : ce bouton
              n'appartient qu'à son auteur, et ne regarde aucun pouvoir. */}
          {estLAuteur && !post.retire ? (
            <BoutonRetirerPost
              postId={post.id}
              aDesPostsApres={aDesPostsApres}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
