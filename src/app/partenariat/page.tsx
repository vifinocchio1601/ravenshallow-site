import type { Metadata } from "next";
import Link from "next/link";
import AdminLink from "@/components/AdminLink";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import BlocACopier from "@/components/partenariat/BlocACopier";
import FormulaireDemande from "@/components/partenariat/FormulaireDemande";
import { jourEnToutesLettres } from "@/lib/dates";
import {
  BANNIERES,
  adresseBanniere,
  codeBBCode,
  codeHtml,
} from "@/lib/partenariat/bannieres";
import { TEXTES_PARTENARIAT } from "@/lib/partenariat/constantes";
import { listerPartenaires } from "@/lib/partenariat/depot";

/**
 * **La page de partenariat** — la première voie de recrutement du forum
 * (bible §15 : « les partenariats croisés donnent de bien meilleurs résultats
 * que les annuaires et les tops de vote »).
 *
 * ⚠️ **Elle est PUBLIQUE, et c'est toute sa raison d'être.** Tout le reste du
 * site est derrière la connexion ; une section de forum réservée aux
 * partenariats ne servirait à personne, puisque l'administration qui nous
 * écrit n'a pas de compte et n'en ouvrira pas pour proposer un échange de
 * bannières. `robots.ts` l'ouvre à l'indexation pour la même raison : une page
 * de partenariat introuvable ne vaut rien.
 *
 * **Elle vouvoie**, à la différence du reste de la vitrine : elle ne s'adresse
 * pas à un futur joueur, mais à une administration voisine.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_PARTENARIAT.meta.titre,
  description: TEXTES_PARTENARIAT.meta.description,
};

export default async function PartenariatPage() {
  const t = TEXTES_PARTENARIAT;
  const partenaires = await listerPartenaires();

  return (
    <>
      <Nav />

      <main className="relative bg-void">
        {/* Voile d'aurore très discret en haut de page, comme au règlement. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(63,217,199,0.08)_0%,rgba(138,111,214,0.05)_45%,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-[52rem] px-6 pb-24 pt-16 sm:px-8 sm:pb-28 md:pt-28">
          {/* — En-tête — */}
          <header>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-x-1"
              >
                ←
              </span>
              {t.entete.retour}
            </Link>

            <p className="eyebrow mt-10 flex items-center gap-3">
              <span aria-hidden="true" className="rune text-aurora-teal">
                {t.entete.rune}
              </span>
              <span>{t.entete.eyebrow}</span>
            </p>

            <h1 className="mt-4 font-display text-[clamp(2.1rem,8vw,3.5rem)] font-bold leading-[1.05] tracking-[0.04em] text-parchment">
              {t.entete.titre}
            </h1>

            <p className="mt-6 max-w-[62ch] leading-[1.8] text-parchment-dim">
              {t.entete.chapeau}
            </p>
          </header>

          {/* — Ce que nous sommes, à copier — */}
          <Section titre={t.presentation.titre} chapeau={t.presentation.chapeau}>
            <BlocACopier
              etiquette={t.presentation.etiquette}
              valeur={t.presentation.texte}
              quoi={t.presentation.etiquette.toLowerCase()}
            />
          </Section>

          {/* — Les bannières — */}
          <Section titre={t.bannieres.titre} chapeau={t.bannieres.chapeau}>
            <ul className="mt-8 grid gap-10">
              {BANNIERES.map((banniere) => (
                <li
                  key={banniere.cle}
                  className="rounded-sm border border-silver/12 bg-fjord/60 p-5 sm:p-7"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="font-display text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-parchment">
                      {banniere.nom}
                    </h3>
                    <p className="font-body text-sm italic text-silver">
                      {banniere.usage}
                    </p>
                  </div>

                  {/* Un `<img>` ordinaire, et **non `next/image`** : c'est
                      exactement l'image qui sera collée chez le partenaire
                      qu'il faut montrer ici. Une version ré-encodée par
                      l'optimiseur montrerait autre chose que ce qu'on donne. */}
                  <div className="mt-5 flex justify-center rounded-sm bg-void/50 p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banniere.fichier}
                      alt={`${t.bannieres.apercu} — ${banniere.nom}`}
                      width={banniere.largeur}
                      height={banniere.hauteur}
                      loading="lazy"
                      decoding="async"
                      className="h-auto max-w-full"
                    />
                  </div>

                  <BlocACopier
                    etiquette={t.bannieres.adresse}
                    valeur={adresseBanniere(banniere)}
                    quoi={`${t.bannieres.adresse.toLowerCase()} ${banniere.nom}`}
                  />
                  <BlocACopier
                    etiquette={t.bannieres.html}
                    valeur={codeHtml(banniere)}
                    quoi={`${t.bannieres.html} ${banniere.nom}`}
                  />
                  <BlocACopier
                    etiquette={t.bannieres.bbcode}
                    valeur={codeBBCode(banniere)}
                    quoi={`${t.bannieres.bbcode} ${banniere.nom}`}
                  />
                </li>
              ))}
            </ul>
          </Section>

          {/* — Ce que nous demandons — */}
          <Section titre={t.conditions.titre} chapeau={t.conditions.chapeau}>
            <ul className="mt-6 space-y-4">
              {t.conditions.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-4 leading-[1.8] text-parchment-dim"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.75em] h-px w-4 shrink-0 bg-aurora-teal/50"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-body italic leading-relaxed text-silver">
              {t.conditions.reponse}
            </p>
          </Section>

          {/* — Les annuaires —
              Rangés à part des partenaires, et ce n'est pas de la mise en
              page : un annuaire ne nous affiche pas parce qu'on l'affiche, il
              classe des forums au nombre de voix. Les mêler ferait passer un
              vote pour un échange. */}
          <Section titre={t.annuaires.titre} chapeau={t.annuaires.chapeau}>
            <ul className="mt-6 grid gap-5">
              {t.annuaires.liste.map((annuaire) => (
                <li
                  key={annuaire.cle}
                  className="flex flex-wrap items-center gap-6"
                >
                  <a
                    href={annuaire.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={annuaire.titre}
                    className="shrink-0 rounded-sm border border-silver/12 bg-fjord/60 p-3 transition-colors duration-300 hover:border-aurora-teal/40"
                  >
                    {/* L'image est servie par l'annuaire lui-même : c'est le
                        bouton qu'il fournit, et on ne le réécrit pas. Si son
                        adresse change un jour, le texte de remplacement
                        s'affiche et le lien reste cliquable. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={annuaire.image}
                      alt={annuaire.alt}
                      width={annuaire.largeur}
                      height={annuaire.hauteur}
                      loading="lazy"
                      decoding="async"
                      style={{ width: annuaire.largeurAffichee }}
                      className="h-auto max-w-full"
                    />
                  </a>
                  <p className="max-w-[38ch] leading-[1.8] text-parchment-dim">
                    {annuaire.legende}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          {/* — Le bloc de liens — */}
          <Section titre={t.partenaires.titre} chapeau={t.partenaires.chapeau}>
            {partenaires.length === 0 ? (
              <p className="mt-6 rounded-sm border border-silver/12 bg-fjord/60 px-6 py-7 leading-[1.8] text-parchment-dim">
                {t.partenaires.aucun}
              </p>
            ) : (
              <ul className="mt-6 flex flex-wrap gap-6">
                {partenaires.map((partenaire) => (
                  <li key={partenaire.id} className="max-w-[14rem]">
                    <a
                      href={partenaire.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      {partenaire.banniereUrl ? (
                        <>
                          {/* Leur image reste chez eux — rien n'est recopié.
                              `no-referrer` : leur hébergeur n'a pas à savoir
                              quelle page du château est en train d'être lue.
                              Même règle que les images d'un post. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={partenaire.banniereUrl}
                            alt={partenaire.nom}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-auto max-w-full rounded-sm border border-silver/12 transition-colors duration-300 group-hover:border-aurora-teal/40"
                          />
                          <span className="sr-only">
                            {t.partenaires.visiter.replace(
                              "{nom}",
                              partenaire.nom,
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="block rounded-sm border border-silver/12 bg-fjord/60 px-5 py-4 font-display text-[0.78rem] uppercase tracking-[0.16em] text-parchment transition-colors duration-300 group-hover:border-aurora-teal/40 group-hover:text-aurora-teal">
                          {partenaire.nom}
                        </span>
                      )}
                    </a>

                    {partenaire.description ? (
                      <p className="mt-2 font-body text-sm italic leading-relaxed text-silver break-words">
                        {partenaire.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* — La demande — */}
          <Section titre={t.demande.titre} chapeau={t.demande.chapeau}>
            <FormulaireDemande />
          </Section>
        </div>
      </main>

      <Footer />
      <AdminLink />
    </>
  );
}

/** Une section de la page : filet, titre, chapeau, puis le contenu. */
function Section({
  titre,
  chapeau,
  children,
}: {
  titre: string;
  chapeau: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <span aria-hidden="true" className="hairline block" />
      <h2 className="mt-7 font-display text-[clamp(1.3rem,4vw,1.7rem)] font-semibold leading-[1.25] tracking-[0.02em] text-parchment">
        {titre}
      </h2>
      <p className="mt-3 max-w-[62ch] leading-[1.8] text-parchment-dim">
        {chapeau}
      </p>
      {children}
    </section>
  );
}
