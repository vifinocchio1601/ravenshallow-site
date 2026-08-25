/**
 * Les routes de l’école, et le menu qui les dessert.
 *
 * Ajouter une entrée au bandeau, c’est ajouter une ligne à `ENTREES_MENU` —
 * rien d’autre. Le menu, la protection des routes et les droits du membre
 * banni se déduisent tous de cette liste.
 */

export const ROUTES = {
  accueil: "/",
  inscription: "/inscription",
  connexion: "/connexion",
  motDePasseOublie: "/mot-de-passe-oublie",

  // Écrans d’attente — accessibles connecté, hors de l’école
  attente: "/dossier/en-attente",
  correction: "/dossier/correction",
  refus: "/dossier/refus",

  // L’école
  bureau: "/bureau",
  fiche: "/fiche",
  cours: "/cours",
  ecole: "/ecole",
} as const;

export type EntreeMenu = {
  href: string;
  libelle: string;
  /**
   * L’entrée reste ouverte pendant un bannissement. Absent = fermée : toute
   * entrée ajoutée plus tard sera interdite au membre suspendu par défaut,
   * ce qui est la règle voulue.
   */
  pendantBannissement?: true;
};

export const ENTREES_MENU: readonly EntreeMenu[] = [
  { href: ROUTES.bureau, libelle: "Mon bureau", pendantBannissement: true },
  { href: ROUTES.fiche, libelle: "Ma fiche", pendantBannissement: true },
  { href: ROUTES.cours, libelle: "Les cours" },
  { href: ROUTES.ecole, libelle: "L’école" },
];

/** Les chemins que le middleware doit garder. */
export const PREFIXES_ECOLE = ENTREES_MENU.map((e) => e.href);
