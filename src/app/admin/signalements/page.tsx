import type { Metadata } from "next";
import Link from "next/link";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { listerSignalements } from "@/lib/corbeaux/moderation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signalements — Administration",
  robots: { index: false, follow: false },
};

/**
 * La file des signalements.
 *
 * **C'est la seule fenêtre du staff sur les échanges privés**, et elle est
 * étroite à dessein : cette page ne lit que la table des signalements, par
 * `lib/corbeaux/moderation.ts`, qui n'importe rien du dépôt des conversations.
 * Il n'existe aucun chemin d'ici vers une boîte, une recherche ou un export —
 * pas une requête qu'on s'interdirait d'écrire, un chemin qui n'existe pas.
 *
 * La liste ne montre pas le contenu des corbeaux, seulement leur nombre : des
 * fragments d'échanges privés n'ont pas à traîner sur un écran qu'on laisse
 * ouvert.
 */
export default async function SignalementsPage() {
  const signalements = await listerSignalements();
  const t = TEXTES_CORBEAUX.moderation;
  const enAttente = signalements.filter((s) => s.statut === "EN_ATTENTE").length;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[60ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        {/* Dit en tête, et répété sur chaque détail : personne ne doit
            chercher un bouton qui n'existera jamais. */}
        <p className="mt-3 max-w-[60ch] rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm italic leading-relaxed text-silver">
          {t.limite}
        </p>

        {signalements.length === 0 ? (
          <p className="mt-12 rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-10 text-center leading-[1.7] text-parchment-dim">
            {t.vide}
            <span className="mt-2 block font-body text-sm italic text-silver">
              {t.videAide}
            </span>
          </p>
        ) : (
          <>
            <p className="mt-8 font-display text-[0.68rem] uppercase tracking-[0.18em] text-aurora-teal">
              {enAttente === 1
                ? t.unEnAttente
                : t.enAttente.replace("{n}", String(enAttente))}
            </p>

            <ul className="mt-4 grid grid-cols-1 gap-3">
              {signalements.map((signalement) => (
                <li key={signalement.id} className="min-w-0">
                  <Link
                    href={`/admin/signalements/${signalement.id}`}
                    className="block rounded-sm border border-silver/12 bg-mist/50 px-5 py-4 transition-colors duration-300 hover:border-silver/30"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-display text-[0.8rem] uppercase tracking-[0.1em] text-parchment">
                        {signalement.vise ?? t.compteSupprime}
                      </p>
                      <span
                        className={`font-display text-[0.62rem] uppercase tracking-[0.14em] ${
                          signalement.statut === "EN_ATTENTE"
                            ? "text-aurora-teal"
                            : "text-silver"
                        }`}
                      >
                        {t.statuts[signalement.statut]}
                      </span>
                    </div>

                    <p className="mt-1 font-body text-sm text-silver">
                      {t.colonnePar} : {signalement.par ?? t.compteSupprime} ·{" "}
                      {t.colonneCorbeaux} : {signalement.corbeaux} ·{" "}
                      {new Date(signalement.creeLe).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {signalement.motif ? (
                      <p className="mt-2 line-clamp-2 font-body italic leading-relaxed text-parchment-dim">
                        « {signalement.motif} »
                      </p>
                    ) : (
                      <p className="mt-2 font-body text-sm italic text-silver">
                        {t.motifAbsent}
                      </p>
                    )}
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
