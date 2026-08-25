import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireDecision from "@/components/admin/FormulaireDecision";
import JournalMembre from "@/components/admin/JournalMembre";
import { lireDossier, modeDemonstration } from "@/lib/dossier/depot";
import { libelleAnnee, libellePlace, TEXTES_ETATS } from "@/lib/dossier/etats";
import { FAMILLES, LIMITES_ECRITURE, TYPES_PORTRAIT } from "@/lib/dossier/constantes";

export const metadata: Metadata = {
  title: "Lecture d’un dossier — Administration",
  robots: { index: false, follow: false },
};

function libelle(
  liste: readonly { valeur: string; libelle: string }[],
  valeur: string,
) {
  return liste.find((e) => e.valeur === valeur)?.libelle ?? valeur;
}

export default async function DossierAdminPage({
  params,
}: {
  params: { id: string };
}) {
  const dossier = await lireDossier(params.id);
  if (!dossier) notFound();

  const t = TEXTES_ETATS.admin;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin
          eyebrow="Dossier"
          titre={dossier.prenomNom}
          demonstration={modeDemonstration()}
          retour={
            dossier.statut === "ACCEPTE"
              ? { href: "/admin/membres", libelle: "Retour aux membres" }
              : { href: "/admin/inscriptions", libelle: t.actions.retour }
          }
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr] lg:items-start">
          {/* ── Portrait ── */}
          <div>
            {dossier.portraitUrl ? (
              <Image
                src={dossier.portraitUrl}
                alt={`Portrait de ${dossier.prenomNom}`}
                width={720}
                height={1280}
                className="w-full rounded-sm border border-silver/15"
              />
            ) : (
              <div className="flex aspect-[9/16] w-full items-center justify-center rounded-sm border border-dashed border-silver/20 bg-mist/40 text-center font-display text-[0.68rem] uppercase tracking-[0.14em] text-silver">
                Portrait absent
              </div>
            )}

            <dl className="mt-6 space-y-3 font-body text-sm">
              <Ligne terme="Adresse" valeur={dossier.email} />
              <Ligne
                terme="Âge / place"
                valeur={`${dossier.age} ans · ${libellePlace(dossier.fonction, dossier.roleAffiche)}`}
              />
              {/* Le rôle masque l'année sans l'effacer : ici, côté
                  administration, on montre les deux — plus qui l'a posé et
                  quand. Ce champ distingue publiquement un membre des autres. */}
              {dossier.roleAffiche ? (
                <Ligne
                  terme="Rôle particulier"
                  valeur={`${dossier.roleAffiche} — décoratif, n’accorde aucun droit. Année masquée : ${libelleAnnee(dossier.fonction)}. ${
                    dossier.roleAffichePoseLe
                      ? `Posé par ${dossier.roleAffichePosePar ?? "—"} le ${new Date(dossier.roleAffichePoseLe).toLocaleDateString("fr-FR")}`
                      : ""
                  }`}
                />
              ) : null}
              <Ligne
                terme="Famille"
                valeur={libelle(FAMILLES, dossier.famille)}
              />
              <Ligne
                terme="Portrait"
                valeur={
                  libelle(TYPES_PORTRAIT, dossier.portraitType) +
                  (dossier.acteurNom ? ` — ${dossier.acteurNom}` : "")
                }
              />
              <Ligne
                terme="Article 10.4"
                valeur={
                  dossier.certification104Le
                    ? `Certifié le ${new Date(dossier.certification104Le).toLocaleDateString("fr-FR")}`
                    : "Non certifié"
                }
              />
            </dl>
          </div>

          {/* ── La fiche ── */}
          <div className="min-w-0">
            <Bloc titre="Biographie">
              <p className="whitespace-pre-line leading-[1.8] text-parchment-dim">
                {dossier.biographie}
              </p>
              <p className="mt-3 font-display text-[0.66rem] uppercase tracking-[0.12em] text-silver">
                {dossier.biographie.trim().length} signes
              </p>
            </Bloc>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <Bloc titre="Trois qualités">
                <Liste entrees={dossier.qualites} />
              </Bloc>
              <Bloc titre="Trois défauts">
                <Liste entrees={dossier.defauts} />
              </Bloc>
            </div>

            <Bloc titre="Sa plus grande peur" className="mt-8">
              <p className="leading-[1.8] text-parchment-dim">
                {dossier.plusGrandePeur}
              </p>
            </Bloc>

            <Bloc titre="Limites d’écriture" className="mt-8">
              {dossier.limitesEcriture.length || dossier.limitesAutres ? (
                <p className="leading-[1.8] text-parchment-dim">
                  {dossier.limitesEcriture
                    .map((v) => libelle(LIMITES_ECRITURE, v))
                    .join(", ")}
                  {dossier.limitesAutres ? ` — ${dossier.limitesAutres}` : ""}
                </p>
              ) : (
                <p className="italic text-silver">Aucune limite indiquée.</p>
              )}
            </Bloc>

            {/* ── Décision — seulement tant que le dossier est en jeu ── */}
            {dossier.statut === "EN_ATTENTE" || dossier.statut === "A_CORRIGER" ? (
              <FormulaireDecision id={dossier.id} />
            ) : null}

            <JournalMembre entrees={dossier.journal} className="mt-10" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Ligne({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-silver/10 pb-2">
      <dt className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver">
        {terme}
      </dt>
      <dd className="text-right text-parchment-dim">{valeur}</dd>
    </div>
  );
}

function Bloc({
  titre,
  children,
  className = "",
}: {
  titre: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
        {titre}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Liste({ entrees }: { entrees: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {entrees.map((entree, index) => (
        <li key={index} className="flex gap-3 text-parchment-dim">
          <span aria-hidden="true" className="text-silver">
            {index + 1}.
          </span>
          {entree}
        </li>
      ))}
    </ul>
  );
}
