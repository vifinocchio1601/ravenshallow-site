import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoutonBloquer from "@/components/registre/BoutonBloquer";
import { listerBlocages } from "@/lib/corbeaux/depot";
import { porteeDeLaTour } from "@/lib/corbeaux/droits";
import { libelleBaguette } from "@/lib/ecole/baguette";
import { blasonDe, BLASON_ECOLE, NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { enPoints } from "@/lib/points/affichage";
import { TEXTES_REGISTRE } from "@/lib/registre/constantes";
import { lireLaFiche } from "@/lib/registre/depot";
import { exigerAcces } from "@/lib/session/garde";
import {
  FAMILLES,
  GENRES,
  LIMITES_ECRITURE,
} from "@/lib/dossier/constantes";

const T = TEXTES_REGISTRE.fiche;

export const metadata: Metadata = {
  title: `${TEXTES_REGISTRE.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **La fiche publique d'un personnage.**
 *
 * Toute la fiche de jeu — décision du joueur, 28 août 2026 : biographie,
 * qualités, défauts, plus grande peur. C'est l'usage des forums de jeu de
 * rôle, où l'on lit la fiche d'un autre avant de lui écrire une scène.
 *
 * **Les avertissements de contenu y sont, et c'est le règlement qui l'exige** —
 * art. 15.4, « affiché publiquement sur la fiche ». Ils préviennent, ils
 * n'accusent pas : le ton de l'intitulé compte autant que la liste.
 *
 * ⚠️ **Aucune sanction ne s'affiche** (art. 8.2). La page ne lit pas
 * `statutAcces`, et il ne faut pas l'y ajouter.
 */
export default async function Page({ params }: { params: { id: string } }) {
  const compte = await exigerAcces(ROUTES.registre);

  const fiche = await lireLaFiche(params.id);
  if (!fiche) notFound();

  const cestMoi = fiche.compteId === compte.id;
  // « Ai-je bloqué cette personne ? » se lit dans un seul sens. Il n'existe
  // aucune fonction qui réponde à « qui m'a bloqué ? », et il ne faut jamais
  // en écrire une.
  const bloques = cestMoi ? [] : await listerBlocages(compte);
  const dejaBloque = bloques.some((b) => b.id === fiche.compteId);

  const blason = fiche.maison ? blasonDe(fiche.maison) : BLASON_ECOLE;
  const nomMaison = fiche.maison
    ? (NOMS_MAISON[fiche.maison] ?? fiche.maison)
    : fiche.etatMaison === "SANS_OBJET"
      ? T.sansMaisonSansObjet
      : T.sansMaison;

  const baguette = fiche.baguette
    ? libelleBaguette(...(fiche.baguette.split("|") as [string, string]))
    : null;

  const genre = GENRES.find((g) => g.valeur === fiche.genre)?.libelle ?? fiche.genre;
  const famille =
    FAMILLES.find((f) => f.valeur === fiche.famille)?.libelle ?? fiche.famille;
  const avertissements = fiche.avertissements.map(
    (a) => LIMITES_ECRITURE.find((l) => l.valeur === a)?.libelle ?? a,
  );

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.registre}
        className="font-body text-sm text-silver hover:text-aurora-teal"
      >
        {T.retour}
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-[14rem_minmax(0,1fr)]">
        {/* ── La colonne d'identité ──

            Le portrait est en 9:16 (art. 6.2) : en pleine largeur sur un
            téléphone de 375 px, il ferait 660 px de haut et occuperait tout le
            premier écran à lui seul. On le borne donc, et il retrouve sa
            largeur dans la colonne dès qu'il y en a une. */}
        <div className="mx-auto w-full max-w-[13rem] min-w-0 sm:mx-0 sm:max-w-none">
          {fiche.portrait ? (
            // Un `<img>` ordinaire, et **non `next/image`** : l'optimiseur va
            // chercher la source sans les cookies du lecteur, et se ferait
            // refuser par `/api/portraits/[id]`.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fiche.portrait}
              alt={TEXTES_REGISTRE.altPortrait}
              className="aspect-[9/16] w-full rounded-sm border border-silver/25 object-cover object-top"
            />
          ) : (
            <div className="grid aspect-[9/16] w-full place-items-center rounded-sm border border-silver/15 bg-mist/50">
              <Image
                src={blason.src}
                alt=""
                width={blason.largeur}
                height={blason.hauteur}
                sizes="112px"
                className="h-auto w-1/2 opacity-50"
              />
            </div>
          )}

          <dl className="mt-5 grid gap-3">
            <Ligne intitule={T.maison}>
              <span className="inline-flex items-center gap-2">
                <Image
                  src={blason.src}
                  alt=""
                  width={blason.largeur}
                  height={blason.hauteur}
                  sizes="22px"
                  className="h-[22px] w-auto"
                />
                {nomMaison}
              </span>
            </Ligne>
            <Ligne intitule={T.age}>{T.ans.replace("{n}", String(fiche.age))}</Ligne>
            <Ligne intitule={T.genre}>{genre}</Ligne>
            <Ligne intitule={T.famille}>{famille}</Ligne>
            <Ligne intitule={T.baguette}>{baguette ?? T.sansBaguette}</Ligne>
            <Ligne intitule={T.points}>{enPoints(fiche.points)}</Ligne>
            {fiche.acteurNom ? (
              <Ligne intitule={T.visage}>{fiche.acteurNom}</Ligne>
            ) : null}
          </dl>
        </div>

        {/* ── La fiche elle-même ── */}
        <div className="min-w-0">
          {/* Le nom ne se coupe jamais : c'est la seule chose que cette page
              doit dire à coup sûr. */}
          <h1 className="font-display text-[clamp(1.6rem,4.4vw,2.3rem)] font-semibold leading-[1.2] tracking-[0.02em] text-parchment">
            {fiche.prenomNom}
          </h1>
          <p className="mt-1 font-body italic text-silver">{fiche.place}</p>

          <Section titre={T.biographie}>
            {/* `whitespace-pre-wrap` : la biographie est du texte brut, écrit
                par un joueur, et React l'échappe d'office.

                ⚠️ **`break-words` n'est pas décoratif.** Un joueur peut coller
                une adresse de trois cents signes sans une espace ; sans lui,
                elle pousse la page à cinq mille pixels de large et tout le
                reste avec. Constaté à l'écran. Même précaution que sur un mot
                du tableau et un message de salon. */}
            <p className="whitespace-pre-wrap break-words font-body leading-[1.85] text-parchment-dim">
              {fiche.biographie}
            </p>
          </Section>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Liste titre={T.qualites} valeurs={fiche.qualites} />
            <Liste titre={T.defauts} valeurs={fiche.defauts} />
          </div>

          <Section titre={T.peur}>
            <p className="break-words font-body leading-[1.85] text-parchment-dim">
              {fiche.plusGrandePeur}
            </p>
          </Section>

          {/* Art. 15.4 — publics, et le règlement le dit. */}
          <Section titre={T.avertissements}>
            {avertissements.length === 0 ? (
              <p className="font-body italic text-silver">
                {T.aucunAvertissement}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {avertissements.map((a) => (
                  <li
                    key={a}
                    className="rounded-sm border border-ember/40 px-2 py-1 font-body text-xs text-ember/90"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ── Ce qu'on peut faire de cette fiche ── */}
          <div className="mt-10 flex flex-wrap items-start gap-6 border-t border-silver/10 pt-6">
            {cestMoi ? (
              <p className="font-body text-sm italic text-silver">
                {TEXTES_REGISTRE.actions.cestVous}
              </p>
            ) : (
              <>
                {/* Écrire n'est possible que si la Tour s'ouvre à ce compte :
                    un membre suspendu n'y a que le fil de l'administration. */}
                {porteeDeLaTour(compte) === "TOUT" ? (
                  <Link href={ROUTES.corbeauxNouveau} className="btn btn-ghost">
                    {TEXTES_REGISTRE.actions.corbeau}
                  </Link>
                ) : null}
                <BoutonBloquer
                  compteId={fiche.compteId}
                  nom={fiche.prenomNom}
                  dejaBloque={dejaBloque}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Ligne({
  intitule,
  children,
}: {
  intitule: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-silver">
        {intitule}
      </dt>
      <dd className="mt-0.5 break-words font-body text-sm text-parchment-dim">
        {children}
      </dd>
    </div>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
        {titre}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Liste({ titre, valeurs }: { titre: string; valeurs: string[] }) {
  return (
    <section className="min-w-0">
      <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
        {titre}
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-1">
        {valeurs.map((v, i) => (
          <li
            key={`${i}-${v}`}
            className="min-w-0 break-words font-body leading-[1.7] text-parchment-dim"
          >
            {v}
          </li>
        ))}
      </ul>
    </section>
  );
}
