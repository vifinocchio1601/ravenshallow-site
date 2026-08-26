import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { traiterSignalementAction } from "@/app/admin/signalements/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { lireSignalement } from "@/lib/corbeaux/moderation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signalement — Administration",
  robots: { index: false, follow: false },
};

const dateLongue = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Un signalement, et **tout ce que la modération verra jamais de cet échange**.
 *
 * Ce qui s'affiche ici vient d'une seule colonne : `Signalement.contexte`, une
 * copie figée au moment du clic, qu'un déclencheur en base interdit de
 * réécrire. La page ne connaît ni l'identifiant de la conversation, ni ceux
 * des messages — ils ne voyagent pas dans la copie, précisément pour qu'il
 * n'existe rien à partir de quoi remonter au fil.
 *
 * C'est aussi pourquoi le corbeau signalé reste lisible quand son auteur l'a
 * retiré depuis, ou quand son compte a disparu : la copie ne dépend de rien.
 */
export default async function SignalementPage({
  params,
}: {
  params: { id: string };
}) {
  const signalement = await lireSignalement(params.id);
  if (!signalement) notFound();

  const t = TEXTES_CORBEAUX.moderation;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <Link
          href="/admin/signalements"
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          ← {t.retour}
        </Link>

        <div className="mt-5">
          <EnTeteAdmin
            eyebrow={t.statuts[signalement.statut]}
            titre={signalement.vise ?? t.compteSupprime}
          />
        </div>

        <p className="mt-6 font-body text-sm text-silver">
          {t.colonnePar} : {signalement.par ?? t.compteSupprime} ·{" "}
          {dateLongue(signalement.creeLe)}
        </p>

        {/* Le motif, tel qu'il a été écrit. Figé lui aussi. */}
        <section className="mt-8">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
            {t.motifDonne}
          </h2>
          {signalement.motif ? (
            <p className="mt-3 max-w-[62ch] whitespace-pre-wrap break-words rounded-sm border border-silver/15 bg-mist/40 px-5 py-4 font-body leading-[1.7] text-parchment">
              {signalement.motif}
            </p>
          ) : (
            <p className="mt-3 font-body italic text-silver">{t.motifAbsent}</p>
          )}
        </section>

        {/* ── La copie ── */}
        <section className="mt-10">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
            {t.contexteTitre}
          </h2>
          <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
            {t.contexteAide}
          </p>

          <ol className="mt-5 grid grid-cols-1 gap-2">
            {signalement.contexte.map((ligne, i) => (
              <li
                key={`${ligne.envoyeLe}-${i}`}
                className={`min-w-0 rounded-sm border px-5 py-4 ${
                  ligne.vise
                    ? "border-ember/45 bg-ember/[0.07]"
                    : "border-silver/12 bg-mist/30"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-display text-[0.68rem] uppercase tracking-[0.14em] text-parchment">
                    {ligne.auteur}
                  </p>
                  <span className="font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver">
                    {/* Le corbeau visé ne se signale pas par la seule couleur :
                        il porte son libellé, lisible par tous. */}
                    {ligne.vise ? `${t.corbeauVise} · ` : ""}
                    {ligne.envoyeLe ? dateLongue(ligne.envoyeLe) : "—"}
                  </span>
                </div>
                {/* Rendu par React, donc échappé : rien du texte d'un joueur
                    ne s'exécute, et les retours à la ligne sont conservés. */}
                <p className="mt-2 whitespace-pre-wrap break-words font-body leading-[1.7] text-parchment-dim">
                  {ligne.corps}
                </p>
              </li>
            ))}
          </ol>

          {!signalement.messageEncoreLa ? (
            <p className="mt-4 max-w-[62ch] rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm italic leading-relaxed text-silver">
              {t.messageEfface}
            </p>
          ) : null}

          <p className="mt-4 max-w-[62ch] rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm italic leading-relaxed text-silver">
            {t.limite}
          </p>
        </section>

        {/* ── Le traitement ── */}
        <section className="mt-10 border-t border-silver/12 pt-8">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
            {t.traiter}
          </h2>
          <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
            {t.traiterAide}
          </p>
          <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
            {t.rappelConfidentiel}
          </p>

          {signalement.traiteLe ? (
            <p className="mt-4 font-display text-[0.66rem] uppercase tracking-[0.14em] text-aurora-teal">
              {t.traiteLe
                .replace("{auteur}", signalement.traitePar ?? "—")
                .replace("{date}", dateLongue(signalement.traiteLe))}
            </p>
          ) : null}

          {signalement.noteTraitement ? (
            <p className="mt-3 max-w-[62ch] whitespace-pre-wrap rounded-sm border border-silver/15 bg-mist/40 px-5 py-4 font-body leading-[1.7] text-parchment">
              {signalement.noteTraitement}
            </p>
          ) : null}

          {/* Les deux décisions dans le même formulaire : elles partagent la
              note, et se distinguent par le bouton pressé. */}
          <form action={traiterSignalementAction} className="mt-6 max-w-[42rem]">
            <input type="hidden" name="id" value={signalement.id} />

            <label
              htmlFor="note"
              className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
            >
              {t.note}
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              defaultValue={signalement.noteTraitement ?? ""}
              placeholder={t.noteInvite}
              className="mt-2 w-full resize-y rounded-sm border border-silver/25 bg-mist/50 px-4 py-3 font-body text-base leading-[1.7] text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                name="statut"
                value="TRAITE"
                className="btn btn-ghost tracking-[0.12em]"
              >
                {t.marquerTraite}
              </button>
              <button
                type="submit"
                name="statut"
                value="CLASSE_SANS_SUITE"
                className="btn btn-ghost tracking-[0.12em]"
              >
                {t.classerSansSuite}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
