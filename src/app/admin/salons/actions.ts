"use server";

import { revalidatePath } from "next/cache";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";
import { retirerDuSalon } from "@/lib/salon/depot";
import { TEXTES_SALON } from "@/lib/salon/constantes";

/**
 * Le geste du staff dans un salon : retirer un message.
 *
 * ⚠️ **Il n'y en a qu'un, et c'est délibéré.** Le staff lit la pièce et peut
 * en décrocher un message. Il n'y écrit pas depuis cet écran : la zone
 * d'administration n'a pas de comptes distincts, et un message sans auteur
 * dans un salon ne voudrait rien dire — au château, un message sans auteur
 * signe une réponse de l'administration, et ce sens-là est déjà pris.
 *
 * Protégé par le middleware, qui n'ouvre `/admin` qu'avec une session valide.
 */
export async function retirerAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  const maison = String(donnees.get("maison") ?? "") as Maison;
  if (!id || !(MAISONS as readonly string[]).includes(maison)) return;

  await retirerDuSalon({
    id,
    maison,
    // Le staff n'est pas une fiche : aucun message ne peut être « le sien »,
    // et c'est bien le ménage qui l'autorise.
    parId: "",
    parNom: TEXTES_SALON.administration.posePar,
    peutFaireLeMenage: true,
  });

  revalidatePath("/admin/salons");
  revalidatePath(`${ROUTES.maison}/salon`);
}
