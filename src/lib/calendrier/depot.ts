import "server-only";
import { prisma } from "@/lib/prisma";
import { TEXTES_CALENDRIER } from "./constantes";
import type { NatureEvenement } from "./natures";
import {
  validerDescriptionEvenement,
  validerLesDates,
  validerNature,
  validerTitreEvenement,
  type Resultat,
} from "./schema";

/**
 * L'accès au calendrier.
 *
 * **Le seul endroit qui compose une requête sur `evenements`** — comme
 * `annonces/depot.ts` pour les annonces. Une table dont les lectures
 * s'écrivent en dix endroits finit par en avoir une qui oublie le filtre, et
 * ici le filtre est ce qui distingue une date affichée d'une date retirée.
 *
 * **Le dépôt appelle la validation lui-même** : l'action serveur ne fait que
 * traduire le résultat. Une seule porte, qu'aucun écran ne contourne — le
 * parti pris d'`envoyerCorbeau`, puis d'`ouvrirSujet`, puis de
 * `publierAnnonce`.
 *
 * ⚠️ **Rien n'est jamais effacé.** Retirer pose une date ; la ligne reste, et
 * « Remettre au calendrier » existe pour la même raison qu'au Grand Hall — un
 * clic malheureux ne doit pas être définitif.
 */

/** Un événement, tel qu'il s'affiche. */
export type EvenementAffiche = {
  id: string;
  titre: string;
  description: string;
  nature: NatureEvenement;
  debuteLe: string;
  finitLe: string | null;
  modifieLe: string | null;
};

/** Tout, plus ce que seule l'administration a besoin de voir. */
export type EvenementEnAdministration = EvenementAffiche & {
  retireLe: string | null;
  retirePar: string | null;
};

const CHAMPS = {
  id: true,
  titre: true,
  description: true,
  nature: true,
  debuteLe: true,
  finitLe: true,
  modifieLe: true,
} as const;

type LigneBrute = {
  id: string;
  titre: string;
  description: string;
  nature: NatureEvenement;
  debuteLe: Date;
  finitLe: Date | null;
  modifieLe: Date | null;
};

function affiche(ligne: LigneBrute): EvenementAffiche {
  return {
    id: ligne.id,
    titre: ligne.titre,
    description: ligne.description,
    nature: ligne.nature,
    debuteLe: ligne.debuteLe.toISOString(),
    finitLe: ligne.finitLe?.toISOString() ?? null,
    modifieLe: ligne.modifieLe?.toISOString() ?? null,
  };
}

/**
 * **Le calendrier, en deux temps** — et c'est une seule table lue deux fois.
 *
 * « Calendrier » et « événements à venir » sont la même chose vue sous deux
 * angles : ce qui vient, et ce qui a eu lieu. Deux tables auraient fini par
 * dire deux choses de la même fête.
 *
 * ⚠️ **Un événement qui DURE reste « à venir » jusqu'à sa fin.** Un trimestre
 * commencé le 1er septembre et fini le 15 décembre n'a pas à basculer dans
 * « déjà passé » le 2 septembre : ce qui décide, c'est `finitLe` quand il
 * existe, `debuteLe` sinon. La comparaison se fait sur la **journée** —
 * l'instant de fin est posé à midi, on retient donc la journée entière.
 */
export async function lireLeCalendrier(): Promise<{
  aVenir: EvenementAffiche[];
  passes: EvenementAffiche[];
}> {
  const lignes = await prisma.evenement.findMany({
    where: { retireLe: null },
    orderBy: { debuteLe: "asc" },
    select: CHAMPS,
  });

  // Minuit ce matin : tout ce qui se termine aujourd'hui est encore devant.
  const debutDuJour = new Date();
  debutDuJour.setHours(0, 0, 0, 0);

  const aVenir: EvenementAffiche[] = [];
  const passes: EvenementAffiche[] = [];

  for (const ligne of lignes) {
    const derniereDate = ligne.finitLe ?? ligne.debuteLe;
    if (derniereDate.getTime() >= debutDuJour.getTime()) {
      aVenir.push(affiche(ligne));
    } else {
      passes.push(affiche(ligne));
    }
  }

  // Les passés se lisent à l'envers : le plus récent d'abord, comme on
  // remonte le fil de ce qui vient de se produire.
  passes.reverse();

  return { aVenir, passes };
}

/**
 * **La prochaine épreuve**, pour le panneau du bureau.
 *
 * ⚠️ **`EPREUVE` et rien d'autre.** Le panneau s'appelle « Prochaines
 * épreuves » depuis le lot du bureau : y faire monter une fête le
 * contredirait, et c'est exactement pour cela que la nature existe.
 *
 * Rend `null` quand rien n'est prévu — le panneau affiche alors « sans date »,
 * ce qu'il fait déjà depuis le premier jour.
 */
export async function prochaineEpreuve(): Promise<EvenementAffiche | null> {
  const debutDuJour = new Date();
  debutDuJour.setHours(0, 0, 0, 0);

  const ligne = await prisma.evenement.findFirst({
    where: { retireLe: null, nature: "EPREUVE", debuteLe: { gte: debutDuJour } },
    orderBy: { debuteLe: "asc" },
    select: CHAMPS,
  });

  return ligne ? affiche(ligne) : null;
}

/**
 * Tout, retiré compris — **et cette fonction n'est appelée que par
 * `/admin/calendrier`**. Elle porte le seul chemin qui voie une date
 * retirée : le retrait n'est pas un effacement, mais il ne se lit pas depuis
 * le Grand Hall pour autant.
 */
export async function listerPourAdministration(): Promise<
  EvenementEnAdministration[]
> {
  const lignes = await prisma.evenement.findMany({
    orderBy: { debuteLe: "asc" },
    select: { ...CHAMPS, retireLe: true, retirePar: true },
  });

  return lignes.map((ligne) => ({
    ...affiche(ligne),
    retireLe: ligne.retireLe?.toISOString() ?? null,
    retirePar: ligne.retirePar,
  }));
}

/** Poser une date au calendrier. */
export async function poserEvenement(entrees: {
  titre: unknown;
  description: unknown;
  nature: unknown;
  debut: unknown;
  fin: unknown;
}): Promise<Resultat<{ id: string }>> {
  const titre = validerTitreEvenement(entrees.titre);
  if (!titre.ok) return titre;
  const description = validerDescriptionEvenement(entrees.description);
  if (!description.ok) return description;
  const nature = validerNature(entrees.nature);
  if (!nature.ok) return nature;
  const dates = validerLesDates(entrees.debut, entrees.fin);
  if (!dates.ok) return dates;

  const posee = await prisma.evenement.create({
    data: {
      titre: titre.valeur,
      description: description.valeur,
      nature: nature.valeur,
      debuteLe: dates.valeur.debuteLe,
      finitLe: dates.valeur.finitLe,
      posePar: TEXTES_CALENDRIER.administration.posePar,
    },
    select: { id: true },
  });

  return { ok: true, valeur: { id: posee.id } };
}

/**
 * Corriger une date.
 *
 * `modifieLe` marque la reprise, comme sur une annonce et sur un post : une
 * date qu'on a notée dans son agenda a le droit de bouger, mais il faut que
 * cela se voie.
 */
export async function corrigerEvenement(
  id: string,
  entrees: {
    titre: unknown;
    description: unknown;
    nature: unknown;
    debut: unknown;
    fin: unknown;
  },
): Promise<Resultat<{ id: string }>> {
  const existant = await prisma.evenement.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existant) {
    return { ok: false, message: TEXTES_CALENDRIER.erreurs.introuvable };
  }

  const titre = validerTitreEvenement(entrees.titre);
  if (!titre.ok) return titre;
  const description = validerDescriptionEvenement(entrees.description);
  if (!description.ok) return description;
  const nature = validerNature(entrees.nature);
  if (!nature.ok) return nature;
  const dates = validerLesDates(entrees.debut, entrees.fin);
  if (!dates.ok) return dates;

  await prisma.evenement.update({
    where: { id },
    data: {
      titre: titre.valeur,
      description: description.valeur,
      nature: nature.valeur,
      debuteLe: dates.valeur.debuteLe,
      finitLe: dates.valeur.finitLe,
      modifieLe: new Date(),
    },
  });

  return { ok: true, valeur: { id } };
}

/**
 * Retirer une date — **sans rien effacer**.
 *
 * Les deux colonnes sont posées ensemble ; la base refuse l'une sans l'autre.
 * Reposer le geste sur une date déjà retirée ne change rien : le `where` s'en
 * charge, et il n'y a pas de second retrait à dater.
 */
export async function retirerEvenement(id: string): Promise<void> {
  await prisma.evenement.updateMany({
    where: { id, retireLe: null },
    data: {
      retireLe: new Date(),
      retirePar: TEXTES_CALENDRIER.administration.posePar,
    },
  });
}

/** Remettre au calendrier ce qui en avait été retiré. */
export async function remettreEvenement(id: string): Promise<void> {
  await prisma.evenement.updateMany({
    where: { id, NOT: { retireLe: null } },
    data: { retireLe: null, retirePar: null },
  });
}
