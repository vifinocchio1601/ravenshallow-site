import type { Metadata } from "next";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireCloture from "@/components/admin/FormulaireCloture";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import { ceQueLaClotureFerait, listerLesSaisonsCloses } from "@/lib/points/cloture";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_POINTS.cloture.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Clore une session — art. 18.3.**
 *
 * L’écran montre d’abord **ce qui sera figé**, puis qui passe, puis le bouton.
 * Cet ordre n’est pas décoratif : un bouton qui archive sans montrer ce qu’il
 * archive ne se presse pas deux fois, et celui-ci est le geste le plus
 * irréversible du site.
 *
 * Rien ne se déclenche sur une date. Décision du joueur : il veut lancer la
 * première lui-même.
 */
export default async function CloturePage() {
  const t = TEXTES_POINTS.cloture;
  const [avenir, closes] = await Promise.all([
    ceQueLaClotureFerait(),
    listerLesSaisonsCloses(),
  ]);

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-ember">
          {t.prevenir}
        </p>

        {!avenir ? (
          <p className="mt-10 rounded-sm border border-ember/40 bg-ember/[0.06] px-5 py-6 font-body leading-[1.7] text-ember">
            {t.erreurs.aucuneSaison}
          </p>
        ) : (
          <>
            <section className="mt-10">
              <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
                {t.classement.titre}
              </h2>
              <p className="mt-1 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
                {t.classement.aide}
              </p>
              <p className="mt-2 font-body text-parchment">{avenir.saison.nom}</p>

              <ul className="mt-3 grid grid-cols-1 gap-2">
                {[...avenir.classement]
                  .sort((a, b) => a.rang - b.rang || a.maison.localeCompare(b.maison))
                  .map((ligne) => (
                    <li
                      key={ligne.maison}
                      className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                    >
                      <span className="min-w-0 font-body text-parchment">
                        <span className="font-display text-sm text-silver">
                          {ligne.rang}.
                        </span>{" "}
                        {NOMS_MAISON[ligne.maison] ?? ligne.maison}
                        {/* « En tête » n’a de sens que si quelqu’un a marqué :
                            à quatre maisons vides, les quatre sont premières. */}
                        {ligne.rang === 1 && ligne.pointsAuTournoi > 0 ? (
                          <span className="ml-2 font-display text-[0.6rem] uppercase tracking-[0.12em] text-aurora-teal">
                            {t.classement.gagnante}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-body text-xs italic text-silver">
                        {moyenne(ligne.moyenne)} pts/élève · {ligne.pointsAuTournoi} pts ·{" "}
                        {ligne.effectif} élèves
                      </span>
                    </li>
                  ))}
              </ul>
            </section>

            <FormulaireCloture eleves={avenir.eleves} />
          </>
        )}

        {/* ── La mémoire du tournoi ── */}
        <section className="mt-14">
          <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.archives.titre}
          </h2>
          <p className="mt-1 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
            {t.archives.aide}
          </p>

          {closes.length === 0 ? (
            <p className="mt-3 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.archives.vide}
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-4">
              {closes.map((saison) => (
                <li
                  key={saison.id}
                  className="min-w-0 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                >
                  <p className="font-body text-parchment">
                    {saison.nom}
                    <span className="ml-2 font-body text-xs italic text-silver">
                      {t.archives.periode
                        .replace("{debut}", jour(saison.ouverteLe))
                        .replace("{fin}", jour(saison.closeLe!))}
                    </span>
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {saison.classement.map((l) => (
                      <li
                        key={l.maison}
                        className="min-w-0 font-body text-xs text-silver"
                      >
                        <span className="text-parchment-dim">
                          {l.rang}. {NOMS_MAISON[l.maison] ?? l.maison}
                        </span>{" "}
                        — {moyenne(l.moyenne)} pts/élève · {l.points} pts · {l.effectif}{" "}
                        élèves
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function moyenne(valeur: number): string {
  return valeur.toFixed(1).replace(".", ",");
}

function jour(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
