import type { Metadata } from "next";
import Link from "next/link";
import {
  deplacerAction,
  remettreAction,
  retirerAction,
} from "@/app/admin/grimoires/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireGrimoire from "@/components/admin/FormulaireGrimoire";
import LigneChapitreGrimoire from "@/components/admin/LigneChapitreGrimoire";
import { jourEnToutesLettres } from "@/lib/dates";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { listerPourAdministration } from "@/lib/grimoires/depot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_GRIMOIRES.administration.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Les grimoires, côté administration.**
 *
 * Poser un volume, corriger ce qu'il annonce, le ranger, le retirer — et le
 * remettre. **Aucune permission attribuable n'ouvre ces gestes**, et il ne
 * faut pas en ajouter : comme les annonces et le calendrier, c'est une
 * décision d'administration, pas une charge qu'on délègue.
 *
 * ⚠️ **Le contenu n'entre pas par ici.** Les volumes s'écrivent sous Word,
 * `scripts/lire-grimoire.mjs` les lit et montre ce qu'il a compris,
 * `poser-grimoire.mjs` les pose. C'est le chemin que le joueur a demandé, et
 * un éditeur de blocs serait un lot à part — celui-ci ne remplacerait pas le
 * document, il en ferait une seconde version.
 *
 * ⚠️ **Les volumes retirés s'affichent ici, et nulle part ailleurs.** Retirer
 * n'efface pas : la ligne reste, et « Remettre » existe pour que le clic
 * malheureux ne soit pas définitif.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { corriger?: string };
}) {
  const t = TEXTES_GRIMOIRES.administration;
  const volumes = await listerPourAdministration();

  // Un volume retiré ne se corrige pas : on le remet d'abord. Corriger ce que
  // personne ne voit ne mène nulle part.
  const enCorrection = searchParams?.corriger
    ? volumes.find((v) => v.id === searchParams.corriger && v.retireLe === null)
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
            {enCorrection ? t.formulaire.titreCorriger : t.formulaire.titrePoser}
          </h2>

          <div className="mt-3 rounded-sm border border-silver/12 bg-mist/40 p-5 sm:p-6">
            <FormulaireGrimoire
              // La clé force un formulaire neuf quand on passe d'un volume à
              // l'autre : sans elle, React garde la saisie du précédent.
              key={enCorrection?.id ?? "neuf"}
              volume={enCorrection}
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.liste.titre}
          </h2>

          {volumes.length === 0 ? (
            <p className="mt-4 font-body italic text-silver">{t.liste.vide}</p>
          ) : (
            <ul className="mt-4 grid gap-6">
              {volumes.map((volume) => (
                <li
                  key={volume.id}
                  className="rounded-sm border border-silver/12 bg-mist/30 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg text-parchment">
                      {volume.titre}
                    </h3>
                    <p className="font-body text-sm text-silver">
                      /{volume.slug} ·{" "}
                      {volume.chapitres === 1
                        ? t.liste.chapitreUn
                        : t.liste.chapitres.replace(
                            "{n}",
                            String(volume.chapitres),
                          )}
                    </p>
                  </div>

                  <p className="mt-2 max-w-[68ch] font-body text-sm leading-relaxed text-parchment-dim">
                    {volume.description}
                  </p>

                  {/* Un état ne se signale jamais par la seule couleur. */}
                  {volume.retireLe ? (
                    <p className="mt-2 font-body text-sm text-ember">
                      {t.liste.retire.replace(
                        "{jour}",
                        jourEnToutesLettres(new Date(volume.retireLe)),
                      )}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {volume.retireLe ? (
                      <form action={remettreAction}>
                        <input type="hidden" name="id" value={volume.id} />
                        <button type="submit" className={LIEN}>
                          {t.liste.remettre}
                        </button>
                      </form>
                    ) : (
                      <>
                        <Link
                          href={`/admin/grimoires?corriger=${volume.id}`}
                          className={LIEN}
                        >
                          {t.liste.corriger}
                        </Link>

                        <Link
                          href={`${ROUTES.grimoires}/${volume.slug}`}
                          className={LIEN}
                        >
                          {t.liste.voir}
                        </Link>

                        <form action={deplacerAction}>
                          <input type="hidden" name="id" value={volume.id} />
                          <input type="hidden" name="sens" value="-1" />
                          <button type="submit" className={LIEN}>
                            {t.liste.monter}
                          </button>
                        </form>

                        <form action={deplacerAction}>
                          <input type="hidden" name="id" value={volume.id} />
                          <input type="hidden" name="sens" value="1" />
                          <button type="submit" className={LIEN}>
                            {t.liste.descendre}
                          </button>
                        </form>

                        <form action={retirerAction}>
                          <input type="hidden" name="id" value={volume.id} />
                          <button type="submit" className={LIEN}>
                            {t.liste.retirer}
                          </button>
                        </form>
                      </>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim">
                      {t.chapitres.titre}
                    </h4>

                    {volume.detail.length === 0 ? (
                      <p className="mt-2 font-body text-sm italic text-silver">
                        {t.chapitres.vide}
                      </p>
                    ) : (
                      <div className="mt-1">
                        {volume.detail.map((chapitre) => (
                          <LigneChapitreGrimoire
                            key={chapitre.id}
                            chapitre={chapitre}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

const LIEN =
  "font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver underline-offset-4 transition-colors hover:text-parchment hover:underline";
