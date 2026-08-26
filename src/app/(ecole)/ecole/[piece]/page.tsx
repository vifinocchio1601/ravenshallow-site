import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Verrou } from "@/components/ecole/CartouchePiece";
import FormulaireScene from "@/components/forum/FormulaireScene";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { lireSection, listerSujets } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutOuvrirUnSujet } from "@/lib/forum/lieux";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.ecole.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Une pièce du château, et ce qui s’y joue.
 *
 * `lireSection` rend `null` si la pièce n’existe pas **ou** si ce membre ne
 * peut pas la lire, et la page répond 404 dans les deux cas. La même réponse
 * pour les deux : « elle existe mais pas pour vous » se lit comme une
 * confirmation, et c’est déjà le choix fait dans la Tour.
 */
export default async function Page({
  params,
}: {
  params: { piece: string };
}) {
  const compte = await exigerAcces(ROUTES.ecole);
  const pouvoirs = await pouvoirsDe(compte.id);

  const trouve = await lireSection("domaine", params.piece, {
    membre: compte,
    pouvoirs,
  });
  if (!trouve) notFound();

  const { section } = trouve;
  const sujets = await listerSujets(section.id);
  const ecriture = peutOuvrirUnSujet(compte, pouvoirs, section.regles);
  const t = TEXTES_FORUM;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.ecole}
        className="eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-aurora-teal"
      >
        <span aria-hidden="true">←</span>
        {t.lieu.retour}
      </Link>

      <h1 className="mt-4 font-display text-[clamp(1.6rem,4.5vw,2.3rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {section.nom}
      </h1>

      <p className="mt-4 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
        {section.description}
      </p>

      {/* La condition d’écriture, en toutes lettres — et le rappel que la
          lecture, elle, ne se ferme pas. */}
      {ecriture.peut ? null : (
        <div className="mt-5 max-w-[68ch] rounded-sm border border-silver/15 bg-mist/40 px-5 py-3">
          <Verrou verdict={ecriture} />
        </div>
      )}

      <section aria-labelledby="sujets" className="mt-12">
        <h2
          id="sujets"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {sujets.length === 0
            ? t.lieu.aucunSujet
            : sujets.length === 1
              ? t.lieu.unSujet
              : t.lieu.sujets.replace("{n}", String(sujets.length))}
        </h2>

        {sujets.length === 0 ? null : (
          <ul className="mt-5 grid grid-cols-1 gap-2">
            {sujets.map((sujet) => (
              <li key={sujet.id} className="min-w-0">
                <Link
                  href={`${ROUTES.ecole}/${params.piece}/${sujet.id}`}
                  className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3 transition-colors duration-300 hover:border-silver/30"
                >
                  <span className="min-w-0 truncate font-body text-parchment">
                    {sujet.epingle ? (
                      <span
                        aria-hidden="true"
                        className="mr-2 text-aurora-teal/80"
                      >
                        ◆
                      </span>
                    ) : null}
                    {sujet.titre}
                  </span>
                  <span className="font-body text-xs text-silver">
                    {sujet.auteur ?? "—"}
                  </span>
                  {/* L’instant voyage en ISO : c’est la mise en forme du
                      navigateur qui gagne, la seule juste pour qui lit. */}
                  <time
                    dateTime={sujet.dernierPostLe}
                    suppressHydrationWarning
                    className="font-body text-xs italic text-silver"
                  >
                    {new Date(sujet.dernierPostLe).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* — Ouvrir une scène, quand le lieu s’y prête — */}
      {ecriture.peut ? (
        <section aria-label={t.ecrire.ouvrir} className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.ecrire.ouvrir}
          </h2>
          <FormulaireScene
            espace="domaine"
            lieu={params.piece}
            lignesMinimum={section.regles.lignesMinimum}
          />
        </section>
      ) : null}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}
