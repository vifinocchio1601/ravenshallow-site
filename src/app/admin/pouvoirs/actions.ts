"use server";

import { revalidatePath } from "next/cache";
import { MAISONS, ROLES, type Maison, type Role } from "@/lib/dossier/etats";
import {
  accorderPermission,
  accorderSurToutesLesMaisons,
  demettrePrefet,
  modifierRole,
  nommerPrefet,
  retirerPermission,
} from "@/lib/forum/depot-pouvoirs";
import { PERMISSIONS, type Permission } from "@/lib/forum/pouvoirs";

/**
 * Accorder et retirer, depuis la zone d’administration **et de nulle part
 * ailleurs**.
 *
 * Protégées par le middleware, qui n’ouvre `/admin` qu’avec une session
 * valide — mais chaque entrée est revalidée ici : une action serveur reste une
 * route publique, appelable directement, et le contrôle qui n’est fait qu’à
 * l’écran n’est pas un contrôle.
 *
 * Une valeur inconnue fait **renoncer à tout**, jamais deviner : accorder au
 * hasard une permission qu’on n’a pas comprise est pire que ne rien faire.
 *
 * `pouvoirs.test.ts` relit le code source de `src/app/` et échoue si un
 * fichier hors de `/admin` appelle l’une de ces fonctions. « Aucune permission
 * ne permet d’en attribuer » cesse d’être une intention à tenir.
 */

/** Le nom qui restera au journal. La zone d’administration n’a pas de comptes. */
const AUTEUR = "Administration";

function permissionValide(brut: string): Permission | null {
  return (PERMISSIONS as readonly string[]).includes(brut)
    ? (brut as Permission)
    : null;
}

function maisonValide(brut: string): Maison | null {
  return (MAISONS as readonly string[]).includes(brut) ? (brut as Maison) : null;
}

/** Rafraîchit les deux écrans où un pouvoir se voit. */
function rafraichir(utilisateurId: string) {
  revalidatePath(`/admin/dossiers/${utilisateurId}`);
  revalidatePath("/admin/pouvoirs");
  revalidatePath("/admin/membres");
}

/**
 * Le même geste dans les deux sens : accorder et retirer se valent, et c’est
 * la règle (art. 13.5 — un rôle peut être repris).
 */
export async function basculerPermissionAction(donnees: FormData) {
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const permission = permissionValide(String(donnees.get("permission") ?? ""));
  const sens = String(donnees.get("sens") ?? "");
  const maisonBrute = String(donnees.get("maison") ?? "");

  if (!utilisateurId || !permission) return;
  if (sens !== "ACCORDER" && sens !== "RETIRER") return;

  // Une permission globale n'a pas de maison ; une permission de maison en
  // exige une valide. La base refuserait le contraire — on ne lui envoie pas
  // la faute, et on ne devine pas à sa place.
  const maisons: readonly (Maison | null)[] = maisonBrute
    ? [maisonValide(maisonBrute)].filter((m): m is Maison => m !== null)
    : [null];
  if (maisonBrute && maisons.length === 0) return;

  if (sens === "ACCORDER") {
    await accorderPermission(utilisateurId, permission, maisons, AUTEUR);
  } else {
    await retirerPermission(utilisateurId, permission, maisons, AUTEUR);
  }
  rafraichir(utilisateurId);
}

/** Les quatre maisons d’un coup — quatre lignes, une seule transaction. */
export async function accorderToutesLesMaisonsAction(donnees: FormData) {
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const permission = permissionValide(String(donnees.get("permission") ?? ""));
  if (!utilisateurId || !permission) return;

  await accorderSurToutesLesMaisons(utilisateurId, permission, AUTEUR);
  rafraichir(utilisateurId);
}

/** Retirer les quatre d’un coup, pour que le retrait reste aussi simple. */
export async function retirerToutesLesMaisonsAction(donnees: FormData) {
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const permission = permissionValide(String(donnees.get("permission") ?? ""));
  if (!utilisateurId || !permission) return;

  await retirerPermission(utilisateurId, permission, MAISONS, AUTEUR);
  rafraichir(utilisateurId);
}

export async function nommerPrefetAction(donnees: FormData) {
  const eleveId = String(donnees.get("eleveId") ?? "");
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const maison = maisonValide(String(donnees.get("maison") ?? ""));
  if (!eleveId || !maison) return;

  await nommerPrefet(eleveId, maison, AUTEUR);
  if (utilisateurId) rafraichir(utilisateurId);
  else revalidatePath("/admin/pouvoirs");
}

export async function demettrePrefetAction(donnees: FormData) {
  const eleveId = String(donnees.get("eleveId") ?? "");
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const maison = maisonValide(String(donnees.get("maison") ?? ""));
  if (!eleveId || !maison) return;

  await demettrePrefet(eleveId, maison, AUTEUR);
  if (utilisateurId) rafraichir(utilisateurId);
  else revalidatePath("/admin/pouvoirs");
}

/**
 * Le rôle technique — joueur, modérateur, administrateur.
 *
 * À ne pas confondre avec le rôle affiché sur la fiche, qui reste décoratif :
 * celui-ci ouvre le forum en grand, celui-là ne remplace qu’un libellé.
 */
export async function modifierRoleAction(donnees: FormData) {
  const utilisateurId = String(donnees.get("utilisateurId") ?? "");
  const brut = String(donnees.get("role") ?? "");
  if (!utilisateurId || !(ROLES as readonly string[]).includes(brut)) return;

  await modifierRole(utilisateurId, brut as Role, AUTEUR);
  rafraichir(utilisateurId);
}
