import type { Metadata } from "next";
import Link from "next/link";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { listerCourrier } from "@/lib/corbeaux/courrier";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courrier — Administration",
  robots: { index: false, follow: false },
};

/**
 * Les lettres adressées à l'administration.
 *
 * Séparé des signalements à dessein : ce ne sont pas les mêmes gestes, et
 * mélanger une question anodine avec un signalement de harcèlement dans la
 * même file est le meilleur moyen de traiter les deux mal.
 *
 * La page ne lit que `lib/corbeaux/courrier.ts`, dont chaque requête porte le
 * filtre `AVEC_ADMINISTRATION` écrit en toutes lettres. Les conversations
 * entre joueurs restent hors de portée — et un test relit le code source pour
 * s'en assurer.
 *
 * Le contenu des lettres ne descend pas jusqu'ici, seulement leur nombre : la
 * file reste ouverte sur un écran, et des fragments n'ont pas à y traîner.
 */
export default async function CourrierPage() {
  const fils = await listerCourrier();
  const t = TEXTES_CORBEAUX.courrier;
  const enAttente = fils.filter((f) => f.enAttente).length;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[60ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[60ch] rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm italic leading-relaxed text-silver">
          {t.limite}
        </p>

        {fils.length === 0 ? (
          <p className="mt-12 rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-10 text-center leading-[1.7] text-parchment-dim">
            {t.vide}
            <span className="mt-2 block font-body text-sm italic text-silver">
              {t.videAide}
            </span>
          </p>
        ) : (
          <>
            {enAttente > 0 ? (
              <p className="mt-8 font-display text-[0.68rem] uppercase tracking-[0.18em] text-aurora-teal">
                {enAttente === 1
                  ? t.unEnAttente
                  : t.enAttente.replace("{n}", String(enAttente))}
              </p>
            ) : null}

            <ul className="mt-4 grid grid-cols-1 gap-3">
              {fils.map((fil) => (
                <li key={fil.id} className="min-w-0">
                  <Link
                    href={`/admin/courrier/${fil.id}`}
                    className="block rounded-sm border border-silver/12 bg-mist/50 px-5 py-4 transition-colors duration-300 hover:border-silver/30"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-display text-[0.8rem] uppercase tracking-[0.1em] text-parchment">
                        {fil.membre ?? t.membreInconnu}
                      </p>
                      {/* L'état ne se signale pas par la seule couleur : il
                          porte son libellé, lisible par tous. */}
                      <span
                        className={`font-display text-[0.62rem] uppercase tracking-[0.14em] ${
                          fil.enAttente ? "text-aurora-teal" : "text-silver"
                        }`}
                      >
                        {fil.enAttente ? t.badgeEnAttente : t.badgeRepondu}
                      </span>
                    </div>

                    <p className="mt-1 font-body text-sm text-silver">
                      {t.corbeaux} : {fil.corbeaux} ·{" "}
                      {new Date(fil.dernierMessageLe).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {fil.suspendu ? (
                        <span className="ml-2 text-ember">· {t.badgeSuspendu}</span>
                      ) : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
