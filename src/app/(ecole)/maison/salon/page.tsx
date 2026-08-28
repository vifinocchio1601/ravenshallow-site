import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SalonVisite from "@/components/maison/SalonVisite";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { exigerAcces } from "@/lib/session/garde";
import type { Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: `${TEXTES_SALON.nom} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le salon de sa propre maison** — le raccourci.
 *
 * L'adresse n'a rien à déclarer dans `ROUTES_HORS_MENU` : `routeAutorisee`
 * reconnaît tout ce qui commence par `/maison/`, et cette pièce hérite donc
 * de l'`exigeUneMaison` de sa page. Le salon d'une autre maison passe par
 * `/maisons/<clé>/salon`, que le middleware ne garde pas de la même façon —
 * il ne connaît pas les permissions.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.maison);

  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) notFound();

  const pouvoirs = await pouvoirsDe(compte.id);

  return (
    <SalonVisite
      maison={maison}
      compte={compte}
      pouvoirs={pouvoirs}
      cheminRetour={ROUTES.maison}
      libelleRetour={TEXTES_SALON.retour}
    />
  );
}
