"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BoutonDeconnexion from "@/components/connexion/BoutonDeconnexion";
import { useNonLus } from "@/components/corbeaux/useNonLus";
import { BLASON_ECOLE } from "@/lib/ecole/blasons";
import { ROUTES, type EntreeMenu } from "@/lib/ecole/menu";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";

/**
 * Le bandeau de l’école, mis en scène comme un parchemin déroulé.
 *
 * Le parchemin est un décor : dessous, c’est une vraie `<nav>`, des liens
 * réels, un focus visible et un ordre de tabulation naturel. Rien n’est
 * dessiné sur une image, rien ne dépend de la souris.
 *
 * Sur téléphone, le parchemin se replie en un rouleau qu’on ouvre au tap. Le
 * déroulé est une transition de `grid-template-rows`, la seule façon d’animer
 * une hauteur inconnue — et `prefers-reduced-motion`, traité globalement dans
 * `globals.css`, la ramène à l’instantané.
 */
export default function MenuParchemin({
  prenomNom,
  blason,
  mention,
  entrees,
  compteurs,
}: {
  prenomNom: string;
  /**
   * Le blason à porter, déjà choisi côté serveur : celui de la maison si elle
   * s’affiche, celui de l’école sinon.
   */
  blason: { src: string; largeur: number; hauteur: number; alt: string };
  /**
   * Ce qui s’écrit sous le nom : la maison, « Répartition à venir », ou
   * **rien** — pour un compte que la répartition ne concerne pas.
   */
  mention: string | null;
  /**
   * Les entrées que ce compte peut ouvrir, calculées côté serveur par
   * `entreesVisibles`. Le bandeau ne décide de rien : il affiche ce qu’on lui
   * donne, et il peut n’en recevoir qu’une seule.
   */
  entrees: readonly EntreeMenu[];
  /**
   * Ce qu’il y a à annoncer sur une entrée, indexé par son adresse — les
   * corbeaux non lus, aujourd’hui. Le bandeau ne connaît aucune adresse en
   * particulier : il affiche le compte qu’on lui remet, et rien si on ne lui
   * en remet pas.
   */
  compteurs: Readonly<Record<string, number>>;
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  /**
   * Le compteur se tient à jour tout seul.
   *
   * Un layout d’App Router n’est pas rendu à nouveau quand on navigue entre
   * deux pages du même segment — c’est ce qui le rend rapide, et c’est aussi
   * ce qui figeait la pastille sur la valeur du premier chargement : on lisait
   * ses corbeaux, elle restait là. Elle vit donc par elle-même désormais, et
   * s’éteint à l’instant où l’on lit.
   */
  const nonLus = useNonLus(compteurs[ROUTES.corbeaux] ?? 0);
  const compteursVivants: Readonly<Record<string, number>> = {
    ...compteurs,
    [ROUTES.corbeaux]: nonLus,
  };

  const estCourante = (entree: EntreeMenu) =>
    chemin === entree.href || chemin.startsWith(`${entree.href}/`);

  return (
    <nav aria-label={TEXTES_ECOLE.menu.aria} className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative mx-auto max-w-content">
        {/* Les rouleaux de bois, aux deux bouts. Décor pur. */}
        <span
          aria-hidden="true"
          className="parchemin__rouleau absolute -left-1 top-1 bottom-1 w-3 rounded-sm sm:-left-2 sm:w-4"
        />
        <span
          aria-hidden="true"
          className="parchemin__rouleau absolute -right-1 top-1 bottom-1 w-3 rounded-sm sm:-right-2 sm:w-4"
        />

        <div className="parchemin relative mx-1 rounded-[2px] px-4 py-3 sm:mx-2 sm:px-7 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* — Le sceau de l’école — */}
            <Link
              href={ROUTES.bureau}
              className="flex shrink-0 items-center gap-3 rounded-sm"
            >
              <Image
                src={BLASON_ECOLE.src}
                alt={BLASON_ECOLE.alt}
                width={BLASON_ECOLE.largeur}
                height={BLASON_ECOLE.hauteur}
                className="h-9 w-auto sm:h-11"
              />
              <span className="hidden font-display text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-ink lg:inline">
                Ravenshallow
              </span>
            </Link>

            {/* — Les entrées, sur écran large — */}
            <ul className="hidden items-center gap-8 md:flex">
              {entrees.map((entree) => (
                <li key={entree.href}>
                  <LienMenu
                    entree={entree}
                    courante={estCourante(entree)}
                    compte={compteursVivants[entree.href] ?? 0}
                  />
                </li>
              ))}
            </ul>

            {/* — L’élève, et de quoi ressortir — */}
            <div className="hidden shrink-0 items-center gap-4 md:flex">
              <div className="text-right">
                <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink">
                  {prenomNom}
                </p>
                {mention ? (
                  <p className="font-body text-[0.78rem] italic leading-tight text-ink/60">
                    {mention}
                  </p>
                ) : null}
              </div>
              <Image
                src={blason.src}
                alt={blason.alt}
                width={blason.largeur}
                height={blason.hauteur}
                className="h-9 w-auto sm:h-11"
              />
              <BoutonDeconnexion className="rounded-sm border border-ink/25 px-3 py-2 font-display text-[0.6rem] uppercase tracking-[0.12em] text-ink/80 transition-colors duration-300 hover:border-ink/60 hover:text-ink disabled:opacity-50" />
            </div>

            {/* — Le rouleau, sur téléphone — */}
            <button
              type="button"
              onClick={() => setOuvert((o) => !o)}
              aria-expanded={ouvert}
              aria-controls="parchemin-deroule"
              className="flex items-center gap-2 rounded-sm border border-ink/25 px-3 py-2 font-display text-[0.62rem] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink/60 md:hidden"
            >
              <span aria-hidden="true" className="flex flex-col gap-[3px]">
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
              </span>
              {ouvert ? TEXTES_ECOLE.menu.replier : TEXTES_ECOLE.menu.derouler}
            </button>
          </div>

          {/* — Le déroulé — */}
          <div
            id="parchemin-deroule"
            data-ouvert={ouvert}
            className="parchemin__deroule md:hidden"
          >
            <div>
              <ul className="mt-4 flex flex-col gap-1 border-t border-ink/15 pt-4">
                {entrees.map((entree) => (
                  <li key={entree.href}>
                    <LienMenu
                      entree={entree}
                      courante={estCourante(entree)}
                      compte={compteursVivants[entree.href] ?? 0}
                      bloc
                      onClick={() => setOuvert(false)}
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/15 pt-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={blason.src}
                    alt={blason.alt}
                    width={blason.largeur}
                    height={blason.hauteur}
                    className="h-8 w-auto"
                  />
                  <div>
                    <p className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink">
                      {prenomNom}
                    </p>
                    {mention ? (
                      <p className="font-body text-[0.78rem] italic leading-tight text-ink/60">
                        {mention}
                      </p>
                    ) : null}
                  </div>
                </div>
                <BoutonDeconnexion className="rounded-sm border border-ink/25 px-3 py-2 font-display text-[0.6rem] uppercase tracking-[0.12em] text-ink/80 transition-colors duration-300 hover:border-ink/60 disabled:opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * L’entrée courante ne se signale pas par la seule couleur : elle porte
 * `aria-current`, une graisse plus forte, un trait sous le mot et un losange
 * en tête. Un daltonien la voit, un lecteur d’écran l’annonce.
 */
function LienMenu({
  entree,
  courante,
  compte,
  bloc = false,
  onClick,
}: {
  entree: EntreeMenu;
  courante: boolean;
  /** Les non-lus à annoncer. Zéro = pas de pastille du tout. */
  compte: number;
  bloc?: boolean;
  onClick?: () => void;
}) {
  const aCompter = entree.porteUnCompteur === true && compte > 0;
  return (
    <Link
      href={entree.href}
      onClick={onClick}
      aria-current={courante ? "page" : undefined}
      className={`group relative flex items-center gap-2 font-display text-[0.72rem] uppercase tracking-[0.16em] transition-colors duration-300 ${
        bloc ? "rounded-sm px-1 py-2" : ""
      } ${
        courante
          ? "font-bold text-ink"
          : "font-medium text-ink/60 hover:text-ink"
      }`}
    >
      <span
        aria-hidden="true"
        className={`text-[0.5rem] transition-opacity duration-300 ${
          courante ? "opacity-100" : "opacity-0"
        }`}
      >
        ◆
      </span>
      {/* `text-center` : les entrées du bandeau tiennent sur deux lignes —
          « MON / BUREAU », « LES / CORBEAUX » —, et les deux mots doivent
          s’aligner l’un sous l’autre plutôt que de se caler à gauche.
          Le déroulé de téléphone, lui, est une liste verticale : le texte y
          reste au fer à gauche, comme n’importe quelle liste de liens. */}
      <span
        className={`pb-0.5 ${bloc ? "text-left" : "text-center"} ${
          courante ? "border-b border-ink/70" : "border-b border-transparent"
        }`}
      >
        {entree.libelle}
      </span>

      {/* La pastille des non-lus.
          Elle ne se signale pas par la seule couleur : le nombre est écrit
          dedans, et un lecteur d’écran lit « Les Corbeaux, 3 non lus » grâce
          au texte hors écran — la pastille elle-même est décorative, sans
          quoi le chiffre serait annoncé deux fois.
          Au-delà de neuf, « 9+ » : la pastille reste ronde, et le compte
          exact n’apprend plus rien à ce stade. */}
      {aCompter ? (
        <>
          <span
            aria-hidden="true"
            className="ml-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full border border-ink/40 bg-ink px-1.5 py-0.5 font-display text-[0.58rem] font-bold leading-none tracking-normal text-parchment"
          >
            {compte > 9 ? "9+" : compte}
          </span>
          <span className="sr-only">
            {compte === 1
              ? TEXTES_CORBEAUX.liste.unNonLuAria
              : TEXTES_CORBEAUX.liste.nonLusAria.replace("{n}", String(compte))}
          </span>
        </>
      ) : null}
    </Link>
  );
}
