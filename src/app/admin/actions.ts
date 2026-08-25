"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deciderDossier,
  lireDossier,
  modifierMembre,
  supprimerMembre,
  type Decision,
} from "@/lib/dossier/depot";
import { envoyerRenvoiEnCorrection } from "@/lib/mail/envoyer";
import { FONCTIONS, STATUTS_ACCES, type Fonction, type StatutAcces } from "@/lib/dossier/etats";

/**
 * Actions d’administration.
 *
 * Protégées par le middleware, qui n’autorise /admin qu’avec une session
 * valide — mais les entrées sont revalidées ici : une action serveur reste
 * une route publique appelable directement.
 */

export async function deciderDossierAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  const decision = String(donnees.get("decision") ?? "") as Decision;
  const note = String(donnees.get("note") ?? "").trim();

  if (!id || !["ACCEPTER", "CORRIGER", "REFUSER"].includes(decision)) return;

  // La note est obligatoire pour tout ce qui n’est pas une acceptation :
  // le joueur doit savoir ce qu’on lui demande.
  if (decision !== "ACCEPTER" && !note) return;

  await deciderDossier(id, decision, note || null);

  // « Ils seront recontactés » : sans courriel, un dossier renvoyé attend un
  // joueur qui ne sait pas qu’on l’attend.
  if (decision === "CORRIGER") {
    const dossier = await lireDossier(id);
    if (dossier) {
      await envoyerRenvoiEnCorrection(
        dossier.email,
        id,
        note,
        dossier.jetonVersion,
      );
    }
  }

  revalidatePath("/admin/inscriptions");
  revalidatePath("/admin/membres");
  redirect("/admin/inscriptions");
}

export async function modifierMembreAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  const ageBrut = Number(donnees.get("age"));
  const fonction = String(donnees.get("fonction") ?? "") as Fonction;
  const acces = String(donnees.get("statutAcces") ?? "") as StatutAcces;
  const note = String(donnees.get("note") ?? "").trim();

  // « Jusqu'au » : une date sans heure, donc lue à midi UTC pour qu'un
  // fuseau ne la fasse pas basculer la veille au soir.
  const finBrute = String(donnees.get("banniJusquau") ?? "").trim();
  const fin = /^\d{4}-\d{2}-\d{2}$/.test(finBrute)
    ? new Date(`${finBrute}T12:00:00.000Z`)
    : null;

  // La durée fait partie de la sanction : elle doit se retrouver dans le
  // journal, pas seulement sur la fiche du joueur.
  const noteComplete =
    fin && acces === "EN_BANNISSEMENT"
      ? `${note ? `${note} — ` : ""}jusqu'au ${fin.toLocaleDateString("fr-FR")}`
      : note;

  await modifierMembre(
    id,
    {
      age:
        Number.isInteger(ageBrut) && ageBrut >= 11 && ageBrut <= 120
          ? ageBrut
          : undefined,
      fonction: FONCTIONS.includes(fonction) ? fonction : undefined,
      statutAcces: STATUTS_ACCES.includes(acces) ? acces : undefined,
      banniJusquau: fin,
    },
    noteComplete || null,
  );

  revalidatePath("/admin/membres");
}

/**
 * Suppression d’un membre depuis la liste.
 * La confirmation est demandée à l’écran ; ici on ne fait qu’exécuter.
 */
export async function supprimerMembreAction(donnees: FormData) {
  const id = String(donnees.get("id") ?? "");
  if (!id) return;

  await supprimerMembre(id);
  revalidatePath("/admin/membres");
  revalidatePath("/admin/inscriptions");
}
