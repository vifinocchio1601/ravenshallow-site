import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MaisonVisitee from "@/components/maison/MaisonVisitee";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { exigerAcces } from "@/lib/session/garde";
import type { Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: "Ma maison — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Ma maison** — le raccourci vers la sienne.
 *
 * La route exige déjà une maison : `exigeUneMaison` ferme l'entrée du bandeau
 * **et** l'adresse, à l'élève que le Miroir attend comme à la directrice
 * qu'il ne concerne pas. Celle-ci passe par « Les maisons », qui les ouvre
 * toutes les quatre.
 *
 * L'écran, lui, est partagé : deux copies finiraient par diverger, et c'est la
 * copie oubliée qui montrerait un jour un tableau à quelqu'un qui n'y a pas
 * droit.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.maison);

  // La garde a déjà refermé la porte sur qui n'a pas de maison qui s'affiche ;
  // ce garde-ci ne rattrape qu'une valeur abîmée en base.
  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <MaisonVisitee
        maison={maison}
        compte={compte}
        pouvoirs={pouvoirs}
        cheminSalon={`${ROUTES.maison}/salon`}
      />
    </main>
  );
}
