/**
 * **Qui a le droit de quoi, et sur quelle maison.**
 *
 * C’est le seul endroit du site qui répond à ces questions. L’écran
 * d’administration s’y réfère pour cocher, le forum s’y réfèrera pour accepter
 * ou refuser — et il refera le contrôle **en entier**, sans se reposer sur ce
 * qui s’affiche : une route d’API est publique.
 *
 * Pas de `server-only` ici, et c’est voulu : le fichier ne contient aucune
 * donnée, seulement des règles, et les deux côtés doivent les lire au mot
 * près. Même choix que `lib/corbeaux/droits.ts` et `lib/dossier/role-affiche.ts`.
 *
 * ── Trois choses que ce fichier ne fait pas, et ne fera jamais ──
 *
 * 1. **Il n’ouvre pas la Tour aux Corbeaux.** Aucune des six permissions ne
 *    donne accès à une conversation privée, sous aucune forme, et
 *    `pouvoirs.test.ts` relit leurs noms pour que personne n’en ajoute une
 *    qui s’en approcherait.
 * 2. **Il ne lit pas `roleAffiche`.** Écrire « Directrice » dans le champ
 *    décoratif n’ouvre rien : les pouvoirs viennent d’ici, et d’ici seulement.
 * 3. **Il n’attribue rien.** Aucune permission ne permet d’en accorder une —
 *    sans quoi un professeur se promeut lui-même, ou promeut un ami. Seule la
 *    zone d’administration accorde, et un test relit le code source pour s’en
 *    assurer.
 */

import type { Maison, Role } from "@/lib/dossier/etats";

/**
 * **Les six permissions attribuables.** Miroir de l’enum Prisma `Permission`.
 *
 * Deux portent sur une maison, quatre sur tout le forum. Cette liste est figée
 * par un test : en ajouter une est un geste délibéré, pas une ligne qui passe
 * dans un lot. La sixième — `VOIR_LES_CONTROLES` — est arrivée ainsi, le
 * 4 septembre 2026, et le test qui figeait les cinq est bien tombé.
 */
export type Permission =
  | "ANNONCES_MAISON"
  | "LIRE_ESPACES_MAISON"
  | "CLORE_SCENE"
  | "EPINGLER_SUJET"
  | "VERROUILLER_SECTION"
  | "VOIR_LES_CONTROLES";

/** Dans l’ordre d’affichage : les deux de maison d’abord, puis les globales. */
export const PERMISSIONS: readonly Permission[] = [
  "ANNONCES_MAISON",
  "LIRE_ESPACES_MAISON",
  "CLORE_SCENE",
  "EPINGLER_SUJET",
  "VERROUILLER_SECTION",
  "VOIR_LES_CONTROLES",
];

/**
 * Celles qui se donnent maison par maison.
 *
 * **La base porte la même règle**, par une contrainte `CHECK`, et dans les
 * deux sens : une permission de maison sans maison n’aurait pas de portée,
 * une permission globale avec une maison en aurait deux. Cette liste-ci sert à
 * l’écran ; celle de la base sert à tout le reste.
 */
export const PERMISSIONS_DE_MAISON: readonly Permission[] = [
  "ANNONCES_MAISON",
  "LIRE_ESPACES_MAISON",
];

export function porteSurUneMaison(permission: Permission): boolean {
  return PERMISSIONS_DE_MAISON.includes(permission);
}

/**
 * Une permission détenue. `maison` est renseignée pour les deux permissions de
 * maison, nulle pour les trois autres.
 *
 * **Jamais un `null` qui voudrait dire « toutes les maisons ».** Les quatre
 * maisons, c’est quatre lignes — sans quoi la même case porterait deux sens,
 * et c’est exactement le piège contre lequel `EtatEtape` a été inventé.
 */
export type PermissionDetenue = {
  permission: Permission;
  maison: Maison | null;
};

/** Le strict nécessaire pour décider — ni la fiche, ni le dossier, ni l’année. */
export type Pouvoirs = {
  /**
   * Le rôle technique du compte. **Ce n’est pas le titre affiché** : un membre
   * peut porter « Directrice » à l’écran et n’être que `JOUEUR` ici, et
   * l’inverse.
   */
  role: Role;
  permissions: readonly PermissionDetenue[];
  /** Les maisons dont ce membre est préfet. Vide pour presque tout le monde. */
  prefetDe: readonly Maison[];
};

/** Un membre ordinaire. Le défaut, et le sens prudent. */
export const AUCUN_POUVOIR: Pouvoirs = {
  role: "JOUEUR",
  permissions: [],
  prefetDe: [],
};

/**
 * Le staff — modérateurs et administrateurs.
 *
 * « Les modérateurs interviennent partout », y compris pour clore un sujet
 * abandonné (art. 17.2). C’est la seule dérogation générale de ce fichier, et
 * elle est écrite une fois.
 */
export function estStaff(pouvoirs: Pouvoirs): boolean {
  return pouvoirs.role === "MODERATEUR" || pouvoirs.role === "ADMIN";
}

/** Détient-il cette permission sur cette maison-là, et pas sur une autre ? */
function detient(
  pouvoirs: Pouvoirs,
  permission: Permission,
  maison: Maison | null,
): boolean {
  return pouvoirs.permissions.some(
    (p) => p.permission === permission && p.maison === maison,
  );
}

/**
 * **Écrire les annonces d’une maison.**
 *
 * Trois chemins y mènent, et le troisième est celui des préfets : il **dérive**
 * de leur nomination plutôt que de créer une permission en douce. Sans cela,
 * démettre un préfet laisserait le pouvoir derrière lui, et personne ne verrait
 * pourquoi il écrit encore.
 *
 * Une permission accordée sur Kaldrafn ne donne rien sur Nattorm : la maison
 * fait partie de la question, jamais du décor.
 */
export function peutEcrireLesAnnoncesDe(
  pouvoirs: Pouvoirs,
  maison: Maison,
): boolean {
  if (estStaff(pouvoirs)) return true;
  if (pouvoirs.prefetDe.includes(maison)) return true;
  return detient(pouvoirs, "ANNONCES_MAISON", maison);
}

/**
 * **Lire les espaces réservés d’une maison** — le dortoir, et ce qui viendra.
 *
 * Ne se dérive pas du fait d’être de la maison : cette question-là se pose sur
 * le lieu, pas sur le membre. Ici, on ne répond qu’à « ce membre passe-t-il
 * outre la réserve ? ».
 */
export function peutLireLesEspacesDe(
  pouvoirs: Pouvoirs,
  maison: Maison,
): boolean {
  if (estStaff(pouvoirs)) return true;
  return detient(pouvoirs, "LIRE_ESPACES_MAISON", maison);
}

/**
 * **Peut-il entrer dans cette maison-là ?** — le tableau d'affichage, le salon.
 *
 * Chez soi, toujours. Ailleurs, il faut `peutLireLesEspacesDe` : le staff, ou
 * le détenteur de `LIRE_ESPACES_MAISON` sur cette maison précise.
 *
 * **Cette question n'existait pas avant le 28 août 2026, et son absence était
 * un trou :** `peutEcrireLesAnnoncesDe` accordait au staff le tableau de
 * toutes les maisons, mais la seule adresse qui y menait exigeait d'avoir une
 * maison. Une directrice avait donc un pouvoir sans chemin.
 *
 * ⚠️ **Elle ne peut pas vivre dans `session/acces.ts`**, et c'est pour cela
 * qu'il a fallu une seconde adresse. Le middleware tourne au bord du réseau
 * et ne joint pas la base : il sait lire l'état d'un compte dans son cookie,
 * jamais ses permissions. « A-t-elle une maison ? » il sait ; « est-elle
 * directrice ? » il ne saura jamais.
 */
export function peutVisiterLaMaison(
  pouvoirs: Pouvoirs,
  /** La maison du compte — celle qui s'affiche, jamais la colonne brute. */
  laSienne: Maison | null,
  visee: Maison,
): boolean {
  if (laSienne === visee) return true;
  return peutLireLesEspacesDe(pouvoirs, visee);
}

/**
 * **Peut-il parler au salon de cette maison-là ?**
 *
 * Chez soi, toujours. Ailleurs, **le staff seul** — une directrice s'adresse
 * à une maison dans sa salle commune, et c'est une décision du joueur du
 * 28 août 2026.
 *
 * ⚠️ **`LIRE_ESPACES_MAISON` n'ouvre pas la parole**, et son nom le dit :
 * lire n'est pas écrire. Un professeur à qui l'on donne la lecture d'un
 * dortoir ne doit pas se retrouver à y bavarder sans que personne l'ait
 * voulu.
 */
export function peutParlerDansLeSalonDe(
  pouvoirs: Pouvoirs,
  laSienne: Maison | null,
  visee: Maison,
): boolean {
  if (laSienne === visee) return true;
  return estStaff(pouvoirs);
}

/** Clore une scène — art. 17.2. Tout le forum. */
export function peutCloreUneScene(pouvoirs: Pouvoirs): boolean {
  return estStaff(pouvoirs) || detient(pouvoirs, "CLORE_SCENE", null);
}

/** Épingler un sujet. Tout le forum. */
export function peutEpinglerUnSujet(pouvoirs: Pouvoirs): boolean {
  return estStaff(pouvoirs) || detient(pouvoirs, "EPINGLER_SUJET", null);
}

/** Verrouiller une section. Tout le forum. */
export function peutVerrouillerUneSection(pouvoirs: Pouvoirs): boolean {
  return estStaff(pouvoirs) || detient(pouvoirs, "VERROUILLER_SECTION", null);
}

/**
 * **Peut-il voir les contrôles de leçon envoyés ?** — la porte des professeurs.
 *
 * Elle ouvre la liste : qui a passé quel contrôle, quand, et avec quelle note.
 * Et **rien d’autre** :
 *
 *   • pas les années qu’il n’a pas atteintes — c’est `peutOuvrirLAnnee` qui en
 *     décide, et l’article 14.4 vaut pour tout le monde ;
 *   • pas les leçons avant leur heure d’ouverture — c’est `peutOuvrirLaLecon` ;
 *   • pas les réponses d’un élève, copie par copie. On voit une note.
 *
 * ⚠️ **Elle ne se déduit JAMAIS du rôle affiché.** Écrire « Professeur
 * d’alchimie » dans le champ décoratif n’ouvre rien — c’est la règle du
 * joueur, et `role-affiche.test.ts` la tient de trois façons. Un professeur
 * reçoit cette permission depuis `/admin/pouvoirs`, comme les cinq autres.
 */
export function peutVoirLesControles(pouvoirs: Pouvoirs): boolean {
  return estStaff(pouvoirs) || detient(pouvoirs, "VOIR_LES_CONTROLES", null);
}

/**
 * Ce membre détient-il quoi que ce soit ?
 *
 * Sert à l’affichage seul — la fiche n’ouvre le panneau des pouvoirs que s’il
 * y a quelque chose à montrer. Aucune décision d’accès ne passe par là.
 */
export function detientQuelqueChose(pouvoirs: Pouvoirs): boolean {
  return (
    estStaff(pouvoirs) ||
    pouvoirs.permissions.length > 0 ||
    pouvoirs.prefetDe.length > 0
  );
}
