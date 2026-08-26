import { TEXTES_ECOLE } from "@/lib/ecole/constantes";

/**
 * Une salle du château pas encore construite.
 *
 * Cinq pages partagent ce gabarit, et c’est la raison de son existence : la
 * même page recopiée cinq fois finit par diverger — un titre mis à jour ici,
 * pas là. Le contenu, lui, vit dans `TEXTES_ECOLE.aVenir`.
 *
 * Elles ne sont pas un pis-aller : **voir une porte fermée donne envie**, une
 * entrée absente ne dit rien du tout.
 */
export default function PageAVenir({
  rune,
  titre,
  corps,
}: {
  rune: string;
  titre: string;
  corps: string;
}) {
  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          {rune}
        </span>
        {TEXTES_ECOLE.aVenir.badge}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {titre}
      </h1>

      <p className="mt-4 max-w-[54ch] font-body leading-[1.8] text-parchment-dim">
        {corps}
      </p>

      <div className="hairline mt-10 max-w-[28rem]" />
    </main>
  );
}
