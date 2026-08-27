import Image from "next/image";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import type { Maison } from "@/lib/dossier/etats";

/**
 * **La carte de celui qui écrit**, à gauche de son post.
 *
 * Elle porte cinq choses, et l’ordre n’est pas décoratif : le portrait dit
 * *qui parle*, le nom dit *lequel*, le blason et la maison rendent une scène à
 * quatre lisible d’un coup d’œil, l’année ou le titre dit *ce qu’il est au
 * château*, les points ce qu’il rapporte. C’est le gabarit des forums de jeu
 * de rôle, et il tient parce que l’œil retrouve toujours la même information
 * au même endroit.
 *
 * ── Les points ──
 *
 * Nuls quand ce compte ne marque pour personne — une directrice, un élève que
 * le Miroir attend : « 0 point » sous le titre d’une directrice serait un
 * chiffre sans objet. **La question se tranche dans le dépôt**, qui appelle
 * `maisonQuiCompte` ; ici on affiche ce qu’on reçoit, sans le rejuger.
 *
 * ⚠️ Rien ne les incrémente encore. La colonne a été posée avant le lot qui
 * l’écrira — décision du joueur, 27 août 2026 —, et tout le monde est donc à
 * zéro. Ce n’est pas un défaut d’affichage.
 *
 * ── Le portrait ──
 *
 * Un `<img>` ordinaire, et **non `next/image`** : l’optimiseur va chercher la
 * source **depuis le serveur, sans les cookies du lecteur**, et se ferait
 * refuser par `/api/portraits/[id]`, qui exige une session. Le portrait est
 * déjà recadré en 9:16 (art. 6.2) et servi avec un cache d’un an — il n’a rien
 * à gagner à repasser par l’optimiseur. **Ne pas le « corriger ».**
 *
 * Le cadre porte le rapport 9:16 même quand l’image manque : sans lui, la
 * carte d’un compte effacé serait plus courte que les autres, et la colonne
 * se déformerait d’un post à l’autre.
 *
 * ── La maison ──
 *
 * `maison` arrive du dépôt déjà tranchée : elle n’est renseignée que si elle
 * s’affiche (`FAIT`). Nul recouvre donc deux situations opposées — un élève
 * que le Miroir attend, et une directrice qu’il ne concerne pas — et c’est
 * pourquoi on n’écrit **ni « Répartition à venir », qui mentirait sur la
 * seconde, ni le nom d’une maison** : on montre le blason de l’école et son
 * nom, qui sont vrais dans les deux cas.
 *
 * Le nom est écrit **à côté** du blason : une maison signalée par la seule
 * couleur d’un écu de quatorze pixels ne se lit ni de loin, ni sans les yeux.
 * D’où l’`alt` vide sur l’image — le texte dit déjà tout, et le faire annoncer
 * deux fois n’ajoute rien.
 */
export default function CarteAuteur({
  auteur,
  maison,
  avatar,
  place,
  points,
}: {
  /** Nul = le compte a été supprimé. Le post, lui, reste. */
  auteur: string | null;
  maison: Maison | null;
  avatar: string | null;
  /** L’année, ou le rôle particulier qui la remplace. */
  place: string;
  /** Nul = ce compte ne marque pour personne. Voir plus haut. */
  points: number | null;
}) {
  const t = TEXTES_FORUM.auteur;
  const blason = blasonDe(maison);
  const nomMaison = (maison && NOMS_MAISON[maison]) || t.ecole;
  // Zéro est au singulier en français : « 0 point », « 1 point », « 2 points ».
  const libellePoints =
    points === null
      ? null
      : (points > 1 ? t.desPoints : t.unPoint).replace("{n}", String(points));

  return (
    <div className="flex shrink-0 flex-row items-center gap-4 border-b border-silver/10 bg-void/25 px-5 py-4 sm:w-48 sm:flex-col sm:items-stretch sm:gap-3 sm:border-b-0 sm:border-r sm:px-4 sm:py-5">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[9/16] w-16 shrink-0 rounded-sm border border-silver/25 object-cover object-top sm:w-full"
        />
      ) : (
        <div className="grid aspect-[9/16] w-16 shrink-0 place-items-center rounded-sm border border-silver/15 bg-mist/50 sm:w-full">
          <Image
            src={blason.src}
            alt=""
            width={blason.largeur}
            height={blason.hauteur}
            sizes="(min-width: 640px) 88px, 32px"
            className="h-auto w-1/2 opacity-60"
          />
        </div>
      )}

      <div className="min-w-0 sm:text-center">
        {/* **Le nom ne se coupe jamais.** Il passe à la ligne : « SIGRID
            HAVNS… » ne dit pas qui parle, et c'est la seule chose que cette
            carte doit dire à coup sûr. Deux lignes coûtent quatorze pixels ;
            un nom tronqué coûte l'information. */}
        <p className="break-words font-display text-[0.72rem] uppercase leading-[1.35] tracking-[0.12em] text-parchment">
          {auteur ?? "—"}
        </p>

        <p className="mt-1.5 flex items-baseline gap-1.5 sm:justify-center">
          <Image
            src={blason.src}
            alt=""
            width={blason.largeur}
            height={blason.hauteur}
            sizes="14px"
            className="h-3.5 w-auto shrink-0"
          />
          <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-parchment-2">
            {nomMaison}
          </span>
        </p>

        {place ? (
          <p className="mt-1 font-body text-xs italic leading-snug text-silver">
            {place}
          </p>
        ) : null}

        {libellePoints ? (
          <p className="mt-1 font-display text-[0.6rem] uppercase tracking-[0.12em] text-parchment-dim/80">
            {libellePoints}
          </p>
        ) : null}
      </div>
    </div>
  );
}
