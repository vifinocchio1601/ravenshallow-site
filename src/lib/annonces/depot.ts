import "server-only";
import { prisma } from "@/lib/prisma";
import { TEXTES_ANNONCES } from "./constantes";
import { extrait } from "./extrait";
import {
  validerCorpsAnnonce,
  validerEntreeEnVigueur,
  validerTitreAnnonce,
  type Resultat,
} from "./schema";

/**
 * L'accès aux annonces du Grand Hall.
 *
 * **Le seul endroit qui compose une requête sur `annonces`** — comme
 * `corbeaux/depot.ts` pour les messages. Une table dont les lectures
 * s'écrivent en dix endroits finit par en avoir une qui oublie le filtre, et
 * ici le filtre est ce qui distingue une annonce affichée d'une annonce
 * retirée.
 *
 * **Le dépôt appelle la validation lui-même.** `publierAnnonce` et
 * `corrigerAnnonce` passent par `schema.ts` avant d'écrire : l'action serveur
 * ne fait que traduire le résultat. Une seule porte, qu'aucun écran ne
 * contourne — le parti pris d'`envoyerCorbeau`, puis d'`ouvrirSujet`.
 *
 * ⚠️ **Rien n'est jamais effacé.** Retirer pose une date ; la ligne reste. Le
 * dépôt n'expose aucune suppression, et il ne faut pas en ajouter : une
 * annonce qui a fait courir les sept jours du préambule doit rester
 * consultable, ne serait-ce que pour savoir ce qui a été annoncé, et quand.
 */

/**
 * Une ligne de liste — au Grand Hall comme dans le journal du bureau.
 *
 * **Sans le corps**, et c'est délibéré : les deux écrans n'en montrent que
 * les premiers mots, et le bureau est la page la plus visitée du site. Ce que
 * le réseau ne transporte pas ne coûte rien.
 */
export type AnnonceEnBref = {
  id: string;
  titre: string;
  publieeLe: string;
  extrait: string;
  entreeEnVigueurLe: string | null;
};

/** Une annonce ouverte, avec son texte. */
export type AnnonceAffichee = {
  id: string;
  titre: string;
  /** Du balisage déjà passé par la liste blanche. */
  corps: string;
  publieeLe: string;
  entreeEnVigueurLe: string | null;
  modifieLe: string | null;
};

/** Tout, plus ce que seule l'administration a besoin de voir. */
export type AnnonceEnAdministration = AnnonceAffichee & {
  extrait: string;
  retireeLe: string | null;
  retireePar: string | null;
};

/**
 * **Ce qui est affiché**, de la plus récente à la plus ancienne.
 *
 * Une annonce retirée n'en fait pas partie — c'est la seule condition, et
 * elle est écrite ici plutôt que chez l'appelant : un écran qui l'oublierait
 * afficherait ce que l'administration a justement décidé de retirer.
 */
export async function listerAnnonces(limite = 50): Promise<AnnonceEnBref[]> {
  const lignes = await prisma.annonce.findMany({
    where: { retireeLe: null },
    orderBy: { publieeLe: "desc" },
    take: limite,
    select: {
      id: true,
      titre: true,
      corps: true,
      publieeLe: true,
      entreeEnVigueurLe: true,
    },
  });

  return lignes.map((ligne) => ({
    id: ligne.id,
    titre: ligne.titre,
    publieeLe: ligne.publieeLe.toISOString(),
    // Calculé, jamais stocké : deux textes qui disent la même chose finissent
    // par se contredire — on corrige l'annonce, l'extrait garde l'ancienne
    // phrase, et le bureau annonce autre chose que le Grand Hall.
    extrait: extrait(ligne.corps),
    entreeEnVigueurLe: ligne.entreeEnVigueurLe?.toISOString() ?? null,
  }));
}

/**
 * Une annonce, par son adresse.
 *
 * Rend `null` pour une annonce retirée **comme** pour une annonce qui n'a
 * jamais existé : l'écran répond « Ce couloir ne mène nulle part » dans les
 * deux cas. Distinguer les deux dirait « elle existe, mais on l'a retirée »,
 * ce qui est exactement le genre de confirmation que le forum et la Tour se
 * refusent déjà.
 */
export async function lireAnnonce(id: string): Promise<AnnonceAffichee | null> {
  const ligne = await prisma.annonce.findFirst({
    where: { id, retireeLe: null },
    select: {
      id: true,
      titre: true,
      corps: true,
      publieeLe: true,
      entreeEnVigueurLe: true,
      modifieLe: true,
    },
  });
  if (!ligne) return null;

  return {
    id: ligne.id,
    titre: ligne.titre,
    corps: ligne.corps,
    publieeLe: ligne.publieeLe.toISOString(),
    entreeEnVigueurLe: ligne.entreeEnVigueurLe?.toISOString() ?? null,
    modifieLe: ligne.modifieLe?.toISOString() ?? null,
  };
}

/**
 * Tout, retiré compris — **et cette fonction n'est appelée que par
 * `/admin/annonces`**. Elle porte le seul chemin qui voie une annonce
 * retirée : le retrait n'est pas un effacement, mais il ne se lit pas depuis
 * le Grand Hall pour autant.
 */
export async function listerPourAdministration(): Promise<
  AnnonceEnAdministration[]
> {
  const lignes = await prisma.annonce.findMany({
    orderBy: { publieeLe: "desc" },
    select: {
      id: true,
      titre: true,
      corps: true,
      publieeLe: true,
      entreeEnVigueurLe: true,
      modifieLe: true,
      retireeLe: true,
      retireePar: true,
    },
  });

  return lignes.map((ligne) => ({
    id: ligne.id,
    titre: ligne.titre,
    corps: ligne.corps,
    publieeLe: ligne.publieeLe.toISOString(),
    extrait: extrait(ligne.corps),
    entreeEnVigueurLe: ligne.entreeEnVigueurLe?.toISOString() ?? null,
    modifieLe: ligne.modifieLe?.toISOString() ?? null,
    retireeLe: ligne.retireeLe?.toISOString() ?? null,
    retireePar: ligne.retireePar,
  }));
}

/**
 * Afficher une annonce au Grand Hall.
 *
 * L'instant d'affichage est **posé ici, une fois**, et sert de repère à la
 * validation de l'entrée en vigueur : sans cela, les deux se compareraient à
 * deux horloges différentes, et une annonce publiée sur le coup de minuit
 * pourrait entrer en vigueur avant d'exister.
 */
export async function publierAnnonce(entrees: {
  titre: unknown;
  corps: unknown;
  entreeEnVigueur: unknown;
}): Promise<Resultat<{ id: string }>> {
  const publieeLe = new Date();

  const titre = validerTitreAnnonce(entrees.titre);
  if (!titre.ok) return titre;
  const corps = validerCorpsAnnonce(entrees.corps);
  if (!corps.ok) return corps;
  const vigueur = validerEntreeEnVigueur(entrees.entreeEnVigueur, publieeLe);
  if (!vigueur.ok) return vigueur;

  const posee = await prisma.annonce.create({
    data: {
      titre: titre.valeur,
      corps: corps.valeur,
      publieeLe,
      entreeEnVigueurLe: vigueur.valeur,
      posePar: TEXTES_ANNONCES.administration.posePar,
    },
    select: { id: true },
  });

  return { ok: true, valeur: { id: posee.id } };
}

/**
 * Corriger une annonce déjà affichée.
 *
 * **La date d'affichage ne bouge pas** : c'est elle qui a fait courir les sept
 * jours, et la déplacer réécrirait l'histoire. `modifieLe` marque la reprise,
 * comme sur un post — on doit voir qu'un texte a bougé depuis qu'on l'a lu.
 *
 * L'entrée en vigueur se revalide **contre la date d'affichage d'origine**,
 * et non contre l'instant présent : une annonce d'il y a trois semaines peut
 * être corrigée sans que sa date d'application devienne illégale.
 */
export async function corrigerAnnonce(
  id: string,
  entrees: { titre: unknown; corps: unknown; entreeEnVigueur: unknown },
): Promise<Resultat<{ id: string }>> {
  const existante = await prisma.annonce.findUnique({
    where: { id },
    select: { publieeLe: true },
  });
  if (!existante) return { ok: false, message: TEXTES_ANNONCES.annonce.introuvable };

  const titre = validerTitreAnnonce(entrees.titre);
  if (!titre.ok) return titre;
  const corps = validerCorpsAnnonce(entrees.corps);
  if (!corps.ok) return corps;
  const vigueur = validerEntreeEnVigueur(
    entrees.entreeEnVigueur,
    existante.publieeLe,
  );
  if (!vigueur.ok) return vigueur;

  await prisma.annonce.update({
    where: { id },
    data: {
      titre: titre.valeur,
      corps: corps.valeur,
      entreeEnVigueurLe: vigueur.valeur,
      modifieLe: new Date(),
    },
  });

  return { ok: true, valeur: { id } };
}

/**
 * Retirer une annonce du Grand Hall — **sans rien effacer**.
 *
 * Les deux colonnes sont posées ensemble ; la base refuse l'une sans l'autre.
 * Reposer le geste sur une annonce déjà retirée ne change rien : le `where`
 * s'en charge, et il n'y a pas de second retrait à dater.
 */
export async function retirerAnnonce(id: string): Promise<void> {
  await prisma.annonce.updateMany({
    where: { id, retireeLe: null },
    data: {
      retireeLe: new Date(),
      retireePar: TEXTES_ANNONCES.administration.posePar,
    },
  });
}

/**
 * Remettre au Grand Hall ce qu'on en avait retiré.
 *
 * Le pendant du retrait, et il faut qu'il existe : sans lui, un clic
 * malheureux serait définitif, alors que rien n'a été effacé.
 */
export async function remettreAnnonce(id: string): Promise<void> {
  await prisma.annonce.updateMany({
    where: { id, retireeLe: { not: null } },
    data: { retireeLe: null, retireePar: null },
  });
}
