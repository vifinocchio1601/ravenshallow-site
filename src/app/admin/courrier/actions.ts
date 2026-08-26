"use server";

import { revalidatePath } from "next/cache";
import { repondreAuCourrier } from "@/lib/corbeaux/courrier";
import { validerCorbeau } from "@/lib/corbeaux/schema";

/**
 * Répondre à une lettre adressée à l'administration.
 *
 * Protégée par le middleware, qui n'autorise /admin qu'avec une session
 * valide — mais tout est revalidé plus bas : une action serveur reste une
 * route publique, appelable directement avec l'identifiant qu'on veut.
 *
 * Deux vérifications, et aucune n'est facultative :
 *
 *   • le texte passe par `validerCorbeau`, **le même fichier que pour les
 *     joueurs**. Deux endroits qui nettoient le même texte finissent par le
 *     nettoyer différemment ;
 *   • le fil est revalidé comme fil d'administration par `repondreAuCourrier`,
 *     qui refuse tout le reste. C'est la seule chose qui empêche d'écrire dans
 *     une conversation entre joueurs en lui passant son identifiant.
 */
export async function repondreAuCourrierAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  const lu = validerCorbeau(donnees.get("corps"));
  if (!lu.ok) return;

  await repondreAuCourrier(id, lu.corps);

  revalidatePath("/admin/courrier");
  revalidatePath(`/admin/courrier/${id}`);
}
