import type { Anomalie } from "../anomalies";
import type { Recolte } from "../collecte";
import { avecDelai } from "../collecte";
import {
  PAGES_FERMEES,
  PAGES_PUBLIQUES,
  type PageSurveillee,
} from "../constantes";
import {
  DELAI_PAR_PAGE_MS,
  REPONSE_LENTE_MS,
  REPONSE_TRES_LENTE_MS,
} from "../reglages";

/**
 * Les pages clés répondent-elles, et en combien de temps ?
 *
 * ── Ce que ce collecteur vérifie vraiment ──
 *
 * Trois choses, et la troisième est la plus importante :
 *
 *   1. les pages publiques répondent 200 ;
 *   2. les pages de l'école répondent 200 **avec** la session du compte de
 *      service ;
 *   3. ⚠️ **les pages de l'école répondent 307 SANS session.** Le jour où
 *      `/bureau` rendrait 200 à un inconnu, ce serait la plus grave anomalie
 *      que ce site puisse produire — et rien d'autre ne l'attraperait. C'est
 *      la seule vérification de ce collecteur qui cherche un défaut plutôt
 *      qu'une panne.
 *
 * ── Il ne fait que demander ──
 *
 * Aucun `POST`, sauf celui de la connexion, qui ne crée rien : il rend un
 * cookie. Aucun formulaire soumis, aucun bouton cliqué. Le parcours au
 * navigateur est un autre collecteur, et lui non plus ne publie rien.
 */

export type EtatDUnePage = {
  nom: string;
  chemin: string;
  code: number | null;
  dureeMs: number;
  /** Ce qui n'allait pas, s'il y a lieu — pour le rapport. */
  souci: string | null;
};

export type Disponibilite = {
  pages: EtatDUnePage[];
  /**
   * Les pages que la ronde n'a pas pu vérifier, et pourquoi.
   *
   * ⚠️ **Ce n'est pas une anomalie, et c'est tout le point.** Une page qui se
   * referme parce que le compte de service n'a pas de maison se comporte
   * exactement comme elle doit. Le dire dans « ce que la ronde n'a pas pu
   * voir » est honnête ; l'annoncer en PANNE serait un faux positif — et un
   * faux positif quotidien vide le rapport de son sens en une semaine.
   */
  nonVerifiees: { nom: string; chemin: string; raison: string }[];
  /** Combien ont répondu comme prévu. */
  saines: number;
  /** La plus lente, pour le rapport — même quand tout va bien. */
  laPlusLente: EtatDUnePage | null;
};

/** Une mesure, pour que le reste du fichier n'ait pas à connaître `fetch`. */
export type Demandeur = (
  chemin: string,
  options: { cookie?: string; signal: AbortSignal },
) => Promise<{ code: number }>;

/** Le demandeur ordinaire : `fetch`, sans suivre les redirections. */
export function parLeReseau(site: string): Demandeur {
  return async (chemin, { cookie, signal }) => {
    const reponse = await fetch(`${site}${chemin}`, {
      // ⚠️ « manual » est indispensable : sans lui, `fetch` suivrait le 307
      // de `/bureau` jusqu'à `/connexion`, qui rend 200 — et la vérification
      // « fermée aux inconnus » passerait toujours, pour rien.
      redirect: "manual",
      headers: {
        ...(cookie ? { cookie } : {}),
        // Un agent qui se nomme : si le site journalise un jour ses visites,
        // celles de La Veille doivent se distinguer d'un joueur.
        "user-agent": "Ravenshallow-Veille/1 (surveillance interne)",
      },
      signal,
      cache: "no-store",
    });
    return { code: reponse.status };
  };
}

/** Une redirection vers la connexion : ce qu'une page fermée doit rendre. */
function estUneRedirection(code: number): boolean {
  return code === 307 || code === 302 || code === 303;
}

async function mesurer(
  page: PageSurveillee,
  demandeur: Demandeur,
  cookie: string | undefined,
  horloge: () => number,
): Promise<EtatDUnePage> {
  const debut = horloge();
  try {
    const { code } = await avecDelai(
      (signal) => demandeur(page.chemin, { cookie, signal }),
      DELAI_PAR_PAGE_MS,
      page.nom,
    );
    return { nom: page.nom, chemin: page.chemin, code, dureeMs: horloge() - debut, souci: null };
  } catch (erreur) {
    return {
      nom: page.nom,
      chemin: page.chemin,
      code: null,
      dureeMs: horloge() - debut,
      souci: erreur instanceof Error ? erreur.message : String(erreur),
    };
  }
}

export type Options = {
  demandeur: Demandeur;
  /** Le cookie de session du compte de service, s'il a pu se connecter. */
  cookie: string | null;
  /**
   * La maison du compte de service s'affiche-t-elle ?
   *
   * ⚠️ **La question se pose avec `aUneMaison`, la couture du site**, jamais
   * en comparant `etatMaison` ici : `acces.ts` est le seul endroit qui ait le
   * droit de comparer un état à une valeur, et le recopier ferait diverger La
   * Veille du site le jour où la règle changerait.
   */
  compteAUneMaison: boolean;
  horloge?: () => number;
};

export async function collecterLaDisponibilite({
  demandeur,
  cookie,
  compteAUneMaison,
  horloge = () => Date.now(),
}: Options): Promise<Recolte<Disponibilite>> {
  const anomalies: Anomalie[] = [];
  const pages: EtatDUnePage[] = [];
  const nonVerifiees: Disponibilite["nonVerifiees"] = [];

  // ── Les pages publiques ──
  for (const page of PAGES_PUBLIQUES) {
    const etat = await mesurer(page, demandeur, undefined, horloge);
    pages.push(etat);
    anomalies.push(...jugerUnePage(etat, 200));
  }

  // ── Les pages de l'école, sans session : elles doivent se refermer ──
  for (const page of PAGES_FERMEES) {
    const etat = await mesurer(page, demandeur, undefined, horloge);
    if (etat.code !== null && !estUneRedirection(etat.code)) {
      anomalies.push({
        // ⚠️ Pas de code dans la clé : « ouverte aux inconnus » est le même
        // défaut qu'elle rende 200 ou 500 demain.
        cle: `disponibilite:ouverte-sans-session:${page.chemin}`,
        gravite: "PANNE",
        quoi:
          `${page.nom} s’ouvre sans être connecté. Cette page devrait renvoyer ` +
          "vers la connexion.",
        ou: page.chemin,
        detail: `code ${etat.code}`,
      });
    }
  }

  // ── Les mêmes, avec la session du compte de service ──
  if (cookie) {
    for (const page of PAGES_FERMEES) {
      // Une page qui dépend d'une maison ne se vérifie que si le compte en a
      // une. Sinon elle répond 307 — et c'est ce qu'elle doit faire.
      if (page.exigeUneMaison && !compteAUneMaison) {
        nonVerifiees.push({
          nom: page.nom,
          chemin: page.chemin,
          raison:
            "Le compte de La Veille n’a pas de maison qui s’affiche : cette " +
            "page se referme sur lui, comme elle le ferait sur la directrice. " +
            "Pour la surveiller, il faudrait lui rendre une maison depuis sa " +
            "fiche.",
        });
        continue;
      }
      const etat = await mesurer(page, demandeur, cookie, horloge);
      pages.push(etat);
      anomalies.push(...jugerUnePage(etat, 200));
    }
  } else {
    anomalies.push({
      cle: "disponibilite:connexion-impossible",
      gravite: "PANNE",
      quoi:
        "Le compte de service n’a pas pu se connecter : aucune page de l’école " +
        "n’a été vérifiée.",
      ou: "/api/connexion",
    });
  }

  const repondues = pages.filter((p) => p.code !== null);
  const laPlusLente =
    repondues.length === 0
      ? null
      : repondues.reduce((a, b) => (b.dureeMs > a.dureeMs ? b : a));

  return {
    donnees: {
      pages,
      nonVerifiees,
      saines: pages.filter((p) => p.code === 200 && p.dureeMs < REPONSE_LENTE_MS).length,
      laPlusLente,
    },
    anomalies,
  };
}

/** Ce qu'une page a de fautif : muette, mauvais code, ou trop lente. */
function jugerUnePage(etat: EtatDUnePage, attendu: number): Anomalie[] {
  if (etat.code === null) {
    return [
      {
        cle: `disponibilite:muette:${etat.chemin}`,
        gravite: "PANNE",
        quoi: `${etat.nom} n’a pas répondu.`,
        ou: etat.chemin,
        detail: etat.souci ?? undefined,
      },
    ];
  }

  if (etat.code !== attendu) {
    return [
      {
        // Le code entre dans la clé, ici : un 404 et un 500 ne se corrigent
        // pas de la même façon, et ce sont deux défauts distincts.
        cle: `disponibilite:code-${etat.code}:${etat.chemin}`,
        gravite: "PANNE",
        quoi: `${etat.nom} répond ${etat.code} au lieu de ${attendu}.`,
        ou: etat.chemin,
      },
    ];
  }

  if (etat.dureeMs >= REPONSE_TRES_LENTE_MS) {
    return [
      {
        // ⚠️ Aucun chiffre dans la clé : la mesure change tous les matins, et
        // une lenteur qui changerait d’identité chaque jour ne durerait jamais.
        cle: `disponibilite:tres-lente:${etat.chemin}`,
        gravite: "A_SURVEILLER",
        quoi: `${etat.nom} met très longtemps à répondre.`,
        ou: etat.chemin,
        detail: `${(etat.dureeMs / 1000).toFixed(1).replace(".", ",")} s`,
      },
    ];
  }

  return [];
}

/**
 * Ouvre une session pour le compte de service, et rend son cookie.
 *
 * ⚠️ **C'est le seul `POST` de toute la ronde**, et il ne crée rien : il pose
 * une session. Il met aussi à jour `derniereConnexionLe` du compte de service,
 * ce qui est voulu — c'est ce qui l'empêche d'apparaître dans les absences.
 */
export async function ouvrirUneSession(
  site: string,
  courriel: string,
  motDePasse: string,
): Promise<string | null> {
  try {
    const reponse = await avecDelai(
      (signal) =>
        fetch(`${site}/api/connexion`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: courriel, motDePasse }),
          signal,
          cache: "no-store",
        }),
      DELAI_PAR_PAGE_MS,
      "La connexion",
    );

    if (!reponse.ok) return null;

    const cookies = reponse.headers.getSetCookie?.() ?? [];
    const session = cookies.find((c) => c.startsWith("ravenshallow_session="));
    return session ? session.split(";")[0] : null;
  } catch {
    // ⚠️ On avale l'erreur ici, et c'est délibéré : l'anomalie est levée par
    // le collecteur, qui sait la formuler. Laisser passer l'exception ferait
    // tomber toute la disponibilité pour une connexion refusée.
    return null;
  }
}
