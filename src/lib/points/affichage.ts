import { TEXTES_POINTS } from "./constantes";

/**
 * **Comment un nombre de points s’écrit à l’écran.**
 *
 * Un seul endroit, et c’est tout l’intérêt : la mise en forme était recopiée
 * dans trois écrans — les tubes, l’administration, la clôture — et chacun
 * arrondissait pour son compte. Trois copies de la même règle finissent
 * toujours par diverger, et le jour où l’on en corrige deux sur trois,
 * personne ne s’en aperçoit.
 *
 * ⚠️ **Seul l’AFFICHAGE est arrondi.** Le calcul garde sa précision : c’est la
 * valeur exacte qui décide de la hauteur d’un tube et du rang d’une maison.
 * Deux maisons peuvent donc montrer le même nombre avec des tubes légèrement
 * différents — c’est normal, et préférable à un faux ex æquo qu’un arrondi
 * aurait fabriqué.
 */

/**
 * Le vrai signe moins — U+2212 —, et non le trait d’union du clavier.
 *
 * Le second est plus court, plus haut, et ne s’aligne pas avec le « + » : dans
 * une colonne de chiffres, « -15 » et « +15 » ne se lisent pas à la même
 * hauteur. Même soin que les apostrophes typographiques ailleurs sur le site.
 */
const MOINS = "−";

/** Un entier, avec le vrai signe moins. `-0` n’existe pas pour un lecteur. */
function entier(valeur: number): string {
  const arrondi = Math.round(valeur);
  // `Math.round(-0.4)` rend `-0`, que `String` écrit « -0 ». Personne n’a
  // jamais lu « moins zéro point ».
  const net = Object.is(arrondi, -0) ? 0 : arrondi;
  return String(net).replace("-", MOINS);
}

/**
 * **La moyenne par élève, arrondie à l’entier.**
 *
 * On lit « 34 », jamais « 34,3 » — et surtout « 0 », jamais « 0,0 ». Une
 * décimale sur un compteur de jeu donne un air de tableur à ce qui doit se
 * lire d’un coup d’œil, et « 0,0 » se lit comme une panne.
 */
export function moyenneAffichee(valeur: number): string {
  return entier(valeur);
}

/** Un total de points. Entier en base, mais on passe par la même porte. */
export function pointsAffiches(valeur: number): string {
  return entier(valeur);
}

/**
 * Un ajustement, avec son sens : « +30 », « −15 ».
 *
 * Le plus est écrit, alors qu’il va de soi ailleurs : dans un historique, ce
 * qui compte est de voir d’un coup ce qui a été donné et ce qui a été repris.
 */
export function pointsSignes(valeur: number): string {
  const arrondi = Math.round(valeur);
  return arrondi > 0 ? `+${arrondi}` : entier(arrondi);
}

/**
 * « 1 point », « 12 points », « 0 point ».
 *
 * **Zéro est au singulier en français**, et c’est la faute que tout le monde
 * fait. Même règle que sur la carte de l’auteur.
 */
export function enPoints(n: number): string {
  const t = TEXTES_POINTS.tournoi;
  const arrondi = Math.round(n);
  return (arrondi > 1 ? t.desPoints : t.unPoint).replace("{n}", entier(arrondi));
}

/** « 1 élève », « 8 élèves », « 0 élève ». */
export function enEleves(n: number): string {
  const t = TEXTES_POINTS.tournoi;
  return (n > 1 ? t.desEleves : t.unEleve).replace("{n}", entier(n));
}

/** « 12 points · 8 élèves » — la ligne de détail sous un tube. */
export function detailDUneMaison(points: number, effectif: number): string {
  return `${enPoints(points)} · ${enEleves(effectif)}`;
}

/** « 34 points par élève » — la moyenne, dite en toutes lettres. */
export function moyenneEnToutesLettres(valeur: number): string {
  return `${moyenneAffichee(valeur)} ${TEXTES_POINTS.tournoi.moyenneLegende}`;
}
