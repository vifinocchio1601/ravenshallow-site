import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SalonVisite from "@/components/maison/SalonVisite";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVisiterLaMaison } from "@/lib/forum/pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { aUneMaison } from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";
import { maisonDepuisCle, type Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: `${TEXTES_SALON.nom} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Le salon d'une maison, visité par son adresse.
 *
 * ⚠️ **Le droit d'entrer est refait ici**, et il ne suffit pas à donner la
 * parole : `SalonVisite` repose la seconde question. Lire n'est pas écrire.
 */
export default async function Page({ params }: { params: { cle: string } }) {
  const compte = await exigerAcces(ROUTES.maisons);

  const maison = maisonDepuisCle(params.cle);
  if (!maison) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);
  const laSienne = aUneMaison(compte) ? ((compte.maison ?? null) as Maison) : null;
  if (!peutVisiterLaMaison(pouvoirs, laSienne, maison)) notFound();

  return (
    <SalonVisite
      maison={maison}
      compte={compte}
      pouvoirs={pouvoirs}
      cheminRetour={`${ROUTES.maisons}/${params.cle}`}
      libelleRetour={TEXTES_SALON.retourVisite}
    />
  );
}
