import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CartouchePiece from "@/components/ecole/CartouchePiece";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { lireArbre, lireEspace } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutOuvrirUnSujet } from "@/lib/forum/lieux";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_FORUM.nonMages;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le monde des non-mages** — l'espace hors RP.
 *
 * ⚠️ **Un seul étage, à la différence de l'école.** Une aile du château
 * contient des pièces qui contiennent des scènes ; ici, une section contient
 * directement ses sujets. « Présentations » et « Absences » sont des choses de
 * même niveau, et un étage de plus n'ajouterait que des clics.
 *
 * C'est pourquoi cette page rend les **sections** comme cartouches, là où
 * `/ecole` rend leurs enfants. Le reste — la page d'un lieu, celle d'un
 * sujet — est partagé mot pour mot entre les deux espaces.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.nonMages);

  const espace = await lireEspace("non-mages");
  // La base porte les lieux : sans l'espace, il n'y a rien à afficher.
  if (!espace) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);
  const sections = await lireArbre(espace, { membre: compte, pouvoirs });

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
        {T.accroche}
      </p>

      <ul className="mt-12 grid grid-cols-1 gap-3">
        {sections.map((section) => (
          <CartouchePiece
            key={section.id}
            href={`${ROUTES.nonMages}/${section.slug}`}
            nom={section.nom}
            description={section.description}
            sujets={section.sujets}
            ecriture={peutOuvrirUnSujet(compte, pouvoirs, section.regles)}
          />
        ))}
      </ul>
    </main>
  );
}
