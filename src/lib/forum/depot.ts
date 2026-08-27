import "server-only";
import { prisma } from "@/lib/prisma";
import { ecrireAuMembre } from "@/lib/corbeaux/courrier";
import { nettoyerTexteLibre } from "@/lib/texte";
import { libellePlace, type Fonction, type Maison } from "@/lib/dossier/etats";
import { TEXTES_FORUM } from "./constantes";
import {
  validerAvertissement,
  validerPost,
  validerTitre,
} from "./schema";
import {
  peutLireLeLieu,
  peutOuvrirUnSujet,
  peutRepondre,
  reglesDuLieu,
  type ParametresEspace,
  type ParametresSection,
  type PourLeForum,
  type QuiOuvreUnSujet,
  type QuiRepond,
  type ReglesDuLieu,
  type Verdict,
  type Visibilite,
} from "./lieux";
import {
  estStaff,
  peutCloreUneScene,
  peutEpinglerUnSujet,
  type Pouvoirs,
} from "./pouvoirs";
import {
  peutModifierSonPost,
  peutRetirerLaScene,
  peutRetirerSonPost,
  type RaisonDeRefus,
} from "./suppression";
import { transaction } from "@/lib/base/transaction";

/**
 * L’accès au forum — la seule porte vers `espaces`, `sections`, `sujets` et
 * `posts`.
 *
 * **Rien ici ne décide de quoi que ce soit.** Ce fichier lit et écrit ; c’est
 * `lieux.ts` qui répond à « a-t-il le droit ? ». La séparation est la même
 * qu’entre `corbeaux/depot.ts` et `corbeaux/droits.ts`, et pour la même
 * raison : une règle recopiée dans un `where` est une règle qu’on oubliera de
 * corriger.
 *
 * Ce qui est **filtré ici** l’est en appelant la couture, jamais en réécrivant
 * sa condition : un lieu que ce membre ne peut pas lire ne lui parvient pas.
 */

export const SUJETS_PAR_PAGE = 30;
export const POSTS_PAR_PAGE = 20;

// ─────────────────────────────────────────────────────────────
//  Les formes rendues
// ─────────────────────────────────────────────────────────────

export type EspaceAffiche = ParametresEspace & {
  id: string;
  cle: string;
  nom: string;
  description: string;
};

export type SectionAffichee = ParametresSection & {
  id: string;
  slug: string;
  nom: string;
  description: string;
  /** Les règles effectives, espace resserré par la section. */
  regles: ReglesDuLieu;
  /** Les sous-sections, quand la section en a. Vide sinon. */
  enfants: SectionAffichee[];
  /** Combien de sujets s’y trouvent — l’aperçu d’une liste de lieux. */
  sujets: number;
};

export type SujetAffiche = {
  id: string;
  titre: string;
  auteur: string | null;
  epingle: boolean;
  clos: boolean;
  anneeRequiseALOuverture: Fonction | null;
  dernierPostLe: string;
  creeLe: string;
  posts: number;
};

/** Le strict nécessaire pour lire, transporté d’un seul tenant. */
export type Lecteur = { membre: PourLeForum; pouvoirs: Pouvoirs };

// ─────────────────────────────────────────────────────────────
//  Les espaces
// ─────────────────────────────────────────────────────────────

function enEspace(ligne: {
  id: string;
  cle: string;
  nom: string;
  description: string;
  lignesMinimum: number | null;
  quiOuvreUnSujet: string;
  quiRepond: string;
  comptePourLesPoints: boolean;
  compteLesScenes: boolean;
  visibilite: string;
  anneeMinimale: string | null;
  ouvert: boolean;
}): EspaceAffiche {
  return {
    id: ligne.id,
    cle: ligne.cle,
    nom: ligne.nom,
    description: ligne.description,
    lignesMinimum: ligne.lignesMinimum,
    quiOuvreUnSujet: ligne.quiOuvreUnSujet as QuiOuvreUnSujet,
    quiRepond: ligne.quiRepond as QuiRepond,
    comptePourLesPoints: ligne.comptePourLesPoints,
    compteLesScenes: ligne.compteLesScenes,
    visibilite: ligne.visibilite as Visibilite,
    anneeMinimale: (ligne.anneeMinimale as Fonction | null) ?? null,
    ouvert: ligne.ouvert,
  };
}

export async function listerEspaces(): Promise<EspaceAffiche[]> {
  const lignes = await prisma.espace.findMany({ orderBy: { ordre: "asc" } });
  return lignes.map(enEspace);
}

/** Rend `null` pour une clé inconnue — jamais une exception. */
export async function lireEspace(cle: string): Promise<EspaceAffiche | null> {
  const ligne = await prisma.espace.findUnique({ where: { cle } });
  return ligne ? enEspace(ligne) : null;
}

// ─────────────────────────────────────────────────────────────
//  Les sections
// ─────────────────────────────────────────────────────────────

/**
 * L’arbre d’un espace : les sections, et leurs sous-sections.
 *
 * **Ce que ce membre ne peut pas lire ne lui parvient pas** — et le tri passe
 * par `peutLireLeLieu`, jamais par une condition SQL qui recopierait la règle.
 * Une section dont toutes les sous-sections sont invisibles disparaît avec
 * elles : un chapeau qui n’ouvre sur rien est pire qu’une absence.
 *
 * Deux requêtes et non une par niveau : la table est petite — dix-neuf pièces
 * pour l’école — et deux allers-retours valent mieux qu’un compte de sujets
 * par section demandé en boucle.
 */
export async function lireArbre(
  espace: EspaceAffiche,
  lecteur: Lecteur,
): Promise<SectionAffichee[]> {
  const lignes = await prisma.section.findMany({
    where: { espaceId: espace.id },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: {
      id: true,
      parentId: true,
      slug: true,
      nom: true,
      description: true,
      anneeMinimale: true,
      maisonReservee: true,
      visibilite: true,
      quiOuvreUnSujet: true,
      ouverte: true,
      _count: { select: { sujets: true } },
    },
  });

  const enSection = (l: (typeof lignes)[number]): SectionAffichee => {
    const surcharges: ParametresSection = {
      anneeMinimale: (l.anneeMinimale as Fonction | null) ?? null,
      maisonReservee: (l.maisonReservee as Maison | null) ?? null,
      visibilite: (l.visibilite as Visibilite | null) ?? null,
      quiOuvreUnSujet: (l.quiOuvreUnSujet as QuiOuvreUnSujet | null) ?? null,
      ouverte: l.ouverte,
    };
    return {
      ...surcharges,
      id: l.id,
      slug: l.slug,
      nom: l.nom,
      description: l.description,
      regles: reglesDuLieu(espace, surcharges),
      enfants: [],
      sujets: l._count.sujets,
    };
  };

  const visible = (s: SectionAffichee) =>
    peutLireLeLieu(lecteur.membre, lecteur.pouvoirs, s.regles);

  const racines = lignes.filter((l) => l.parentId === null).map(enSection);
  const parParent = new Map<string, SectionAffichee[]>();
  for (const l of lignes) {
    if (!l.parentId) continue;
    const enfant = enSection(l);
    if (!visible(enfant)) continue;
    const fratrie = parParent.get(l.parentId) ?? [];
    fratrie.push(enfant);
    parParent.set(l.parentId, fratrie);
  }

  return racines
    .map((racine) => ({ ...racine, enfants: parParent.get(racine.id) ?? [] }))
    // Une section vide de tout — ni sujets, ni sous-sections visibles — et
    // qu'on ne peut pas lire non plus n'a rien à faire dans la liste.
    .filter((racine) => visible(racine) || racine.enfants.length > 0);
}

/**
 * Une section par son adresse, avec ses règles déjà résolues.
 *
 * Rend `null` si elle n’existe pas **ou** si ce membre ne peut pas la lire :
 * la même réponse dans les deux cas, comme pour un fil de la Tour. « Elle
 * existe mais pas pour vous » se lit comme une confirmation.
 */
export async function lireSection(
  espaceCle: string,
  slug: string,
  lecteur: Lecteur,
): Promise<{ espace: EspaceAffiche; section: SectionAffichee } | null> {
  const espace = await lireEspace(espaceCle);
  if (!espace) return null;

  const ligne = await prisma.section.findUnique({
    where: { espaceId_slug: { espaceId: espace.id, slug } },
    select: {
      id: true,
      slug: true,
      nom: true,
      description: true,
      anneeMinimale: true,
      maisonReservee: true,
      visibilite: true,
      quiOuvreUnSujet: true,
      ouverte: true,
      _count: { select: { sujets: true } },
      enfants: {
        orderBy: [{ ordre: "asc" }, { nom: "asc" }],
        select: {
          id: true,
          slug: true,
          nom: true,
          description: true,
          anneeMinimale: true,
          maisonReservee: true,
          visibilite: true,
          quiOuvreUnSujet: true,
          ouverte: true,
          _count: { select: { sujets: true } },
        },
      },
    },
  });
  if (!ligne) return null;

  const construire = (l: {
    id: string;
    slug: string;
    nom: string;
    description: string;
    anneeMinimale: string | null;
    maisonReservee: string | null;
    visibilite: string | null;
    quiOuvreUnSujet: string | null;
    ouverte: boolean;
    _count: { sujets: number };
  }): SectionAffichee => {
    const surcharges: ParametresSection = {
      anneeMinimale: (l.anneeMinimale as Fonction | null) ?? null,
      maisonReservee: (l.maisonReservee as Maison | null) ?? null,
      visibilite: (l.visibilite as Visibilite | null) ?? null,
      quiOuvreUnSujet: (l.quiOuvreUnSujet as QuiOuvreUnSujet | null) ?? null,
      ouverte: l.ouverte,
    };
    return {
      ...surcharges,
      id: l.id,
      slug: l.slug,
      nom: l.nom,
      description: l.description,
      regles: reglesDuLieu(espace, surcharges),
      enfants: [],
      sujets: l._count.sujets,
    };
  };

  const section = {
    ...construire(ligne),
    enfants: ligne.enfants
      .map(construire)
      .filter((e) => peutLireLeLieu(lecteur.membre, lecteur.pouvoirs, e.regles)),
  };

  if (!peutLireLeLieu(lecteur.membre, lecteur.pouvoirs, section.regles)) {
    return null;
  }
  return { espace, section };
}

// ─────────────────────────────────────────────────────────────
//  Les sujets
// ─────────────────────────────────────────────────────────────

/**
 * Les sujets d’une section, épinglés d’abord, puis par activité récente.
 *
 * Le tri lit `dernierPostLe`, dénormalisé et indexé : le recalculer à chaque
 * affichage obligerait à balayer tous les posts de tous les sujets.
 */
export async function listerSujets(
  sectionId: string,
  avant?: Date,
): Promise<SujetAffiche[]> {
  const lignes = await prisma.sujet.findMany({
    // Une scène retirée sort des listes et de son adresse, mais reste en
    // base : rien ne part définitivement sur un clic.
    where: {
      sectionId,
      supprimeLe: null,
      ...(avant ? { dernierPostLe: { lt: avant } } : {}),
    },
    orderBy: [{ epingle: "desc" }, { dernierPostLe: "desc" }],
    take: SUJETS_PAR_PAGE,
    select: {
      id: true,
      titre: true,
      epingle: true,
      closLe: true,
      anneeRequiseALOuverture: true,
      dernierPostLe: true,
      creeLe: true,
      auteur: { select: { prenomNom: true } },
      _count: { select: { posts: true } },
    },
  });

  return lignes.map((l) => ({
    id: l.id,
    titre: l.titre,
    // Nul = le compte a été supprimé. Le sujet reste lisible : effacer un
    // compte n'efface pas ce qu'il a écrit chez les autres.
    auteur: l.auteur?.prenomNom ?? null,
    epingle: l.epingle,
    clos: l.closLe !== null,
    anneeRequiseALOuverture: (l.anneeRequiseALOuverture as Fonction | null) ?? null,
    dernierPostLe: l.dernierPostLe.toISOString(),
    creeLe: l.creeLe.toISOString(),
    posts: l._count.posts,
  }));
}

/**
 * Les scènes en cours d’un membre — **pour l’afficher, jamais pour refuser**.
 *
 * Compte ce qu’il a réellement écrit : les sujets non clos, dans un espace qui
 * compte les scènes, où il a publié au moins un post. Figurer sur une liste
 * sans jamais écrire n’a jamais été participer à une scène.
 *
 * La limite de l’article 17.3 est un principe de confiance : voir
 * `forum/scenes.ts`.
 */
export async function compterScenesOuvertes(eleveId: string): Promise<number> {
  return prisma.sujet.count({
    where: {
      closLe: null,
      supprimeLe: null,
      section: { espace: { compteLesScenes: true } },
      OR: [{ auteurId: eleveId }, { posts: { some: { auteurId: eleveId } } }],
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  Un sujet, et ce qui s’y écrit
// ─────────────────────────────────────────────────────────────

export type PostAffiche = {
  id: string;
  auteurId: string | null;
  auteur: string | null;
  maisonAuteur: Maison | null;
  place: string;
  corps: string;
  avertissementContenu: string | null;
  publieLe: string;
  modifieLe: string | null;
  /** Art. 19.3 — masqué le temps d’une correction, jamais supprimé. */
  masque: boolean;
  motifMasquage: string | null;
  corrigerAvantLe: string | null;
  /**
   * **Retiré par son auteur** — un autre geste que le masquage. N’arrive ici
   * que si sa place est gardée ; sinon le post n’est pas transporté du tout.
   * `corps` est alors vide : ce que l’auteur a retiré ne traverse pas le
   * réseau, même vers un écran qui ne l’afficherait pas.
   */
  retire: boolean;
};

export type SujetCharge = {
  espace: EspaceAffiche;
  section: SectionAffichee;
  sujet: SujetAffiche & { auteurId: string | null };
  posts: PostAffiche[];
};

/**
 * Un sujet et ses posts.
 *
 * Rend `null` si le sujet n’existe pas, **si le lieu n’est pas lisible par ce
 * membre**, ou **s’il a été retiré** : la même réponse dans les trois cas.
 * « Il existe mais pas pour vous » se lit comme une confirmation — c’est déjà
 * le choix fait dans la Tour. Une scène retirée qui rendrait autre chose
 * qu’un 404 dirait qu’elle a existé, et à qui la cherche cela suffit.
 */
export async function lireSujet(
  sujetId: string,
  lecteur: Lecteur,
): Promise<SujetCharge | null> {
  const ligne = await prisma.sujet.findUnique({
    where: { id: sujetId },
    select: {
      id: true,
      titre: true,
      epingle: true,
      closLe: true,
      closPar: true,
      supprimeLe: true,
      anneeRequiseALOuverture: true,
      dernierPostLe: true,
      creeLe: true,
      auteurId: true,
      auteur: { select: { prenomNom: true } },
      section: { select: { espace: { select: { cle: true } }, slug: true } },
      _count: { select: { posts: true } },
    },
  });
  // Retirée = introuvable. Voir le commentaire de la fonction.
  if (!ligne || ligne.supprimeLe) return null;

  // On repasse par `lireSection` plutôt que de relire les colonnes ici : c’est
  // lui qui résout les règles et qui refuse un lieu illisible, et le recopier
  // serait la copie qu’on oublierait de corriger.
  const trouve = await lireSection(
    ligne.section.espace.cle,
    ligne.section.slug,
    lecteur,
  );
  if (!trouve) return null;

  const posts = await prisma.post.findMany({
    // Un post retiré ne remonte que s’il garde sa place — et son texte, lui,
    // ne remonte jamais : voir plus bas.
    where: {
      sujetId,
      OR: [{ retireLe: null }, { placeConservee: true }],
    },
    orderBy: { publieLe: "asc" },
    take: POSTS_PAR_PAGE,
    select: {
      id: true,
      corps: true,
      avertissementContenu: true,
      publieLe: true,
      modifieLe: true,
      masqueLe: true,
      motifMasquage: true,
      corrigerAvantLe: true,
      retireLe: true,
      auteurId: true,
      auteur: {
        select: {
          prenomNom: true,
          maison: true,
          etatMaison: true,
          fonction: true,
          roleAffiche: true,
        },
      },
    },
  });

  return {
    espace: trouve.espace,
    section: trouve.section,
    sujet: {
      id: ligne.id,
      titre: ligne.titre,
      auteur: ligne.auteur?.prenomNom ?? null,
      auteurId: ligne.auteurId,
      epingle: ligne.epingle,
      clos: ligne.closLe !== null,
      anneeRequiseALOuverture:
        (ligne.anneeRequiseALOuverture as Fonction | null) ?? null,
      dernierPostLe: ligne.dernierPostLe.toISOString(),
      creeLe: ligne.creeLe.toISOString(),
      posts: ligne._count.posts,
    },
    posts: posts.map((p) => ({
      id: p.id,
      auteurId: p.auteurId,
      auteur: p.auteur?.prenomNom ?? null,
      // `blasonAffiche` n’est pas appelé ici : le dépôt ne met pas en forme.
      // On transporte la maison **au sens des accès** — `FAIT` et rien d’autre.
      maisonAuteur:
        p.auteur && p.auteur.etatMaison === "FAIT"
          ? (p.auteur.maison as Maison | null)
          : null,
      place: p.auteur
        ? libellePlace(p.auteur.fonction as Fonction, p.auteur.roleAffiche)
        : "",
      // Le texte d’un post retiré ne quitte pas le serveur. L’écran n’en
      // montrerait rien, mais il serait dans la page — et une page se lit.
      corps: p.retireLe ? "" : p.corps,
      avertissementContenu: p.retireLe ? null : p.avertissementContenu,
      publieLe: p.publieLe.toISOString(),
      modifieLe: p.modifieLe?.toISOString() ?? null,
      masque: p.masqueLe !== null,
      motifMasquage: p.retireLe ? null : p.motifMasquage,
      corrigerAvantLe: p.corrigerAvantLe?.toISOString() ?? null,
      retire: p.retireLe !== null,
    })),
  };
}

export type ResultatEcriture =
  | { ok: true; sujetId: string; postId: string }
  | { ok: false; message: string; verdict?: Verdict };

/**
 * **Ouvrir une scène.**
 *
 * Le dépôt refait le contrôle **en entier** plutôt que de faire confiance à
 * l’appelant : il relit le lieu, résout ses règles, interroge la couture, puis
 * valide le texte contre le minimum de l’espace. C’est le même parti pris
 * qu’`envoyerCorbeau` — une seule porte, qu’aucune route ne peut contourner.
 *
 * `anneeRequiseALOuverture` est recopiée ici, et un déclencheur l’empêche de
 * bouger ensuite : **le verrouillage n’est pas rétroactif.**
 */
export async function ouvrirSujet(
  auteur: { eleveId: string } & PourLeForum,
  pouvoirs: Pouvoirs,
  espaceCle: string,
  slug: string,
  saisie: { titre: unknown; corps: unknown; avertissement: unknown },
): Promise<ResultatEcriture> {
  const lecteur = { membre: auteur, pouvoirs };
  const trouve = await lireSection(espaceCle, slug, lecteur);
  if (!trouve) {
    return { ok: false, message: TEXTES_FORUM.erreurs.lieuIntrouvable };
  }
  const { espace, section } = trouve;

  const verdict = peutOuvrirUnSujet(auteur, pouvoirs, section.regles);
  if (!verdict.peut) {
    return { ok: false, message: TEXTES_FORUM.erreurs.refuse, verdict };
  }

  const titre = validerTitre(saisie.titre);
  if (!titre.ok) return { ok: false, message: titre.message };

  const corps = validerPost(saisie.corps, section.regles.lignesMinimum);
  if (!corps.ok) return { ok: false, message: corps.message };

  const avertissement = validerAvertissement(saisie.avertissement);
  if (!avertissement.ok) return { ok: false, message: avertissement.message };

  const cree = await prisma.sujet.create({
    data: {
      sectionId: section.id,
      auteurId: auteur.eleveId,
      titre: titre.valeur,
      anneeRequiseALOuverture: section.regles.anneeMinimale,
      posts: {
        create: {
          auteurId: auteur.eleveId,
          corps: corps.valeur,
          avertissementContenu: avertissement.valeur,
        },
      },
    },
    select: { id: true, posts: { select: { id: true } } },
  });

  // Sans usage aujourd'hui — mais l'espace le déclare, et le lot des points
  // s'y branchera plutôt que de relire la colonne `maison`.
  void espace.comptePourLesPoints;

  return { ok: true, sujetId: cree.id, postId: cree.posts[0]!.id };
}

/**
 * **Répondre.**
 *
 * L’année se compare à celle **figée à l’ouverture du sujet**, jamais à celle
 * du lieu aujourd’hui : c’est `peutRepondre` qui le fait, et c’est toute la
 * promesse « une scène en cours ne se ferme pas si les règles changent ».
 */
export async function repondre(
  auteur: { eleveId: string } & PourLeForum,
  pouvoirs: Pouvoirs,
  sujetId: string,
  saisie: { corps: unknown; avertissement: unknown },
): Promise<ResultatEcriture> {
  const charge = await lireSujet(sujetId, { membre: auteur, pouvoirs });
  if (!charge) {
    return { ok: false, message: TEXTES_FORUM.erreurs.sujetIntrouvable };
  }

  const verdict = peutRepondre(auteur, pouvoirs, charge.section.regles, {
    clos: charge.sujet.clos,
    anneeRequiseALOuverture: charge.sujet.anneeRequiseALOuverture,
  });
  if (!verdict.peut) {
    return { ok: false, message: TEXTES_FORUM.erreurs.refuse, verdict };
  }

  const corps = validerPost(saisie.corps, charge.section.regles.lignesMinimum);
  if (!corps.ok) return { ok: false, message: corps.message };

  const avertissement = validerAvertissement(saisie.avertissement);
  if (!avertissement.ok) return { ok: false, message: avertissement.message };

  // Le post et la date d'activité dans la même transaction : un sujet qui
  // gagne un post sans remonter dans la liste serait invisible à tous.
  const [post] = await prisma.$transaction([
    prisma.post.create({
      data: {
        sujetId,
        auteurId: auteur.eleveId,
        corps: corps.valeur,
        avertissementContenu: avertissement.valeur,
      },
      select: { id: true },
    }),
    prisma.sujet.update({
      where: { id: sujetId },
      data: { dernierPostLe: new Date() },
    }),
  ]);

  return { ok: true, sujetId, postId: post.id };
}

// ─────────────────────────────────────────────────────────────
//  Ce que le staff fait sur un sujet
// ─────────────────────────────────────────────────────────────

/**
 * Clore ou rouvrir une scène — art. 17.2.
 *
 * « Une scène sans réponse depuis un mois peut être clôturée par un
 * modérateur ; **les points acquis restent acquis.** » Rien n’est effacé : le
 * sujet reste lisible, il n’accepte simplement plus de réponse.
 *
 * **L’auteur clôt la sienne**, sans permission particulière — décision du
 * joueur, 27 août 2026. C’est la contrepartie du retrait : dès qu’un autre a
 * écrit, la scène ne lui appartient plus assez pour la retirer, mais assez
 * pour la fermer. Sans cela, quelqu’un dont la scène s’enlise n’aurait aucun
 * geste à sa disposition.
 *
 * Il peut la rouvrir de même : une scène close par erreur n’a pas à
 * mobiliser un modérateur.
 */
export async function changerLaCloture(
  pouvoirs: Pouvoirs,
  sujetId: string,
  clore: boolean,
  parNom: string,
  parEleveId?: string,
): Promise<boolean> {
  if (!peutCloreUneScene(pouvoirs)) {
    if (!parEleveId) return false;
    const sien = await prisma.sujet.findFirst({
      where: { id: sujetId, auteurId: parEleveId, supprimeLe: null },
      select: { id: true },
    });
    if (!sien) return false;
  }

  const { count } = await prisma.sujet.updateMany({
    // Une scène retirée ne se rouvre pas par la petite porte.
    where: { id: sujetId, supprimeLe: null },
    data: clore
      ? { closLe: new Date(), closPar: parNom }
      : { closLe: null, closPar: null },
  });
  return count > 0;
}

/** Épingler un sujet en tête de sa section. */
export async function changerLEpingle(
  pouvoirs: Pouvoirs,
  sujetId: string,
  epingle: boolean,
): Promise<boolean> {
  if (!peutEpinglerUnSujet(pouvoirs)) return false;
  const { count } = await prisma.sujet.updateMany({
    where: { id: sujetId },
    data: { epingle },
  });
  return count > 0;
}

// ─────────────────────────────────────────────────────────────
//  Un post masqué le temps d’une correction — art. 19.3
// ─────────────────────────────────────────────────────────────

/** « Le joueur en est informé et dispose de sept jours pour corriger. » */
export const JOURS_POUR_CORRIGER = 7;

/**
 * **Masquer un post, pas le supprimer.**
 *
 * Le texte reste en base, et son auteur continue de le voir : c’est lui qui
 * doit le reprendre. Les autres n’en voient qu’une ligne. La différence n’est
 * pas cosmétique — supprimer, ce serait faire disparaître le travail de
 * quelqu’un sans qu’il puisse le corriger.
 *
 * **Le joueur est prévenu par un corbeau du château**, dans la même foulée.
 * C’est le seul canal qui existe, et c’en est un bon : il aboutit dans sa
 * boîte, il allume sa pastille, et il peut y répondre. Un envoi raté ne
 * défait pas le masquage — il est inscrit dans la réponse, comme pour les
 * courriels.
 */
export type ResultatMasquage =
  | { ok: true; prevenu: boolean }
  | { ok: false; message: string };

export async function masquerPost(
  pouvoirs: Pouvoirs,
  postId: string,
  motif: unknown,
  parNom: string,
): Promise<ResultatMasquage> {
  // Masquer relève de la modération : c'est le staff, et personne d'autre.
  // Aucune permission attribuable ne le donne — ce n'est pas un pouvoir qu'on
  // accorde à la carte.
  if (!estStaff(pouvoirs)) {
    return { ok: false, message: TEXTES_FORUM.erreurs.refuse };
  }

  // Le motif est OBLIGATOIRE ici, à l'inverse de celui d'un signalement : le
  // joueur ne verra que ça pour savoir ce qu'il doit reprendre. Le signalement
  // se fait en un clic parce que celui qui subit n'a pas à rédiger un dossier ;
  // ici, c'est le staff qui écrit, et il a une phrase à dire.
  const motifNet = typeof motif === "string" ? nettoyerTexteLibre(motif) : "";
  if (motifNet.length === 0) {
    return { ok: false, message: TEXTES_FORUM.masquage.motifRequis };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      masqueLe: true,
      auteur: { select: { utilisateurId: true } },
    },
  });
  if (!post) return { ok: false, message: TEXTES_FORUM.erreurs.sujetIntrouvable };
  if (post.masqueLe) return { ok: true, prevenu: false };

  const limite = new Date(
    Date.now() + JOURS_POUR_CORRIGER * 24 * 60 * 60 * 1000,
  );

  await prisma.post.update({
    where: { id: postId },
    data: {
      masqueLe: new Date(),
      masquePar: parNom,
      motifMasquage: motifNet,
      corrigerAvantLe: limite,
    },
  });

  // Un compte supprimé n'a plus de boîte : le masquage tient quand même.
  if (!post.auteur) return { ok: true, prevenu: false };

  const lettre = TEXTES_FORUM.masquage.courrier.corps
    .replace("{motif}", motifNet)
    .replace(
      "{date}",
      limite.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  const envoi = await ecrireAuMembre(post.auteur.utilisateurId, lettre);

  return { ok: true, prevenu: envoi === "ENVOYEE" };
}

/** Le post redevient visible. Les quatre colonnes repartent ensemble. */
export async function demasquerPost(
  pouvoirs: Pouvoirs,
  postId: string,
): Promise<boolean> {
  if (!estStaff(pouvoirs)) return false;
  const { count } = await prisma.post.updateMany({
    where: { id: postId },
    data: {
      masqueLe: null,
      masquePar: null,
      motifMasquage: null,
      corrigerAvantLe: null,
    },
  });
  return count > 0;
}

// ─────────────────────────────────────────────────────────────
//  Retirer une scène, retirer son post — art. 2.4 et 6.4
// ─────────────────────────────────────────────────────────────

/** Le refus, dit en français. Une seule table, pour ne pas la recopier. */
function refus(raison: RaisonDeRefus): string {
  const E = TEXTES_FORUM.suppression.erreurs;
  if (raison === "DEJA_ECRIT_PAR_D_AUTRES") return E.dejaEcritParDAutres;
  if (raison === "DEJA_REPONDU_APRES") return E.dejaEcritParDAutres;
  return E.pasAMoi;
}

export type ResultatRetrait =
  | { ok: true; prevenus: number }
  | { ok: false; message: string };

/**
 * **Retirer une scène du forum, sans rien effacer.**
 *
 * Le dépôt fournit les faits, `suppression.ts` rend le verdict, et cette
 * fonction ne fait qu’exécuter. Une seule porte : la route n’a rien à
 * revérifier, et ne le pourrait pas mieux.
 *
 * ── Qui est prévenu, et pourquoi eux ──
 *
 * **Tous ceux qui ont écrit dans la scène**, sauf celui qui la retire — décision
 * du joueur, 27 août 2026. L’auteur de la scène en fait partie : quelqu’un dont
 * la scène disparaît sans un mot le vivra mal, surtout si la faute vient d’un
 * autre. Chacun n’est prévenu qu’une fois, quel que soit le nombre de ses posts.
 *
 * Un envoi raté **ne défait pas le retrait** : il est seulement compté à part.
 * Même choix que pour le masquage, et que pour les courriels.
 */
export async function retirerLaScene(
  auteur: { eleveId: string; utilisateurId: string },
  pouvoirs: Pouvoirs,
  sujetId: string,
  motif: unknown,
  parNom: string,
): Promise<ResultatRetrait> {
  const sujet = await prisma.sujet.findUnique({
    where: { id: sujetId },
    select: {
      id: true,
      titre: true,
      auteurId: true,
      supprimeLe: true,
      auteur: { select: { utilisateurId: true } },
      section: { select: { nom: true } },
      posts: {
        select: { auteurId: true, auteur: { select: { utilisateurId: true } } },
      },
    },
  });

  // Déjà retirée = introuvable. Un second clic ne doit ni échouer bruyamment
  // ni renvoyer un second corbeau à tout le monde.
  if (!sujet || sujet.supprimeLe) {
    return { ok: false, message: TEXTES_FORUM.erreurs.sujetIntrouvable };
  }

  // Ceux qui ont écrit : les auteurs des posts ET celui de la scène, chacun
  // une fois, moi retiré. Une `Map` par élève plutôt qu’une liste — six posts
  // du même joueur ne font pas six corbeaux.
  const ecrivains = new Map<string, string>();
  const ajouter = (
    eleveId: string | null,
    utilisateurId: string | null | undefined,
  ) => {
    if (!eleveId || !utilisateurId) return;
    if (eleveId === auteur.eleveId) return;
    ecrivains.set(eleveId, utilisateurId);
  };
  ajouter(sujet.auteurId, sujet.auteur?.utilisateurId);
  for (const p of sujet.posts) ajouter(p.auteurId, p.auteur?.utilisateurId);

  const verdict = peutRetirerLaScene({
    estStaff: estStaff(pouvoirs),
    estLAuteur: sujet.auteurId !== null && sujet.auteurId === auteur.eleveId,
    auteursAutres: ecrivains.size,
  });
  if (!verdict.peut) return { ok: false, message: refus(verdict.raison) };

  const motifNet = typeof motif === "string" ? nettoyerTexteLibre(motif) : "";
  if (verdict.motifRequis && motifNet.length === 0) {
    return { ok: false, message: TEXTES_FORUM.suppression.erreurs.motifRequis };
  }

  // Le retrait et sa trace dans la même transaction : sans le journal, il ne
  // resterait rien d’un geste du staff, et la colonne seule ne dit pas
  // pourquoi. Même principe que les pouvoirs.
  await transaction(async (tx) => {
    await tx.sujet.update({
      where: { id: sujet.id },
      data: {
        supprimeLe: new Date(),
        supprimePar: parNom,
        motifSuppression: motifNet.length > 0 ? motifNet : null,
      },
    });

    // Le journal est celui d’un membre : on l’écrit chez l’auteur de la scène,
    // et seulement quand c’est le staff qui agit. Un joueur qui retire sa
    // propre scène ne se convoque pas lui-même à son journal.
    if (estStaff(pouvoirs) && sujet.auteur) {
      await tx.journalMembre.create({
        data: {
          utilisateurId: sujet.auteur.utilisateurId,
          type: "SCENE_SUPPRIMEE",
          valeurAvant: sujet.titre,
          note: motifNet,
          parNom,
        },
      });
    }
  });

  if (!verdict.previendra) return { ok: true, prevenus: 0 };

  const lettre = TEXTES_FORUM.suppression.courrier.corps
    .replace("{titre}", sujet.titre)
    .replace("{lieu}", sujet.section.nom)
    .replace("{motif}", motifNet);

  let prevenus = 0;
  for (const utilisateurId of ecrivains.values()) {
    const envoi = await ecrireAuMembre(utilisateurId, lettre);
    if (envoi === "ENVOYEE") prevenus += 1;
  }

  return { ok: true, prevenus };
}

/**
 * **Retirer son propre post.**
 *
 * Ce qu’un joueur a écrit est à lui (art. 6.4), et ne lui est jamais refusé.
 * Ce qui change, c’est ce qu’il en reste : le post s’en va sans trace s’il
 * fermait la scène, et laisse sa place sinon — une réponse qui suit un trou
 * ne se comprend plus.
 *
 * **Le staff ne passe pas par ici.** Masquer est un autre geste, qui laisse le
 * texte lisible à son auteur pour qu’il le reprenne (art. 19.3).
 */
export async function retirerSonPost(
  auteur: { eleveId: string },
  postId: string,
): Promise<ResultatRetrait> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, sujetId: true, auteurId: true, publieLe: true, retireLe: true },
  });
  if (!post || post.retireLe) {
    return { ok: false, message: TEXTES_FORUM.erreurs.sujetIntrouvable };
  }

  // « Répondu après » se compte sur les posts ENCORE LÀ : un post lui-même
  // retiré ne troue rien, et n’a pas à figer la place de celui d’avant.
  const apres = await prisma.post.count({
    where: {
      sujetId: post.sujetId,
      publieLe: { gt: post.publieLe },
      retireLe: null,
    },
  });

  const verdict = peutRetirerSonPost({
    estStaff: false,
    estLAuteur: post.auteurId !== null && post.auteurId === auteur.eleveId,
    aDesPostsApres: apres > 0,
  });
  if (!verdict.peut) {
    return { ok: false, message: TEXTES_FORUM.suppression.erreurs.postPasAMoi };
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { retireLe: new Date(), placeConservee: verdict.placeConservee },
  });

  return { ok: true, prevenus: 0 };
}

/**
 * **Reprendre son propre post.**
 *
 * Sans limite de temps : ce qu'un joueur a écrit est à lui (art. 6.4), et une
 * coquille se corrige six mois plus tard. Ce qui protège les autres n'est pas
 * un délai mais **la marque « modifié le »**, que `modifieLe` porte et que
 * l'écran affiche.
 *
 * Le texte repasse par `validerPost` — **la même porte que la publication** :
 * même nettoyage du balisage, même minimum de lignes. Une correction ne peut
 * donc ni faire passer un post sous le seuil, ni y glisser ce que la
 * publication aurait refusé.
 *
 * ⚠️ **Modifier ne démasque pas.** Un post masqué le temps d'une correction
 * (art. 19.3) le reste après correction : c'est le staff qui rouvre, après
 * avoir relu. Sinon il suffirait de changer une virgule pour annuler la
 * mesure.
 */
export async function modifierSonPost(
  auteur: { eleveId: string },
  postId: string,
  saisie: { corps: unknown; avertissement: unknown },
): Promise<ResultatEcriture> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      auteurId: true,
      retireLe: true,
      sujet: {
        select: {
          supprimeLe: true,
          section: { select: { espace: { select: { lignesMinimum: true } } } },
        },
      },
    },
  });

  if (!post || post.sujet.supprimeLe) {
    return { ok: false, message: TEXTES_FORUM.erreurs.sujetIntrouvable };
  }

  if (
    !peutModifierSonPost({
      estLAuteur: post.auteurId !== null && post.auteurId === auteur.eleveId,
      retire: post.retireLe !== null,
    })
  ) {
    // Pas de `verdict` ici — le refus ne vient pas du lieu mais de la
    // propriété du texte. La route reconnaît ce message et répond 403.
    return { ok: false, message: TEXTES_FORUM.suppression.erreurs.postPasAMoi };
  }

  // Le minimum du LIEU, comme à la publication — jamais une valeur recopiée.
  const corps = validerPost(
    saisie.corps,
    post.sujet.section.espace.lignesMinimum,
  );
  if (!corps.ok) return { ok: false, message: corps.message };

  const avertissement = validerAvertissement(saisie.avertissement);
  if (!avertissement.ok) {
    return { ok: false, message: avertissement.message };
  }

  await prisma.post.update({
    where: { id: post.id },
    data: {
      corps: corps.valeur,
      avertissementContenu: avertissement.valeur,
      modifieLe: new Date(),
    },
  });

  return { ok: true, sujetId: "", postId: post.id };
}

/**
 * Les scènes en cours d’un membre, pour son bureau.
 *
 * Les mêmes que celles que `compterScenesOuvertes` compte : non closes, dans
 * un espace qui compte les scènes, et où il a **réellement écrit**. Figurer
 * sur une liste sans jamais écrire n’a jamais été participer à une scène.
 *
 * **Ce panneau ne refuse rien.** Le repère de l’article 17.3 s’affiche à côté
 * du compte ; c’est un principe de confiance, pas un verrou.
 */
export async function listerScenesDe(eleveId: string, combien = 4) {
  const lignes = await prisma.sujet.findMany({
    where: {
      closLe: null,
      supprimeLe: null,
      section: { espace: { compteLesScenes: true } },
      OR: [{ auteurId: eleveId }, { posts: { some: { auteurId: eleveId } } }],
    },
    orderBy: { dernierPostLe: "desc" },
    take: combien,
    select: {
      id: true,
      titre: true,
      dernierPostLe: true,
      section: { select: { nom: true, slug: true } },
      posts: {
        orderBy: { publieLe: "desc" },
        take: 1,
        select: { auteur: { select: { prenomNom: true } } },
      },
    },
  });

  return lignes.map((l) => ({
    id: l.id,
    titre: l.titre,
    lieu: l.section.nom,
    slug: l.section.slug,
    dernierMessageLe: l.dernierPostLe.toISOString(),
    auteurDernierMessage: l.posts[0]?.auteur?.prenomNom ?? "—",
  }));
}
