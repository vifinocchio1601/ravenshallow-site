import { matiereDe, type Annee } from "./cursus";

/**
 * Les leçons en ligne — **et qui a le droit de les ouvrir**.
 *
 * ── Ce que ce fichier décide, seul ──
 *
 * Deux choses : quelles leçons existent, et **si elles sont ouvertes aux
 * élèves**.
 *
 * ✅ **Les six de première année s'ouvrent le vendredi 4 septembre 2026 à 9 h**,
 * heure de Bruxelles — date et heure fixées par le joueur, et annoncées au
 * Grand Hall. Elles étaient fermées avant cela pour une raison précise, qui a
 * cessé d'exister : le contrôle qui suit chacune n'existait pas côté serveur,
 * et ouvrir une leçon promettait une suite qui n'arrivait pas.
 *
 * ⚠️ **L'ouverture est une DATE, jamais un déploiement.** C'était un booléen
 * jusqu'au 3 septembre au soir, et l'ouverture dépendait donc du moment où
 * l'on poussait : le `git push` de la veille a ouvert les cours un jour trop
 * tôt, alors que l'annonce disait vendredi 9 h. Une date annoncée aux membres
 * est une donnée du site.
 *
 * ⚠️ **Ce champ ne se remplit jamais par habitude.** Une leçon sans son
 * contrôle reste à `null` : `lecons.test.ts` exige que toute leçon ouverte —
 * ou à venir — ait son questionnaire, et tombe sinon en la nommant.
 *
 * ── Pourquoi une date plutôt qu'une absence ──
 *
 * Parce qu'il faut pouvoir poser une leçon que le joueur relit avant qu'elle
 * ne s'ouvre, et pouvoir annoncer QUAND. La date dit les deux — « elle existe,
 * elle s'ouvre tel jour » — là où une absence dirait « elle n'existe pas » et
 * où un booléen ne disait que « pas encore ».
 *
 * ── Ce fichier est PUR ──
 *
 * Ni base, ni session, ni contenu. Il dit ce qui existe et ce qui est ouvert ;
 * la route va chercher le HTML, et la garde applique la règle.
 */

export type Lecon = {
  /**
   * L'identifiant de la matière au cursus — « sortileges », jamais son nom.
   *
   * ⚠️ **Le libellé s'affiche depuis `cours/cursus.ts`, qui est la source.**
   * Le recopier ici en ferait une seconde vérité, et c'est déjà la règle des
   * fiches de sort dans les grimoires.
   */
  matiereId: string;
  annee: Annee;
  /** Le rang dans la matière — « Leçon 1 sur 4 ». */
  rang: number;
  /** Combien la matière en compte cette année-là. */
  surCombien: number;
  titre: string;
  /**
   * **L'instant où elle s'ouvre aux élèves**, ou `null` si elle ne l'est pas.
   *
   * ⚠️ **Un instant, et non un booléen**, depuis le 4 septembre 2026. Le
   * drapeau faisait dépendre l'ouverture du **moment du déploiement** : le
   * joueur avait annoncé les cours pour le vendredi 9 h, un `git push` la
   * veille les a ouverts le jeudi. Une date annoncée aux membres est une
   * donnée du site, pas un effet de bord de la mise en ligne.
   *
   * ⚠️ **`null` ne veut dire qu'une chose : fermée.** Il ne veut pas dire
   * « ouverte depuis toujours » — l'oubli va donc dans le sens de la
   * fermeture, comme les drapeaux du menu et comme `robots.ts`.
   *
   * ⚠️ **L'offset est écrit en toutes lettres** — `+02:00`. Écrire l'instant
   * en UTC obligerait à faire le calcul de tête et à le refaire à chaque
   * relecture ; l'écrire sans offset le ferait dépendre du fuseau de la
   * machine, et Vercel vit en UTC. C'est la leçon de la garde d'heure de La
   * Veille, où GitHub ignore l'heure d'été.
   *
   * ⚠️ **Une leçon ouverte doit avoir son contrôle**, et `lecons.test.ts` le
   * vérifie : sans lui, le bouton « Passer le contrôle » mène à un 404, et
   * l'élève croit que le site est cassé.
   */
  ouverteAuxElevesLe: Date | null;
};

/**
 * ⚠️ **La clé d'une leçon est `matiere/rang`**, et l'année s'en déduit — elle
 * n'entre pas dans l'adresse. Une leçon appartient à une matière et à une
 * année à la fois ; les faire toutes deux voyager dans l'URL laisserait
 * `/cours/2/sortileges/1` désigner une leçon de première année.
 */
/**
 * ⚠️ **L'instant d'ouverture des six leçons de première année**, une seule
 * fois. Le joueur l'a fixé au vendredi 4 septembre 2026 à 9 h, heure de
 * Bruxelles, et l'a annoncé au Grand Hall.
 *
 * Il est écrit ici plutôt que six fois : les six s'ouvrent ensemble, c'est
 * une même annonce, et six copies finiraient par diverger d'une minute.
 */
const OUVERTURE_PREMIERE_ANNEE = new Date("2026-09-04T09:00:00+02:00");

export const LECONS: readonly Lecon[] = [
  {
    matiereId: "sortileges",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La Torche",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
  {
    matiereId: "runologie",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Vingt-quatre signes, vingt-quatre sons",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
  {
    matiereId: "magie_defensive",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La garde et la distance",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
  {
    matiereId: "herboristerie",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Reconnaître",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
  {
    matiereId: "creatures",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "Regarder",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
  {
    matiereId: "histoire",
    annee: 1,
    rang: 1,
    surCombien: 4,
    titre: "La côte avant l’école",
    ouverteAuxElevesLe: OUVERTURE_PREMIERE_ANNEE,
  },
];

/**
 * La leçon désignée par une matière et un rang, ou `null`.
 *
 * ⚠️ **Le rang doit s'écrire en chiffres, et rien d'autre.** `Number(" 1")`
 * vaut 1, et `Number("1e3")` vaut 1000 : s'en remettre à la conversion
 * laisserait `/cours/1/sortileges/%201` mener à la même leçon que
 * `/cours/1/sortileges/1`. Une leçon joignable par deux adresses est le
 * défaut que `cleDeMaison` et l'adresse en nombre d'une année ont déjà été
 * écrits pour éviter.
 */
export function lecon(matiere: string, rang: string): Lecon | null {
  if (!/^[1-9][0-9]*$/.test(rang)) return null;
  const numero = Number(rang);
  return (
    LECONS.find((l) => l.matiereId === matiere && l.rang === numero) ?? null
  );
}

/**
 * Ce compte peut-il ouvrir cette leçon ?
 *
 * ⚠️ **Pure, et elle reçoit `staff` en paramètre** : elle ne lit ni base ni
 * pouvoirs. Même parti pris que `peutOuvrirLAnnee` et `peutLireLeLieu`.
 *
 * Trois conditions, et l'ordre n'a pas d'importance :
 *
 *   • la leçon existe ;
 *   • elle est ouverte aux élèves, **ou** c'est le staff qui regarde ;
 *   • l'année du lecteur atteint celle de la leçon — art. 14.4, « les matières
 *     accessibles à un personnage sont celles de son année en cours ». La
 *     question n'est pas reposée ici : elle s'appelle, par `peutOuvrirLAnnee`.
 */
export function peutOuvrirLaLecon(
  lecon: Lecon,
  peutOuvrirLAnnee: boolean,
  staff: boolean,
  maintenant: Date,
): boolean {
  if (staff) return true;
  return estOuverteAuxEleves(lecon, maintenant) && peutOuvrirLAnnee;
}

/**
 * **Cette leçon est-elle ouverte aux élèves à cet instant ?**
 *
 * ⚠️ **`maintenant` arrive en paramètre**, et cette fonction ne lit aucune
 * horloge : c'est ce qui permet d'éprouver la veille et le lendemain de
 * l'ouverture sans attendre. Même parti pris qu'`etatDuPlafond`, que le frein
 * du salon et que le délai entre deux leçons.
 *
 * ⚠️ **La comparaison est un `>=`** : à 9 h 00 m 00 s pile, c'est ouvert.
 * L'heure annoncée est celle à laquelle on entre, pas celle après laquelle on
 * entrera.
 */
export function estOuverteAuxEleves(lecon: Lecon, maintenant: Date): boolean {
  if (lecon.ouverteAuxElevesLe === null) return false;
  return maintenant.getTime() >= lecon.ouverteAuxElevesLe.getTime();
}

/** Les leçons d'une matière pour une année, dans l'ordre. */
export function leconsDe(matiereId: string, annee: Annee): Lecon[] {
  return LECONS.filter(
    (l) => l.matiereId === matiereId && l.annee === annee,
  ).sort((a, b) => a.rang - b.rang);
}

/**
 * Le nom d'affichage d'une leçon, tiré du cursus.
 *
 * ⚠️ Rend `null` si la matière n'existe pas au cursus — ce qui ne devrait
 * jamais arriver, et se verrait tout de suite si cela arrivait.
 */
export function nomDeLaMatiere(lecon: Lecon): string | null {
  return matiereDe(lecon.matiereId)?.nom ?? null;
}
