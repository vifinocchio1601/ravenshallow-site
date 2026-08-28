import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MaisonVisitee from "@/components/maison/MaisonVisitee";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVisiterLaMaison } from "@/lib/forum/pouvoirs";
import { aUneMaison } from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";
import { maisonDepuisCle, type Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Une maison — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Une maison, visitée par son adresse.
 *
 * ⚠️ **Une maison qu'on n'a pas le droit de visiter rend 404**, exactement
 * comme une clé qui ne correspond à rien. « Elle existe, mais pas pour vous »
 * se lit comme une confirmation — même choix que le forum, la Tour et le
 * Grand Hall.
 */
export default async function Page({ params }: { params: { cle: string } }) {
  const compte = await exigerAcces(ROUTES.maisons);

  const maison = maisonDepuisCle(params.cle);
  if (!maison) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);
  const laSienne = aUneMaison(compte) ? ((compte.maison ?? null) as Maison) : null;
  if (!peutVisiterLaMaison(pouvoirs, laSienne, maison)) notFound();

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <MaisonVisitee
        maison={maison}
        compte={compte}
        pouvoirs={pouvoirs}
        cheminSalon={`${ROUTES.maisons}/${params.cle}/salon`}
      />
    </main>
  );
}
