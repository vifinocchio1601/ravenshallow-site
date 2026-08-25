"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BoutonDeconnexion from "@/components/connexion/BoutonDeconnexion";
import { BLASON_ECOLE, blasonDe, NOMS_MAISON, REPARTITION_A_VENIR } from "@/lib/ecole/blasons";
import { ROUTES, type EntreeMenu } from "@/lib/ecole/menu";
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
  maison,
  entrees,
}: {
  prenomNom: string;
  maison: string | null;
  /**
   * Les entrées que ce compte peut ouvrir, calculées côté serveur par
   * `entreesVisibles`. Le bandeau ne décide de rien : il affiche ce qu’on lui
   * donne, et il peut n’en recevoir qu’une seule.
   */
  entrees: readonly EntreeMenu[];
}) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  const blason = blasonDe(maison);
  const nomMaison = maison ? NOMS_MAISON[maison] : REPARTITION_A_VENIR;

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
                  <LienMenu entree={entree} courante={estCourante(entree)} />
                </li>
              ))}
            </ul>

            {/* — L’élève, et de quoi ressortir — */}
            <div className="hidden shrink-0 items-center gap-4 md:flex">
              <div className="text-right">
                <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink">
                  {prenomNom}
                </p>
                <p className="font-body text-[0.78rem] italic leading-tight text-ink/60">
                  {nomMaison}
                </p>
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
                    <p className="font-body text-[0.78rem] italic leading-tight text-ink/60">
                      {nomMaison}
                    </p>
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
  bloc = false,
  onClick,
}: {
  entree: EntreeMenu;
  courante: boolean;
  bloc?: boolean;
  onClick?: () => void;
}) {
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
      <span
        className={
          courante
            ? "border-b border-ink/70 pb-0.5"
            : "border-b border-transparent pb-0.5"
        }
      >
        {entree.libelle}
      </span>
    </Link>
  );
}
