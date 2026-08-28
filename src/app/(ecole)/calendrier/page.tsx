import type { Metadata } from "next";
import { TEXTES_CALENDRIER } from "@/lib/calendrier/constantes";
import { lireLeCalendrier, type EvenementAffiche } from "@/lib/calendrier/depot";
import { jourEnToutesLettres } from "@/lib/dates";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_CALENDRIER;

export const metadata: Metadata = {
  title: `${T.page.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le calendrier** — la troisième feuille du Grand Hall (bible §12).
 *
 * « Calendrier » et « événements à venir » sont **la même table lue deux
 * fois** : ce qui vient, et ce qui a eu lieu. Décision du joueur, 28 août
 * 2026 — deux tables auraient fini par dire deux choses de la même fête.
 *
 * On y lit, on n'y débat pas : aucun bouton. Les dates se posent à
 * `/admin/calendrier`, et nulle part ailleurs.
 */
export default async function Page() {
  await exigerAcces(ROUTES.calendrier);
  const { aVenir, passes } = await lireLeCalendrier();
  const vide = aVenir.length === 0 && passes.length === 0;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛃ
        </span>
        {T.page.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.page.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.page.chapeau}
      </p>

      {vide ? (
        // Rien du tout : une seule phrase, et pas deux sections vides qui
        // donneraient l’air d’un écran cassé.
        <p className="mt-12 font-body italic leading-[1.8] text-silver">
          {T.page.vide}
        </p>
      ) : (
        <>
          <section aria-labelledby="a-venir" className="mt-12">
            <h2
              id="a-venir"
              className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
            >
              {T.aVenir.titre}
            </h2>

            {aVenir.length === 0 ? (
              <p className="mt-3 font-body italic leading-[1.8] text-silver">
                {T.aVenir.vide}
              </p>
            ) : (
              <ul className="mt-5 grid grid-cols-1 gap-3">
                {aVenir.map((e) => (
                  <Ligne key={e.id} evenement={e} />
                ))}
              </ul>
            )}
          </section>

          {passes.length === 0 ? null : (
            <section aria-labelledby="passes" className="mt-14">
              <h2
                id="passes"
                className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
              >
                {T.passes.titre}
              </h2>

              <ul className="mt-5 grid grid-cols-1 gap-3">
                {passes.map((e) => (
                  <Ligne key={e.id} evenement={e} passe />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}

/**
 * Une date du calendrier.
 *
 * ⚠️ **La nature s’écrit en toutes lettres**, jamais par une seule couleur :
 * un état qui ne se signale qu’à l’œil ne se signale pas du tout — c’est la
 * règle du site, et elle vaut ici comme sur un lieu verrouillé.
 */
function Ligne({
  evenement,
  passe,
}: {
  evenement: EvenementAffiche;
  passe?: boolean;
}) {
  const debut = new Date(evenement.debuteLe);
  const fin = evenement.finitLe ? new Date(evenement.finitLe) : null;

  /**
   * ⚠️ **Pas de `suppressHydrationWarning` ici, à la différence du reste du
   * site — et ce n’est pas un oubli.**
   *
   * Ailleurs on affiche un INSTANT, dont le jour dépend du fuseau de qui
   * lit : « 23:40 hier » d’un côté, « 01:40 aujourd’hui » de l’autre. Une
   * date de calendrier est une JOURNÉE, posée à midi précisément pour que le
   * jour soit le même partout. Le texte est donc calculé une fois, sur le
   * serveur, et il n’a aucune raison de changer chez le lecteur.
   */
  const quand = fin
    ? T.evenement.du
        .replace("{debut}", jourEnToutesLettres(debut))
        .replace("{fin}", jourEnToutesLettres(fin))
    : T.evenement.le.replace("{date}", jourEnToutesLettres(debut));

  return (
    // `min-w-0` sur l’élément ET `grid-cols-1` sur la liste : sans les deux,
    // un titre long élargit la carte au-delà de l’écran.
    <li
      className={`min-w-0 rounded-md border border-silver/15 bg-void/40 p-5 ${
        passe ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="min-w-0 break-words font-display text-lg leading-snug text-parchment">
          {evenement.titre}
        </h3>
        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/80">
          {T.natures[evenement.nature]}
        </span>
      </div>

      <p className="mt-1 font-body text-xs italic text-silver">
        {fin ? (
          quand
        ) : (
          <time dateTime={evenement.debuteLe}>{quand}</time>
        )}
      </p>

      {/* Du texte brut, échappé par React : les retours à la ligne sont
          conservés par la CSS, jamais par une conversion en `<br>` — qui
          obligerait à assembler du HTML à la main. */}
      <p className="mt-3 max-w-[68ch] whitespace-pre-wrap break-words font-body leading-[1.75] text-parchment-dim">
        {evenement.description}
      </p>
    </li>
  );
}
