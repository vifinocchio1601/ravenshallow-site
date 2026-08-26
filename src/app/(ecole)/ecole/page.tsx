import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CartouchePiece from "@/components/ecole/CartouchePiece";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { lireArbre, lireEspace } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutOuvrirUnSujet } from "@/lib/forum/lieux";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_FORUM.ecole.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * L’intérieur du château : les cinq sections, et leurs pièces.
 *
 * La page ne décide de rien. `lireArbre` a déjà écarté ce que ce membre ne
 * peut pas lire — en appelant la couture, jamais en recopiant sa condition —,
 * et `peutOuvrirUnSujet` dit pièce par pièce si l’écriture est ouverte. Ici on
 * met en forme, et c’est tout.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.ecole);

  const espace = await lireEspace("domaine");
  // La base porte les lieux : sans l’espace, il n’y a rien à afficher — et
  // mieux vaut une page absente qu’une page qui invente un château.
  if (!espace) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);
  const lecteur = { membre: compte, pouvoirs };
  const sections = await lireArbre(espace, lecteur);
  const t = TEXTES_FORUM;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᚺ
        </span>
        {t.ecole.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {t.ecole.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {t.ecole.accroche}
      </p>


      {sections.map((section) => (
        <section key={section.id} className="mt-12">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {section.nom}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {section.description}
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-3">
            {section.enfants.map((piece) => (
              <CartouchePiece
                key={piece.id}
                href={`${ROUTES.ecole}/${piece.slug}`}
                nom={piece.nom}
                description={piece.description}
                sujets={piece.sujets}
                ecriture={peutOuvrirUnSujet(compte, pouvoirs, piece.regles)}
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}
