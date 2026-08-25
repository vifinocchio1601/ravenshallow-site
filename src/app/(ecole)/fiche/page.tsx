import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { libelleBaguette } from "@/lib/ecole/baguette";
import { blasonAffiche, mentionMaison } from "@/lib/ecole/blasons";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import { FAMILLES, LIMITES_ECRITURE } from "@/lib/dossier/constantes";
import { lireDossier } from "@/lib/dossier/depot";
import { libellePlace } from "@/lib/dossier/etats";
import {
  aUneBaguette,
  doitPasserAKaldvik,
  estBanni,
  finDuBannissement,
} from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Ma fiche — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function libelle(
  liste: readonly { valeur: string; libelle: string }[],
  valeur: string,
) {
  return liste.find((e) => e.valeur === valeur)?.libelle ?? valeur;
}

export default async function FicheElevePage() {
  const compte = await exigerAcces(ROUTES.fiche);
  const dossier = await lireDossier(compte.id);
  if (!dossier) notFound();

  const t = TEXTES_ECOLE.fiche;
  // Rien ne se déduit plus d'une case vide : l'état tranche, et lui seul.
  const blason = blasonAffiche(dossier);
  const mention = mentionMaison(dossier);

  // Un compte que la boutique ne concerne pas n'affiche pas de baguette, et
  // surtout pas un « aucune baguette » qui ferait croire à un manque.
  const baguette = aUneBaguette(dossier)
    ? libelleBaguette(dossier.baguetteBois, dossier.baguetteCoeur)
    : null;
  const baguetteAttendue = doitPasserAKaldvik(dossier);

  const banni = estBanni(compte);
  const fin = finDuBannissement(compte);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛖ
        </span>
        {t.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {t.titre}
      </h1>
      <p className="mt-3 max-w-[54ch] font-body leading-[1.8] text-parchment-dim">
        {t.lectureSeule}
      </p>

      {/* ── Bannissement : dit franchement, avec sa durée et le recours ── */}
      {banni ? (
        <section
          role="status"
          className="mt-8 rounded-sm border border-ember/45 bg-ember/[0.07] p-6"
        >
          <p className="font-display text-[0.7rem] uppercase tracking-[0.16em] text-ember">
            {t.bannissement.titre} · {t.bannissement.badge}
          </p>
          <p className="mt-3 font-body leading-[1.8] text-parchment">
            {fin
              ? t.bannissement.jusquau.replace(
                  "{date}",
                  fin.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                )
              : t.bannissement.definitif}
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-parchment-dim">
            {t.bannissement.recours}
          </p>
        </section>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_1fr] lg:items-start">
        {/* ── Portrait, format unique du château ── */}
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
            <div className="flex aspect-[9/16] w-full items-center justify-center rounded-sm border border-dashed border-silver/25 bg-mist/40 text-center font-display text-[0.68rem] uppercase tracking-[0.14em] text-silver">
              {t.portraitAbsent}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Image
              src={blason.src}
              alt={blason.alt}
              width={blason.largeur}
              height={blason.hauteur}
              className="h-14 w-auto"
            />
            {/* Le blason de l'école reste, pour ne pas laisser un trou —
                mais aucune mention de maison n'accompagne un compte que la
                répartition ne concerne pas. */}
            {mention ? (
              <div>
                <p className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver">
                  {t.ligne.maison}
                </p>
                <p className="font-body text-parchment">{mention}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── L’état civil, puis la fiche ── */}
        <div className="min-w-0">
          <dl className="space-y-3 font-body text-sm">
            <Ligne terme={t.ligne.nom} valeur={dossier.prenomNom} />
            <Ligne terme={t.ligne.age} valeur={`${dossier.age} ans`} />
            {/* Le rôle remplace l’année — libellé compris : « Année —
                Directrice » se contredirait. L’année reste en base, masquée. */}
            <Ligne
              terme={dossier.roleAffiche ? t.ligne.role : t.ligne.fonction}
              valeur={libellePlace(dossier.fonction, dossier.roleAffiche)}
            />
            <Ligne
              terme={t.ligne.famille}
              valeur={libelle(FAMILLES, dossier.famille)}
            />
            {baguette || baguetteAttendue ? (
              <Ligne
                terme={t.ligne.baguette}
                valeur={baguette ?? t.ligne.baguetteAVenir}
                attente={!baguette}
              />
            ) : null}
            <Ligne
              terme={t.ligne.limites}
              valeur={
                dossier.limitesEcriture.length || dossier.limitesAutres
                  ? dossier.limitesEcriture
                      .map((v) => libelle(LIMITES_ECRITURE, v))
                      .join(", ") +
                    (dossier.limitesAutres ? ` — ${dossier.limitesAutres}` : "")
                  : t.ligne.limitesAucune
              }
              attente={
                !dossier.limitesEcriture.length && !dossier.limitesAutres
              }
            />
          </dl>

          <Bloc titre={t.bloc.biographie} className="mt-10">
            <p className="whitespace-pre-line leading-[1.9] text-parchment-dim">
              {dossier.biographie}
            </p>
          </Bloc>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Bloc titre={t.bloc.qualites}>
              <Liste entrees={dossier.qualites} />
            </Bloc>
            <Bloc titre={t.bloc.defauts}>
              <Liste entrees={dossier.defauts} />
            </Bloc>
          </div>

          <Bloc titre={t.bloc.peur} className="mt-8">
            <p className="leading-[1.8] text-parchment-dim">
              {dossier.plusGrandePeur}
            </p>
          </Bloc>
        </div>
      </div>
    </main>
  );
}

function Ligne({
  terme,
  valeur,
  attente = false,
}: {
  terme: string;
  valeur: string;
  attente?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-silver/10 pb-2">
      <dt className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver">
        {terme}
      </dt>
      <dd
        className={`text-right ${attente ? "italic text-silver" : "text-parchment"}`}
      >
        {valeur}
      </dd>
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
      <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment">
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
