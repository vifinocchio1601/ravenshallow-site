/**
 * Les routes de l’école, et le menu qui les dessert.
 *
 * Ajouter une entrée au bandeau, c’est ajouter une ligne à `ENTREES_MENU` —
 * rien d’autre. Le menu, la protection des routes et les droits du membre
 * banni se déduisent tous de cette liste.
 */

import { NOM_COURT } from "@/lib/corbeaux/constantes";

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
  corbeaux: "/corbeaux",
  // Deux adresses de la Tour qui ne sont pas un fil. Elles n’ont pas besoin
  // de figurer dans `ROUTES_HORS_MENU` : `routeAutorisee` reconnaît déjà tout
  // ce qui commence par `/corbeaux/`.
  corbeauxNouveau: "/corbeaux/nouveau",
  corbeauxAdministration: "/corbeaux/administration",
  corbeauxBloques: "/corbeaux/bloques",

  // L’école, hors bandeau
  bjornstav: "/bjornstav",
  ceremonie: "/ceremonie",
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
  /**
   * L’entrée est ouverte au nouvel arrivant, avant qu’il ait choisi sa
   * baguette et rencontré le Miroir. Même règle que ci-dessus : absent =
   * fermée. Une entrée ajoutée plus tard se rangera donc d’elle-même derrière
   * la liste des premiers pas, sans que personne ait à y penser.
   */
  avantPremiersPas?: true;
  /**
   * L’entrée affiche un compte à côté de son libellé — les corbeaux non lus.
   *
   * Déclaré ici plutôt que deviné par le bandeau : celui-ci ne connaît aucune
   * adresse en particulier, il affiche le compte qu’on lui remet pour ce
   * `href`. Le jour où les scènes en auront un, ce sera une ligne de plus,
   * pas une condition de plus.
   */
  porteUnCompteur?: true;
};

export const ENTREES_MENU: readonly EntreeMenu[] = [
  {
    href: ROUTES.bureau,
    libelle: "Mon bureau",
    pendantBannissement: true,
    avantPremiersPas: true,
  },
  {
    href: ROUTES.fiche,
    libelle: "Ma fiche",
    pendantBannissement: true,
    avantPremiersPas: true,
  },
  {
    // La Tour aux Corbeaux s’ouvre dès le premier jour, et reste ouverte
    // pendant une suspension — non pour continuer à bavarder, mais parce que
    // c’est par là qu’on écrit à l’administration. L’article 8.5 donne quinze
    // jours pour contester une sanction : la lui fermer reviendrait à
    // supprimer ce recours pour la seule personne à qui il sert.
    //
    // Ce que le membre suspendu y trouve — le fil de l’administration, et rien
    // d’autre — se décide dans `lib/corbeaux/droits.ts`. Un drapeau de menu ne
    // sait dire qu’ouvert ou fermé ; la nuance vit ailleurs, comme pour la
    // boutique et le Miroir.
    href: ROUTES.corbeaux,
    libelle: NOM_COURT,
    pendantBannissement: true,
    avantPremiersPas: true,
    porteUnCompteur: true,
  },
  { href: ROUTES.cours, libelle: "Les cours" },
  { href: ROUTES.ecole, libelle: "L’école" },
];

/**
 * Les routes de l’école qui n’ont **pas** d’entrée au bandeau.
 *
 * La Cérémonie du Miroir ne se range pas dans un menu : on y va une fois,
 * depuis le bureau, et l’adresse se ferme derrière soi. Elle a pourtant
 * besoin d’être gardée comme les autres — d’où cette liste, séparée de
 * l’affichage mais lue par la même protection.
 *
 * Même règle que le bandeau : sans `pendantBannissement`, l’entrée est
 * fermée au membre suspendu.
 */
export type RouteEcole = {
  href: string;
  pendantBannissement?: true;
  avantPremiersPas?: true;
};

export const ROUTES_HORS_MENU: readonly RouteEcole[] = [
  // La boutique et la cérémonie sont précisément les deux premiers pas :
  // elles s’ouvrent avant qu’ils soient faits, et chaque page se referme
  // d’elle-même une fois le sien franchi.
  //
  // Ni l’une ni l’autre n’est ouverte pendant un bannissement : un membre
  // suspendu garde son bureau et sa fiche, rien d’autre.
  { href: ROUTES.bjornstav, avantPremiersPas: true },
  { href: ROUTES.ceremonie, avantPremiersPas: true },
];

/**
 * Les chemins que le middleware doit garder : ceux du bandeau, et ceux qui
 * n’y figurent pas. Une route oubliée ici ne serait plus gardée du tout.
 */
export const PREFIXES_ECOLE = [
  ...ENTREES_MENU.map((e) => e.href),
  ...ROUTES_HORS_MENU.map((r) => r.href),
];
