import "server-only";
import type { Maison } from "@/lib/dossier/etats";

/**
 * Les cinq questions du Miroir, et ce qu’elles pèsent.
 *
 * **Ce fichier ne sort jamais du serveur.** Le `server-only` en tête n’est pas
 * décoratif : si un composant client l’importait, la construction échouerait
 * plutôt que d’expédier le barème au navigateur. Un joueur qui lit les
 * pondérations choisit sa maison, et la cérémonie ne veut plus rien dire.
 *
 * Ce que le navigateur reçoit, lui, est bâti par `pourLAffichage()` : les
 * énoncés et les libellés, dans l’ordre tiré pour cet élève. Jamais les points.
 *
 * **Chaque réponse donne 2 points à une maison et 1 à une autre.** Ce double
 * poids est délibéré : il rend le système illisible de l’extérieur, et il
 * garantit que deux maisons ne marquent jamais autant l’une que l’autre sur
 * une même réponse — ce sur quoi le départage s’appuie.
 */

export type Reponse = {
  /** Stable, et seul jeton que le navigateur renvoie au serveur. */
  id: string;
  texte: string;
  points: Readonly<Partial<Record<Maison, number>>>;
};

export type Question = {
  id: string;
  enonce: string;
  reponses: readonly Reponse[];
};

export const QUESTIONS: readonly Question[] = [
  {
    id: "q1",
    enonce:
      "La barque qui vous mène au château s’arrête dans la brume. Le passeur ne dit rien. Vous ne voyez plus la côte.",
    reponses: [
      {
        id: "q1a",
        texte: "Vous attrapez une rame de secours, au cas où.",
        points: { BRYGGELD: 2, KALDRAFN: 1 },
      },
      {
        id: "q1b",
        texte: "Vous écoutez. Il y a autre chose que le vent.",
        points: { TIDEAL: 2, NATTORM: 1 },
      },
      {
        id: "q1c",
        texte:
          "Vous comptez les secondes entre les vagues pour savoir si on avance encore.",
        points: { KALDRAFN: 2, TIDEAL: 1 },
      },
      {
        id: "q1d",
        texte: "Vous observez le passeur plutôt que la mer : c’est lui qui sait.",
        points: { NATTORM: 2, KALDRAFN: 1 },
      },
    ],
  },
  {
    id: "q2",
    enonce:
      "Un camarade de dortoir pleure la nuit, en silence. Il ne sait pas que vous êtes réveillé.",
    reponses: [
      {
        id: "q2a",
        texte:
          "Vous dites à voix basse que vous êtes réveillé, pour qu’il ne soit pas seul avec ça.",
        points: { TIDEAL: 2, BRYGGELD: 1 },
      },
      {
        id: "q2b",
        texte:
          "Vous ne bougez pas. Demain, vous vous arrangerez pour être là quand il en aura besoin.",
        points: { KALDRAFN: 2, NATTORM: 1 },
      },
      {
        id: "q2c",
        texte:
          "Vous faites semblant de dormir et vous n’en parlerez jamais à personne.",
        points: { NATTORM: 2, TIDEAL: 1 },
      },
      {
        id: "q2d",
        texte: "Vous vous levez et vous lui proposez quelque chose de chaud.",
        points: { BRYGGELD: 2, TIDEAL: 1 },
      },
    ],
  },
  {
    id: "q3",
    enonce:
      "Une porte que vous n’aviez jamais vue est entrouverte. Derrière, un escalier qui descend.",
    reponses: [
      {
        id: "q3a",
        texte: "Vous entrez, et vous refermez derrière vous.",
        points: { NATTORM: 2, KALDRAFN: 1 },
      },
      {
        id: "q3b",
        texte: "Vous reculez. Quelque chose là dedans ne veut pas de vous.",
        points: { TIDEAL: 2, KALDRAFN: 1 },
      },
      {
        id: "q3c",
        texte: "Vous regardez d’abord si l’escalier tient, avant toute chose.",
        points: { BRYGGELD: 2, NATTORM: 1 },
      },
      {
        id: "q3d",
        texte: "Vous notez l’endroit et l’heure, et vous reviendrez préparé.",
        points: { KALDRAFN: 2, BRYGGELD: 1 },
      },
    ],
  },
  {
    id: "q4",
    enonce: "Votre premier sort rate devant toute la classe. Quelqu’un rit.",
    reponses: [
      {
        id: "q4a",
        texte:
          "Vous cherchez ce qui a cloché dans votre geste avant de recommencer.",
        points: { TIDEAL: 2, BRYGGELD: 1 },
      },
      {
        id: "q4b",
        texte:
          "Vous riez aussi, puis vous vous entraînerez seul jusqu’à ce que ça marche.",
        points: { BRYGGELD: 2, NATTORM: 1 },
      },
      {
        id: "q4c",
        texte: "Vous le refaites. Tout de suite, dans le silence.",
        points: { KALDRAFN: 2, BRYGGELD: 1 },
      },
      {
        id: "q4d",
        texte: "Vous retenez qui a ri.",
        points: { NATTORM: 2, KALDRAFN: 1 },
      },
    ],
  },
  {
    id: "q5",
    enonce: "Vous savez quelque chose que personne ne veut entendre.",
    reponses: [
      {
        id: "q5a",
        texte: "Vous le gardez. Ça vaudra plus cher plus tard.",
        points: { NATTORM: 2, KALDRAFN: 1 },
      },
      {
        id: "q5b",
        texte: "Vous le dites à la personne concernée, à elle seule.",
        points: { BRYGGELD: 2, TIDEAL: 1 },
      },
      {
        id: "q5c",
        texte: "Vous attendez le moment où l’on vous écoutera vraiment.",
        points: { KALDRAFN: 2, NATTORM: 1 },
      },
      {
        id: "q5d",
        texte: "Vous le dites à voix haute, même si ça vous retombe dessus.",
        points: { TIDEAL: 2, BRYGGELD: 1 },
      },
    ],
  },
];

/** La question qui tranche les égalités — la dernière, et c’est voulu. */
export const INDEX_QUESTION_DEPARTAGE = QUESTIONS.length - 1;

/** Les identifiants d’une question, dans l’ordre où ils sont écrits ici. */
export function identifiantsDe(indexQuestion: number): readonly string[] {
  return QUESTIONS[indexQuestion]?.reponses.map((r) => r.id) ?? [];
}

/** La réponse portant cet identifiant, dans cette question. */
export function reponseDe(
  indexQuestion: number,
  id: string,
): Reponse | undefined {
  return QUESTIONS[indexQuestion]?.reponses.find((r) => r.id === id);
}

// ─────────────────────────────────────────────────────────────
//  Ce que le navigateur reçoit
// ─────────────────────────────────────────────────────────────

export type ReponseAffichee = { id: string; texte: string };
export type QuestionAffichee = {
  id: string;
  enonce: string;
  reponses: readonly ReponseAffichee[];
};

/**
 * Les questions telles qu’elles partent au navigateur : dans l’ordre tiré
 * pour cet élève, **et sans les points**.
 *
 * La construction est explicite plutôt qu’un `delete` ou un `omit` : ce qui
 * traverse est une liste écrite à la main, ce qui rend impossible d’expédier
 * un champ par distraction le jour où le barème gagnera une colonne.
 */
export function pourLAffichage(
  melange: readonly (readonly string[])[],
): QuestionAffichee[] {
  return QUESTIONS.map((question, index) => ({
    id: question.id,
    enonce: question.enonce,
    reponses: (melange[index] ?? identifiantsDe(index)).flatMap((id) => {
      const reponse = reponseDe(index, id);
      return reponse ? [{ id: reponse.id, texte: reponse.texte }] : [];
    }),
  }));
}
