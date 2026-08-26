"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import BoutonDeconnexion from "@/components/connexion/BoutonDeconnexion";
import { useNonLus } from "@/components/corbeaux/useNonLus";
import { BLASON_ECOLE } from "@/lib/ecole/blasons";
import {
  ROUTES,
  compteDe,
  estUnGroupe,
  type EntreeMenu,
  type GroupeMenu,
  type LienMenu,
} from "@/lib/ecole/menu";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";

/**
 * Le bandeau de l’école, mis en scène comme un parchemin déroulé.
 *
 * Le parchemin est un décor : dessous, c’est une vraie `<nav>`, des liens
 * réels, un focus visible et un ordre de tabulation naturel. Rien n’est
 * dessiné sur une image, rien ne dépend de la souris.
 *
 * ── Les groupes ──
 *
 * Trois entrées sur cinq ouvrent un sous-menu, et **le survol n’est jamais la
 * seule façon de l’ouvrir** : chaque groupe est un `<button aria-expanded>`
 * qu’on actionne à la souris, au clavier ou au doigt. Le survol s’ajoute
 * par-dessus, comme une commodité.
 *
 * Sur téléphone, le parchemin se replie en un rouleau, et les groupes y
 * deviennent des accordéons — pas des menus flottants, qui n’ont aucun sens
 * sans souris. Le déroulé est une transition de `grid-template-rows`, la seule
 * façon d’animer une hauteur inconnue — et `prefers-reduced-motion`, traité
 * globalement dans `globals.css`, la ramène à l’instantané.
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
   * L’arbre du menu, déjà taillé côté serveur par `menuVisible` : ce compte
   * peut ouvrir tout ce qu’il y trouve. Le bandeau ne décide de rien, et un
   * groupe vide ne lui parvient jamais.
   */
  entrees: readonly EntreeMenu[];
  /**
   * Ce qu’il y a à annoncer sur une adresse — les corbeaux non lus,
   * aujourd’hui. Le bandeau ne connaît aucune adresse en particulier : il
   * affiche le compte qu’on lui remet, et rien si on ne lui en remet pas.
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

  const estLienCourant = (lien: LienMenu) =>
    chemin === lien.href || chemin.startsWith(`${lien.href}/`);

  const estCourante = (entree: EntreeMenu) =>
    estUnGroupe(entree)
      ? entree.liens.some(estLienCourant)
      : estLienCourant(entree);

  /**
   * **Le compte d’un groupe est la somme de celui de ses feuilles**, et cette
   * règle vit dans `ecole/menu.ts` — pas ici. Sans la remontée, on raterait
   * ses corbeaux derrière un sous-menu fermé, et une règle enfouie dans un
   * composant ne se teste pas.
   */
  const compte = (entree: EntreeMenu) => compteDe(entree, compteursVivants);

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
                sizes="32px"
                className="h-9 w-auto sm:h-11"
              />
              <span className="hidden font-display text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-ink 2xl:inline">
                Ravenshallow
              </span>
            </Link>

            {/* — Les entrées, sur écran large — */}
            <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
              {entrees.map((entree) => (
                <li key={cleDe(entree)}>
                  {estUnGroupe(entree) ? (
                    <GroupeDeroulant
                      groupe={entree}
                      courante={estCourante(entree)}
                      compte={compte(entree)}
                      compteurs={compteursVivants}
                      estLienCourant={estLienCourant}
                    />
                  ) : (
                    <LienMenuAffiche
                      lien={entree}
                      courante={estCourante(entree)}
                      compte={compte(entree)}
                    />
                  )}
                </li>
              ))}
            </ul>

            {/* — L’élève, et de quoi ressortir — */}
            <div className="hidden shrink-0 items-center gap-4 lg:flex">
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
                sizes="32px"
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
              className="flex items-center gap-2 rounded-sm border border-ink/25 px-3 py-2 font-display text-[0.62rem] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink/60 lg:hidden"
            >
              <span aria-hidden="true" className="flex flex-col gap-[3px]">
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
                <span className="block h-px w-4 bg-ink" />
              </span>
              {/* La pastille suit jusque sur le rouleau replié : sinon, un
                  corbeau reçu sur téléphone ne se voit nulle part. */}
              {ouvert ? TEXTES_ECOLE.menu.replier : TEXTES_ECOLE.menu.derouler}
              <Pastille compte={entrees.reduce((n, e) => n + compte(e), 0)} />
            </button>
          </div>

          {/* — Le déroulé — */}
          <div
            id="parchemin-deroule"
            data-ouvert={ouvert}
            className="parchemin__deroule lg:hidden"
          >
            <div>
              <ul className="mt-4 flex flex-col gap-1 border-t border-ink/15 pt-4">
                {entrees.map((entree) => (
                  <li key={cleDe(entree)}>
                    {estUnGroupe(entree) ? (
                      <GroupeAccordeon
                        groupe={entree}
                        contientLaPageCourante={estCourante(entree)}
                        compte={compte(entree)}
                        compteurs={compteursVivants}
                        estLienCourant={estLienCourant}
                        onNavigation={() => setOuvert(false)}
                      />
                    ) : (
                      <LienMenuAffiche
                        lien={entree}
                        courante={estCourante(entree)}
                        compte={compte(entree)}
                        bloc
                        onClick={() => setOuvert(false)}
                      />
                    )}
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
                    sizes="24px"
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

/** Un groupe n’a pas d’adresse : son libellé lui sert de clé. */
function cleDe(entree: EntreeMenu): string {
  return estUnGroupe(entree) ? entree.libelle : entree.href;
}

// ─────────────────────────────────────────────────────────────
//  Le groupe, sur écran large — un menu déroulant
// ─────────────────────────────────────────────────────────────

/**
 * **Le survol ouvre, mais il n’est jamais le seul à ouvrir.**
 *
 * Le bouton porte `aria-expanded` et réagit à Entrée comme à Espace ; le
 * groupe se referme sur Échap — en rendant le focus au bouton, sans quoi on le
 * perdrait au début de la page — et dès que le focus quitte le groupe. C’est
 * ce dernier point qui fait tenir la navigation au clavier : on entre dans le
 * sous-menu par Tab, on en sort par Tab, et il se ferme tout seul.
 */
function GroupeDeroulant({
  groupe,
  courante,
  compte,
  compteurs,
  estLienCourant,
}: {
  groupe: GroupeMenu;
  courante: boolean;
  compte: number;
  compteurs: Readonly<Record<string, number>>;
  estLienCourant: (lien: LienMenu) => boolean;
}) {
  const [deplie, setDeplie] = useState(false);
  const identifiant = useId();
  const bouton = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="relative"
      onMouseEnter={() => setDeplie(true)}
      onMouseLeave={() => setDeplie(false)}
      // Le focus quitte le groupe : on referme. `relatedTarget` est la cible
      // qui reçoit le focus — nulle quand on quitte la fenêtre, auquel cas on
      // ferme aussi, ce qui est le comportement attendu.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDeplie(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && deplie) {
          setDeplie(false);
          bouton.current?.focus();
        }
      }}
    >
      <button
        ref={bouton}
        type="button"
        aria-expanded={deplie}
        aria-controls={identifiant}
        onClick={() => setDeplie((d) => !d)}
        className={`group flex items-center gap-2 font-display text-[0.72rem] uppercase tracking-[0.16em] transition-colors duration-300 ${
          courante ? "font-bold text-ink" : "font-medium text-ink/60 hover:text-ink"
        }`}
      >
        <Losange visible={courante} />
        <span
          className={`pb-0.5 text-center ${
            courante ? "border-b border-ink/70" : "border-b border-transparent"
          }`}
        >
          {groupe.libelle}
        </span>
        <Pastille compte={compte} />
        {/* Le chevron dit qu’il y a quelque chose dessous, et dans quel sens
            ça s’ouvre. Décoratif : `aria-expanded` porte déjà l’information. */}
        <span
          aria-hidden="true"
          className={`text-[0.5rem] leading-none transition-transform duration-300 ${
            deplie ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {/* Rendu en permanence, masqué quand il est replié : `hidden` retire les
          liens de l’ordre de tabulation sans avoir à gérer un `tabIndex`. */}
      <ul
        id={identifiant}
        hidden={!deplie}
        aria-label={TEXTES_ECOLE.menu.sousMenuAria.replace(
          "{groupe}",
          groupe.libelle,
        )}
        // Même précaution que l'accordéon : la classe dit ce que l'attribut
        // dit, pour qu'aucun utilitaire de `display` ne puisse les désaccorder.
        className={`parchemin absolute left-1/2 top-full z-20 mt-3 min-w-[12rem] -translate-x-1/2 rounded-[2px] border border-ink/20 px-2 py-2 shadow-lg ${
          deplie ? "block" : "hidden"
        }`}
      >
        {groupe.liens.map((lien) => (
          <li key={lien.href}>
            <LienMenuAffiche
              lien={lien}
              courante={estLienCourant(lien)}
              compte={lien.porteUnCompteur ? (compteurs[lien.href] ?? 0) : 0}
              bloc
              onClick={() => setDeplie(false)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Le groupe, sur téléphone — un accordéon
// ─────────────────────────────────────────────────────────────

/**
 * Pas de menu flottant sur téléphone : il n’y a pas de survol, et un panneau
 * qui recouvre le reste sur un écran de six centimètres se referme mal.
 *
 * Le groupe qui contient la page courante s’ouvre de lui-même : on vient d’y
 * naviguer, on veut voir où l’on est.
 */
function GroupeAccordeon({
  groupe,
  contientLaPageCourante,
  compte,
  compteurs,
  estLienCourant,
  onNavigation,
}: {
  groupe: GroupeMenu;
  contientLaPageCourante: boolean;
  compte: number;
  compteurs: Readonly<Record<string, number>>;
  estLienCourant: (lien: LienMenu) => boolean;
  onNavigation: () => void;
}) {
  const [deplie, setDeplie] = useState(contientLaPageCourante);
  const identifiant = useId();

  // La navigation change le groupe courant : on suit, sans écraser un
  // dépliement fait à la main sur le groupe qu’on regarde déjà.
  useEffect(() => {
    if (contientLaPageCourante) setDeplie(true);
  }, [contientLaPageCourante]);

  return (
    <>
      <button
        type="button"
        aria-expanded={deplie}
        aria-controls={identifiant}
        onClick={() => setDeplie((d) => !d)}
        className={`flex w-full items-center gap-2 rounded-sm px-1 py-2 text-left font-display text-[0.72rem] uppercase tracking-[0.16em] transition-colors duration-300 ${
          contientLaPageCourante
            ? "font-bold text-ink"
            : "font-medium text-ink/60"
        }`}
      >
        <Losange visible={contientLaPageCourante} />
        <span
          className={`pb-0.5 text-left ${
            contientLaPageCourante
              ? "border-b border-ink/70"
              : "border-b border-transparent"
          }`}
        >
          {groupe.libelle}
        </span>
        <Pastille compte={compte} />
        <span
          aria-hidden="true"
          className={`ml-auto text-[0.5rem] leading-none transition-transform duration-300 ${
            deplie ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <ul
        id={identifiant}
        hidden={!deplie}
        aria-label={TEXTES_ECOLE.menu.sousMenuAria.replace(
          "{groupe}",
          groupe.libelle,
        )}
        // `hidden` seul ne suffit pas : une classe utilitaire qui pose un
        // `display` — ici `flex` — l'écrase en silence, et le sous-menu reste
        // ouvert en permanence. La classe doit donc porter la même décision
        // que l'attribut.
        className={`mb-1 ml-4 flex-col gap-0.5 border-l border-ink/15 pl-3 ${
          deplie ? "flex" : "hidden"
        }`}
      >
        {groupe.liens.map((lien) => (
          <li key={lien.href}>
            <LienMenuAffiche
              lien={lien}
              courante={estLienCourant(lien)}
              compte={lien.porteUnCompteur ? (compteurs[lien.href] ?? 0) : 0}
              bloc
              onClick={onNavigation}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Les pièces communes
// ─────────────────────────────────────────────────────────────

/**
 * L’entrée courante ne se signale pas par la seule couleur : elle porte
 * `aria-current`, une graisse plus forte, un trait sous le mot et un losange
 * en tête. Un daltonien la voit, un lecteur d’écran l’annonce.
 */
function LienMenuAffiche({
  lien,
  courante,
  compte,
  bloc = false,
  onClick,
}: {
  lien: LienMenu;
  courante: boolean;
  /** Les non-lus à annoncer. Zéro = pas de pastille du tout. */
  compte: number;
  bloc?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={lien.href}
      onClick={onClick}
      aria-current={courante ? "page" : undefined}
      className={`group relative flex items-center gap-2 font-display text-[0.72rem] uppercase tracking-[0.16em] transition-colors duration-300 ${
        bloc ? "rounded-sm px-1 py-2" : ""
      } ${
        courante ? "font-bold text-ink" : "font-medium text-ink/60 hover:text-ink"
      }`}
    >
      <Losange visible={courante} />
      {/* `text-center` : les entrées du bandeau tiennent sur deux lignes —
          « MON / BUREAU », « LES / CORBEAUX » —, et les deux mots doivent
          s’aligner l’un sous l’autre plutôt que de se caler à gauche.
          Les listes déroulées, elles, restent au fer à gauche. */}
      <span
        className={`pb-0.5 ${bloc ? "text-left" : "text-center"} ${
          courante ? "border-b border-ink/70" : "border-b border-transparent"
        }`}
      >
        {lien.libelle}
      </span>
      <Pastille compte={compte} />
    </Link>
  );
}

function Losange({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`text-[0.5rem] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      ◆
    </span>
  );
}

/**
 * La pastille des non-lus.
 *
 * Elle ne se signale pas par la seule couleur : le nombre est écrit dedans, et
 * un lecteur d’écran lit « Les Corbeaux, 3 non lus » grâce au texte hors écran
 * — la pastille elle-même est décorative, sans quoi le chiffre serait annoncé
 * deux fois. Au-delà de neuf, « 9+ » : elle reste ronde, et le compte exact
 * n’apprend plus rien à ce stade.
 */
function Pastille({ compte }: { compte: number }) {
  if (compte <= 0) return null;
  return (
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
  );
}
