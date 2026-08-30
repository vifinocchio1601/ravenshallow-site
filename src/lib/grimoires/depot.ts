import "server-only";
import { prisma } from "@/lib/prisma";
import { chapitresLisibles, type AccesGrimoire } from "./acces";
import type { Bloc } from "./blocs";
import { TEXTES_GRIMOIRES } from "./constantes";
import type { Reliure } from "./reliures";
import {
  validerAcces,
  validerDescriptionGrimoire,
  validerExergue,
  validerReliure,
  validerSlug,
  validerTitreChapitre,
  validerTitreGrimoire,
} from "./schema";

/**
 * L'accès aux grimoires.
 *
 * **Le seul endroit qui compose une requête** sur `grimoires`,
 * `chapitres_grimoire` et `blocs_grimoire` — comme `annonces/depot.ts` pour
 * les annonces. Une table dont les lectures s'écrivent en dix endroits finit
 * par en avoir une qui oublie le filtre ; ici, le filtre est ce qui garde les
 * quatre sortilèges interdits hors du navigateur d'un joueur.
 *
 * ── Comment le contenu réservé ne part pas ──
 *
 * Le dépôt lit d'abord les chapitres **sans leurs blocs** — quelques lignes
 * légères —, applique `chapitresLisibles`, puis ne demande les blocs **que
 * des chapitres retenus**. Le texte d'un chapitre réservé ne quitte donc
 * jamais la base : il n'est pas filtré après coup, il n'est pas lu.
 *
 * ⚠️ **La condition d'accès n'est jamais recopiée dans un `where`.** Elle vit
 * dans `acces.ts`, où elle se teste ; un `where` la mettrait hors de portée
 * des essais et la ferait diverger au premier ajout. C'est le parti pris de
 * `forum/depot.ts`, qui appelle `peutLireLeLieu` plutôt que d'en réécrire la
 * condition.
 *
 * ⚠️ **Un volume retiré et un volume qui n'existe pas rendent tous deux
 * `null`** — l'écran répond « Ce couloir ne mène nulle part » dans les deux
 * cas. Distinguer les deux se lirait comme une confirmation : même choix que
 * le forum, la Tour et le Grand Hall.
 */

/** Un volume, tel qu'il se lit sur l'étagère. */
export type VolumeSurLEtagere = {
  id: string;
  slug: string;
  titre: string;
  exergue: string | null;
  description: string;
  reliure: Reliure;
  /** **Les chapitres qui s'ouvrent à ce lecteur**, jamais le total. */
  chapitres: number;
};

/** Une ligne du sommaire. Le titre seul : les blocs viennent après. */
export type ChapitreAuSommaire = {
  id: string;
  slug: string;
  titre: string;
};

/** Un chapitre et son contenu. */
export type ChapitreLu = ChapitreAuSommaire & { blocs: Bloc[] };

export type VolumeOuvert = VolumeSurLEtagere & {
  modifieLe: string | null;
  sommaire: ChapitreAuSommaire[];
};

/**
 * Ce que Prisma rend d'une colonne `Json` est un `JsonValue`, et le typage
 * fin d'un bloc dépend de son `type`. La forme a été vérifiée **à l'entrée**
 * par `grimoires/schema.ts`, seule porte : on la reprend telle quelle.
 */
function enBloc(ligne: {
  id: string;
  ancre: string | null;
  type: string;
  donnees: unknown;
}): Bloc {
  return {
    id: ligne.id,
    ancre: ligne.ancre,
    type: ligne.type,
    donnees: ligne.donnees,
  } as Bloc;
}

// ─────────────────────────────────────────────────────────────
//  L'étagère
// ─────────────────────────────────────────────────────────────

/**
 * **Les volumes posés sur l'étagère.**
 *
 * Un volume retiré n'y figure pas : `listerPourAdministration` est le seul
 * chemin qui le voie, comme pour les annonces.
 *
 * ⚠️ **Un volume dont aucun chapitre ne s'ouvre à ce lecteur n'y figure pas
 * non plus.** C'est la même règle qu'au sommaire, d'un cran plus haut : un
 * livre qu'on ouvrirait sur rien vaudrait moins qu'une absence — et un
 * volume entièrement réservé à l'administration ne doit pas s'annoncer à un
 * joueur, fût-ce par son seul titre. Même raisonnement que le groupe de menu
 * dont toutes les feuilles sont fermées : il disparaît, il ne se grise pas.
 *
 * Le compte des chapitres est demandé avec la liste — quelques lignes par
 * volume, jamais leur contenu.
 */
export async function listerLEtagere(
  staff: boolean,
): Promise<VolumeSurLEtagere[]> {
  const lignes = await prisma.grimoire.findMany({
    where: { retireLe: null },
    orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    select: {
      id: true,
      slug: true,
      titre: true,
      exergue: true,
      description: true,
      reliure: true,
      chapitres: { select: { acces: true } },
    },
  });

  return lignes
    .map((v) => ({
      ...v,
      chapitres: chapitresLisibles(
        v.chapitres as { acces: AccesGrimoire }[],
        staff,
      ).length,
    }))
    .filter((v) => v.chapitres > 0) as VolumeSurLEtagere[];
}

// ─────────────────────────────────────────────────────────────
//  Le sommaire d'un volume
// ─────────────────────────────────────────────────────────────

/**
 * **Le volume et son sommaire**, sans une ligne de contenu.
 *
 * Le sommaire ne porte que les chapitres lisibles : un chapitre réservé n'y
 * figure pas, pas même grisé. « Il existe, mais pas pour vous » se lit comme
 * une confirmation.
 */
export async function lireLeVolume(
  slug: string,
  staff: boolean,
): Promise<VolumeOuvert | null> {
  const volume = await prisma.grimoire.findFirst({
    where: { slug, retireLe: null },
    select: {
      id: true,
      slug: true,
      titre: true,
      exergue: true,
      description: true,
      reliure: true,
      modifieLe: true,
      chapitres: {
        orderBy: { ordre: "asc" },
        select: { id: true, slug: true, titre: true, acces: true },
      },
    },
  });
  if (!volume) return null;

  const { chapitres, modifieLe, ...reste } = volume;
  const sommaire = chapitresLisibles(
    chapitres as {
      id: string;
      slug: string;
      titre: string;
      acces: AccesGrimoire;
    }[],
    staff,
  ).map(({ id, slug: s, titre }) => ({ id, slug: s, titre }));

  return {
    ...(reste as Omit<VolumeSurLEtagere, "chapitres">),
    chapitres: sommaire.length,
    modifieLe: modifieLe ? modifieLe.toISOString() : null,
    sommaire,
  };
}

// ─────────────────────────────────────────────────────────────
//  Un chapitre, avec son contenu
// ─────────────────────────────────────────────────────────────

/**
 * **Un chapitre et ses blocs.**
 *
 * Rend `null` pour un chapitre réservé exactement comme pour un chapitre qui
 * n'existe pas — et les blocs ne sont demandés qu'ensuite : le texte d'un
 * chapitre fermé n'est jamais lu.
 */
export async function lireLeChapitre(
  volumeSlug: string,
  chapitreSlug: string,
  staff: boolean,
): Promise<{ volume: VolumeOuvert; chapitre: ChapitreLu } | null> {
  const volume = await lireLeVolume(volumeSlug, staff);
  if (!volume) return null;

  const ligne = volume.sommaire.find((c) => c.slug === chapitreSlug);
  if (!ligne) return null;

  const blocs = await prisma.blocGrimoire.findMany({
    where: { chapitreId: ligne.id },
    orderBy: { ordre: "asc" },
    select: { id: true, ancre: true, type: true, donnees: true },
  });

  return { volume, chapitre: { ...ligne, blocs: blocs.map(enBloc) } };
}

/**
 * **Le volume entier**, pour la lecture continue.
 *
 * Les mêmes chapitres que le sommaire, avec leur contenu : le mode continu
 * doit montrer exactement ce que le mode paginé montre, ni plus ni moins.
 */
export async function lireLeVolumeEntier(
  slug: string,
  staff: boolean,
): Promise<{ volume: VolumeOuvert; chapitres: ChapitreLu[] } | null> {
  const volume = await lireLeVolume(slug, staff);
  if (!volume) return null;

  const ids = volume.sommaire.map((c) => c.id);
  const blocs = ids.length
    ? await prisma.blocGrimoire.findMany({
        where: { chapitreId: { in: ids } },
        orderBy: [{ chapitreId: "asc" }, { ordre: "asc" }],
        select: {
          id: true,
          ancre: true,
          type: true,
          donnees: true,
          chapitreId: true,
        },
      })
    : [];

  return {
    volume,
    chapitres: volume.sommaire.map((c) => ({
      ...c,
      blocs: blocs.filter((b) => b.chapitreId === c.id).map(enBloc),
    })),
  };
}

// ─────────────────────────────────────────────────────────────
//  Ce que seule l'administration voit
// ─────────────────────────────────────────────────────────────

export type VolumeEnAdministration = VolumeSurLEtagere & {
  ordre: number;
  retireLe: string | null;
  retirePar: string | null;
  /** Le détail, retirés et réservés compris — le seul chemin qui les voie. */
  detail: (ChapitreAuSommaire & { acces: AccesGrimoire; blocs: number })[];
};

/**
 * **Tous les volumes, retirés compris** — le seul chemin qui les voie.
 */
export async function listerPourAdministration(): Promise<
  VolumeEnAdministration[]
> {
  const lignes = await prisma.grimoire.findMany({
    orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    select: {
      id: true,
      slug: true,
      titre: true,
      exergue: true,
      description: true,
      reliure: true,
      ordre: true,
      retireLe: true,
      retirePar: true,
      chapitres: {
        orderBy: { ordre: "asc" },
        select: {
          id: true,
          slug: true,
          titre: true,
          acces: true,
          _count: { select: { blocs: true } },
        },
      },
    },
  });

  return lignes.map((v) => ({
    id: v.id,
    slug: v.slug,
    titre: v.titre,
    exergue: v.exergue,
    description: v.description,
    reliure: v.reliure as Reliure,
    chapitres: v.chapitres.length,
    ordre: v.ordre,
    retireLe: v.retireLe ? v.retireLe.toISOString() : null,
    retirePar: v.retirePar,
    detail: v.chapitres.map((c) => ({
      id: c.id,
      slug: c.slug,
      titre: c.titre,
      acces: c.acces as AccesGrimoire,
      blocs: c._count.blocs,
    })),
  }));
}

// ─────────────────────────────────────────────────────────────
//  Ce que la zone d'administration écrit
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **Le dépôt appelle la validation lui-même** : l'action serveur ne fait
 * que traduire le résultat en message. Une seule porte, qu'aucun écran ne
 * contourne — le parti pris d'`envoyerCorbeau`, puis d'`ouvrirSujet`, puis de
 * `publierAnnonce`.
 */
export type Ecriture = { ok: true; id: string } | { ok: false; message: string };

/** Ce qu'un volume reçoit, du formulaire comme de l'import. */
export type ChampsVolume = {
  slug: unknown;
  titre: unknown;
  exergue: unknown;
  description: unknown;
  reliure: unknown;
};

function valider(champs: ChampsVolume) {
  const slug = validerSlug(champs.slug);
  if (!slug.ok) return slug;
  const titre = validerTitreGrimoire(champs.titre);
  if (!titre.ok) return titre;
  const exergue = validerExergue(champs.exergue);
  if (!exergue.ok) return exergue;
  const description = validerDescriptionGrimoire(champs.description);
  if (!description.ok) return description;
  const reliure = validerReliure(champs.reliure);
  if (!reliure.ok) return reliure;

  return {
    ok: true as const,
    valeur: {
      slug: slug.valeur,
      titre: titre.valeur,
      exergue: exergue.valeur,
      description: description.valeur,
      reliure: reliure.valeur,
    },
  };
}

/**
 * **Poser un volume vide.** Son contenu arrive ensuite par l'import — c'est
 * le chemin voulu : les volumes sont écrits sous Word et lus par
 * `scripts/lire-grimoire.mjs`.
 */
export async function poserGrimoire(champs: ChampsVolume): Promise<Ecriture> {
  const valide = valider(champs);
  if (!valide.ok) return { ok: false, message: valide.message };

  const dejaPris = await prisma.grimoire.findUnique({
    where: { slug: valide.valeur.slug },
    select: { id: true },
  });
  if (dejaPris) {
    return { ok: false, message: TEXTES_GRIMOIRES.erreurs.adressePrise };
  }

  const dernier = await prisma.grimoire.aggregate({ _max: { ordre: true } });

  const pose = await prisma.grimoire.create({
    data: {
      ...valide.valeur,
      ordre: (dernier._max.ordre ?? -1) + 1,
      posePar: "Administration",
    },
    select: { id: true },
  });
  return { ok: true, id: pose.id };
}

export async function corrigerGrimoire(
  id: string,
  champs: ChampsVolume,
): Promise<Ecriture> {
  const valide = valider(champs);
  if (!valide.ok) return { ok: false, message: valide.message };

  const dejaPris = await prisma.grimoire.findUnique({
    where: { slug: valide.valeur.slug },
    select: { id: true },
  });
  if (dejaPris && dejaPris.id !== id) {
    return { ok: false, message: TEXTES_GRIMOIRES.erreurs.adressePrise };
  }

  await prisma.grimoire.update({
    where: { id },
    data: { ...valide.valeur, modifieLe: new Date() },
  });
  return { ok: true, id };
}

/**
 * **Retirer n'efface pas.** Le volume sort de l'étagère ; la ligne reste, et
 * « Remettre » existe pour que le clic malheureux ne soit pas définitif.
 */
export async function retirerGrimoire(id: string): Promise<Ecriture> {
  await prisma.grimoire.update({
    where: { id },
    data: { retireLe: new Date(), retirePar: "Administration" },
  });
  return { ok: true, id };
}

export async function remettreGrimoire(id: string): Promise<Ecriture> {
  await prisma.grimoire.update({
    where: { id },
    data: { retireLe: null, retirePar: null },
  });
  return { ok: true, id };
}

/** Sa place sur l'étagère, d'un cran. */
export async function deplacerGrimoire(
  id: string,
  sens: -1 | 1,
): Promise<Ecriture> {
  const volumes = await prisma.grimoire.findMany({
    orderBy: [{ ordre: "asc" }, { titre: "asc" }],
    select: { id: true },
  });
  const place = volumes.findIndex((v) => v.id === id);
  const voisine = place + sens;
  if (place === -1 || voisine < 0 || voisine >= volumes.length) {
    return { ok: true, id };
  }

  const range = [...volumes];
  [range[place], range[voisine]] = [range[voisine], range[place]];

  // Une liste, et non une transaction interactive : elle part en un seul
  // aller-retour, et Prisma ne lui laisse rien d'autre à régler.
  await prisma.$transaction(
    range.map((v, ordre) =>
      prisma.grimoire.update({ where: { id: v.id }, data: { ordre } }),
    ),
  );
  return { ok: true, id };
}

/**
 * **Un chapitre : son titre, son rang, et surtout sa condition d'accès.**
 *
 * ⚠️ **Ouvrir un chapitre qui porte un sortilège interdit est refusé par la
 * base**, pas par ce code — un déclencheur, qui regarde les deux bouts. On
 * traduit donc son refus en une phrase, plutôt que de le laisser remonter en
 * erreur 500 : c'est ce que fait déjà « Remettre au bloc » chez les
 * partenaires.
 */
export async function corrigerChapitre(
  id: string,
  champs: { titre: unknown; acces: unknown },
): Promise<Ecriture> {
  const titre = validerTitreChapitre(champs.titre);
  if (!titre.ok) return { ok: false, message: titre.message };
  const acces = validerAcces(champs.acces);
  if (!acces.ok) return { ok: false, message: acces.message };

  try {
    await prisma.chapitreGrimoire.update({
      where: { id },
      data: { titre: titre.valeur, acces: acces.valeur },
    });
  } catch {
    return { ok: false, message: TEXTES_GRIMOIRES.erreurs.chapitreInterdit };
  }
  return { ok: true, id };
}
