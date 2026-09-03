import type { Metadata } from "next";
import Link from "next/link";
import { TEXTES_COURS } from "@/lib/cours/constantes";
import {
  anneeDuCursus,
  chargeDe,
  CYCLES,
  obligatoires,
  peutOuvrirLAnnee,
  type Annee,
  type Cycle,
} from "@/lib/cours/cursus";
import { FONCTIONS, libelleAnnee, type Fonction } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff, peutVoirLesControles } from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_COURS.annees;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Les sept années, groupées par cycle.**
 *
 * ⚠️ **Une année qu’on n’a pas atteinte s’affiche, fermée** — jamais cachée.
 * C’est le choix du joueur, et celui que la page des maisons fait déjà : voir
 * une porte close donne envie, une absence ne dit rien. La raison est écrite
 * en toutes lettres, et l’article qui la fonde avec.
 *
 * La règle vit dans `cours/cursus.ts`, jamais ici : la page ne compare pas
 * deux années, elle demande.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.cours);
  const pouvoirs = await pouvoirsDe(compte.id);
  const staff = estStaff(pouvoirs);
  const sienne = anneeDuCursus(compte.fonction as Fonction);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛏ
        </span>
        {T.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      {/*
        **La porte des professeurs.**

        ⚠️ **Elle ne s'affiche qu'à qui l'ouvre**, et ce n'est pas une exception
        à « une porte close s'affiche » : les années fermées et les maisons où
        l'on n'entre pas se montrent parce qu'elles sont des faits du monde,
        qu'un élève gagne à connaître. Un registre d'administration n'en est
        pas un — l'annoncer à toute l'école ne lui apprendrait rien, et
        donnerait à croire qu'il lui manque quelque chose.

        Même lecture que le menu, où une entrée fermée disparaît.
      */}
      {peutVoirLesControles(pouvoirs) ? (
        <Link
          href={`${ROUTES.cours}/controles`}
          className="mt-6 inline-flex flex-col gap-1 rounded-md border border-aurora-teal/25 bg-void/40 px-5 py-4 transition-colors duration-300 hover:border-aurora-teal/60"
        >
          <span className="font-display text-sm tracking-[0.04em] text-parchment">
            {TEXTES_COURS.controles.entree}
          </span>
          <span className="font-body text-xs italic text-silver">
            {TEXTES_COURS.controles.entreeAide}
          </span>
        </Link>
      ) : null}

      {CYCLES.map((cycle) => (
        <section key={cycle.id} className="mt-12">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {cycle.nom}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {resumeDuCycle(cycle)}
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cycle.annees.map((annee) => (
              <CarteAnnee
                key={annee}
                annee={annee}
                ouverte={peutOuvrirLAnnee(
                  compte.fonction as Fonction,
                  annee,
                  staff,
                )}
                lasienne={annee === sienne}
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}

/**
 * Ce qu’un cycle impose, en une phrase.
 *
 * ⚠️ **La charge varie d’une année à l’autre dans un même cycle** — le Seuil
 * en compte 6, puis 7, puis 8. Annoncer celle de la première année serait
 * faux pour les deux autres, et c’est exactement ce que cette page faisait
 * avant d’être relue à l’écran. On donne donc la plage quand il y en a une.
 *
 * Et le singulier : la Veille n’impose qu’une matière — « 1 matières
 * imposées » est la faute que personne ne relit.
 */
function resumeDuCycle(cycle: Cycle): string {
  const T = TEXTES_COURS.annees;

  if (cycle.choixParAnnee === 0) {
    const charges = cycle.annees.map(chargeDe);
    const min = Math.min(...charges);
    const max = Math.max(...charges);
    return min === max
      ? T.cycleSansChoix.replace("{n}", String(min))
      : T.cycleSansChoixPlage
          .replace("{min}", String(min))
          .replace("{max}", String(max));
  }

  const imposees = Math.min(...cycle.annees.map((a) => obligatoires(a).length));
  const gabarit = imposees === 1 ? T.cycleAvecChoixUne : T.cycleAvecChoix;
  return gabarit
    .replace("{n}", String(imposees))
    .replace("{choix}", String(cycle.choixParAnnee));
}

/** Une année : ouverte, on y entre ; fermée, on lit pourquoi. */
function CarteAnnee({
  annee,
  ouverte,
  lasienne,
}: {
  annee: Annee;
  ouverte: boolean;
  lasienne: boolean;
}) {
  // Le libellé vient de `dossier/etats.ts`, seul endroit qui nomme les années :
  // une seconde liste — « 1re », « 2e »… — finirait par diverger de l’enum.
  const nom = libelleAnnee(FONCTIONS[annee - 1] as Fonction);

  const contenu = (
    <>
      <span className="font-display text-base leading-snug text-parchment">
        {nom}
      </span>
      <span className="font-body text-xs italic text-silver">
        {TEXTES_COURS.annee.charge.replace("{n}", String(chargeDe(annee)))}
      </span>
      {/* Le mot, et pas seulement le liseré : un état ne se signale jamais par
          la seule couleur. */}
      {lasienne ? (
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/90">
          {TEXTES_COURS.annees.laMienne}
        </span>
      ) : null}
    </>
  );

  if (!ouverte) {
    return (
      <li className="min-w-0 rounded-md border border-dashed border-silver/15 bg-void/40 p-5 opacity-70">
        <div className="flex flex-col gap-1">
          {contenu}
          <p className="mt-2 font-body text-xs leading-relaxed text-silver">
            <span className="sr-only">{TEXTES_COURS.annees.fermeeAria} </span>
            {TEXTES_COURS.annees.fermeeRaison}
          </p>
        </div>
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <Link
        href={`${ROUTES.cours}/${annee}`}
        className={`flex h-full flex-col gap-1 rounded-md border bg-void/40 p-5 transition-colors hover:border-aurora-teal/40 ${
          lasienne ? "border-aurora-teal/40" : "border-silver/15"
        }`}
      >
        {contenu}
      </Link>
    </li>
  );
}
