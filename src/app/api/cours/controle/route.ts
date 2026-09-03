import { NextResponse } from "next/server";
import { controleEnvoye, envoyerLeControle } from "@/lib/cours/depot";
import { lecteurDeLaLecon } from "@/lib/cours/garde";
import { corriger, questionnaireDe } from "@/lib/cours/questionnaires";
import { noterErreur } from "@/lib/erreurs/depot";

/**
 * **L'envoi d'un contrôle.** Une fois, et pour toujours.
 *
 * ── La garde est refaite ici en entier ──
 *
 * Une adresse de page se contourne en la tapant ; une route d'API se contourne
 * en l'appelant. Celle-ci repose donc les six mêmes questions que la page, par
 * `lecteurDeLaLecon` — la couture partagée. Sans elle, un première année
 * enverrait le contrôle de septième en visant l'adresse au jugé.
 *
 * ── Trois codes, et ils ne disent pas la même chose ──
 *
 *   **404** — la leçon n'existe pas, ou pas pour ce compte. « Elle existe,
 *     mais pas pour vous » se lit comme une confirmation, et l'on ne
 *     distingue donc pas les deux. Même choix que le forum et la Tour ;
 *   **409** — il l'a déjà envoyé. C'est un rejeu, pas un refus : la page
 *     reçoit la correction et s'ouvre dessus, comme si elle venait de la
 *     recevoir. Même distinction que le Miroir et la boutique, où 409 dit
 *     « c'est déjà passé » et 403 « cela ne vous concerne pas » ;
 *   **422** — les réponses ne sont pas recevables : il en manque une, ou l'une
 *     d'elles désigne un choix qui n'existe pas. Il a le droit, mais pas comme
 *     ça — c'est la lecture du forum, où 403 et 422 ne se confondent jamais.
 *
 * ⚠️ **Le 409 rend la correction, et c'est voulu.** Un second clic sur
 * « Envoyer » ne doit pas laisser l'élève devant une page morte : il a bien
 * envoyé, sa note existe, il la voit. Rien n'est écrit une seconde fois — c'est
 * l'index unique qui l'a refusé, et la transaction annulée a emporté les points
 * avec elle.
 */

export const dynamic = "force-dynamic";

/** Ce que la page attend en retour : la correction, et ce qu'elle a rapporté. */
type Reponse = {
  correction: {
    note: number;
    surCombien: number;
    bonnes: number[];
    explications: string[];
    mot: string;
    reponses: number[];
    envoyeLe: number;
  };
  points: number;
};

export async function POST(requete: Request): Promise<Response> {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json(
      { message: "Envoi illisible." },
      { status: 422 },
    );
  }

  const { matiere, annee, rang, reponses } = (corps ?? {}) as Record<
    string,
    unknown
  >;

  // La garde attend les trois morceaux de l'adresse, en toutes lettres : elle
  // les vérifie elle-même, et rien n'est converti avant elle.
  const lecteur = await lecteurDeLaLecon(
    String(annee),
    String(matiere),
    String(rang),
  );
  if (!lecteur) return new Response(null, { status: 404 });

  const questionnaire = questionnaireDe(
    lecteur.laLecon.matiereId,
    lecteur.annee,
    lecteur.laLecon.rang,
  );
  if (!questionnaire) return new Response(null, { status: 404 });

  try {
    const resultat = await envoyerLeControle(
      lecteur.auteur,
      lecteur.laLecon.matiereId,
      lecteur.annee,
      lecteur.laLecon.rang,
      reponses,
    );

    if (resultat.etat === "REFUSE") {
      return NextResponse.json(
        {
          message:
            "Il manque une réponse, ou l'une d'elles ne correspond à rien. Reprenez le contrôle.",
        },
        { status: 422 },
      );
    }

    if (resultat.etat === "DEJA_ENVOYE") {
      // Rejeu : on relit ce qui a été écrit et l'on rend la même correction.
      const deja = await controleEnvoye(
        lecteur.eleveId,
        lecteur.laLecon.matiereId,
        lecteur.annee,
        lecteur.laLecon.rang,
      );
      if (!deja) return new Response(null, { status: 404 });
      const reponse: Reponse = {
        correction: {
          ...corriger(questionnaire, deja.reponses),
          reponses: deja.reponses,
          envoyeLe: deja.envoyeLe.getTime(),
        },
        points: 0,
      };
      return NextResponse.json(reponse, { status: 409 });
    }

    const reponse: Reponse = {
      correction: {
        ...resultat.correction,
        // Celles que le dépôt a nettoyées, jamais celles reçues : ce qui
        // repart vers la page est ce qui vient d'être écrit en base.
        reponses: resultat.reponses,
        envoyeLe: resultat.envoyeLe.getTime(),
      },
      points: resultat.points,
    };
    return NextResponse.json(reponse, { status: 200 });
  } catch (erreur) {
    // ⚠️ **Attendue, jamais lancée à la volée** : sur Vercel, la fonction peut
    // se terminer avant qu'un appel non attendu n'aboutisse.
    await noterErreur("cours", erreur, "/api/cours/controle");
    return NextResponse.json(
      {
        message:
          "L'envoi n'est pas parti. Vos réponses sont toujours là — réessayez.",
      },
      { status: 500 },
    );
  }
}
