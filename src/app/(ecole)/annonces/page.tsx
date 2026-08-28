import type { Metadata } from "next";
import Link from "next/link";
import { listerAnnonces } from "@/lib/annonces/depot";
import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_ANNONCES.liste;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le Grand Hall** — l'espace officiel de l'administration (bible §12).
 *
 * On y lit, on n'y débat pas : aucune réponse, aucun bouton d'écriture. C'est
 * précisément ce que le moteur du forum ne savait pas exprimer, et la raison
 * pour laquelle les annonces vivent dans leur propre table.
 *
 * La page ne décide de rien : `listerAnnonces` a déjà écarté ce qui est
 * retiré. Ici on met en forme.
 */
export default async function Page() {
  await exigerAcces(ROUTES.annonces);
  const annonces = await listerAnnonces();

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛗ
        </span>
        {T.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      {annonces.length === 0 ? (
        <p className="mt-12 font-body italic leading-[1.8] text-silver">
          {T.vide}
        </p>
      ) : (
        <ul aria-label={T.ariaListe} className="mt-10 grid grid-cols-1 gap-4">
          {annonces.map((annonce) => (
            // `min-w-0` sur l'élément ET `grid-cols-1` sur la liste : sans les
            // deux, un titre long élargit la carte au-delà de l'écran, et sur
            // téléphone la date sort du cadre.
            <li
              key={annonce.id}
              className="min-w-0 rounded-md border border-silver/15 bg-void/40 p-5 transition-colors hover:border-aurora-teal/40"
            >
              <h2 className="font-display text-lg leading-snug text-parchment">
                <Link
                  href={`${ROUTES.annonces}/${annonce.id}`}
                  className="hover:text-aurora-teal"
                >
                  {annonce.titre}
                </Link>
              </h2>

              <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {/* L'instant voyage en ISO ; c'est le navigateur qui met en
                    forme, la seule juste pour qui lit — le serveur vit en UTC. */}
                <time
                  dateTime={annonce.publieeLe}
                  suppressHydrationWarning
                  className="font-body text-xs italic text-silver"
                >
                  {TEXTES_ANNONCES.annonce.affichee.replace(
                    "{date}",
                    enJour(annonce.publieeLe),
                  )}
                </time>

                {annonce.entreeEnVigueurLe ? (
                  <time
                    dateTime={annonce.entreeEnVigueurLe}
                    suppressHydrationWarning
                    className="font-display text-[0.66rem] uppercase tracking-[0.18em] text-ember/85"
                  >
                    {TEXTES_ANNONCES.annonce.enVigueur.replace(
                      "{date}",
                      enJour(annonce.entreeEnVigueurLe),
                    )}
                  </time>
                ) : null}
              </p>

              <p className="mt-3 font-body leading-[1.8] text-parchment-dim">
                {annonce.extrait}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/** « 28 août 2026 ». */
function enJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
