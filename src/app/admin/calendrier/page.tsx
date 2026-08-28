import type { Metadata } from "next";
import Link from "next/link";
import { remettreAction, retirerAction } from "@/app/admin/calendrier/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireEvenement from "@/components/admin/FormulaireEvenement";
import { TEXTES_CALENDRIER } from "@/lib/calendrier/constantes";
import { listerPourAdministration } from "@/lib/calendrier/depot";
import { jourEnToutesLettres } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_CALENDRIER.administration.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Le calendrier, côté administration.**
 *
 * Poser, corriger, retirer — et remettre. C'est le seul endroit du site qui
 * touche aux dates : **aucune permission attribuable ne les ouvre**, et il ne
 * faut pas en ajouter une. Le préambule du règlement fait du Grand Hall le
 * seul lieu officiel d'annonce ; c'est une décision d'administration, pas une
 * charge qu'on délègue. Même règle que pour les annonces.
 *
 * **La correction se fait sur place**, par `?corriger=<id>` : un second écran
 * aurait eu son propre formulaire, et deux formulaires finissent par accepter
 * deux saisies différentes.
 *
 * ⚠️ **Les dates retirées s'affichent ici, et nulle part ailleurs.** Retirer
 * n'efface pas : la ligne reste, et « Remettre » existe pour que le clic
 * malheureux ne soit pas définitif.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { corriger?: string };
}) {
  const t = TEXTES_CALENDRIER.administration;
  const toutes = await listerPourAdministration();

  // Une date retirée ne se corrige pas : on la remet d'abord. Corriger ce que
  // personne ne voit ne mène nulle part.
  const enCorrection = searchParams?.corriger
    ? toutes.find((e) => e.id === searchParams.corriger && e.retireLe === null)
    : undefined;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappel}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {enCorrection ? t.formulaire.enregistrer : t.formulaire.titre}
          </h2>

          <FormulaireEvenement
            // La clé force un formulaire neuf quand on passe d'une date à
            // l'autre : sans elle, React garde l'état de la précédente et l'on
            // corrige la seconde avec la saisie de la première.
            key={enCorrection?.id ?? "neuve"}
            evenement={
              enCorrection
                ? {
                    id: enCorrection.id,
                    titre: enCorrection.titre,
                    description: enCorrection.description,
                    nature: enCorrection.nature,
                    debuteLe: enCorrection.debuteLe,
                    finitLe: enCorrection.finitLe,
                  }
                : undefined
            }
          />

          {enCorrection ? (
            <Link
              href="/admin/calendrier"
              className="mt-3 inline-block font-body text-sm text-silver hover:text-aurora-teal"
            >
              {t.formulaire.annuler}
            </Link>
          ) : null}
        </section>

        <section className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.liste.titre}
          </h2>
          <p className="mt-2 font-body text-sm italic leading-relaxed text-silver">
            {t.liste.aide}
          </p>

          {toutes.length === 0 ? (
            <p className="mt-4 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.liste.vide}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3">
              {toutes.map((evenement) => {
                // **Une seule liste, retirées comprises**, et le trait
                // pointillé les distingue — doublé de la phrase « Retirée
                // le… », parce qu'un état ne se signale jamais par la seule
                // apparence.
                const retiree = evenement.retireLe !== null;
                const debut = new Date(evenement.debuteLe);
                const fin = evenement.finitLe
                  ? new Date(evenement.finitLe)
                  : null;
                const quand = fin
                  ? TEXTES_CALENDRIER.evenement.du
                      .replace("{debut}", jourEnToutesLettres(debut))
                      .replace("{fin}", jourEnToutesLettres(fin))
                  : TEXTES_CALENDRIER.evenement.le.replace(
                      "{date}",
                      jourEnToutesLettres(debut),
                    );

                return (
                  <li
                    key={evenement.id}
                    className={`min-w-0 rounded-sm p-4 ${
                      retiree
                        ? "border border-dashed border-silver/15 bg-void/40"
                        : "border border-silver/12 bg-mist/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p
                        className={`min-w-0 break-words font-display text-base leading-snug ${
                          retiree ? "text-silver" : "text-parchment"
                        }`}
                      >
                        {evenement.titre}
                      </p>
                      <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/80">
                        {TEXTES_CALENDRIER.natures[evenement.nature]}
                      </span>
                    </div>

                    <p className="mt-1 font-body text-xs italic text-silver">
                      {quand}
                      {retiree ? (
                        <>
                          {" · "}
                          {t.liste.retireeLe.replace(
                            "{date}",
                            jourEnToutesLettres(new Date(evenement.retireLe!)),
                          )}
                        </>
                      ) : null}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm leading-[1.7] text-parchment-dim">
                      {evenement.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {retiree ? (
                        <form action={remettreAction}>
                          <input type="hidden" name="id" value={evenement.id} />
                          <button
                            type="submit"
                            // Le nom accessible est entier : dans une liste de
                            // vingt lignes, « Remettre » ne dit pas laquelle.
                            aria-label={t.liste.remettreAria.replace(
                              "{titre}",
                              evenement.titre,
                            )}
                            className={BOUTON}
                          >
                            {t.liste.remettre}
                          </button>
                        </form>
                      ) : (
                        <>
                          <Link
                            href={`/admin/calendrier?corriger=${evenement.id}`}
                            aria-label={t.liste.corrigerAria.replace(
                              "{titre}",
                              evenement.titre,
                            )}
                            className={BOUTON}
                          >
                            {t.liste.corriger}
                          </Link>

                          <form action={retirerAction}>
                            <input
                              type="hidden"
                              name="id"
                              value={evenement.id}
                            />
                            <button
                              type="submit"
                              aria-label={t.liste.retirerAria.replace(
                                "{titre}",
                                evenement.titre,
                              )}
                              className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver hover:text-ember"
                            >
                              {t.liste.retirer}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

const BOUTON =
  "font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver hover:text-aurora-teal";
