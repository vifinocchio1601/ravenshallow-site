import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Salon from "@/components/maison/Salon";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { lireLeSalon } from "@/lib/salon/depot";
import { exigerAcces } from "@/lib/session/garde";
import type { Maison } from "@/lib/dossier/etats";

export const metadata: Metadata = {
  title: `${TEXTES_SALON.nom} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le salon d'une maison.**
 *
 * L'adresse n'a rien à déclarer dans `ROUTES_HORS_MENU` : `routeAutorisee`
 * reconnaît tout ce qui commence par `/maison/`, et cette pièce hérite donc
 * de l'`exigeUneMaison` de sa page — le procédé de la Tour aux Corbeaux.
 *
 * ⚠️ **Une pièce, et non une correspondance.** Le staff peut y lire, et
 * `/admin/salons` lui en donne le moyen : sans cela son pouvoir de retirer un
 * message serait théorique, une directrice n'ayant pas de maison et
 * n'atteignant donc aucun salon par ici.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.maison);

  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) notFound();

  const [messages, pouvoirs] = await Promise.all([
    lireLeSalon(maison),
    pouvoirsDe(compte.id),
  ]);

  const t = TEXTES_SALON;
  const nom = NOMS_MAISON[maison] ?? maison;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.maison}
        className="font-body text-sm text-silver hover:text-aurora-teal"
      >
        {t.retour}
      </Link>

      <h1 className="mt-6 font-display text-[clamp(1.6rem,4.4vw,2.3rem)] font-semibold leading-[1.2] tracking-[0.02em] text-parchment">
        {t.titre.replace("{maison}", nom)}
      </h1>

      {/* La phrase dit trois choses, et les trois comptent : qui est là, que
          c'est gardé, et que le château peut entrer. Quelqu'un qui croirait
          chuchoter se tromperait lourdement. */}
      <p className="mt-3 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
        {t.chapeau}
      </p>

      <div className="mt-6">
        <Salon
          messagesInitiaux={messages}
          jusqua={new Date().toISOString()}
          moiId={compte.eleveId}
          peutFaireLeMenage={peutEcrireLesAnnoncesDe(pouvoirs, maison)}
        />
      </div>
    </main>
  );
}
