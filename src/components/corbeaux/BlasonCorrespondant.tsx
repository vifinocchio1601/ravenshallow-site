import Image from "next/image";
import type { Correspondant } from "@/lib/corbeaux/depot";
import { BLASON_ECOLE, blasonAffiche } from "@/lib/ecole/blasons";

/**
 * Le blason d’un correspondant : celui de sa maison, ou celui de l’école.
 *
 * **Aucune règle n’est réécrite ici.** `blasonAffiche` tranche, et il ne rend
 * le blason d’une maison que si elle s’affiche vraiment — une directrice
 * garde Tideål en base sans le porter à l’écran. Écrire
 * `correspondant.maison ? … : …` dans ce composant recopierait la règle, et
 * c’est la copie qu’on oublierait de corriger.
 *
 * Un correspondant absent — l’administration, ou un compte supprimé — porte
 * le sceau de l’école. Jamais un trou dans la page.
 */
export default function BlasonCorrespondant({
  correspondant,
  taille = "normal",
}: {
  correspondant: Correspondant | null;
  taille?: "normal" | "petit";
}) {
  const blason = correspondant ? blasonAffiche(correspondant) : BLASON_ECOLE;

  return (
    <Image
      src={blason.src}
      alt={blason.alt}
      width={blason.largeur}
      height={blason.hauteur}
      className={`w-auto shrink-0 ${taille === "petit" ? "h-7" : "h-10"}`}
    />
  );
}
