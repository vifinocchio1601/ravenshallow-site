"use server";

import { revalidatePath } from "next/cache";
import { traiterSignalement } from "@/lib/corbeaux/moderation";

/**
 * Traiter un signalement, ou le classer sans suite.
 *
 * Protégée par le middleware, qui n'autorise /admin qu'avec une session
 * valide — mais les entrées sont revalidées ici : une action serveur reste une
 * route publique, appelable directement.
 *
 * **Elle ne touche qu'au signalement.** Poser une sanction est un autre geste,
 * qui se fait depuis la fiche du membre et s'inscrit à son journal : les deux
 * ne se déclenchent pas l'un l'autre, exactement comme signaler et bloquer ne
 * se déclenchent pas l'un l'autre côté joueur.
 */
export async function traiterSignalementAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  const statut = String(donnees.get("statut") ?? "");
  const note = String(donnees.get("note") ?? "").trim();

  if (!id) return;
  if (statut !== "TRAITE" && statut !== "CLASSE_SANS_SUITE") return;

  await traiterSignalement(id, statut, note || null);

  revalidatePath("/admin/signalements");
  revalidatePath(`/admin/signalements/${id}`);
}
