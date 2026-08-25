import "server-only";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import {
  identifiantsDe,
  INDEX_QUESTION_DEPARTAGE,
  QUESTIONS,
  reponseDe,
  type Reponse,
} from "./questionnaire";

/**
 * Ce que le Miroir décide, et comment.
 *
 * **Tout est reproductible.** À partir des cinq identifiants donnés, ce
 * fichier retrouve toujours la même maison — aucun tirage au sort n’entre
 * dans le calcul, y compris pour départager. C’est ce qui permet de répondre
 * à un joueur qui conteste sa répartition : on rejoue ses réponses, on
 * retombe sur le même résultat, et on peut lui montrer le compte.
 *
 * Le hasard n’intervient qu’à un seul endroit, et il ne pèse sur rien :
 * l’ordre d’affichage des réponses (`tirerMelange`).
 */

// ─────────────────────────────────────────────────────────────
//  Le calcul
// ─────────────────────────────────────────────────────────────

/** Comment la maison a été désignée. Recalculable, donc jamais stocké. */
export type Departage =
  | { regle: "aucun" }
  /** Deux maisons ou plus au sommet ; la cinquième réponse a tranché. */
  | { regle: "question5"; exAequo: readonly Maison[] }
  /** La cinquième n’en désignait aucune ; la première à marquer l’emporte. */
  | { regle: "premiereMarque"; exAequo: readonly Maison[] };

export type Repartition = {
  maison: Maison;
  points: Record<Maison, number>;
  departage: Departage;
};

export type ResultatCalcul =
  | { valide: true; repartition: Repartition }
  | { valide: false; raison: "nombre" | "identifiant" };

/**
 * La maison, à partir des cinq identifiants de réponse.
 *
 * On reçoit des identifiants et non des numéros de réponse : un mélange
 * décalé, un rechargement à contretemps ou une requête forgée ne peuvent donc
 * pas faire compter une réponse pour une autre. Un identifiant inconnu — ou
 * qui appartient à une autre question — est refusé plutôt qu’ignoré.
 */
export function calculerRepartition(
  reponses: readonly unknown[],
): ResultatCalcul {
  if (reponses.length !== QUESTIONS.length) {
    return { valide: false, raison: "nombre" };
  }

  const choisies: Reponse[] = [];
  for (let question = 0; question < QUESTIONS.length; question += 1) {
    const id = reponses[question];
    if (typeof id !== "string") return { valide: false, raison: "identifiant" };

    const reponse = reponseDe(question, id);
    if (!reponse) return { valide: false, raison: "identifiant" };
    choisies.push(reponse);
  }

  const points = Object.fromEntries(
    MAISONS.map((maison) => [maison, 0]),
  ) as Record<Maison, number>;

  /** Où chaque maison a marqué pour la première fois, et combien. */
  const premiere = new Map<Maison, { question: number; gain: number }>();

  choisies.forEach((reponse, question) => {
    for (const maison of MAISONS) {
      const gain = reponse.points[maison];
      if (!gain) continue;
      points[maison] += gain;
      if (!premiere.has(maison)) premiere.set(maison, { question, gain });
    }
  });

  const sommet = Math.max(...MAISONS.map((maison) => points[maison]));
  const exAequo = MAISONS.filter((maison) => points[maison] === sommet);

  if (exAequo.length === 1) {
    return {
      valide: true,
      repartition: { maison: exAequo[0], points, departage: { regle: "aucun" } },
    };
  }

  // ── 1 — La cinquième réponse tranche ──
  // Parmi les maisons à égalité, celle qui marque le plus sur cette réponse.
  // Le barème donnant 2 à une maison et 1 à une autre, deux prétendantes ne
  // peuvent pas y marquer autant : quand cette règle s’applique, elle décide.
  const cinquieme = choisies[INDEX_QUESTION_DEPARTAGE].points;
  const marquentEnCinq = exAequo.filter((maison) => (cinquieme[maison] ?? 0) > 0);

  if (marquentEnCinq.length > 0) {
    const maison = marquentEnCinq.reduce((tenante, candidate) =>
      (cinquieme[candidate] ?? 0) > (cinquieme[tenante] ?? 0)
        ? candidate
        : tenante,
    );
    return {
      valide: true,
      repartition: { maison, points, departage: { regle: "question5", exAequo } },
    };
  }

  // ── 2 — La première à avoir marqué ──
  // À égalité de question, c’est la même réponse qui les a servies toutes les
  // deux : l’une y a pris 2 points, l’autre 1. Comparer le gain suffit donc à
  // trancher, et il n’existe pas de troisième cas — jamais de tirage au sort.
  const maison = exAequo.reduce((tenante, candidate) => {
    const a = premiere.get(tenante);
    const b = premiere.get(candidate);
    if (!a || !b) return tenante;
    if (b.question !== a.question) return b.question < a.question ? candidate : tenante;
    return b.gain > a.gain ? candidate : tenante;
  });

  return {
    valide: true,
    repartition: { maison, points, departage: { regle: "premiereMarque", exAequo } },
  };
}

// ─────────────────────────────────────────────────────────────
//  L’ordre d’affichage des réponses
// ─────────────────────────────────────────────────────────────

/**
 * Un entier tiré uniformément dans [0, borne[.
 *
 * Le rejet des valeurs hautes n’est pas une coquetterie : sans lui, un simple
 * modulo ferait sortir les premiers indices un peu plus souvent que les
 * derniers, et les quatre réponses ne seraient pas à égalité de position.
 */
function entierAleatoire(borne: number): number {
  const limite = Math.floor(0x1_0000_0000 / borne) * borne;
  const tampon = new Uint32Array(1);
  let tirage: number;
  do {
    crypto.getRandomValues(tampon);
    tirage = tampon[0];
  } while (tirage >= limite);
  return tirage % borne;
}

function melanger(liste: readonly string[]): string[] {
  const resultat = [...liste];
  for (let i = resultat.length - 1; i > 0; i -= 1) {
    const j = entierAleatoire(i + 1);
    [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
  }
  return resultat;
}

/**
 * L’ordre d’affichage des réponses, tiré une fois par élève.
 *
 * Sans lui, les joueurs s’échangeraient « prends toujours la dernière ». Il
 * est tiré ici, côté serveur, et rangé avec l’élève : un rechargement de page
 * relit le même ordre au lieu d’en tirer un nouveau.
 *
 * Rendu au format de la base : une chaîne par question, identifiants séparés
 * par une espace — lisible à l’œil nu si l’on doit un jour regarder la ligne.
 */
export function tirerMelange(): string[] {
  return QUESTIONS.map((_, question) =>
    melanger(identifiantsDe(question)).join(" "),
  );
}

/**
 * Relit un mélange rangé en base.
 *
 * Rend `null` — et non un ordre de secours — si ce qui est stocké ne
 * correspond plus exactement au questionnaire : cinq questions, quatre
 * identifiants connus par question, aucun doublon. L’appelant retire alors
 * un mélange neuf. Le cas ne se produit que si le questionnaire change sous
 * une cérémonie déjà ouverte ; mieux vaut alors rebattre les cartes qu’afficher
 * une question à trois réponses.
 */
export function lireMelange(
  stocke: readonly string[] | null | undefined,
): string[][] | null {
  if (!stocke || stocke.length !== QUESTIONS.length) return null;

  const melange: string[][] = [];
  for (let question = 0; question < QUESTIONS.length; question += 1) {
    const ids = (stocke[question] ?? "").split(" ").filter(Boolean);
    const attendus = identifiantsDe(question);

    if (ids.length !== attendus.length) return null;
    if (new Set(ids).size !== ids.length) return null;
    if (!ids.every((id) => attendus.includes(id))) return null;

    melange.push(ids);
  }
  return melange;
}
