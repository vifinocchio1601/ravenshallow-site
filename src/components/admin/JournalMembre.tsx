import type { EntreeJournal } from "@/lib/dossier/depot";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POUVOIRS } from "@/lib/forum/constantes";
import type { Permission } from "@/lib/forum/pouvoirs";
import {
  libelleAnnee,
  LIBELLES_ETAT_ETAPE,
  LIBELLES_ROLE,
  LIBELLES_STATUT_ACCES,
  LIBELLES_STATUT_DOSSIER,
  TEXTES_ETATS,
  type Etape,
  type EtatEtape,
  type Fonction,
  type Role,
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
  FONCTION_MODIFIEE: "Année modifiée",
  ROLE_AFFICHE_MODIFIE: "Rôle particulier modifié",
  ETAT_MAISON_MODIFIE: "Maison — étape modifiée",
  ETAT_BAGUETTE_MODIFIE: "Baguette — étape modifiée",
  ACCES_MODIFIE: "Accès modifié",
  COURRIEL_CONFIRMATION: "Accusé de réception",
  ROLE_MODIFIE: "Rôle sur le site modifié",
  PERMISSION_ACCORDEE: TEXTES_POUVOIRS.journal.PERMISSION_ACCORDEE,
  PERMISSION_RETIREE: TEXTES_POUVOIRS.journal.PERMISSION_RETIREE,
  PREFET_NOMME: TEXTES_POUVOIRS.journal.PREFET_NOMME,
  PREFET_DEMIS: TEXTES_POUVOIRS.journal.PREFET_DEMIS,
};

/**
 * Traduit une valeur du journal. Elle est stockée en texte brut — un âge, un
 * enum — et n’a de sens qu’au regard du type d’événement.
 */
function lisible(
  type: EntreeJournal["type"],
  valeur: string | null,
): string | null {
  // Un rôle effacé n'est pas « rien à dire » : c'est le retour à l'année, et
  // la ligne doit le montrer. D'où ce cas avant le garde-fou du vide.
  if (type === "ROLE_AFFICHE_MODIFIE") return valeur || "aucun";
  if (!valeur) return null;
  if (type === "ETAT_MAISON_MODIFIE" || type === "ETAT_BAGUETTE_MODIFIE") {
    return LIBELLES_ETAT_ETAPE[valeur as EtatEtape] ?? valeur;
  }
  if (type === "AGE_MODIFIE") return `${valeur} ans`;
  // Liste de champs, déjà lisible telle quelle.
  if (type === "FICHE_MODIFIEE") return valeur;
  // « envoyé » ou « échec », déjà écrits en toutes lettres.
  if (type === "COURRIEL_CONFIRMATION") return valeur;
  if (type === "FONCTION_MODIFIEE") {
    return libelleAnnee(valeur as Fonction);
  }
  if (type === "ACCES_MODIFIE") {
    return LIBELLES_STATUT_ACCES[valeur as StatutAcces]?.court ?? valeur;
  }
  if (type === "ROLE_MODIFIE") {
    return LIBELLES_ROLE[valeur as Role]?.court ?? valeur;
  }
  if (type === "PREFET_NOMME" || type === "PREFET_DEMIS") {
    return NOMS_MAISON[valeur] ?? valeur;
  }
  // « ANNONCES_MAISON:KALDRAFN » — la permission, et la maison quand il y en
  // a une. Le journal doit dire SUR QUOI le pouvoir portait : « pouvoir
  // retiré » sans la maison ne se relit pas six mois plus tard.
  if (type === "PERMISSION_ACCORDEE" || type === "PERMISSION_RETIREE") {
    const [permission, maison] = valeur.split(":");
    const nom =
      TEXTES_POUVOIRS.permissions[permission as Permission]?.nom ?? permission;
    return maison ? `${nom} — ${NOMS_MAISON[maison] ?? maison}` : nom;
  }
  return LIBELLES_STATUT_DOSSIER[valeur as StatutDossier] ?? valeur;
}

/** Fil chronologique d’un membre : décisions et modifications. */
export default function JournalMembre({
  entrees,
  className = "",
}: {
  entrees: EntreeJournal[];
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
            const avant = lisible(entree.type, entree.valeurAvant);
            const apres = lisible(entree.type, entree.valeurApres);
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
