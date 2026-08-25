import type { Metadata } from "next";
import Link from "next/link";
import EcranEtat from "@/components/dossier/EcranEtat";
import FicheForm from "@/components/dossier/FicheForm";
import Nav from "@/components/Nav";
import { TEXTES } from "@/lib/dossier/constantes";
import { lireDossier } from "@/lib/dossier/depot";
import { verifierJeton } from "@/lib/dossier/jeton";
import { LIBELLES_STATUT_DOSSIER, TEXTES_ETATS } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Ma fiche — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ETATS_MODIFIABLES = ["EN_ATTENTE", "A_CORRIGER", "ACCEPTE"];

/** Coquille commune, pour que les trois issues se ressemblent. */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="relative min-h-[100svh] bg-void">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.07)_0%,transparent_72%)]"
        />
        <div className="relative mx-auto max-w-[48rem] px-6 pb-24 pt-20 sm:px-8 md:pt-28">
          {children}
        </div>
      </main>
    </>
  );
}

export default async function FichePage({
  params,
}: {
  params: { jeton: string };
}) {
  const verification = await verifierJeton(params.jeton);

  if (!verification.valide) {
    const t = TEXTES.fiche.lienInvalide;
    return (
      <Page>
        <EcranEtat ton="correction" titre={t.titre} corps={t.corps} badge="Lien expiré">
          <div className="mt-8">
            <Link href="/" className="btn btn-ghost">
              Retour à l’accueil
            </Link>
          </div>
        </EcranEtat>
      </Page>
    );
  }

  const dossier = await lireDossier(verification.contenu.id);
  const lienPerime =
    dossier !== null && verification.contenu.v !== dossier.jetonVersion;

  if (lienPerime) {
    const t = TEXTES.fiche.lienInvalide;
    return (
      <Page>
        <EcranEtat ton="correction" titre={t.titre} corps={t.corps} badge="Lien expiré">
          <div className="mt-8">
            <Link href="/" className="btn btn-ghost">
              Retour à l’accueil
            </Link>
          </div>
        </EcranEtat>
      </Page>
    );
  }

  if (!dossier || !ETATS_MODIFIABLES.includes(dossier.statut)) {
    const t = TEXTES.fiche.verrouillee;
    return (
      <Page>
        <EcranEtat ton="correction" titre={t.titre} corps={t.corps} badge="Verrouillée">
          <div className="mt-8">
            <Link href="/" className="btn btn-ghost">
              Retour à l’accueil
            </Link>
          </div>
        </EcranEtat>
      </Page>
    );
  }

  const correction = TEXTES_ETATS.correction;

  return (
    <Page>
      <header>
        <p className="eyebrow flex items-center gap-3">
          <span aria-hidden="true" className="rune text-aurora-teal">
            ᛖᛚᚡ
          </span>
          <span>{dossier.prenomNom}</span>
        </p>

        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,2.75rem)] font-bold leading-[1.1] tracking-[0.04em] text-parchment">
          {TEXTES.fiche.titre}
        </h1>

        <p className="mt-5 max-w-[52ch] leading-[1.8] text-parchment-dim">
          {TEXTES.fiche.chapeau}
        </p>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-silver/25 px-4 py-1.5 font-display text-[0.66rem] uppercase tracking-[0.16em] text-silver">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
          {LIBELLES_STATUT_DOSSIER[dossier.statut]}
        </p>
      </header>

      {/* La note de l’administration d’abord : c’est ce que le joueur vient lire. */}
      {dossier.statut === "A_CORRIGER" && dossier.noteAdmin ? (
        <blockquote className="mt-8 border-l-2 border-ember/60 bg-ember/[0.04] py-4 pl-6 pr-5">
          <p className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver">
            {correction.noteTitre}
          </p>
          <p className="mt-2 font-body italic leading-relaxed text-parchment-dim">
            «&nbsp;{dossier.noteAdmin}&nbsp;»
          </p>
        </blockquote>
      ) : null}

      <FicheForm
        jeton={params.jeton}
        valeursInitiales={{
          prenomNom: dossier.prenomNom,
          genre: dossier.genre,
          famille: dossier.famille,
          portraitType: dossier.portraitType,
          acteurNom: dossier.acteurNom ?? "",
          portrait: dossier.portraitUrl ?? "",
          biographie: dossier.biographie,
          qualites: dossier.qualites,
          defauts: dossier.defauts,
          plusGrandePeur: dossier.plusGrandePeur,
          limitesEcriture: dossier.limitesEcriture,
          limitesAutres: dossier.limitesAutres ?? "",
        }}
      />
    </Page>
  );
}
