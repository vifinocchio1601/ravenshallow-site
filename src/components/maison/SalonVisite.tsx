import Link from "next/link";
import Salon from "@/components/maison/Salon";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { peutParlerDansLeSalonDe, peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import type { Pouvoirs } from "@/lib/forum/pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { lireLeSalon } from "@/lib/salon/depot";
import { cleDeMaison, type Maison } from "@/lib/dossier/etats";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * **Le salon d'une maison, tel qu'on l'ouvre** — par la sienne ou en visite.
 *
 * Une seule implémentation, deux chemins : `/maison/salon` et
 * `/maisons/<clé>/salon`. Ce composant ne décide d'aucun accès — les pages ont
 * déjà tranché.
 *
 * ⚠️ **Lire et parler ne se décident pas de la même façon.** Un professeur à
 * qui l'on donne `LIRE_ESPACES_MAISON` sur un dortoir entre et lit ; il n'y
 * parle pas pour autant. Seul le staff s'adresse à une maison dont il n'est
 * pas — décision du joueur, 28 août 2026.
 */
export default async function SalonVisite({
  maison,
  compte,
  pouvoirs,
  cheminRetour,
  libelleRetour,
}: {
  maison: Maison;
  compte: CompteConnecte;
  pouvoirs: Pouvoirs;
  cheminRetour: string;
  libelleRetour: string;
}) {
  const messages = await lireLeSalon(maison);
  const t = TEXTES_SALON;
  const nom = NOMS_MAISON[maison] ?? maison;

  const laSienne = compte.etatMaison === "FAIT" ? (compte.maison as Maison) : null;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={cheminRetour}
        className="font-body text-sm text-silver hover:text-aurora-teal"
      >
        {libelleRetour}
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
          maison={cleDeMaison(maison)}
          messagesInitiaux={messages}
          jusqua={new Date().toISOString()}
          moiId={compte.eleveId}
          peutParler={peutParlerDansLeSalonDe(pouvoirs, laSienne, maison)}
          peutFaireLeMenage={peutEcrireLesAnnoncesDe(pouvoirs, maison)}
        />
      </div>
    </main>
  );
}
