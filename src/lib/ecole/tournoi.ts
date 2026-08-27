import { MAISONS, type EtatEtape, type Maison } from "@/lib/dossier/etats";
import { PLANCHER_EFFECTIF } from "@/lib/points/regles";
import { aUneMaison } from "@/lib/session/acces";

/**
 * Qui marque pour sa maison — et le tournoi inter-maisons (art. 18.2).
 *
 * **`maisonQuiCompte` est le seul endroit du site qui répond à la question.**
 * Lire `Eleve.maison` ailleurs, c’est le bug : la maison d’une directrice
 * reste écrite en base — on ne l’efface pas —, et n’importe quelle somme
 * naïve la ramasserait au passage.
 *
 * La règle a été posée avant les points, exprès. La poser après coup aurait
 * obligé à retrouver un par un les endroits qui totalisent, et c’est très
 * exactement ainsi qu’un professeur finit par rapporter des points à son
 * ancienne maison. Le lot des points s’y est branché sans rien y changer.
 *
 * ── Ce que ce fichier ne fait pas ──
 *
 * Il ne totalise **aucun point**. Le compteur d’une maison vit en base et se
 * reconstruit depuis le carnet — `lib/points/depot.ts`. Ici on répond à trois
 * questions et trois seulement : qui marque, combien ils sont, et où ça les
 * place.
 *
 * Rien ici n’est un contrôle d’accès : ce fichier dit ce qui se totalise,
 * jamais qui a le droit d’entrer où.
 */

/** Le strict nécessaire pour décider — pas la fiche entière. */
export type PourLeTournoi = {
  /** Écrite ou non. **Ne pas la lire directement** : voir ci-dessous. */
  maison: string | null;
  etatMaison: EtatEtape;
};

/**
 * La maison pour laquelle ce compte marque, ou `null` s’il ne marque pour
 * personne.
 *
 * `FAIT` et rien d’autre. Une directrice garde Tideål en base — c’est ce qui
 * lui permet de la retrouver intacte le jour où elle quitte le poste — et ne
 * doit pas pour autant faire pencher le tournoi. Un nouvel élève, lui, n’a
 * pas encore de maison à faire pencher.
 */
export function maisonQuiCompte(compte: PourLeTournoi): Maison | null {
  // Marquer et s'afficher, c'est la même condition aujourd'hui. Le jour où
  // elles divergeront — un membre suspendu qui garde son blason sans plus
  // marquer —, c'est cette ligne-ci qui changera, et elle seule.
  if (!aUneMaison(compte) || !compte.maison) return null;
  // Une valeur écrite avant un renommage ne doit pas fausser un total : on ne
  // rend que ce que la liste des maisons reconnaît.
  return (MAISONS as readonly string[]).includes(compte.maison)
    ? (compte.maison as Maison)
    : null;
}

/**
 * Ce compte pèse-t-il dans le tournoi ?
 *
 * Question de comptage, distincte de « sa maison s’affiche-t-elle ? », à
 * laquelle répond `aUneMaison` dans `session/acces.ts`. Les deux coïncident
 * aujourd’hui ; les séparer laisse la place à une règle qui viendra
 * peut-être — un membre suspendu qui garde son blason sans plus marquer —
 * sans avoir à démêler l’une de l’autre à ce moment-là.
 */
export function compteAuTournoi(compte: PourLeTournoi): boolean {
  return maisonQuiCompte(compte) !== null;
}

/** Les quatre maisons à zéro. Toujours les quatre, jamais un objet partiel. */
export function totauxVides(): Record<Maison, number> {
  return Object.fromEntries(MAISONS.map((m) => [m, 0])) as Record<Maison, number>;
}

/**
 * L’effectif de chaque maison.
 *
 * Prend les membres **bruts** et fait le tri lui-même, à dessein : une
 * fonction qui recevrait une liste déjà filtrée reposerait sur l’appelant
 * pour ne pas se tromper, et c’est précisément ce qu’on veut lui retirer.
 *
 * Les quatre maisons figurent toujours au résultat, même à zéro : un tournoi
 * où une maison disparaît du tableau parce qu’elle n’a encore personne serait
 * illisible.
 *
 * **Qui filtrer AVANT d’appeler** : les dossiers non acceptés et les comptes
 * archivés (art. 7.3). Ce sont des questions de dossier, pas de tournoi, et
 * elles se posent dans le dépôt. Un membre suspendu, lui, compte — décision
 * du joueur, 27 août 2026 : il garde son blason, il reste de sa maison.
 *
 * ⚠️ **Ce fichier ne totalise plus les points.** `totauxParMaison` sommait
 * `Eleve.points`, c’est-à-dire qu’il supposait « compteur de maison = somme
 * des points personnels ». C’est faux depuis le lot des points : un
 * ajustement de l’administration (art. 19.1) ne touche que la maison, jamais
 * les points personnels. Le compteur de maison vit désormais en base, et se
 * reconstruit depuis le carnet — voir `lib/points/depot.ts`.
 */
export function effectifsParMaison(
  membres: readonly PourLeTournoi[],
): Record<Maison, number> {
  const effectifs = totauxVides();
  for (const membre of membres) {
    const maison = maisonQuiCompte(membre);
    if (maison) effectifs[maison] += 1;
  }
  return effectifs;
}

// ─────────────────────────────────────────────────────────────
//  Le classement — à la moyenne par élève
// ─────────────────────────────────────────────────────────────

/**
 * Une maison au classement.
 *
 * `part` est ce que remplit son tube : la maison en tête vaut 1, les autres
 * se mesurent à elle. **Pas d’objectif fixe** — un plafond arbitraire serait
 * à recalibrer tous les mois, et un tube à moitié plein ne dirait rien.
 */
export type LigneDeClassement = {
  maison: Maison;
  /**
   * Le compteur tel qu’il est en base — **et il peut être négatif**, si
   * l’administration a retiré plus de points qu’une maison n’en avait
   * (art. 19.1). C’est la vérité du carnet, et l’administration doit la voir :
   * sans elle, un retrait de vingt points sur une maison qui en a dix
   * n’aurait aucun effet visible, et on le referait.
   */
  points: number;
  /**
   * **Ce qui compte au tournoi : jamais moins que zéro.**
   *
   * Décision du joueur, 27 août 2026. Un tube ne descend pas sous le fond du
   * verre — il n’y a pas de hauteur négative à peindre —, et une maison
   * punie n’a pas à traîner un handicap invisible pendant des semaines : elle
   * repart de zéro et remonte.
   *
   * Le plancher est posé **ici et nulle part ailleurs**. Surtout pas à
   * l’écriture : le compteur se reconstruit depuis le carnet, et un plancher
   * appliqué à chaque geste donnerait un autre total que la même somme faite
   * d’un coup. Le recalcul cesserait d’être un filet.
   */
  pointsAuTournoi: number;
  effectif: number;
  /** Calculée sur `pointsAuTournoi` : jamais négative non plus. */
  moyenne: number;
  /** De 1 à 4. Les ex æquo partagent leur rang. */
  rang: number;
  /** De 0 à 1 — la hauteur du tube. */
  part: number;
};

/**
 * **Le classement se fait à la moyenne par élève, jamais au total.**
 *
 * Sinon la maison la plus peuplée gagne mécaniquement : quarante élèves
 * médiocres battent huit élèves assidus, et le tournoi ne récompense plus que
 * le recrutement.
 *
 *     moyenne = points de la maison / max(effectif, PLANCHER)
 *
 * Le **plancher** neutralise le cas inverse — une maison à un ou deux
 * inscrits dont la moyenne exploserait au premier post. Il vit dans
 * `config/points.json` : c’est une mesure, pas une règle.
 *
 * ── L’ordre du résultat ──
 *
 * Les quatre maisons sortent **toujours dans l’ordre de `MAISONS`**, et non
 * triées par rang. Un tube qui change de place entre deux visites est
 * désorientant : on cherche le sien, il a bougé. Le rang voyage sur chaque
 * ligne, et l’écran l’affiche sans avoir à déplacer quoi que ce soit.
 *
 * Fonction pure : elle ne lit ni base ni horloge, et se teste sur des
 * nombres.
 */
export function classement(
  totaux: Record<Maison, number>,
  effectifs: Record<Maison, number>,
): LigneDeClassement[] {
  // Le plancher à zéro, une fois pour toutes : tout ce qui suit — moyennes,
  // rangs, hauteurs de tubes — en découle, et rien ne peut plus redevenir
  // négatif en chemin.
  const auTournoi = Object.fromEntries(
    MAISONS.map((maison) => [maison, Math.max(0, totaux[maison])]),
  ) as Record<Maison, number>;

  const moyennes = Object.fromEntries(
    MAISONS.map((maison) => [
      maison,
      auTournoi[maison] / Math.max(effectifs[maison], PLANCHER_EFFECTIF),
    ]),
  ) as Record<Maison, number>;

  const sommet = Math.max(...MAISONS.map((m) => moyennes[m]));

  return MAISONS.map((maison) => ({
    maison,
    points: totaux[maison],
    pointsAuTournoi: auTournoi[maison],
    effectif: effectifs[maison],
    moyenne: moyennes[maison],
    // Le rang se compte, il ne se trie pas : deux maisons à égalité partagent
    // le leur, et la suivante ne prend pas la place laissée libre.
    rang: 1 + MAISONS.filter((m) => moyennes[m] > moyennes[maison]).length,
    // Toutes à zéro — le premier jour, et après chaque clôture : quatre tubes
    // vides, et surtout pas quatre tubes pleins. Une division par zéro rendrait
    // `NaN`, que le navigateur peindrait comme une hauteur de zéro pixel par
    // accident plutôt que par décision.
    part: sommet > 0 ? moyennes[maison] / sommet : 0,
  }));
}
