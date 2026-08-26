import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repondreAuCourrierAction } from "@/app/admin/courrier/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { lireCourrier } from "@/lib/corbeaux/courrier";
import { CORBEAU_MAX } from "@/lib/corbeaux/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courrier — Administration",
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
 * Une lettre, et de quoi y répondre.
 *
 * `lireCourrier` refait le filtre `AVEC_ADMINISTRATION` sur l'identifiant reçu
 * de l'URL : taper à la main celui d'une conversation entre joueurs ne l'ouvre
 * pas, il rend `null`, et la page répond 404. Le filtre est refait une
 * troisième fois avant d'écrire, dans `repondreAuCourrier` — une action
 * serveur est une route publique, et la garde de la page ne la protège pas.
 */
export default async function CourrierFilPage({
  params,
}: {
  params: { id: string };
}) {
  const fil = await lireCourrier(params.id);
  if (!fil) notFound();

  const t = TEXTES_CORBEAUX.courrier;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <Link
          href="/admin/courrier"
          className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          ← {t.retour}
        </Link>

        <div className="mt-5">
          <EnTeteAdmin
            eyebrow={fil.enAttente ? t.badgeEnAttente : t.badgeRepondu}
            titre={fil.membre ?? t.membreInconnu}
          />
        </div>

        {/* Un membre suspendu qui écrit conteste le plus souvent sa sanction :
            le staff doit le savoir avant de lire, pas après. */}
        {fil.suspendu ? (
          <p className="mt-5 max-w-[60ch] rounded-sm border border-ember/35 bg-ember/[0.07] px-4 py-3 font-body text-sm leading-relaxed text-parchment">
            {t.badgeSuspendu}
          </p>
        ) : null}

        <section className="mt-9">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
            {t.filTitre}
          </h2>

          <ol className="mt-5 grid grid-cols-1 gap-2">
            {fil.corbeaux.map((corbeau) => (
              <li
                key={corbeau.id}
                className={`min-w-0 rounded-sm border px-5 py-4 ${
                  corbeau.deLAdministration
                    ? "border-aurora-teal/25 bg-aurora-teal/[0.06]"
                    : "border-silver/12 bg-mist/40"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-display text-[0.68rem] uppercase tracking-[0.14em] text-parchment">
                    {/* Un corbeau sans auteur ne peut venir que du château :
                        dans ce fil, il n'y a que deux interlocuteurs. */}
                    {corbeau.deLAdministration
                      ? t.signature
                      : (corbeau.auteur ?? t.membreInconnu)}
                  </p>
                  <span className="font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver">
                    {dateLongue(corbeau.envoyeLe)}
                  </span>
                </div>
                {/* Rendu par React, donc échappé : rien du texte d'un joueur
                    ne s'exécute, et les retours à la ligne sont conservés. */}
                <p className="mt-2 whitespace-pre-wrap break-words font-body leading-[1.7] text-parchment-dim">
                  {corbeau.corps}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-t border-silver/12 pt-8">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.2em] text-parchment">
            {t.repondre}
          </h2>
          <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
            {t.repondreAide}
          </p>

          <form action={repondreAuCourrierAction} className="mt-5 max-w-[42rem]">
            <input type="hidden" name="id" value={fil.id} />

            <label
              htmlFor="corps"
              className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
            >
              {t.champ}
            </label>
            <textarea
              id="corps"
              name="corps"
              rows={5}
              required
              maxLength={CORBEAU_MAX}
              placeholder={t.invite}
              className="mt-2 w-full resize-y rounded-sm border border-silver/25 bg-mist/50 px-4 py-3 font-body text-base leading-[1.7] text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
            />

            <button type="submit" className="btn btn-ghost mt-4 tracking-[0.12em]">
              {t.envoyer}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
