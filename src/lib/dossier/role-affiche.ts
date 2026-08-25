import { z } from "zod";

/**
 * Le rôle affiché — un titre au château, écrit à la main.
 *
 * Directrice, professeur d’alchimie, bibliothécaire, intendant du château.
 * Texte libre plutôt qu’une liste : ces titres sont rares, variés, et on en
 * inventera d’autres — les enfermer dans une liste imposerait une migration
 * par nouveau titre.
 *
 * **Ce fichier est la seule source de vérité de la validation**, partagée mot
 * pour mot entre le champ de saisie et l’action serveur. Il n’est pas
 * `server-only` : le formulaire en a besoin pour valider pendant la frappe.
 *
 * ⚠️ **Ce titre n’ouvre aucun droit.** Il ne fait que remplacer l’année à
 * l’affichage. Rien ici ne doit jamais servir à décider d’un accès : les
 * droits se lisent dans `lib/session/acces.ts`, sur l’état du dossier et le
 * statut d’accès. Écrire « Administratrice » dans ce champ n’ouvre rien.
 */

export const ROLE_AFFICHE_MAX = 40;

/**
 * Lettres — accents compris —, espaces, apostrophes, tirets et points.
 *
 * Le premier signe doit être une lettre : un titre commençant par un point ou
 * un tiret n’en est pas un, et laisser passer « .Directrice » n’aiderait
 * personne. Les chevrons sont exclus d’office, faute d’être des lettres.
 */
export const REGEX_ROLE_AFFICHE = /^[\p{L}][\p{L} '’.-]*$/u;

export const TEXTES_ROLE_AFFICHE = {
  libelle: "Rôle particulier",
  aide: "Laisser vide pour un élève. Remplace l’année partout où elle s’affiche.",
  placeholder: "Directrice, professeur d’alchimie…",
  /** Rappelé sous le champ : ce libellé n’est qu’un libellé. */
  sansDroit: "Décoratif : n’accorde aucun droit.",
  /** La provenance, côté administration seule. */
  provenance: "Posé par {auteur} le {date}",
  erreurs: {
    longueur: `${ROLE_AFFICHE_MAX} caractères au plus.`,
    contenu:
      "Lettres, espaces, apostrophes, tirets et points seulement, en commençant par une lettre.",
  },
} as const;

/**
 * Ce qui est retiré avant tout examen.
 *
 * Les espaces de début et de fin, les espaces multiples — et les retours à la
 * ligne, qu’un collage peut glisser dans un champ d’une seule ligne : ils
 * deviennent des espaces ordinaires plutôt que de faire échouer la saisie.
 *
 * L’apostrophe droite devient typographique, comme partout ailleurs sur le
 * site : « professeur d’alchimie » s’affichera à côté de textes qui, eux, ne
 * s’écrivent pas autrement.
 */
export function nettoyerRoleAffiche(brut: string): string {
  return brut.replace(/'/g, "’").replace(/\s+/g, " ").trim();
}

/**
 * Le schéma partagé. Rend `null` pour un champ vide — c’est ce que la base
 * attend, et c’est ce qui fait réapparaître l’année à l’affichage.
 */
export const roleAfficheSchema = z
  .string()
  .transform(nettoyerRoleAffiche)
  .refine(
    (v) => v.length <= ROLE_AFFICHE_MAX,
    TEXTES_ROLE_AFFICHE.erreurs.longueur,
  )
  .refine(
    (v) => v === "" || REGEX_ROLE_AFFICHE.test(v),
    TEXTES_ROLE_AFFICHE.erreurs.contenu,
  )
  .transform((v) => (v === "" ? null : v));

export type ResultatRoleAffiche =
  | { ok: true; valeur: string | null }
  | { ok: false; message: string };

/**
 * Valide une saisie. Appelée des deux côtés : par le champ à chaque frappe,
 * et par l’action serveur avant d’écrire — une action serveur reste une route
 * publique, appelable directement.
 */
export function validerRoleAffiche(brut: string): ResultatRoleAffiche {
  const lu = roleAfficheSchema.safeParse(brut);
  return lu.success
    ? { ok: true, valeur: lu.data }
    : { ok: false, message: lu.error.issues[0]?.message ?? TEXTES_ROLE_AFFICHE.erreurs.contenu };
}
