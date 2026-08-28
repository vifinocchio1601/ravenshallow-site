import type { Metadata } from "next";
import Link from "next/link";
import { remettreAction, retirerAction } from "@/app/admin/annonces/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireAnnonce from "@/components/admin/FormulaireAnnonce";
import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { listerPourAdministration } from "@/lib/annonces/depot";
import { ROUTES } from "@/lib/ecole/menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${TEXTES_ANNONCES.administration.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

/**
 * **Le Grand Hall, côté administration.**
 *
 * Écrire, corriger, retirer — et remettre. C'est le seul endroit du site qui
 * touche aux annonces : aucune permission attribuable ne les ouvre, et il ne
 * faut pas en ajouter une. Le préambule du règlement fait de ce lieu le seul
 * endroit officiel où annoncer une modification des règles ; c'est une
 * décision d'administration, pas une charge qu'on délègue.
 *
 * **La correction se fait sur place**, par `?corriger=<id>` : un second écran
 * aurait eu son propre formulaire, et deux formulaires finissent par accepter
 * deux textes différents.
 *
 * ⚠️ **Les annonces retirées s'affichent ici, et nulle part ailleurs.**
 * Retirer n'efface pas — la ligne reste, et ce qui a fait courir les sept
 * jours du préambule doit rester consultable.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { corriger?: string };
}) {
  const t = TEXTES_ANNONCES.administration;
  const toutes = await listerPourAdministration();

  const affichees = toutes.filter((a) => a.retireeLe === null);
  const retirees = toutes.filter((a) => a.retireeLe !== null);

  // Une annonce retirée ne se corrige pas : on la remet d'abord. Corriger un
  // texte que personne ne voit ne mène nulle part, et le bouton n'existe donc
  // que sur les annonces affichées.
  const enCorrection = searchParams?.corriger
    ? affichees.find((a) => a.id === searchParams.corriger)
    : undefined;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.chapeau}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {enCorrection ? t.enregistrer : t.publier}
          </h2>

          <FormulaireAnnonce
            // La clé force un formulaire neuf quand on passe d'une annonce à
            // l'autre : sans elle, React garde l'état du précédent et l'on
            // corrige la seconde avec le texte de la première.
            key={enCorrection?.id ?? "neuve"}
            annonce={
              enCorrection
                ? {
                    id: enCorrection.id,
                    titre: enCorrection.titre,
                    corps: enCorrection.corps,
                    entreeEnVigueurLe: enCorrection.entreeEnVigueurLe,
                  }
                : undefined
            }
          />

          {enCorrection ? (
            <Link
              href="/admin/annonces"
              className="mt-3 inline-block font-body text-sm text-silver hover:text-aurora-teal"
            >
              {t.annuler}
            </Link>
          ) : null}
        </section>

        <section className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {TEXTES_ANNONCES.liste.titre}
          </h2>
          <p className="mt-2 font-body text-sm italic leading-relaxed text-silver">
            {t.retirerAide}
          </p>

          {affichees.length === 0 ? (
            <p className="mt-4 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.aucune}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3">
              {affichees.map((annonce) => (
                <li
                  key={annonce.id}
                  className="min-w-0 rounded-sm border border-silver/12 bg-mist/30 p-4"
                >
                  <p className="font-display text-base leading-snug text-parchment">
                    <Link
                      href={`${ROUTES.annonces}/${annonce.id}`}
                      className="hover:text-aurora-teal"
                    >
                      {annonce.titre}
                    </Link>
                  </p>

                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <time
                      dateTime={annonce.publieeLe}
                      suppressHydrationWarning
                      className="font-body text-xs italic text-silver"
                    >
                      {TEXTES_ANNONCES.annonce.affichee.replace(
                        "{date}",
                        enJour(annonce.publieeLe),
                      )}
                    </time>
                    {annonce.entreeEnVigueurLe ? (
                      <time
                        dateTime={annonce.entreeEnVigueurLe}
                        suppressHydrationWarning
                        className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-ember/85"
                      >
                        {TEXTES_ANNONCES.annonce.enVigueur.replace(
                          "{date}",
                          enJour(annonce.entreeEnVigueurLe),
                        )}
                      </time>
                    ) : null}
                    {annonce.modifieLe ? (
                      <time
                        dateTime={annonce.modifieLe}
                        suppressHydrationWarning
                        className="font-body text-[0.68rem] italic text-silver/70"
                      >
                        {TEXTES_ANNONCES.annonce.modifiee.replace(
                          "{date}",
                          enJour(annonce.modifieLe),
                        )}
                      </time>
                    ) : null}
                  </p>

                  <p className="mt-2 font-body text-sm leading-[1.7] text-parchment-dim">
                    {annonce.extrait}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/admin/annonces?corriger=${annonce.id}`}
                      // Le nom accessible est entier : dans une liste de
                      // trente lignes, « Corriger » ne dit pas laquelle.
                      aria-label={t.modifierAria.replace("{titre}", annonce.titre)}
                      className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver hover:text-aurora-teal"
                    >
                      {t.modifier}
                    </Link>

                    <form action={retirerAction}>
                      <input type="hidden" name="id" value={annonce.id} />
                      <button
                        type="submit"
                        aria-label={t.retirerAria.replace("{titre}", annonce.titre)}
                        className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver hover:text-ember"
                      >
                        {t.retirer}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {retirees.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
              {t.retireesTitre}
            </h2>

            <ul className="mt-4 grid grid-cols-1 gap-3">
              {retirees.map((annonce) => (
                <li
                  key={annonce.id}
                  className="min-w-0 rounded-sm border border-dashed border-silver/15 bg-void/40 p-4"
                >
                  <p className="font-display text-base leading-snug text-silver">
                    {annonce.titre}
                  </p>
                  <p className="mt-1 font-body text-xs italic text-silver/80">
                    <time dateTime={annonce.retireeLe!} suppressHydrationWarning>
                      {t.retireeLe
                        .replace("{date}", enJour(annonce.retireeLe!))
                        .replace("{qui}", annonce.retireePar ?? t.posePar)}
                    </time>
                  </p>

                  <form action={remettreAction} className="mt-3">
                    <input type="hidden" name="id" value={annonce.id} />
                    <button
                      type="submit"
                      aria-label={t.remettreAria.replace("{titre}", annonce.titre)}
                      className="font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver hover:text-aurora-teal"
                    >
                      {t.remettre}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/** « 28 août 2026 ». */
function enJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
