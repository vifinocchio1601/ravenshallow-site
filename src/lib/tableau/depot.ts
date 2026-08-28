import "server-only";
import { libellePlace, type Maison } from "@/lib/dossier/etats";
import { prisma } from "@/lib/prisma";
import { TEXTES_TABLEAU } from "./constantes";
import { MOTS_AFFICHES } from "./limites";
import { validerMot, type Resultat } from "./schema";

/**
 * L'accès au tableau d'affichage d'une maison.
 *
 * **Le seul endroit qui compose une requête sur `mots_du_tableau`** — et le
 * seul qui sache qu'un mot retiré ne s'affiche plus. Une table dont les
 * lectures s'écrivent en dix endroits finit par en avoir une qui oublie le
 * filtre.
 *
 * ⚠️ **Le dépôt ne décide de rien sur les droits.** Qui peut épingler se
 * tranche dans `lib/forum/pouvoirs.ts` — `peutEcrireLesAnnoncesDe` —, et
 * l'appelant le lui passe. Recopier la question ici en ferait une seconde
 * source, qui divergerait le jour où l'on toucherait aux préfets.
 */

export type MotAffiche = {
  id: string;
  corps: string;
  epingleLe: string;
  /** Le nom de qui l'a épinglé, ou `null` s'il n'est plus là. */
  auteurNom: string | null;
  /** L'année, ou le titre au château qui la remplace. `null` s'il est parti. */
  auteurPlace: string | null;
  /** L'identifiant de son auteur — pour savoir s'il peut le retirer lui-même. */
  auteurId: string | null;
};

/**
 * **Ce qui est au mur**, du plus récent au plus ancien.
 *
 * Le retrait est la seule condition, et elle est écrite ici plutôt que chez
 * l'appelant : un écran qui l'oublierait afficherait ce qu'un préfet a
 * justement décroché.
 */
export async function lireLeTableau(
  maison: Maison,
  combien: number = MOTS_AFFICHES,
): Promise<MotAffiche[]> {
  const lignes = await prisma.motDuTableau.findMany({
    where: { maison, retireLe: null },
    orderBy: { epingleLe: "desc" },
    take: combien,
    select: {
      id: true,
      corps: true,
      epingleLe: true,
      auteurId: true,
      auteur: { select: { prenomNom: true, fonction: true, roleAffiche: true } },
    },
  });

  return lignes.map((ligne) => ({
    id: ligne.id,
    corps: ligne.corps,
    epingleLe: ligne.epingleLe.toISOString(),
    auteurNom: ligne.auteur?.prenomNom ?? null,
    // **`libellePlace` et jamais `libelleAnnee`** : un mot signé par la
    // directrice doit dire « Directrice », pas « première année ». Le rôle
    // n'y est pas facultatif — l'oublier est une erreur de compilation.
    auteurPlace: ligne.auteur
      ? libellePlace(ligne.auteur.fonction, ligne.auteur.roleAffiche)
      : null,
    auteurId: ligne.auteurId,
  }));
}

/**
 * Épingler un mot.
 *
 * **Le droit est vérifié par l'appelant**, et passé ici : le dépôt refuse
 * d'écrire sans lui, mais ne le calcule pas. La validation, elle, se fait
 * bien ici — une seule porte, qu'aucun écran ne contourne.
 */
export async function epinglerUnMot(entrees: {
  maison: Maison;
  auteurId: string;
  corps: unknown;
  aLeDroit: boolean;
}): Promise<Resultat<{ id: string }>> {
  if (!entrees.aLeDroit) {
    return { ok: false, message: TEXTES_TABLEAU.erreurs.pasLeDroit };
  }

  const corps = validerMot(entrees.corps);
  if (!corps.ok) return corps;

  const pose = await prisma.motDuTableau.create({
    data: {
      maison: entrees.maison,
      corps: corps.valeur,
      auteurId: entrees.auteurId,
    },
    select: { id: true },
  });

  return { ok: true, valeur: { id: pose.id } };
}

/**
 * Retirer un mot du mur — **sans l'effacer**.
 *
 * Deux droits mènent ici, et il faut les deux : **son auteur** peut décrocher
 * ce qu'il a écrit, et **qui peut épingler** peut faire le ménage. Un préfet
 * qui ne pourrait pas retirer le mot d'un autre n'aurait aucun moyen de tenir
 * son tableau.
 *
 * Le `where` porte la maison **et** l'absence de retrait : un identifiant
 * emprunté à une autre maison ne décroche rien, et reposer le geste ne
 * réécrit pas la date.
 */
export async function retirerUnMot(entrees: {
  id: string;
  maison: Maison;
  parId: string;
  parNom: string;
  peutFaireLeMenage: boolean;
}): Promise<Resultat<null>> {
  const mot = await prisma.motDuTableau.findFirst({
    where: { id: entrees.id, maison: entrees.maison, retireLe: null },
    select: { auteurId: true },
  });
  if (!mot) return { ok: false, message: TEXTES_TABLEAU.erreurs.introuvable };

  const sien = mot.auteurId !== null && mot.auteurId === entrees.parId;
  if (!sien && !entrees.peutFaireLeMenage) {
    return { ok: false, message: TEXTES_TABLEAU.erreurs.pasLeDroit };
  }

  await prisma.motDuTableau.updateMany({
    where: { id: entrees.id, retireLe: null },
    // ⚠️ Un NOM, jamais un identifiant : un lien serait vidé le jour où ce
    // compte disparaît, et la contrainte « les deux colonnes ensemble »
    // tomberait toute seule au milieu d'une suppression.
    data: { retireLe: new Date(), retirePar: entrees.parNom },
  });

  return { ok: true, valeur: null };
}
