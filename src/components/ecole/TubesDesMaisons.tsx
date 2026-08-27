import Image from "next/image";
import type { CSSProperties } from "react";
import reglages from "@/config/bureau.json";
import type { Maison } from "@/lib/dossier/etats";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import type { LigneDeClassement } from "@/lib/ecole/tournoi";
import { detailDUneMaison, moyenneAffichee } from "@/lib/points/affichage";
import { TEXTES_POINTS } from "@/lib/points/constantes";

/**
 * **Les quatre tubes du tournoi.**
 *
 * Quatre éprouvettes photographiées, dont on remplit l’intérieur. Le gabarit
 * vient de la maquette du joueur ; l’image est fournie déjà traitée et ne se
 * retouche pas.
 *
 * ── Un composant SERVEUR, et c’est un choix ──
 *
 * Le remplissage est une animation CSS qui part de zéro : aucune ligne de
 * JavaScript n’est nécessaire, donc rien à hydrater, rien à charger, et la
 * page s’affiche remplie même si le script n’arrive jamais. La maquette
 * fabriquait ses tubes en JavaScript ; ici les nombres viennent du serveur,
 * déjà calculés — le client ne reçoit ni la règle du classement, ni le
 * plancher, ni de quoi les recalculer.
 *
 * ── Ce qui se lit, et ce qui se regarde ──
 *
 * L’eau, les bulles et les reflets sont **décoratifs** : masqués aux lecteurs
 * d’écran. Tout ce qu’un tube raconte — la maison, sa moyenne, ses points,
 * son effectif — est écrit en toutes lettres au-dessous. Un tube n’est jamais
 * la seule façon de connaître un chiffre.
 */

/** La hauteur intérieure du verre, en points de pourcentage de l’image. */
const HAUTEUR_INTERIEURE = 78.44 - 14.34;

/**
 * Six bulles, écrites à la main plutôt que tirées au sort.
 *
 * Le tirage de la maquette redonnait des bulles différentes à chaque rendu :
 * sans conséquence à l’écran, mais un composant serveur qui change de sortie
 * sans raison est une mauvaise habitude — on finit par ne plus savoir si une
 * différence vient de là ou d’ailleurs. Les valeurs sont décalées d’une
 * maison à l’autre par leur retard, pour qu’aucune colonne ne batte en mesure
 * avec sa voisine.
 */
const BULLES = [
  { gauche: 18, taille: 3.4, monte: 62, duree: 5.5 },
  { gauche: 46, taille: 2.6, monte: 108, duree: 7.5 },
  { gauche: 71, taille: 4.2, monte: 84, duree: 4.6 },
  { gauche: 33, taille: 2.9, monte: 131, duree: 8.2 },
  { gauche: 60, taille: 3.7, monte: 71, duree: 6.3 },
  { gauche: 12, taille: 2.5, monte: 96, duree: 5.1 },
] as const;

export default function TubesDesMaisons({
  lignes,
  maMaison,
}: {
  lignes: readonly LigneDeClassement[];
  /** La maison du lecteur, ou `null` — professeur, ou élève pas encore réparti. */
  maMaison: Maison | null;
}) {
  const t = TEXTES_POINTS.tournoi;
  const rienMarque = lignes.every((l) => l.pointsAuTournoi === 0);

  return (
    <div>
      {/* `items-start` et non `items-end` : les quatre colonnes n'ont pas la
          même hauteur — celle du lecteur porte une ligne de plus —, et
          aligner par le bas faisait flotter son tube au-dessus des autres.
          Quatre éprouvettes posées sur une étagère reposent sur la même
          planche ; c'est par le HAUT qu'elles s'alignent ici, le bloc du
          blason et du nom ayant partout la même hauteur. */}
      {/* **Le groupe remplit sa colonne**, et c'est le plafond de largeur d'un
          tube — et lui seul — qui décide de sa taille.

          Il a d'abord été borné à quatre fois quatre-vingts pixels, pour le
          resserrer dans un panneau qui prenait alors toute la page. Depuis
          qu'il vit dans une colonne de 58 %, ce plafond-là le laissait à trois
          cent cinquante dans cinq cent soixante utiles : deux cents pixels de
          vide à sa gauche, et des tubes qui paraissaient perdus. La grille
          répartit maintenant la place, et chaque tube s'arrête à son plafond. */}
      <ul
        className="grid grid-cols-4 items-start"
        style={{ gap: `${reglages.tubeEcart}px` } as CSSProperties}
      >
        {lignes.map((ligne, rang) => {
          const blason = blasonDe(ligne.maison);
          const mienne = ligne.maison === maMaison;

          return (
            <li key={ligne.maison} className="min-w-0 text-center">
              <Image
                src={blason.src}
                alt={blason.alt}
                width={blason.largeur}
                height={blason.hauteur}
                // Sans `sizes`, `next/image` réclame la pleine largeur pour un
                // écu de cinquante pixels. Le trou déjà bouché ailleurs.
                sizes="50px"
                // Une HAUTEUR fixe, et la largeur qui suit : les quatre écus
                // n'ont pas le même rapport — 608, 615, 625 et 641 pixels de
                // large pour 900 de haut —, et une largeur commune les
                // rendrait de hauteurs différentes. Les tubes en dessous ne
                // partiraient plus du même trait.
                className="mx-auto mb-2 h-[40px] w-auto drop-shadow-[0_5px_12px_rgba(0,0,0,0.85)] sm:h-[52px]"
              />

              {/* `mb-3` et non `mb-2` : le liseré de « ma maison » est posé à huit
                  pixels du tube, et venait toucher le nom sur téléphone. */}
              <p className="mb-3 font-display text-[0.62rem] uppercase leading-tight tracking-[0.12em] text-parchment sm:text-[0.68rem]">
                {NOMS_MAISON[ligne.maison] ?? ligne.maison}
              </p>

              {/* Le verre et son contenu : purement visuel. Tout ce qu'il dit
                  est écrit juste dessous. */}
              <div
                aria-hidden="true"
                className={`tube${mienne ? " tube--mienne" : ""}`}
                style={
                  {
                    "--tube-largeur": `${reglages.tubeLargeurMax}px`,
                    "--tube-h": `${(ligne.part * HAUTEUR_INTERIEURE).toFixed(2)}%`,
                    "--eau-1": `var(--eau-${ligne.maison.toLowerCase()}-1)`,
                    "--eau-2": `var(--eau-${ligne.maison.toLowerCase()}-2)`,
                    // Les quatre colonnes ne montent pas d'un même bloc.
                    // Posé sur le tube, appliqué par les enfants : une
                    // `animation-delay` ne s'hérite pas.
                    "--tube-retard": `${rang * 0.12}s`,
                  } as CSSProperties
                }
              >
                <div className="tube__eau" />
                <div className="tube__bulles">
                  {BULLES.map((bulle, i) => (
                    <i
                      key={i}
                      style={
                        {
                          left: `${bulle.gauche}%`,
                          width: `${bulle.taille}px`,
                          height: `${bulle.taille}px`,
                          "--bulle-h": `${bulle.monte}px`,
                          animationDuration: `${bulle.duree}s`,
                          animationDelay: `-${i * 1.3 + rang * 0.7}s`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
                <Image
                  src="/bureau/tube.webp"
                  alt=""
                  width={512}
                  height={1716}
                  sizes="86px"
                  className="tube__verre"
                />
                <div className="tube__reflet" />
              </div>

              {/* La moyenne en gros : c'est elle qui classe.

                  ⚠️ **Arrondie à l'entier, alors que le calcul garde sa
                  précision.** C'est la valeur exacte qui décide de la hauteur
                  du tube et du rang ; seul ce chiffre-ci est arrondi. Deux
                  maisons peuvent donc montrer le même nombre avec des tubes
                  légèrement différents — c'est normal, et préférable à un faux
                  ex æquo qu'un arrondi aurait fabriqué. */}
              <p className="mt-3 font-display text-[1.05rem] leading-tight text-parchment sm:text-[1.2rem]">
                {moyenneAffichee(ligne.moyenne)}
                <span className="mt-0.5 block font-body text-[0.6rem] uppercase tracking-[0.1em] text-silver">
                  {t.moyenneLegende}
                </span>
              </p>

              {/* Puis le total et l'effectif, en petit — sans eux, on voit la
                  maison qui a le plus de points porter le plus petit tube et
                  l'on croit à un défaut. */}
              <p className="mt-1 font-body text-[0.66rem] italic leading-snug text-silver">
                {detailDUneMaison(ligne.pointsAuTournoi, ligne.effectif)}
              </p>

              {/* Le liseré ne parle qu'aux yeux. Le mot se lit aussi. */}
              {mienne ? (
                <p className="mt-1 font-display text-[0.56rem] uppercase tracking-[0.12em] text-ember">
                  {t.maMaison}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 border-t border-silver/10 pt-4 font-body text-sm italic leading-relaxed text-silver">
        {rienMarque ? t.vide : t.explication}
      </p>
    </div>
  );
}
