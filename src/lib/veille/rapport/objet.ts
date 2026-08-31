import { TEXTES } from "../constantes";
import { postesDeLObjet, type Bilan } from "./bilan";

/**
 * La ligne d'objet — **elle doit se lire sans ouvrir le message**.
 *
 * C'est la partie du rapport qu'on voit le plus souvent : sur trois cent
 * soixante-cinq matins, on en ouvrira peut-être vingt. L'objet doit donc
 * suffire les trois cent quarante-cinq autres fois.
 *
 *   Ravenshallow — 3 anomalies, 2 dossiers en attente — 12 sept.
 *   Ravenshallow — tout va bien — 13 sept.
 *
 * ── Ce qu'il ne dit pas ──
 *
 * ⚠️ **Jamais de détail, jamais de nom, jamais un extrait.** Un objet de
 * courriel s'affiche sur l'écran verrouillé d'un téléphone, à côté de
 * quelqu'un dans le métro. « 2 dossiers en attente » y a sa place ; le nom de
 * celui qui attend, non.
 *
 * ── Pourquoi la date est à la fin ──
 *
 * Parce que les clients de messagerie tronquent par la droite, et que ce qu'on
 * perd doit être ce qui compte le moins. La date est utile pour retrouver un
 * rapport dans une liste ; elle ne dit rien qu'on ne sache déjà.
 */

/** Le jour, court, comme on l'écrit dans une conversation : « 12 sept. ». */
export function jourCourt(instant: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Brussels",
    day: "numeric",
    month: "short",
  }).format(instant);
}

/** Accorde un nom au nombre. « 0 dossier », « 1 dossier », « 3 dossiers ». */
function accorde(nombre: number, singulier: string, pluriel = `${singulier}s`): string {
  // ⚠️ Zéro est au singulier en français — la faute que tout le monde fait,
  // et déjà corrigée une fois dans `points/affichage.ts`.
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`;
}

export function objetDuRapport(bilan: Bilan): string {
  const morceaux: string[] = [];

  if (bilan.anomalies.length > 0) {
    morceaux.push(accorde(bilan.anomalies.length, "anomalie"));
  }

  // ⚠️ Chaque poste est nommé, jamais additionné : voir `postesDeLObjet`.
  for (const poste of postesDeLObjet(bilan.attente)) {
    morceaux.push(accorde(poste.nombre, poste.singulier, poste.pluriel));
  }

  // ⚠️ « Tout va bien » ne se dit que si la ronde a VRAIMENT tout vu. Une
  // ronde amputée qui l'annoncerait mentirait par omission — et c'est
  // exactement le silence qu'on cherche à rendre impossible.
  if (morceaux.length === 0) {
    morceaux.push(
      bilan.manquants.length > 0
        ? `${accorde(bilan.manquants.length, "contrôle")} n’a pas abouti`
        : TEXTES.objet.toutVaBien,
    );
  }

  return `${TEXTES.objet.prefixe} — ${morceaux.join(", ")} — ${jourCourt(bilan.instant)}`;
}

/**
 * L'objet du courriel qu'on envoie quand la ronde elle-même est tombée.
 *
 * Il ne ressemble à aucun autre : c'est ce qui permet de le repérer d'un coup
 * d'œil dans une liste de rapports quotidiens.
 */
export function objetDeLEchec(instant: Date): string {
  return `${TEXTES.objet.prefixe} — ${TEXTES.objet.ronde} — ${jourCourt(instant)}`;
}
