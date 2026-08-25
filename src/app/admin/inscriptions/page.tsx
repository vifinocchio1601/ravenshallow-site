import type { Metadata } from "next";
import Link from "next/link";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { listerDossiersEnAttente, modeDemonstration } from "@/lib/dossier/depot";
import { TEXTES_ETATS } from "@/lib/dossier/etats";

/**
 * Jamais prérendue : la page lit l’état courant des dossiers, et elle est de
 * toute façon derrière une session. Sans cela, Next la fige au build.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscriptions — Administration",
  robots: { index: false, follow: false },
};

export default async function InscriptionsPage() {
  const dossiers = await listerDossiersEnAttente();
  const t = TEXTES_ETATS.admin.inscriptions;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin
          eyebrow={t.eyebrow}
          titre={t.titre}
          demonstration={modeDemonstration()}
        />

        {dossiers.length === 0 ? (
          <p className="mt-12 rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-10 text-center leading-[1.7] text-parchment-dim">
            {t.vide}
          </p>
        ) : (
          <ul className="mt-10 grid gap-4">
            {dossiers.map((dossier) => (
              <li
                key={dossier.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-silver/12 bg-mist/50 px-6 py-5"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold tracking-[0.03em] text-parchment">
                    {dossier.prenomNom}
                  </p>
                  <p className="mt-1 font-body text-sm text-silver">
                    {dossier.email}
                    {dossier.soumisLe ? (
                      <>
                        {" · "}
                        {t.depuis}{" "}
                        {new Date(dossier.soumisLe).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </>
                    ) : null}
                  </p>
                </div>

                <Link
                  href={`/admin/dossiers/${dossier.id}`}
                  className="btn btn-ghost"
                >
                  {t.lire}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
