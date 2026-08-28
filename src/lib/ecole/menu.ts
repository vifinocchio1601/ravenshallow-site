/**
 * Les routes de l’école, et le menu qui les dessert.
 *
 * ── L’arbre et les feuilles ──
 *
 * Le parchemin affiche **un arbre** : cinq entrées, dont trois ouvrent un
 * sous-menu. Les règles d’accès, elles, ne portent que sur **les feuilles** —
 * une adresse s’ouvre ou ne s’ouvre pas, un groupe n’est qu’un chapeau.
 *
 * D’où une seule source, `MENU`, et une liste plate qui s’en déduit :
 * `ENTREES_MENU`. Deux listes tenues à la main finiraient par diverger, et
 * c’est la copie oubliée qui laisserait une route sans garde.
 *
 * **Un groupe n’a pas d’adresse.** On ne clique pas sur « Le domaine » : on
 * l’ouvre. C’est ce qui permet au Grand Hall d’accueillir le calendrier et
 * les résultats plus tard sans rien déplacer.
 */

import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { NOM_COURT } from "@/lib/corbeaux/constantes";

export const ROUTES = {
  accueil: "/",
  inscription: "/inscription",
  connexion: "/connexion",
  motDePasseOublie: "/mot-de-passe-oublie",
  reglementPublic: "/reglement",

  // Écrans d’attente — accessibles connecté, hors de l’école
  attente: "/dossier/en-attente",
  correction: "/dossier/correction",
  refus: "/dossier/refus",

  // L’école
  bureau: "/bureau",

  // Mon personnage
  fiche: "/fiche",
  maison: "/maison",
  corbeaux: "/corbeaux",
  // Trois adresses de la Tour qui ne sont pas un fil. Elles n’ont pas besoin
  // de figurer dans `ROUTES_HORS_MENU` : `routeAutorisee` reconnaît déjà tout
  // ce qui commence par `/corbeaux/`.
  corbeauxNouveau: "/corbeaux/nouveau",
  corbeauxAdministration: "/corbeaux/administration",
  corbeauxBloques: "/corbeaux/bloques",

  // Le domaine
  ecole: "/ecole",
  cours: "/cours",
  alentours: "/alentours",

  // Le monde des non-mages
  nonMages: "/non-mages",

  // Le Grand Hall — l'espace officiel de l'administration (bible §12).
  //
  // Les annonces vivent à `/annonces` et non sous `/archives/` : c'est
  // l'adresse vers laquelle le journal du bureau pointait déjà, et une
  // annonce n'est pas une archive — c'est ce qu'on lit cette semaine.
  // L'adresse d'une feuille n'a pas à répéter le nom de son groupe.
  annonces: "/annonces",
  archivesReglement: "/archives/reglement",
  archivesHistoire: "/archives/histoire",

  // L’école, hors bandeau
  bjornstav: "/bjornstav",
  ceremonie: "/ceremonie",
} as const;

/**
 * Une feuille du menu : une adresse, un libellé, et ce qui la referme.
 *
 * **L’absence d’un drapeau vaut fermeture**, dans les trois cas. Une entrée
 * ajoutée plus tard sera donc interdite au membre suspendu comme au nouvel
 * arrivant par défaut, ce qui est la règle voulue et qu’on ne risque pas
 * d’oublier.
 */
export type LienMenu = {
  href: string;
  libelle: string;
  /** L’entrée reste ouverte pendant un bannissement. */
  pendantBannissement?: true;
  /**
   * L’entrée est ouverte au nouvel arrivant, avant qu’il ait choisi sa
   * baguette et rencontré le Miroir.
   */
  avantPremiersPas?: true;
  /**
   * L’entrée **exige une maison qui s’affiche**. Fermée à qui n’en a pas —
   * l’élève que le Miroir attend, comme la directrice qu’il ne concerne pas.
   *
   * Le drapeau existe parce que « Ma maison » n’a aucun sens sans maison :
   * l’entrée ne se grise pas, elle disparaît. La question elle-même n’est pas
   * posée ici — c’est `aUneMaison`, dans `session/acces.ts`, qui y répond.
   */
  exigeUneMaison?: true;
  /**
   * L’entrée affiche un compte à côté de son libellé — les corbeaux non lus.
   *
   * Déclaré ici plutôt que deviné par le bandeau : celui-ci ne connaît aucune
   * adresse en particulier, il affiche le compte qu’on lui remet pour ce
   * `href`. **Le groupe qui la contient en hérite** : la somme des comptes de
   * ses feuilles remonte sur son libellé, sans quoi on raterait ses corbeaux
   * depuis un sous-menu fermé.
   */
  porteUnCompteur?: true;
};

/** Un chapeau qui ouvre un sous-menu. Sans adresse : on ne clique pas dessus. */
export type GroupeMenu = {
  libelle: string;
  /**
   * Les feuilles du groupe. La liste est **faite pour s’allonger** — les
   * archives accueilleront la carte et le bestiaire.
   */
  liens: readonly LienMenu[];
};

export type EntreeMenu = LienMenu | GroupeMenu;

export function estUnGroupe(entree: EntreeMenu): entree is GroupeMenu {
  return "liens" in entree;
}

/**
 * **L’arbre du parchemin.** L’ordre est celui de l’affichage.
 *
 * Ajouter une entrée = une ligne ici. Ajouter un lieu aux archives = une ligne
 * dans `liens`. Rien d’autre : le menu, la protection des routes et les droits
 * du membre suspendu s’en déduisent tous.
 */
export const MENU: readonly EntreeMenu[] = [
  {
    href: ROUTES.bureau,
    libelle: "Mon bureau",
    pendantBannissement: true,
    avantPremiersPas: true,
  },

  {
    libelle: "Mon personnage",
    liens: [
      {
        href: ROUTES.fiche,
        libelle: "Ma fiche",
        pendantBannissement: true,
        avantPremiersPas: true,
      },
      {
        // Sans maison, pas d’entrée : ni pour l’élève que le Miroir attend,
        // ni pour la directrice qu’il ne concerne pas.
        href: ROUTES.maison,
        libelle: "Ma maison",
        exigeUneMaison: true,
      },
      {
        // La Tour aux Corbeaux s’ouvre dès le premier jour, et reste ouverte
        // pendant une suspension — non pour continuer à bavarder, mais parce
        // que c’est par là qu’on écrit à l’administration. L’article 8.5 donne
        // quinze jours pour contester une sanction : la lui fermer reviendrait
        // à supprimer ce recours pour la seule personne à qui il sert.
        //
        // Ce que le membre suspendu y trouve — le fil de l’administration, et
        // rien d’autre — se décide dans `lib/corbeaux/droits.ts`. Un drapeau
        // de menu ne sait dire qu’ouvert ou fermé ; la nuance vit ailleurs.
        href: ROUTES.corbeaux,
        libelle: NOM_COURT,
        pendantBannissement: true,
        avantPremiersPas: true,
        porteUnCompteur: true,
      },
    ],
  },

  {
    libelle: "Le domaine",
    liens: [
      { href: ROUTES.ecole, libelle: "L’école" },
      { href: ROUTES.cours, libelle: "Les cours" },
      { href: ROUTES.alentours, libelle: "Les alentours" },
    ],
  },

  {
    // **Libellé court au bandeau, nom complet sur la page** — exactement le
    // procédé de la Tour aux Corbeaux (« Les Corbeaux » / « La Tour aux
    // Corbeaux »). « Le monde des non-mages » en toutes lettres se cassait en
    // quatre lignes et poussait la déconnexion hors du parchemin : cinq
    // entrées ne tiennent pas sur une ligne à ces largeurs.
    href: ROUTES.nonMages,
    // Le trait d’union est **insécable** (U+2011). Avec un tiret ordinaire, le
    // bandeau coupait « NON- / MAGES » et l’entrée tombait sur trois lignes.
    libelle: "Les non‑mages",
  },

  {
    // **« Le Grand Hall », et surtout pas « La Grande Salle ».** La bible
    // (§12) et le préambule du règlement distinguent les deux, et demandent
    // que « toute interface, tout menu et toute annonce respectent cette
    // séparation sans exception ». Le Grand Hall est l'administration : le
    // règlement, les annonces, l'histoire du château. On y lit.
    //
    // Le groupe s'appelait « Les archives ». Il portait déjà le règlement,
    // c'est-à-dire l'essentiel du Grand Hall — il ne lui manquait que son nom
    // et ses annonces. Le renommer coûtait moins qu'une sixième entrée : à
    // cinq, la ligne de parchemin est déjà pleine.
    libelle: TEXTES_ANNONCES.nomBandeau,
    liens: [
      {
        // **Ouverte au membre suspendu et au nouvel arrivant**, à la manière
        // de la Tour aux Corbeaux, et pour une raison voisine.
        //
        // Le journal du bureau affiche les dernières annonces et renvoie
        // vers elles ; or le bureau reste ouvert à ces deux-là. Fermer
        // l'adresse leur donnerait des liens morts sur leur propre bureau.
        //
        // Et le préambule du règlement dit que « il appartient à chaque
        // membre d'en prendre connaissance » : un membre suspendu reste tenu
        // par un règlement qui change, et c'est même lui qui a le plus besoin
        // de le lire.
        href: ROUTES.annonces,
        libelle: TEXTES_ANNONCES.nomCourt,
        pendantBannissement: true,
        avantPremiersPas: true,
      },
      { href: ROUTES.archivesReglement, libelle: "Règlement" },
      { href: ROUTES.archivesHistoire, libelle: "Histoire" },
    ],
  },
];

/**
 * **Toutes les feuilles, à plat.** C’est sur elles, et sur elles seules, que
 * portent les règles d’accès : un groupe n’a pas d’adresse à garder.
 *
 * Déduite de l’arbre plutôt que tenue à côté : deux listes finiraient par
 * diverger, et l’entrée oubliée dans la seconde serait une route sans garde.
 */
export const ENTREES_MENU: readonly LienMenu[] = MENU.flatMap((entree) =>
  estUnGroupe(entree) ? entree.liens : [entree],
);

/**
 * Les routes de l’école qui n’ont **pas** d’entrée au bandeau.
 *
 * La Cérémonie du Miroir ne se range pas dans un menu : on y va une fois,
 * depuis le bureau, et l’adresse se ferme derrière soi. Elle a pourtant besoin
 * d’être gardée comme les autres — d’où cette liste, séparée de l’affichage
 * mais lue par la même protection.
 *
 * Même règle que le bandeau : sans `pendantBannissement`, l’entrée est fermée
 * au membre suspendu.
 */
export type RouteEcole = {
  href: string;
  pendantBannissement?: true;
  avantPremiersPas?: true;
  exigeUneMaison?: true;
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

/**
 * **Le compte à annoncer sur une entrée** : le sien pour une feuille, **la
 * somme de ses feuilles** pour un groupe.
 *
 * C’est la remontée de la pastille, et ce n’est pas de la mise en forme : sans
 * elle, un corbeau reçu se cache derrière un sous-menu fermé, et on le rate.
 * Elle vit donc ici, avec les règles, plutôt que dans le bandeau — où elle ne
 * se testerait pas.
 *
 * Ne compte que les feuilles qui portent `porteUnCompteur` : le bandeau reçoit
 * un dictionnaire indexé par adresse, et rien n’interdit qu’il contienne des
 * chiffres pour des adresses qui n’en affichent pas.
 */
export function compteDe(
  entree: EntreeMenu,
  compteurs: Readonly<Record<string, number>>,
): number {
  const feuilles = estUnGroupe(entree) ? entree.liens : [entree];
  return feuilles.reduce(
    (total, lien) =>
      total + (lien.porteUnCompteur ? (compteurs[lien.href] ?? 0) : 0),
    0,
  );
}
