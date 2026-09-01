import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * La ronde — le point d'entrée.
 *
 * ── Ce qu'elle fait, dans l'ordre ──
 *
 *   1. la garde d'heure : est-ce à cette exécution-ci de travailler ?
 *   2. les secrets, relus d'un coup pour se plaindre tôt
 *   3. les collecteurs, chacun dans son filet
 *   4. les anomalies datées contre la mémoire d'hier
 *   5. les suggestions, si l'API répond
 *   6. le rapport, vérifié puis envoyé
 *   7. la mémoire rangée pour demain
 *
 * ── Ce qu'elle ne dit PAS à l'écran ──
 *
 * ⚠️ **Le dépôt est public, donc les journaux d'exécution des Actions le sont
 * aussi.** La ronde n'écrit que des lignes de progression sans contenu : « 6
 * collecteurs, 2 anomalies, rapport envoyé ». Jamais le rapport lui-même,
 * jamais un nombre de dossiers, jamais une adresse. Tout ce qui compte part
 * par courriel.
 *
 * Pour regarder un rapport, il y a `--sans-envoi`, qui l'écrit à l'écran et
 * n'envoie rien : on le lance à la main, sur son propre poste.
 *
 * ── La durée ──
 *
 * Une borne interne coupe les collecteurs restants et **envoie ce qu'elle a**.
 * Le `timeout-minutes` du workflow est un filet d'un autre ordre : lui tue le
 * travail sans rien envoyer, et c'est pour cela qu'il est réglé bien au-delà.
 *
 *   npm run veille                 une ronde, rapport à l’écran, rien d’envoyé
 *   npm run veille:envoyer         une ronde complète
 */

// `.env.local` d'abord — sans écraser ce que l'environnement porte déjà :
// dans les Actions, les secrets viennent de là et ce fichier n'existe pas.
try {
  for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
    const nette = ligne.trim();
    if (!nette || nette.startsWith("#") || !nette.includes("=")) continue;
    const coupure = nette.indexOf("=");
    process.env[nette.slice(0, coupure).trim()] ??= nette
      .slice(coupure + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
} catch {
  // Absent dans les Actions, et c'est le cas normal : les secrets y sont déjà
  // dans l'environnement. On ne dit rien, il n'y a rien à dire.
}

const { daterLesAnomalies } = await import("./anomalies");
const { depot, refermer, verifierLaLectureSeule } = await import("./base");
const { orchestrer } = await import("./orchestration");
const { aUneMaison } = await import("@/lib/session/acces");
const { collecterCeQuiAttend } = await import("./collecteurs/attente");
const { collecterLaCoherence } = await import("./collecteurs/coherence");
const { collecterLaDisponibilite, ouvrirUneSession, parLeReseau } = await import(
  "./collecteurs/disponibilite"
);
const { collecterLesErreurs } = await import("./collecteurs/erreurs");
const { collecterLeParcours } = await import("./collecteurs/parcours");
const { collecterLaVie, memoriserLaVie } = await import("./collecteurs/vie");
const { envoyerLeRapport } = await import("./courriel");
const { verdictDeLaRonde } = await import("./heure");
const { ecrireLaMemoire, lireLaMemoire } = await import("./memoire");
const { corpsDeLEchec, corpsDuRapport } = await import("./rapport/corps");
const { objetDeLEchec, objetDuRapport } = await import("./rapport/objet");
const { verifierAvantEnvoi } = await import("./rapport/caviardage");
const { lireLesSecrets } = await import("./secrets");
const suggestions = await import("./suggestions");
const { ecrireLesSuggestions } = suggestions;
const { DUREE_MAX_RONDE_MS } = await import("./reglages");

import type { Recolte } from "./collecte";
import type { Bilan } from "./rapport/bilan";

const options = new Set(process.argv.slice(2));
const SANS_ENVOI = options.has("--sans-envoi");
const MANUELLE = options.has("--manuelle") || SANS_ENVOI;

const instant = new Date();
const debut = Date.now();

/** Ce qu'il reste avant la borne de durée. */
const resteMs = () => DUREE_MAX_RONDE_MS - (Date.now() - debut);

// ─────────────────────────────────────────────────────────────
//  1. La garde d'heure
// ─────────────────────────────────────────────────────────────

const verdict = verdictDeLaRonde(instant, MANUELLE);
if (!verdict.travaille) {
  console.log(verdict.raison);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────
//  2. Les secrets, puis la ronde
// ─────────────────────────────────────────────────────────────

const secrets = lireLesSecrets();

let bilan: Bilan;
try {
  bilan = await faireLaRonde();
} catch (erreur) {
  // ⚠️ **Un échec silencieux est pire qu'une panne.** Si la ronde elle-même
  // tombe — la base injoignable, un secret absent —, un courriel court le dit.
  // Sans lui, l'absence de rapport se confondrait avec « tout va bien ».
  const raison = erreur instanceof Error ? erreur.message : String(erreur);
  console.log("La ronde est tombée.");
  await refermer().catch(() => undefined);

  if (!SANS_ENVOI) {
    const envoi = await envoyerLeRapport(
      secrets,
      objetDeLEchec(instant),
      corpsDeLEchec(instant, raison),
    );
    console.log(envoi.envoye ? "Courriel d’échec envoyé." : "Courriel d’échec non parti.");
  } else {
    console.log(corpsDeLEchec(instant, raison));
  }
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
//  3. Le rapport
// ─────────────────────────────────────────────────────────────

const objet = objetDuRapport(bilan);
const corps = corpsDuRapport(bilan);

const verification = verifierAvantEnvoi(objet, corps);
if (!verification.peutPartir) {
  // Le rapport est retenu, et l'on dit pourquoi — par courriel, sans lui.
  console.log("Rapport retenu.");
  if (!SANS_ENVOI) {
    await envoyerLeRapport(
      secrets,
      objetDeLEchec(instant),
      corpsDeLEchec(instant, verification.raison),
    );
  }
  console.log(verification.raison);
  process.exit(1);
}

if (SANS_ENVOI) {
  console.log("");
  console.log(`Objet : ${objet}`);
  console.log("");
  console.log(corps);
} else {
  const envoi = await envoyerLeRapport(secrets, objet, corps);
  if (!envoi.envoye) {
    console.log("Le rapport n’a pas pu être envoyé.");
    process.exit(1);
  }
  // ⚠️ Ni le nombre d'anomalies ni le contenu : le journal est public.
  console.log("Rapport envoyé.");
}

// ─────────────────────────────────────────────────────────────
//  Ce que la ronde fait vraiment
// ─────────────────────────────────────────────────────────────

async function faireLaRonde(): Promise<Bilan> {
  const memoireDHier = lireLaMemoire(process.env.VEILLE_MEMOIRE);
  const racine = resolve(".");

  const base = depot(secrets.base);
  // ⚠️ Avant toute requête : on demande à la base qui parle. Une chaîne de
  // connexion mal collée donnerait à La Veille les droits du propriétaire,
  // sans que rien ne le signale.
  await verifierLaLectureSeule(base);

  /**
   * ⚠️ **La question passe par `aUneMaison`, la couture du site**, jamais par
   * une comparaison d'état écrite ici : `acces.ts` est le seul endroit qui ait
   * le droit de comparer un `EtatEtape` à une valeur. Le recopier ferait
   * diverger La Veille du site le jour où la règle changerait — et c'est elle
   * qui aurait tort.
   */
  const fiche = await base.eleve.findFirst({
    where: { utilisateur: { email: secrets.compte.courriel } },
    select: { maison: true, etatMaison: true },
  });
  const compteAUneMaison = fiche ? aUneMaison(fiche) : false;

  const cookie = await ouvrirUneSession(
    secrets.site,
    secrets.compte.courriel,
    secrets.compte.motDePasse,
  );

  /**
   * Chaque famille dans son filet, **et l'ordre compte** : les plus rapides et
   * les plus importantes d'abord, pour que la borne de durée ne coupe que ce
   * qui pouvait attendre.
   */
  // Le tableau est hétérogène — chaque collecteur rend sa propre forme —,
  // d'où le type commun : `executer` n'a besoin que de savoir emballer.
  const familles: { nom: string; faire: () => Promise<Recolte<unknown>> }[] = [
    {
      nom: "la disponibilité",
      faire: () =>
        collecterLaDisponibilite({
          demandeur: parLeReseau(secrets.site),
          cookie,
          compteAUneMaison,
        }),
    },
    { nom: "les erreurs du serveur", faire: () => collecterLesErreurs({ base, instant }) },
    { nom: "ce qui attend", faire: () => collecterCeQuiAttend({ base, instant }) },
    {
      nom: "la vie du site",
      faire: () => collecterLaVie({ base, instant, memoire: memoireDHier }),
    },
    {
      nom: "la cohérence des données",
      faire: () => collecterLaCoherence({ base, instant, racine }),
    },
    // Le parcours en dernier : c'est le plus long, et le seul qui demande un
    // navigateur. S'il saute faute de temps, le reste est déjà rapporté.
    {
      nom: "le parcours au navigateur",
      faire: async () =>
        collecterLeParcours({
          site: secrets.site,
          courriel: secrets.compte.courriel,
          motDePasse: secrets.compte.motDePasse,
          playwright: await chargerPlaywright(),
        }),
    },
  ];

  // ⚠️ La boucle vit dans `orchestration.ts`, et non ici : c'est elle qui
  // tient les trois garanties de robustesse du dispositif, et un point
  // d'entrée — qui lit l'environnement, ouvre une base, envoie un courriel —
  // ne s'éprouve pas.
  const { recoltes, anomalies, manquants, ecourtee } = await orchestrer(familles, {
    resteMs,
    dire: (ligne) => console.log(ligne),
  });

  await refermer();

  // ── Depuis quand chaque anomalie est-elle là ? ──
  const { datees, memoire } = daterLesAnomalies(anomalies, memoireDHier, instant);

  const vie = (recoltes.get("la vie du site") ?? null) as Bilan["vie"];

  const bilanFait: Bilan = {
    instant,
    anomalies: datees,
    attente: (recoltes.get("ce qui attend") ?? null) as Bilan["attente"],
    vie,
    erreurs: (recoltes.get("les erreurs du serveur") ?? null) as Bilan["erreurs"],
    disponibilite: (recoltes.get("la disponibilité") ?? null) as Bilan["disponibilite"],
    parcours: (recoltes.get("le parcours au navigateur") ?? null) as Bilan["parcours"],
    coherence: (recoltes.get("la cohérence des données") ?? null) as Bilan["coherence"],
    manquants,
    suggestions: null,
    dureeMs: Date.now() - debut,
    ecourtee,
  };

  // ── Les suggestions, en dernier et jamais bloquantes ──
  bilanFait.suggestions = await ecrireLesSuggestions(bilanFait, secrets.cleApi);

  // ⚠️ Seulement en mode « sans envoi », c'est-à-dire à la main sur le poste
  // du joueur. Le journal des Actions est public, et la ronde y reste muette.
  if (SANS_ENVOI && bilanFait.suggestions === null && suggestions.derniereRaison) {
    console.log(`  suggestions : ${suggestions.derniereRaison}`);
  }

  // ── Ranger pour demain ──
  const pourDemain = vie ? memoriserLaVie(memoire, vie) : memoire;
  try {
    ecrireLaMemoire(pourDemain, process.env.VEILLE_MEMOIRE);
  } catch (erreur) {
    // Sans conséquence pour ce rapport-ci : demain repartira sans historique.
    console.log(
      `  mémoire non rangée : ${erreur instanceof Error ? erreur.message : "?"}`,
    );
  }

  bilanFait.dureeMs = Date.now() - debut;
  return bilanFait;
}

/**
 * Playwright, s'il est là.
 *
 * ⚠️ **Ce n'est pas une dépendance du projet** : il est installé dans le CI
 * seulement, comme `sharp` l'a été pour les bannières. Absent, le collecteur
 * lève, `executer` l'attrape, et le rapport dit que le parcours n'a pas eu
 * lieu. Le nom passe par une variable pour que `npx tsc --noEmit` ne réclame
 * pas un module que le poste du joueur n'a pas.
 */
async function chargerPlaywright(): Promise<unknown | null> {
  try {
    const nom = "playwright";
    return await import(nom);
  } catch {
    return null;
  }
}
