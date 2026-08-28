import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CartouchePiece from "@/components/ecole/CartouchePiece";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_FORUM } from "@/lib/forum/constantes";
import { lireArbre, lireEspace } from "@/lib/forum/depot";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutOuvrirUnSujet } from "@/lib/forum/lieux";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_FORUM.alentours;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Ce qui entoure le château** : cinq zones, et leurs lieux.
 *
 * Le même écran que `/ecole`, à deux étages — une zone contient des lieux qui
 * contiennent des scènes. La page ne décide de rien : `lireArbre` a déjà
 * écarté ce que ce membre ne peut pas lire, en appelant la couture plutôt
 * qu’en recopiant sa condition, et `peutOuvrirUnSujet` dit lieu par lieu si
 * l’écriture est ouverte.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.alentours);

  const espace = await lireEspace("alentours");
  // Les lieux vivent en base : sans l’espace, il n’y a rien à afficher — et
  // mieux vaut une page absente qu’une page qui invente un domaine.
  if (!espace) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);
  const zones = await lireArbre(espace, { membre: compte, pouvoirs });

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛚ
        </span>
        {T.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.accroche}
      </p>

      {zones.map((zone) => (
        <section key={zone.id} className="mt-12">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {zone.nom}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {zone.description}
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-3">
            {zone.enfants.map((lieu) => (
              <CartouchePiece
                key={lieu.id}
                href={`${ROUTES.alentours}/${lieu.slug}`}
                nom={lieu.nom}
                description={lieu.description}
                sujets={lieu.sujets}
                ecriture={peutOuvrirUnSujet(compte, pouvoirs, lieu.regles)}
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}
