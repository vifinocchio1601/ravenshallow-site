import type { EntreeJournal } from "@/lib/dossier/depot";
import {
  libelleFonction,
  LIBELLES_STATUT_ACCES,
  LIBELLES_STATUT_DOSSIER,
  TEXTES_ETATS,
  type Fonction,
  type Genre,
  type StatutAcces,
  type StatutDossier,
} from "@/lib/dossier/etats";

const LIBELLES: Record<EntreeJournal["type"], string> = {
  DOSSIER_SOUMIS: "Dossier déposé",
  FICHE_MODIFIEE: "Fiche reprise par le joueur",
  DOSSIER_ACCEPTE: "Dossier accepté",
  DOSSIER_RENVOYE_EN_CORRECTION: "Renvoyé en correction",
  DOSSIER_REFUSE: "Dossier refusé",
  AGE_MODIFIE: "Âge modifié",
  FONCTION_MODIFIEE: "Fonction modifiée",
  ACCES_MODIFIE: "Accès modifié",
};

/**
 * Traduit une valeur du journal. Elle est stockée en texte brut — un âge, un
 * enum — et n’a de sens qu’au regard du type d’événement.
 */
function lisible(
  type: EntreeJournal["type"],
  valeur: string | null,
  genre: Genre,
): string | null {
  if (!valeur) return null;
  if (type === "AGE_MODIFIE") return `${valeur} ans`;
  // Liste de champs, déjà lisible telle quelle.
  if (type === "FICHE_MODIFIEE") return valeur;
  if (type === "FONCTION_MODIFIEE") {
    return libelleFonction(valeur as Fonction, genre);
  }
  if (type === "ACCES_MODIFIE") {
    return LIBELLES_STATUT_ACCES[valeur as StatutAcces]?.court ?? valeur;
  }
  return LIBELLES_STATUT_DOSSIER[valeur as StatutDossier] ?? valeur;
}

/** Fil chronologique d’un membre : décisions et modifications. */
export default function JournalMembre({
  entrees,
  genre,
  className = "",
}: {
  entrees: EntreeJournal[];
  genre: Genre;
  className?: string;
}) {
  const t = TEXTES_ETATS.admin.journal;

  return (
    <section className={className}>
      <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
        {t.titre}
      </h2>

      {entrees.length === 0 ? (
        <p className="mt-3 italic text-silver">{t.vide}</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l border-silver/15 pl-5">
          {entrees.map((entree) => {
            const avant = lisible(entree.type, entree.valeurAvant, genre);
            const apres = lisible(entree.type, entree.valeurApres, genre);
            return (
            <li key={entree.id}>
              <p className="font-display text-[0.68rem] uppercase tracking-[0.14em] text-parchment-dim">
                {LIBELLES[entree.type]}
                {apres ? (
                  <span className="text-silver">
                    {" "}
                    · {avant ? `${avant} → ${apres}` : apres}
                  </span>
                ) : null}
              </p>

              <p className="mt-1 font-body text-sm text-silver">
                {new Date(entree.creeLe).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                — {t.par} {entree.parNom ?? t.systeme}
              </p>

              {entree.note ? (
                <p className="mt-2 border-l border-ember/40 pl-4 font-body italic leading-relaxed text-parchment-dim">
                  «&nbsp;{entree.note}&nbsp;»
                </p>
              ) : null}
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
