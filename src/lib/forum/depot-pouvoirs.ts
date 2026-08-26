import "server-only";
import { prisma } from "@/lib/prisma";
import type { Maison, Role } from "@/lib/dossier/etats";
import { MAISONS } from "@/lib/dossier/etats";
import {
  AUCUN_POUVOIR,
  porteSurUneMaison,
  type Permission,
  type Pouvoirs,
} from "./pouvoirs";

/**
 * L’accès aux pouvoirs — la seule porte vers `permissions_accordees` et
 * `prefets`.
 *
 * **Rien ici ne décide de quoi que ce soit.** Ce fichier lit et écrit ; c’est
 * `pouvoirs.ts` qui répond à « a-t-il le droit ? ». La séparation est la même
 * qu’entre `corbeaux/depot.ts` et `corbeaux/droits.ts`, et pour la même
 * raison : une règle recopiée dans une requête est une règle qu’on oubliera
 * de corriger.
 *
 * **Chaque écriture laisse sa trace au journal du membre, dans la même
 * transaction.** Un pouvoir accordé sans trace serait un pouvoir dont personne
 * ne saurait d’où il vient — et le retrait, lui, efface la ligne : sans le
 * journal, il ne resterait rien du tout.
 *
 * Le nom de l’auteur vaut « Administration » tant que la zone
 * d’administration n’est qu’un mot de passe partagé : le site n’a personne
 * d’autre à nommer.
 */

export const AUTEUR_PAR_DEFAUT = "Administration";

// ─────────────────────────────────────────────────────────────
//  Lire
// ─────────────────────────────────────────────────────────────

/**
 * Les pouvoirs d’un compte, tels que `pouvoirs.ts` les attend.
 *
 * Rend `AUCUN_POUVOIR` pour un compte inconnu — le sens prudent, et jamais une
 * exception : une fiche qui s’effondre parce qu’un identifiant a changé
 * servirait moins bien qu’une fiche sans pouvoirs.
 */
export async function pouvoirsDe(utilisateurId: string): Promise<Pouvoirs> {
  return (await pouvoirsDuMembre(utilisateurId)).pouvoirs;
}

/**
 * Les mêmes pouvoirs, **et l’identifiant de la fiche**, en une seule requête.
 *
 * L’écran d’administration a besoin des deux : les permissions s’accordent au
 * compte, la charge de préfet à la fiche. Les demander séparément ferait deux
 * allers-retours pour une seule ligne.
 */
export async function pouvoirsDuMembre(
  utilisateurId: string,
): Promise<{ pouvoirs: Pouvoirs; eleveId: string | null }> {
  const compte = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      role: true,
      permissions: { select: { permission: true, maison: true } },
      eleve: {
        select: { id: true, prefectures: { select: { maison: true } } },
      },
    },
  });
  if (!compte) return { pouvoirs: AUCUN_POUVOIR, eleveId: null };

  return {
    eleveId: compte.eleve?.id ?? null,
    pouvoirs: {
      role: compte.role as Role,
      permissions: compte.permissions.map((p) => ({
        permission: p.permission as Permission,
        maison: (p.maison as Maison | null) ?? null,
      })),
      prefetDe: (compte.eleve?.prefectures ?? []).map((p) => p.maison as Maison),
    },
  };
}

export type LignePouvoir = {
  utilisateurId: string;
  eleveId: string | null;
  prenomNom: string;
  permission: Permission;
  maison: Maison | null;
  accordeeLe: string;
  accordeePar: string;
};

export type LignePrefet = {
  eleveId: string;
  utilisateurId: string;
  prenomNom: string;
  maison: Maison;
  nommeLe: string;
  nommePar: string;
};

export type LigneStaff = {
  utilisateurId: string;
  prenomNom: string;
  role: Role;
};

/**
 * Tout ce qui est détenu sur le site, pour l’écran d’ensemble.
 *
 * Trois requêtes et non une : les trois listes n’ont ni la même forme ni la
 * même clé, et les coudre en SQL ne rendrait pas la page plus rapide — il n’y
 * aura jamais que quelques dizaines de lignes.
 */
export async function listerTousLesPouvoirs(): Promise<{
  permissions: LignePouvoir[];
  prefets: LignePrefet[];
  staff: LigneStaff[];
}> {
  const [permissions, prefets, staff] = await Promise.all([
    prisma.permissionAccordee.findMany({
      orderBy: [{ permission: "asc" }, { maison: "asc" }, { accordeeLe: "asc" }],
      select: {
        permission: true,
        maison: true,
        accordeeLe: true,
        accordeePar: true,
        utilisateur: {
          select: { id: true, eleve: { select: { id: true, prenomNom: true } } },
        },
      },
    }),
    prisma.prefet.findMany({
      orderBy: [{ maison: "asc" }, { nommeLe: "asc" }],
      select: {
        maison: true,
        nommeLe: true,
        nommePar: true,
        eleve: {
          select: { id: true, prenomNom: true, utilisateurId: true },
        },
      },
    }),
    prisma.utilisateur.findMany({
      where: { role: { in: ["MODERATEUR", "ADMIN"] } },
      orderBy: { creeLe: "asc" },
      select: { id: true, role: true, eleve: { select: { prenomNom: true } } },
    }),
  ]);

  return {
    permissions: permissions.map((p) => ({
      utilisateurId: p.utilisateur.id,
      eleveId: p.utilisateur.eleve?.id ?? null,
      // Un compte sans fiche ne devrait pas exister ; s’il en apparaissait un,
      // mieux vaut une ligne sans nom qu’une page qui tombe.
      prenomNom: p.utilisateur.eleve?.prenomNom ?? "—",
      permission: p.permission as Permission,
      maison: (p.maison as Maison | null) ?? null,
      accordeeLe: p.accordeeLe.toISOString(),
      accordeePar: p.accordeePar,
    })),
    prefets: prefets.map((p) => ({
      eleveId: p.eleve.id,
      utilisateurId: p.eleve.utilisateurId,
      prenomNom: p.eleve.prenomNom,
      maison: p.maison as Maison,
      nommeLe: p.nommeLe.toISOString(),
      nommePar: p.nommePar,
    })),
    staff: staff.map((s) => ({
      utilisateurId: s.id,
      prenomNom: s.eleve?.prenomNom ?? "—",
      role: s.role as Role,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
//  Écrire — et laisser une trace, toujours
// ─────────────────────────────────────────────────────────────

/** « ANNONCES_MAISON:KALDRAFN », ou « CLORE_SCENE ». Lu par le journal. */
export function empreinte(permission: Permission, maison: Maison | null): string {
  return maison ? `${permission}:${maison}` : permission;
}

/**
 * Accorder une permission.
 *
 * Rend le nombre de lignes réellement posées : accorder deux fois la même
 * chose ne fait rien, et n’écrit donc rien au journal non plus. Sans ce
 * `skipDuplicates`, un double clic tomberait sur l’index unique et
 * afficherait une erreur là où il ne s’est simplement rien passé.
 *
 * **Une ligne par maison.** « Les quatre maisons » se demande en passant les
 * quatre : cette fonction ne connaît pas de raccourci, et c’est voulu.
 */
export async function accorderPermission(
  utilisateurId: string,
  permission: Permission,
  maisons: readonly (Maison | null)[],
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<number> {
  // Une permission globale ne prend pas de maison, une permission de maison en
  // exige une. La base refuserait l'inverse ; on ne lui envoie pas la faute.
  const portees = porteSurUneMaison(permission)
    ? maisons.filter((m): m is Maison => m !== null)
    : [null];
  if (portees.length === 0) return 0;

  return prisma.$transaction(async (tx) => {
    // On regarde ce qui est DÉJÀ détenu avant d'écrire, plutôt que de deviner
    // après coup ce que l'insertion a posé : dans une transaction, toutes les
    // lignes portent le même instant, et un tri par date ne les départage pas.
    const deja = await tx.permissionAccordee.findMany({
      where: { utilisateurId, permission },
      select: { maison: true },
    });
    const cle = (m: Maison | null) => m ?? "__globale__";
    const detenues = new Set(deja.map((d) => cle(d.maison as Maison | null)));
    const aPoser = portees.filter((m) => !detenues.has(cle(m)));

    // Reposer une permission déjà détenue n'est pas un événement : ni ligne,
    // ni entrée au journal. Sans quoi un double clic gonflerait l'historique.
    if (aPoser.length === 0) return 0;

    await tx.permissionAccordee.createMany({
      data: aPoser.map((maison) => ({
        utilisateurId,
        permission,
        maison,
        accordeePar: parNom,
      })),
      // Ceinture : deux administrateurs au même instant tomberaient sinon sur
      // l'index unique, et l'un des deux lirait une erreur pour un geste qui a
      // pourtant abouti.
      skipDuplicates: true,
    });

    await tx.journalMembre.createMany({
      data: aPoser.map((maison) => ({
        utilisateurId,
        type: "PERMISSION_ACCORDEE" as const,
        valeurApres: empreinte(permission, maison),
        parNom,
      })),
    });
    return aPoser.length;
  });
}

/**
 * Retirer une permission — un clic, comme l’attribution (art. 13.5).
 *
 * `maisons` vide retire la permission globale ; sinon, les maisons visées.
 * Ce qui n’était pas détenu ne produit aucune entrée au journal.
 */
export async function retirerPermission(
  utilisateurId: string,
  permission: Permission,
  maisons: readonly (Maison | null)[],
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<number> {
  const portees = porteSurUneMaison(permission)
    ? maisons.filter((m): m is Maison => m !== null)
    : [null];
  if (portees.length === 0) return 0;

  return prisma.$transaction(async (tx) => {
    // On relit avant d'effacer : après, il ne resterait rien à consigner.
    const existantes = await tx.permissionAccordee.findMany({
      where: {
        utilisateurId,
        permission,
        ...(porteSurUneMaison(permission)
          ? { maison: { in: portees as Maison[] } }
          : { maison: null }),
      },
      select: { id: true, maison: true },
    });
    if (existantes.length === 0) return 0;

    await tx.permissionAccordee.deleteMany({
      where: { id: { in: existantes.map((e) => e.id) } },
    });

    await tx.journalMembre.createMany({
      data: existantes.map((e) => ({
        utilisateurId,
        type: "PERMISSION_RETIREE" as const,
        valeurAvant: empreinte(permission, (e.maison as Maison | null) ?? null),
        parNom,
      })),
    });
    return existantes.length;
  });
}

/** Les quatre maisons d’un coup, dans une seule transaction. */
export function accorderSurToutesLesMaisons(
  utilisateurId: string,
  permission: Permission,
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<number> {
  return accorderPermission(utilisateurId, permission, MAISONS, parNom);
}

// ─────────────────────────────────────────────────────────────
//  Les préfets
// ─────────────────────────────────────────────────────────────

/**
 * Nommer un préfet.
 *
 * Aucune ligne n’est créée dans `permissions_accordees` : le droit d’écrire
 * les annonces **dérive** de cette nomination, dans `pouvoirs.ts`. Sans cela,
 * démettre le préfet laisserait le pouvoir derrière lui.
 */
export async function nommerPrefet(
  eleveId: string,
  maison: Maison,
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<boolean> {
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { utilisateurId: true },
  });
  if (!eleve) return false;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.prefet.createMany({
      data: [{ eleveId, maison, nommePar: parNom }],
      skipDuplicates: true,
    });
    if (count === 0) return false;

    await tx.journalMembre.create({
      data: {
        utilisateurId: eleve.utilisateurId,
        type: "PREFET_NOMME",
        valeurApres: maison,
        parNom,
      },
    });
    return true;
  });
}

/** Démettre — « le rôle peut être repris en cas d’inactivité » (art. 13.5). */
export async function demettrePrefet(
  eleveId: string,
  maison: Maison,
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<boolean> {
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { utilisateurId: true },
  });
  if (!eleve) return false;

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.prefet.deleteMany({ where: { eleveId, maison } });
    if (count === 0) return false;

    await tx.journalMembre.create({
      data: {
        utilisateurId: eleve.utilisateurId,
        type: "PREFET_DEMIS",
        valeurAvant: maison,
        parNom,
      },
    });
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  Le rôle technique
// ─────────────────────────────────────────────────────────────

/**
 * Changer le rôle d’un compte — joueur, modérateur, administrateur.
 *
 * Rien à voir avec `roleAffiche` : celui-là ne remplace qu’un libellé à
 * l’écran, celui-ci ouvre le forum en grand.
 */
export async function modifierRole(
  utilisateurId: string,
  role: Role,
  parNom = AUTEUR_PAR_DEFAUT,
): Promise<boolean> {
  const avant = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: { role: true },
  });
  if (!avant || avant.role === role) return false;

  await prisma.$transaction([
    prisma.utilisateur.update({ where: { id: utilisateurId }, data: { role } }),
    prisma.journalMembre.create({
      data: {
        utilisateurId,
        // Son propre événement, et non `ACCES_MODIFIE` : le journal afficherait
        // « Accès modifié : MODERATEUR », une phrase fausse dans la seule page
        // qui sert à comprendre ce qui est arrivé à un compte.
        type: "ROLE_MODIFIE",
        valeurAvant: avant.role,
        valeurApres: role,
        parNom,
      },
    }),
  ]);
  return true;
}
