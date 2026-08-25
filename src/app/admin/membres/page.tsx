import type { Metadata } from "next";
import Link from "next/link";
import { modifierMembreAction } from "@/app/admin/actions";
import BoutonSupprimerMembre from "@/components/admin/BoutonSupprimerMembre";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { listerMembres, modeDemonstration } from "@/lib/dossier/depot";
import {
  FONCTIONS,
  libelleFonction,
  LIBELLES_STATUT_ACCES,
  STATUTS_ACCES,
  TEXTES_ETATS,
} from "@/lib/dossier/etats";

/**
 * Jamais prérendue : la page lit l’état courant des dossiers, et elle est de
 * toute façon derrière une session. Sans cela, Next la fige au build.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membres — Administration",
  robots: { index: false, follow: false },
};

export default async function MembresPage() {
  const membres = await listerMembres();
  const t = TEXTES_ETATS.admin.membres;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin
          eyebrow={t.eyebrow}
          titre={t.titre}
          demonstration={modeDemonstration()}
        />

        {membres.length === 0 ? (
          <p className="mt-12 rounded-sm border border-dashed border-silver/20 bg-void/40 px-6 py-10 text-center leading-[1.7] text-parchment-dim">
            {t.vide}
          </p>
        ) : (
          <ul className="mt-10 grid gap-5">
            {membres.map((membre) => (
              <li
                key={membre.id}
                className="rounded-sm border border-silver/12 bg-mist/50 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Le dialogue de confirmation est du contenu de flux : il ne
                      peut pas vivre dans le <p> du nom. */}
                  <div className="flex items-center gap-3">
                    <BoutonSupprimerMembre
                      id={membre.id}
                      nom={membre.prenomNom}
                    />
                    <p className="font-display text-lg font-semibold tracking-[0.03em] text-parchment">
                      {membre.prenomNom}
                    </p>
                  </div>
                  <p className="font-body text-sm text-silver">
                    {membre.email} ·{" "}
                    {libelleFonction(membre.fonction, membre.genre)} ·{" "}
                    {LIBELLES_STATUT_ACCES[membre.statutAcces].court}{" "}
                    <Link
                      href={`/admin/dossiers/${membre.id}`}
                      className="ml-2 font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
                    >
                      Fiche et journal
                    </Link>
                  </p>
                </div>

                {/* Un formulaire par membre : chaque enregistrement est
                    indépendant et laisse sa trace au journal. */}
                <form
                  action={modifierMembreAction}
                  className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[6rem_1fr_1fr_auto] lg:items-end"
                >
                  <input type="hidden" name="id" value={membre.id} />

                  <div>
                    <label
                      htmlFor={`age-${membre.id}`}
                      className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
                    >
                      {t.age}
                    </label>
                    <input
                      id={`age-${membre.id}`}
                      name="age"
                      type="number"
                      min={11}
                      max={120}
                      defaultValue={membre.age}
                      className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`fonction-${membre.id}`}
                      className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
                    >
                      {t.fonction}
                    </label>
                    <select
                      id={`fonction-${membre.id}`}
                      name="fonction"
                      defaultValue={membre.fonction}
                      className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
                    >
                      {FONCTIONS.map((fonction) => (
                        <option key={fonction} value={fonction}>
                          {libelleFonction(fonction, membre.genre)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`acces-${membre.id}`}
                      className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
                    >
                      {t.acces}
                    </label>
                    <select
                      id={`acces-${membre.id}`}
                      name="statutAcces"
                      defaultValue={membre.statutAcces}
                      className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
                    >
                      {STATUTS_ACCES.map((statut) => (
                        <option key={statut} value={statut}>
                          {LIBELLES_STATUT_ACCES[statut].court} —{" "}
                          {LIBELLES_STATUT_ACCES[statut].detail}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-ghost">
                    {t.enregistrer}
                  </button>

                  <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[13rem_1fr] lg:col-span-4">
                    {/* Vide = exclusion définitive. Ignorée hors bannissement,
                        et effacée dès que l'accès est rétabli. */}
                    <div>
                      <label
                        htmlFor={`fin-${membre.id}`}
                        className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
                      >
                        {t.jusquau}
                      </label>
                      <input
                        id={`fin-${membre.id}`}
                        name="banniJusquau"
                        type="date"
                        defaultValue={membre.banniJusquau?.slice(0, 10) ?? ""}
                        aria-describedby={`fin-aide-${membre.id}`}
                        className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
                      />
                      <p
                        id={`fin-aide-${membre.id}`}
                        className="mt-1 font-body text-xs italic text-silver"
                      >
                        {t.jusquauAide}
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`note-${membre.id}`} className="sr-only">
                        Motif
                      </label>
                      <input
                        id={`note-${membre.id}`}
                        name="note"
                        type="text"
                        placeholder="Motif — obligatoire pour un bannissement, consigné au journal"
                        className="mt-2 w-full rounded-sm border border-silver/20 bg-mist/40 px-3 py-2 font-body text-sm text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
                      />
                    </div>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
