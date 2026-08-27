import type { Metadata } from "next";
import Link from "next/link";
import { archiverAction, restaurerAction } from "@/app/admin/absences/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { listerLesAbsences, type LigneAbsence } from "@/lib/dossier/archivage";
import { TEXTES_POINTS } from "@/lib/points/constantes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_POINTS.absences.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Qui n’est pas venu depuis longtemps — art. 7.3.**
 *
 * Un écran à part, et non une colonne de plus dans la liste des membres :
 * celle-ci répond à « que devient Sigrid ? », celui-ci à « qui n’est pas
 * revenu ? ». Ce n’est pas la même question, et la première est triée par
 * nom — l’absent s’y perd au milieu des présents.
 *
 * **Rien ne s’archive tout seul.** L’écran donne le fait, le joueur décide.
 * Décision du 27 août 2026, la même que pour la clôture d’année : un compte
 * fermé sans que personne l’ait voulu se vit très mal.
 */
export default async function AbsencesPage() {
  const t = TEXTES_POINTS.absences;
  const lignes = await listerLesAbsences();
  const actifs = lignes.filter((l) => l.archiveLe === null);
  const archives = lignes.filter((l) => l.archiveLe !== null);
  const aucunAbsent = actifs.every((l) => !l.archivable);

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappelDouceur}
        </p>
        <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappelManuel}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.colonneMembre}
          </h2>
          {aucunAbsent ? (
            <p className="mt-3 font-body text-sm italic leading-relaxed text-silver">
              {t.aucunAbsent}
            </p>
          ) : null}

          <ul className="mt-3 grid grid-cols-1 gap-2">
            {actifs.map((ligne) => (
              <Ligne key={ligne.utilisateurId} ligne={ligne}>
                {ligne.archivable ? (
                  <form action={archiverAction}>
                    <input type="hidden" name="utilisateurId" value={ligne.utilisateurId} />
                    <Bouton
                      libelle={t.archiver}
                      aria={t.archiverAria.replace("{nom}", ligne.prenomNom)}
                    />
                  </form>
                ) : null}
              </Ligne>
            ))}
          </ul>

          {/* La colonne n'existe que depuis le 27 août 2026 : le dire évite
              qu'on prenne un « pas encore notée » pour une absence, et qu'on
              archive l'école entière d'un clic. */}
          {actifs.some((l) => l.derniereConnexionLe === null) ? (
            <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
              {t.jamaisNoteeAide}
            </p>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.titreArchives}
          </h2>
          {archives.length === 0 ? (
            <p className="mt-3 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.aucunArchive}
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {archives.map((ligne) => (
                <Ligne key={ligne.utilisateurId} ligne={ligne}>
                  <form action={restaurerAction}>
                    <input type="hidden" name="utilisateurId" value={ligne.utilisateurId} />
                    <Bouton
                      libelle={t.restaurer}
                      aria={t.restaurerAria.replace("{nom}", ligne.prenomNom)}
                    />
                  </form>
                </Ligne>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Ligne({
  ligne,
  children,
}: {
  ligne: LigneAbsence;
  children: React.ReactNode;
}) {
  const t = TEXTES_POINTS.absences;

  return (
    <li className="min-w-0 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="min-w-0 truncate font-body text-parchment">
            {ligne.prenomNom}
            {/* Le seuil dit en clair, plutôt qu'une couleur : trois mois, et
                c'est le règlement, pas un réglage. Le NOMBRE du seuil serait
                trompeur — « 90 jours » à côté d'une absence de cent se lit
                comme la durée, et contredit la ligne du dessous. */}
            {ligne.archivable ? (
              <span className="ml-2 font-display text-[0.6rem] uppercase tracking-[0.12em] text-ember">
                {t.seuilAtteint}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 font-body text-xs italic text-silver">
            {t.colonneDerniere} :{" "}
            {ligne.derniereConnexionLe === null ? (
              t.jamaisNotee
            ) : (
              // L'instant voyage en ISO ; c'est le navigateur qui met en forme,
              // la seule juste pour qui lit — le serveur vit en UTC.
              <time dateTime={ligne.derniereConnexionLe} suppressHydrationWarning>
                {jour(ligne.derniereConnexionLe)} · {absence(ligne.joursDAbsence)}
              </time>
            )}
          </p>
          {ligne.archiveLe ? (
            <p className="mt-0.5 font-body text-xs italic text-silver">
              {t.archiveLe
                .replace("{date}", jour(ligne.archiveLe))
                .replace("{auteur}", ligne.archivePar ?? "—")}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {children}
          <Link
            href={`/admin/dossiers/${ligne.utilisateurId}`}
            className="font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-aurora-teal"
          >
            Fiche et journal
          </Link>
        </div>
      </div>
    </li>
  );
}

/** « il y a 94 jours », « hier », « aujourd’hui ». */
function absence(jours: number | null): string {
  const t = TEXTES_POINTS.absences;
  if (jours === null) return t.jamaisNotee;
  if (jours <= 0) return t.aujourdHui;
  if (jours === 1) return t.depuisUnJour;
  return t.depuis.replace("{n}", String(jours));
}

function jour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Bouton({ libelle, aria }: { libelle: string; aria: string }) {
  return (
    <button
      type="submit"
      // Dans une liste de trente membres, « Archiver » ne dit pas qui à qui
      // écoute — le nom voyage donc avec le bouton.
      aria-label={aria}
      className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
    >
      {libelle}
    </button>
  );
}
