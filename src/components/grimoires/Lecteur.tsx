"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import reglages from "@/config/grimoires.json";
import type { TypeBloc } from "@/lib/grimoires/blocs";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { pageDuBloc, paginer } from "@/lib/grimoires/pagination";

const T = TEXTES_GRIMOIRES.lecteur;

/** Un bloc, tel que le lecteur a besoin de le connaître — jamais son contenu. */
export type RepereBloc = {
  type: TypeBloc;
  ancre: string | null;
  /** L'index du chapitre auquel il appartient. */
  chapitre: number;
};

export type ChapitreDuLecteur = {
  slug: string;
  titre: string;
  /** L'index de son premier bloc dans la suite. */
  premier: number;
};

type Taille = "petite" | "moyenne" | "grande";

const TAILLES: Record<Taille, number> = {
  petite: reglages.taillePetite,
  moyenne: reglages.tailleMoyenne,
  grande: reglages.tailleGrande,
};

/**
 * **Le grimoire ouvert sur son bureau.**
 *
 * ── Comment il remplit ses pages ──
 *
 * Les blocs sont rendus **par le serveur** et remis ici en tableau : le
 * lecteur ne fabrique aucun contenu, il ne fait que le mesurer et le
 * distribuer. C'est ce qui permet au balisage de rester nettoyé côté serveur
 * — le nettoyeur est `server-only` et n'a rien à faire dans le navigateur.
 *
 * Une copie invisible de tous les blocs est posée à la largeur d'une page ;
 * on lit leurs hauteurs, `paginer` fait le reste. La mesure a lieu dans un
 * `useLayoutEffect` — **avant que le navigateur ne peigne** —, sans quoi on
 * verrait le volume entier s'afficher puis se replier.
 *
 * ⚠️ **La règle vit dans `pagination.ts`, pas ici.** Une fiche qui ne se coupe
 * pas, un titre qui ne finit pas une page : ce sont des règles, elles
 * s'éprouvent sans navigateur.
 *
 * ── Ce qui survit à un redimensionnement ──
 *
 * On retient **le premier bloc affiché**, jamais le numéro de page : celui-ci
 * ne veut plus rien dire dès que la largeur ou la taille du texte changent.
 * Après recalcul, on rouvre à la page qui porte ce bloc.
 *
 * ⚠️ **Et c'est pour la même raison qu'un numéro de page ne voyage pas dans
 * un lien.** L'adresse porte le chapitre et l'ancre du premier bloc ; « page
 * 12 » chez soi n'est pas « page 12 » chez quelqu'un d'autre.
 */
export default function Lecteur({
  blocs,
  reperes,
  chapitres,
  hrefVolume,
  hrefContinu,
  chapitreInitial,
  ancreInitiale,
}: {
  blocs: ReactNode[];
  reperes: RepereBloc[];
  chapitres: ChapitreDuLecteur[];
  hrefVolume: string;
  hrefContinu: string;
  chapitreInitial: string | null;
  ancreInitiale: string | null;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const mesure = useRef<HTMLDivElement>(null);

  const [taille, setTaille] = useState<Taille>("moyenne");
  const [pages, setPages] = useState<number[][]>([]);
  const [page, setPage] = useState(0);
  const [double, setDouble] = useState(false);

  /** Le bloc à retrouver après un recalcul. Jamais le numéro de page. */
  const repere = useRef(0);

  /**
   * La feuille en train de tourner : son sens, et une clé qui change à chaque
   * fois — c'est elle qui relance l'animation quand on enchaîne les pages.
   */
  const [tour, setTour] = useState<{ sens: 1 | -1; cle: number } | null>(null);
  const compteurDeTours = useRef(0);

  // ── Une page ou deux ──
  useLayoutEffect(() => {
    const requete = window.matchMedia("(min-width: 640px)");
    const suivre = () => setDouble(requete.matches);
    suivre();
    requete.addEventListener("change", suivre);
    return () => requete.removeEventListener("change", suivre);
  }, []);

  // ── La mesure, avant peinture ──
  useLayoutEffect(() => {
    const cible = zone.current;
    const copie = mesure.current;
    if (!cible || !copie) return;

    const calculer = () => {
      const cadreZone = cible.getBoundingClientRect();
      if (cadreZone.width === 0) return;

      copie.style.width = `${cadreZone.width}px`;
      copie.style.fontSize = `${TAILLES[taille]}rem`;

      const hauteurs = Array.from(copie.children).map((enfant, i) => ({
        hauteur: enfant.getBoundingClientRect().height,
        type: reperes[i]?.type ?? ("PARAGRAPHE" as TypeBloc),
      }));

      const nouvelles = paginer(
        hauteurs,
        cadreZone.height,
        reglages.ecartBlocs,
      );
      setPages(nouvelles);
      setPage((ancienne) => {
        const retrouvee = pageDuBloc(nouvelles, repere.current);
        // En double page, on ouvre toujours sur une feuille : la page de
        // gauche est paire, sinon le texte saute d'un côté à l'autre.
        return nouvelles.length === 0
          ? 0
          : Math.min(retrouvee, Math.max(0, nouvelles.length - 1)) ||
              (ancienne === 0 ? 0 : retrouvee);
      });
    };

    calculer();
    const observateur = new ResizeObserver(calculer);
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [taille, reperes]);

  // ── Où l'on ouvre : une ancre, un chapitre, ou le début ──
  const ouvertureFaite = useRef(false);
  useEffect(() => {
    if (ouvertureFaite.current || pages.length === 0) return;
    ouvertureFaite.current = true;

    // ⚠️ Le fragment d'une adresse ne parvient JAMAIS au serveur : `#sortilege
    // -de-la-charge` n'existe que dans le navigateur. C'est donc ici qu'on le
    // lit — la page ne peut pas nous le passer.
    const visee =
      ancreInitiale ?? decodeURIComponent(window.location.hash.slice(1));
    const parAncre = visee
      ? reperes.findIndex((r) => r.ancre === visee)
      : -1;
    const parChapitre = chapitreInitial
      ? (chapitres.find((c) => c.slug === chapitreInitial)?.premier ?? -1)
      : -1;

    const bloc = parAncre !== -1 ? parAncre : parChapitre;
    if (bloc === -1) return;

    repere.current = bloc;
    setPage(alignee(pageDuBloc(pages, bloc), double));
  }, [pages, ancreInitiale, chapitreInitial, chapitres, reperes, double]);

  const parVue = double ? 2 : 1;
  const derniere = Math.max(0, pages.length - 1);

  /**
   * ⚠️ **La page cible se calcule DEHORS de la mise à jour d'état.** Poser un
   * second état — la feuille qui tourne — à l'intérieur de la fonction que
   * React passe à `setPage` revient à modifier un composant pendant qu'un
   * autre se rend : React peut la rejouer, et l'animation partirait deux
   * fois. Le calcul est fait ici, les deux états sont posés côte à côte.
   */
  const aller = useCallback(
    (sens: 1 | -1) => {
      const visee = alignee(page + sens * parVue, double);
      const bornee = Math.min(Math.max(visee, 0), derniere);
      if (bornee === page) return;

      repere.current = pages[bornee]?.[0] ?? 0;
      compteurDeTours.current += 1;
      setTour({ sens, cle: compteurDeTours.current });
      setPage(bornee);
    },
    [derniere, double, page, pages, parVue],
  );

  // La feuille se retire d'elle-même. ⚠️ Elle n'a jamais retenu la page : le
  // contenu a changé avant elle, et l'on peut tourner de nouveau pendant
  // qu'elle vole.
  useEffect(() => {
    if (!tour) return;
    const minuteur = window.setTimeout(
      () => setTour(null),
      reglages.animationMs,
    );
    return () => window.clearTimeout(minuteur);
  }, [tour]);

  const allerAuBloc = useCallback(
    (bloc: number) => {
      repere.current = bloc;
      setPage(alignee(pageDuBloc(pages, bloc), double));
    },
    [pages, double],
  );

  // ── Le clavier ──
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      // Ne jamais voler une flèche à un champ ou à un menu déroulant.
      if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
      if (e.key === "ArrowRight") aller(1);
      else if (e.key === "ArrowLeft") aller(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [aller]);

  // ── Le doigt ──
  const depart = useRef<number | null>(null);
  const debutGlissement = (e: React.TouchEvent) => {
    depart.current = e.touches[0]?.clientX ?? null;
  };
  const finGlissement = (e: React.TouchEvent) => {
    const x0 = depart.current;
    depart.current = null;
    if (x0 === null) return;
    const distance = (e.changedTouches[0]?.clientX ?? x0) - x0;
    if (Math.abs(distance) < reglages.glissementMin) return;
    // On glisse vers la gauche pour avancer : le sens de la lecture.
    aller(distance < 0 ? 1 : -1);
  };

  // ── L'adresse suit la page, sans jamais porter son numéro ──
  useEffect(() => {
    const premier = pages[page]?.[0];
    if (premier === undefined) return;

    const chapitre = chapitres[reperes[premier]?.chapitre ?? 0];
    if (!chapitre) return;

    const ancre = reperes[premier]?.ancre;
    const adresse = `${hrefVolume}/${chapitre.slug}${ancre ? `#${ancre}` : ""}`;
    window.history.replaceState(null, "", adresse);
  }, [page, pages, chapitres, reperes, hrefVolume]);

  const chapitreCourant =
    chapitres[reperes[pages[page]?.[0] ?? 0]?.chapitre ?? 0]?.titre ?? "";

  const compte = useMemo(() => {
    if (pages.length === 0) return "";
    const a = page + 1;
    const b = Math.min(page + parVue, pages.length);
    return a === b
      ? T.page.replace("{n}", String(a)).replace("{total}", String(pages.length))
      : T.pages
          .replace("{a}", String(a))
          .replace("{b}", String(b))
          .replace("{total}", String(pages.length));
  }, [page, pages.length, parVue]);

  const contenu = (index: number) =>
    (pages[index] ?? []).map((i) => <div key={i}>{blocs[i]}</div>);

  return (
    <div
      style={
        {
          ["--gr-taille"]: `${TAILLES[taille]}rem`,
          // Le même nombre que celui dont `paginer` tient compte : deux
          // valeurs différentes feraient déborder la dernière ligne d'une
          // page sur deux.
          ["--gr-ecart"]: `${reglages.ecartBlocs}px`,
        } as React.CSSProperties
      }
    >
      {/* ── Les commandes ── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <details className="grimoire-sommaire">
          <summary className="font-display text-[0.7rem] uppercase tracking-[0.16em] text-parchment-dim">
            {T.sommaire}
          </summary>
          <ul className="mt-2 grid gap-1">
            {chapitres.map((chapitre) => (
              <li key={chapitre.slug}>
                <button
                  type="button"
                  onClick={() => allerAuBloc(chapitre.premier)}
                  className="text-left font-body text-sm text-parchment-dim underline-offset-4 hover:text-parchment hover:underline"
                >
                  {chapitre.titre}
                </button>
              </li>
            ))}
          </ul>
        </details>

        <div className="flex items-center gap-4">
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">{T.tailleTexte}</legend>
            {(Object.keys(TAILLES) as Taille[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={taille === t}
                onClick={() => setTaille(t)}
                className={`font-display text-[0.62rem] uppercase tracking-[0.16em] transition-colors ${
                  taille === t
                    ? "text-aurora-teal"
                    : "text-silver hover:text-parchment"
                }`}
              >
                {T.tailles[t]}
              </button>
            ))}
          </fieldset>

          <Link
            href={hrefContinu}
            className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver underline-offset-4 hover:text-parchment hover:underline"
          >
            {T.modeContinu}
          </Link>
        </div>
      </div>

      {/* ── Le grimoire ── */}
      <div
        ref={cadre}
        className="grimoire mt-4"
        style={mesuresDuDecor}
        onTouchStart={debutGlissement}
        onTouchEnd={finGlissement}
      >
        {/* Du décor, et rien d'autre : tout ce qui compte est du vrai texte
            par-dessus. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/grimoires/grimoire_ouvert.webp"
          alt={T.decorAlt}
          className="grimoire__decor"
        />

        <div ref={zone} className="grimoire__page grimoire__page--gauche gr-papier">
          {contenu(page)}
        </div>

        {double ? (
          <div className="grimoire__page grimoire__page--droite gr-papier">
            {contenu(page + 1)}
          </div>
        ) : null}

        {tour ? (
          <div
            key={tour.cle}
            aria-hidden="true"
            className={`grimoire__tour ${
              tour.sens === 1 ? "grimoire__tour--avant" : "grimoire__tour--arriere"
            }`}
          />
        ) : null}
      </div>

      {/* ── Tourner ── */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => aller(-1)}
          disabled={page === 0}
          className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver transition-colors hover:text-parchment disabled:opacity-40"
        >
          ← {T.precedente}
        </button>

        <p className="font-body text-sm text-parchment-dim">{compte}</p>

        <button
          type="button"
          onClick={() => aller(1)}
          disabled={page >= derniere}
          className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver transition-colors hover:text-parchment disabled:opacity-40"
        >
          {T.suivante} →
        </button>
      </div>

      {/* Le changement de page est annoncé — sans quoi il n'existe pas pour
          qui n'a pas l'écran sous les yeux. */}
      <p aria-live="polite" className="sr-only">
        {T.pageAnnoncee
          .replace("{n}", String(page + 1))
          .replace("{total}", String(pages.length))
          .replace("{chapitre}", chapitreCourant)}
      </p>

      {/* ── La copie qu'on mesure ── */}
      <div ref={mesure} className="grimoire__mesure gr-papier" aria-hidden="true">
        {blocs.map((bloc, i) => (
          <div key={i}>{bloc}</div>
        ))}
      </div>
    </div>
  );
}

/**
 * **Les mesures du décor, en variables CSS.**
 *
 * Elles sont posées ici plutôt que sur chaque page, et c'est ce qui permet à
 * la requête média du téléphone de les redéfinir : un style en ligne écrit
 * sur l'élément l'emporterait, et le petit écran garderait les deux pages
 * dans un cadre de trois cent soixante-quinze pixels.
 */
const marge = reglages.marge;
const mesuresDuDecor = {
  ["--decor-max" as string]: `${reglages.decorLargeurMax}px`,
  ["--decor-ratio" as string]: `${reglages.imageLargeur} / ${reglages.imageHauteur}`,
  ["--pg-l" as string]: `${reglages.pageGauche.gauche + marge}%`,
  ["--pg-r" as string]: `${100 - reglages.pageGauche.droite + marge}%`,
  ["--pg-t" as string]: `${reglages.pageGauche.haut + marge}%`,
  ["--pg-b" as string]: `${100 - reglages.pageGauche.bas + marge}%`,
  ["--pd-l" as string]: `${reglages.pageDroite.gauche + marge}%`,
  ["--pd-r" as string]: `${100 - reglages.pageDroite.droite + marge}%`,
  ["--pd-t" as string]: `${reglages.pageDroite.haut + marge}%`,
  ["--pd-b" as string]: `${100 - reglages.pageDroite.bas + marge}%`,

  // La reliure est au milieu des deux pages, jamais au milieu de l'image :
  // le livre n'est pas centré dans la photographie.
  ["--reliure-x" as string]: `${
    (reglages.pageGauche.droite + reglages.pageDroite.gauche) / 2
  }%`,
  ["--tour-l" as string]: `${reglages.pageGauche.gauche}%`,
  ["--tour-r" as string]: `${100 - reglages.pageDroite.droite}%`,
  ["--tour-t" as string]: `${reglages.pageGauche.haut}%`,
  ["--tour-b" as string]: `${100 - reglages.pageGauche.bas}%`,
  ["--tour-duree" as string]: `${reglages.animationMs}ms`,
} as React.CSSProperties;

/**
 * En double page, la page de gauche est toujours paire : sans cela, le même
 * texte saute d'un côté à l'autre de la reliure au fil de la navigation.
 */
function alignee(page: number, double: boolean): number {
  const bornee = Math.max(0, page);
  return double ? bornee - (bornee % 2) : bornee;
}
