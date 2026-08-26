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
    where: { sectionId, ...(avant ? { dernierPostLe: { lt: avant } } : {}) },
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
 * Rend `null` si le sujet n’existe pas **ou** si le lieu n’est pas lisible par
 * ce membre : la même réponse dans les deux cas. « Il existe mais pas pour
 * vous » se lit comme une confirmation — c’est déjà le choix fait dans la Tour.
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
      anneeRequiseALOuverture: true,
      dernierPostLe: true,
      creeLe: true,
      auteurId: true,
      auteur: { select: { prenomNom: true } },
      section: { select: { espace: { select: { cle: true } }, slug: true } },
      _count: { select: { posts: true } },
    },
  });
  if (!ligne) return null;

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
    where: { sujetId },
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
      corps: p.corps,
      avertissementContenu: p.avertissementContenu,
      publieLe: p.publieLe.toISOString(),
      modifieLe: p.modifieLe?.toISOString() ?? null,
      masque: p.masqueLe !== null,
      motifMasquage: p.motifMasquage,
      corrigerAvantLe: p.corrigerAvantLe?.toISOString() ?? null,
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
 */
export async function changerLaCloture(
  pouvoirs: Pouvoirs,
  sujetId: string,
  clore: boolean,
  parNom: string,
): Promise<boolean> {
  if (!peutCloreUneScene(pouvoirs)) return false;
  const { count } = await prisma.sujet.updateMany({
    where: { id: sujetId },
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
