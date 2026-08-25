import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import BoutonDeconnexion from "@/components/connexion/BoutonDeconnexion";
import EcranEtat from "./EcranEtat";
import { TEXTES_ETATS } from "@/lib/dossier/etats";

/**
 * Coquille des trois écrans d’état du dossier.
 *
 * Ce sont des culs-de-sac assumés : rien de l’école ne s’ouvre avant
 * l’acceptation. Le pied de page n’offre donc que deux issues — écrire à
 * l’administration, ou repartir — et la navigation ne montre aucune porte,
 * puisqu’il n’y en a pas à ouvrir d’ici.
 */
export default function PageEtat({
  ton = "attente",
  titre,
  corps,
  badge,
  note,
  noteTitre,
  detail,
  children,
}: {
  ton?: "attente" | "correction" | "accepte";
  titre: string;
  corps: string;
  badge: string;
  note?: string | null;
  noteTitre?: string;
  detail?: ReactNode;
  children?: ReactNode;
}) {
  const t = TEXTES_ETATS.pages;

  return (
    <>
      <Nav connecte={null} />
      <main className="relative flex min-h-[100svh] items-center bg-void px-6 py-28 sm:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.07)_0%,transparent_72%)]"
        />

        <div className="relative mx-auto w-full max-w-[44rem]">
          <EcranEtat ton={ton} titre={titre} corps={corps} badge={badge}>
            {note ? (
              <blockquote className="mx-auto mt-8 max-w-[46ch] border-l-2 border-ember/60 pl-5 text-left">
                {noteTitre ? (
                  <p className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver">
                    {noteTitre}
                  </p>
                ) : null}
                <p className="mt-2 font-body italic leading-relaxed text-parchment-dim">
                  «&nbsp;{note}&nbsp;»
                </p>
              </blockquote>
            ) : null}

            {children}
          </EcranEtat>

          {detail ? (
            <div className="mx-auto mt-10 max-w-[52ch] space-y-4 text-center font-body leading-[1.8] text-parchment-dim">
              {detail}
            </div>
          ) : null}

          <div className="hairline my-10" />

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <a
              href={`mailto:${t.adresseContact}`}
              className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              {t.contact}
            </a>
            <BoutonDeconnexion className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver transition-colors duration-300 hover:text-aurora-teal disabled:opacity-50" />
          </div>
        </div>
      </main>
    </>
  );
}
