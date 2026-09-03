import { CONTROLE_CREATURES_L1_1 } from "@/contenu/cours/controles/creatures-l1-1";
import { CONTROLE_HERBORISTERIE_L1_1 } from "@/contenu/cours/controles/herboristerie-l1-1";
import { CONTROLE_HISTOIRE_L1_1 } from "@/contenu/cours/controles/histoire-l1-1";
import { CONTROLE_MAGIE_DEFENSIVE_L1_1 } from "@/contenu/cours/controles/magie-defensive-l1-1";
import { CONTROLE_RUNOLOGIE_L1_1 } from "@/contenu/cours/controles/runologie-l1-1";
import { CONTROLE_SORTILEGES_L1_1 } from "@/contenu/cours/controles/sortileges-l1-1";
import { controleEnvoye } from "@/lib/cours/depot";
import { lecteurDeLaLecon } from "@/lib/cours/garde";
import {
  corriger,
  enoncesDe,
  questionnaireDe,
} from "@/lib/cours/questionnaires";

/**
 * **La page d'un contrôle** — celle du joueur, remplie par le serveur.
 *
 * ── Ce que cette route injecte, et ce qu'elle laisse au chaud ──
 *
 * Elle remplit deux marques dans le HTML :
 *
 *   `__DONNEES_QUESTIONS__` — les énoncés et les réponses proposées, **rien
 *     d'autre**. Ni l'indice de la bonne réponse, ni l'explication : ils
 *     restent dans `questionnaires.ts`, qui est `server-only`. C'était le
 *     défaut de la maquette, et c'est la seule chose que ce lot devait
 *     absolument corriger ;
 *   `__DONNEES_ETAT__` — l'adresse d'envoi, la leçon visée, et le résultat
 *     s'il est déjà passé.
 *
 * ⚠️ **Quand le contrôle est déjà envoyé, la correction descend en entier** —
 * bonnes réponses et explications comprises. C'est le seul moment où elles ont
 * le droit de descendre, et il n'y a plus rien à protéger : le contrôle ne se
 * repasse pas (`REGLES.controleEnvoiUnique`), l'élève a sa note, et lui cacher
 * la correction lui retirerait ce que le contrôle a de pédagogique.
 *
 * ── L'injection est du JSON, jamais une concaténation de texte ──
 *
 * `JSON.stringify` produit une valeur JavaScript valide, et les deux marques
 * sont **hors de toute chaîne de caractères** dans la page. Reste le piège de
 * `</script>` dans un texte, qui refermerait la balise en plein milieu : il est
 * neutralisé par `enJavaScript`.
 *
 * ⚠️ **C'est du HTML non passé par React, comme la leçon** — et pour la même
 * raison : la page est complète, avec son propre style. Rien de ce qui est
 * injecté ici ne vient d'un joueur ni de la base : ce sont les questionnaires
 * du dépôt et la note qu'on vient de calculer. **Ne jamais y faire passer un
 * texte écrit par un membre.**
 */

export const dynamic = "force-dynamic";

/** Le contenu de chaque contrôle, par sa clé. */
const CONTENUS: Record<string, string> = {
  "sortileges/1": CONTROLE_SORTILEGES_L1_1,
  "runologie/1": CONTROLE_RUNOLOGIE_L1_1,
  "magie_defensive/1": CONTROLE_MAGIE_DEFENSIVE_L1_1,
  "herboristerie/1": CONTROLE_HERBORISTERIE_L1_1,
  "creatures/1": CONTROLE_CREATURES_L1_1,
  "histoire/1": CONTROLE_HISTOIRE_L1_1,
};

function introuvable(): Response {
  return new Response(null, { status: 404 });
}

/**
 * Une valeur posée dans un `<script>`.
 *
 * ⚠️ **`</script>` doit être coupé.** Le navigateur cherche cette suite de
 * lettres sans se soucier de savoir qu'elle est dans une chaîne : un énoncé
 * qui la contiendrait refermerait la balise, et la fin du script deviendrait
 * du texte à l'écran. Aucun de nos trente énoncés ne la porte aujourd'hui ;
 * c'est justement pourquoi il faut s'en occuper maintenant.
 */
function enJavaScript(valeur: unknown): string {
  return JSON.stringify(valeur)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    // Et les deux separateurs de ligne d'Unicode, qui sont du JSON valide et
    // du JavaScript invalide -- la seule difference entre les deux langages
    // qui puisse casser une page.
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export async function GET(
  _requete: Request,
  { params }: { params: { annee: string; matiere: string; lecon: string } },
): Promise<Response> {
  const lecteur = await lecteurDeLaLecon(
    params.annee,
    params.matiere,
    params.lecon,
  );
  if (!lecteur) return introuvable();

  const { laLecon, annee, eleveId } = lecteur;

  const gabarit = CONTENUS[`${laLecon.matiereId}/${laLecon.rang}`];
  const questionnaire = questionnaireDe(laLecon.matiereId, annee, laLecon.rang);
  // ⚠️ Une leçon peut exister sans son contrôle — c'est le cas normal des
  // leçons à venir. On rend 404 plutôt qu'une page vide.
  if (!gabarit || !questionnaire) return introuvable();

  const deja = await controleEnvoye(
    eleveId,
    laLecon.matiereId,
    annee,
    laLecon.rang,
  );

  const etat = {
    envoi: "/api/cours/controle",
    // ⚠️ **La sortie est DÉRIVÉE de l'année**, jamais écrite en dur dans le
    // script : le contrôle d'une leçon de deuxième année ramènerait sinon au
    // programme de première. Le lien du haut de page, lui, est dans le HTML —
    // `lecons.test.ts` vérifie qu'il désigne bien la bonne année.
    retour: `/cours/${annee}`,
    matiere: laLecon.matiereId,
    annee,
    rang: laLecon.rang,
    // La correction entière, mais **seulement** s'il a déjà envoyé.
    envoye: deja
      ? {
          ...corriger(questionnaire, deja.reponses),
          reponses: deja.reponses,
          envoyeLe: deja.envoyeLe.getTime(),
        }
      : null,
  };

  // La page du joueur lit `q.q` et `q.r` : on lui rend ses noms de champs,
  // et l'on garde les nôtres côté serveur. Écrit à la main, jamais par une
  // copie — un champ ajouté demain à `Question` ne partirait pas tout seul.
  const questions = enoncesDe(questionnaire).map((q) => ({
    q: q.enonce,
    r: q.reponses,
  }));

  // ⚠️ **Le remplacement passe par une fonction**, jamais par une chaîne :
  // `String.replace` interprète `$&`, `$'` et leurs cousins dans le texte de
  // remplacement, et un énoncé qui porterait un `$` sortirait mutilé. Le
  // défaut ne se verrait que sur la question fautive.
  const page = gabarit
    .replace("__DONNEES_QUESTIONS__", () => enJavaScript(questions))
    .replace("__DONNEES_ETAT__", () => enJavaScript(etat));

  // Les deux marques ont-elles bien disparu ? Une page qui en garderait une
  // ne s'exécuterait pas, et l'élève verrait un contrôle vide sans savoir
  // pourquoi. Mieux vaut un 404, qui se voit et se cherche.
  if (page.includes("__DONNEES_")) return introuvable();

  return new Response(page, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // ⚠️ Jamais de cache : la page porte la note de CE compte.
      "cache-control": "private, no-store",
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
