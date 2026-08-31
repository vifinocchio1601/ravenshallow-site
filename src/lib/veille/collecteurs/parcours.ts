import type { Anomalie } from "../anomalies";
import type { Recolte } from "../collecte";
import { TEXTES } from "../constantes";

/**
 * Le parcours au navigateur — ce qu'un code 200 ne dit pas.
 *
 * ── Pourquoi un navigateur, alors que la disponibilité suffit ──
 *
 * Une page peut répondre 200 et n'afficher qu'un cadre vide. React échoue à
 * l'hydratation, une erreur part dans la console, et le serveur n'en sait
 * rien : le HTML est parti, le code est 200, et le joueur voit une page morte.
 * Ce projet a payé ce défaut plusieurs fois — le cache webpack corrompu qui
 * fait tomber `useContext` dans `next/link`, le `<form>` dans un `<p>` qui
 * casse l'hydratation sans jamais nommer la balise fautive.
 *
 * ⚠️ **C'est ce collecteur qui attrape ces pannes-là, et lui seul.**
 *
 * ── Elle regarde, elle ne publie rien ──
 *
 * Le parcours ouvre des pages et tourne une page de grimoire. Il ne remplit
 * aucun champ de publication, ne clique sur aucun bouton d'envoi, n'ouvre
 * aucune scène. La seule chose qu'il écrive est le formulaire de connexion.
 *
 * ── Playwright n'est pas une dépendance du projet ──
 *
 * Il est installé dans le CI seulement, comme `sharp` l'a été pour les
 * bannières. S'il est absent, ce collecteur le dit et rend la main : la ronde
 * continue sans lui, et le rapport signale la partie manquante. Un
 * avertissement vaut mieux qu'une ronde qui ne part pas.
 */

/** Ce qu'on demande à une page : qu'elle porte vraiment quelque chose. */
export type EcranVerifie = {
  nom: string;
  chemin: string;
  /** Un texte qui doit se trouver sur la page une fois rendue. */
  attendu: string;
};

export const ECRANS: readonly EcranVerifie[] = [
  { nom: "Mon bureau", chemin: "/bureau", attendu: "Mon bureau" },
  // Les tubes sont un composant serveur sans une ligne de script : s'ils ne
  // sont pas là, c'est que le rendu serveur a échoué.
  { nom: "Les tubes des maisons", chemin: "/bureau", attendu: "Kaldrafn" },
  { nom: "L’école", chemin: "/ecole", attendu: "aile" },
  { nom: "La Tour aux Corbeaux", chemin: "/corbeaux", attendu: "Corbeaux" },
  { nom: "Les Grimoires", chemin: "/grimoires", attendu: "Sortilèges" },
  { nom: "Le Registre", chemin: "/registre", attendu: "Registre" },
];

export type Parcours = {
  /** `null` quand le navigateur n'a pas pu être ouvert du tout. */
  disponible: boolean;
  ecrans: { nom: string; vu: boolean; souci: string | null }[];
  /** Les messages d'erreur de la console, groupés et dédoublonnés. */
  erreursConsole: { message: string; nombre: number }[];
  /** Les requêtes qui ont échoué, par adresse relative. */
  requetesEnEchec: { adresse: string; code: number }[];
  /** La page de grimoire a-t-elle tourné ? */
  pageTournee: boolean | null;
};

export type Options = {
  site: string;
  courriel: string;
  motDePasse: string;
  /** Le module Playwright, déjà chargé. Absent, le collecteur rend la main. */
  playwright: unknown | null;
};

export async function collecterLeParcours({
  site,
  courriel,
  motDePasse,
  playwright,
}: Options): Promise<Recolte<Parcours>> {
  if (!playwright) {
    // Pas une anomalie : c'est un outil absent, pas un défaut du site. Le
    // rapport le dira dans « ce que la ronde n'a pas pu voir ».
    throw new Error(
      "Playwright n’est pas installé : le parcours au navigateur n’a pas eu lieu.",
    );
  }

  const { chromium } = playwright as {
    chromium: {
      launch: (o: unknown) => Promise<PlaywrightNavigateur>;
    };
  };

  const navigateur = await chromium.launch({ args: ["--no-sandbox"] });
  const anomalies: Anomalie[] = [];
  const erreursConsole = new Map<string, number>();
  const requetesEnEchec: Parcours["requetesEnEchec"] = [];
  const ecrans: Parcours["ecrans"] = [];
  let pageTournee: boolean | null = null;

  try {
    const contexte = await navigateur.newContext({
      userAgent: "Ravenshallow-Veille/1 (surveillance interne)",
    });
    const page = await contexte.newPage();

    /**
     * ⚠️ **Le texte de la console est du contenu, jamais une consigne.** Une
     * page peut écrire ce qu'elle veut dans `console.log` ; on le compte et on
     * le tronque, on ne l'interprète pas.
     */
    page.on("console", (message: PlaywrightMessage) => {
      if (message.type() !== "error") return;
      const texte = message.text().slice(0, 200);
      erreursConsole.set(texte, (erreursConsole.get(texte) ?? 0) + 1);
    });

    page.on("response", (reponse: PlaywrightReponse) => {
      const code = reponse.status();
      if (code < 400) return;
      const adresse = reponse.url().replace(site, "") || "/";
      // Une même adresse en échec deux fois ne fait pas deux lignes.
      if (!requetesEnEchec.some((r) => r.adresse === adresse)) {
        requetesEnEchec.push({ adresse: adresse.slice(0, 200), code });
      }
    });

    // ── La connexion ──
    await seConnecter(page, site, courriel, motDePasse);

    // ── Les écrans ──
    for (const ecran of ECRANS) {
      try {
        await page.goto(`${site}${ecran.chemin}`, { waitUntil: "domcontentloaded" });
        const contenu = await page.textContent("body");
        const vu = (contenu ?? "").includes(ecran.attendu);
        ecrans.push({ nom: ecran.nom, vu, souci: null });

        if (!vu) {
          anomalies.push({
            cle: `parcours:ecran-vide:${ecran.chemin}:${ecran.attendu}`,
            gravite: "PANNE",
            quoi:
              `${ecran.nom} répond, mais n’affiche pas ce qu’elle devrait. ` +
              "La page est peut-être rendue à moitié.",
            ou: ecran.chemin,
          });
        }
      } catch (erreur) {
        const souci = erreur instanceof Error ? erreur.message : String(erreur);
        ecrans.push({ nom: ecran.nom, vu: false, souci });
        anomalies.push({
          cle: `parcours:ecran-inatteignable:${ecran.chemin}`,
          gravite: "PANNE",
          quoi: `${ecran.nom} n’a pas pu être ouverte dans un navigateur.`,
          ou: ecran.chemin,
          detail: souci.slice(0, 200),
        });
      }
    }

    // ── Tourner une page de grimoire ──
    //
    // C'est le seul geste du parcours, et il est sans effet : le lecteur ne
    // publie rien, il change de page. C'est aussi le seul écran du site dont
    // le fonctionnement dépende entièrement du script.
    pageTournee = await tournerUnePage(page, site);
    if (pageTournee === false) {
      anomalies.push({
        cle: "parcours:grimoire-ne-tourne-pas",
        gravite: "PANNE",
        quoi: "Le lecteur de grimoire ne tourne pas ses pages.",
        ou: "/grimoires",
      });
    }

    await contexte.close();
  } finally {
    await navigateur.close();
  }

  // ── Ce que la console a dit ──
  for (const [message, nombre] of erreursConsole) {
    anomalies.push({
      // Le message entre dans la clé — c'est lui l'identité du défaut —, mais
      // tronqué court pour qu'un identifiant variable ne la fasse pas changer
      // chaque matin.
      cle: `parcours:console:${message.slice(0, 60)}`,
      gravite: "A_SURVEILLER",
      quoi: "Le navigateur a signalé une erreur en affichant le site.",
      ou: "la console du navigateur",
      detail: `${nombre} fois — ${message}`,
    });
  }

  for (const requete of requetesEnEchec) {
    anomalies.push({
      cle: `parcours:requete-${requete.code}:${requete.adresse}`,
      gravite: requete.code >= 500 ? "PANNE" : "A_SURVEILLER",
      quoi: `Une requête de la page a échoué (${requete.code}).`,
      ou: requete.adresse,
    });
  }

  return {
    donnees: {
      disponible: true,
      ecrans,
      erreursConsole: [...erreursConsole].map(([message, nombre]) => ({
        message,
        nombre,
      })),
      requetesEnEchec,
      pageTournee,
    },
    anomalies,
  };
}

/**
 * Ouvre une session par le formulaire, comme un joueur le ferait.
 *
 * ⚠️ **On remplit, PUIS on vérifie que c’est resté** — et ce n’est pas de la
 * méfiance gratuite. Rencontré pour de bon en éprouvant ce collecteur : le
 * champ de l’adresse était rempli avant que React n’ait hydraté la page, et
 * l’hydratation le remettait à vide. Le mot de passe, saisi une fraction de
 * seconde plus tard, survivait — si bien que le formulaire partait avec un
 * mot de passe et pas d’adresse, et que la page répondait « Indique ton
 * adresse e-mail ».
 *
 * Une ronde qui tomberait là-dessus signalerait chaque matin que la connexion
 * du site est cassée. Elle ne l’est pas : c’est l’outil qui va trop vite.
 * **Un faux positif quotidien est pire qu’une surveillance absente**, parce
 * qu’au bout d’une semaine on ne lit plus le rapport.
 *
 * `domcontentloaded` ne suffit donc pas : on attend `load`, on remplit, on
 * relit, et l’on recommence si le champ s’est vidé.
 */
async function seConnecter(
  page: PlaywrightPage,
  site: string,
  courriel: string,
  motDePasse: string,
): Promise<void> {
  await page.goto(`${site}/connexion`, { waitUntil: "load" });

  for (let essai = 1; essai <= 3; essai += 1) {
    await page.fill('input[name="email"]', courriel);
    await page.fill('input[name="motDePasse"]', motDePasse);

    const adresseTenue = (await page.inputValue('input[name="email"]')) === courriel;
    const motTenu = (await page.inputValue('input[name="motDePasse"]')).length > 0;
    if (adresseTenue && motTenu) break;

    if (essai === 3) {
      throw new Error(
        "Le formulaire de connexion ne retient pas ce qu’on y saisit — " +
          "la page n’a probablement pas fini de s’animer.",
      );
    }
    await page.waitForTimeout(1000);
  }

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/bureau/, { timeout: 20_000 });
}

/**
 * Ouvre un grimoire et tourne une page.
 *
 * Rend `null` s'il n'y a aucun grimoire à ouvrir — ce n'est pas un défaut, et
 * ce le sera de moins en moins.
 */
async function tournerUnePage(
  page: PlaywrightPage,
  site: string,
): Promise<boolean | null> {
  await page.goto(`${site}/grimoires`, { waitUntil: "load" });

  const premier = page.locator('a[href^="/grimoires/"]').first();
  if ((await premier.count()) === 0) return null;

  /**
   * ⚠️ **On lit l’adresse et on y va, plutôt que de cliquer.**
   *
   * Le clic partait avant que Next n’ait hydraté la page : `<Link>` n’avait
   * pas encore pris la main, et rien ne bougeait — l’URL restait sur
   * l’étagère. C’est le même piège que le champ de connexion, et il donnait
   * le même faux positif silencieux.
   *
   * Ce n’est pas une perte : ce qu’on veut éprouver ici, c’est que le LECTEUR
   * tourne ses pages, pas qu’un lien soit cliquable — la disponibilité et les
   * écrans s’en chargent déjà.
   */
  const adresse = await premier.getAttribute("href");
  if (!adresse) return null;
  await page.goto(`${site}${adresse}`, { waitUntil: "load" });

  const suivante = page.getByRole("button", { name: /page suivante/i }).first();
  if ((await suivante.count()) === 0) return null;

  const avant = await page.textContent("body");
  await suivante.click();
  // La feuille tourne en 600 ms, mais le contenu a déjà changé : on laisse
  // largement de quoi, sans dépendre de l'animation.
  await page.waitForTimeout(1200);
  const apres = await page.textContent("body");

  return avant !== apres;
}

// ─────────────────────────────────────────────────────────────
//  Les formes minimales de Playwright dont on se sert
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **On décrit ce qu'on utilise plutôt que d'importer les types de
 * Playwright**, qui n'est pas une dépendance du projet : `npx tsc --noEmit`
 * échouerait sur le poste du joueur, où il n'est pas installé.
 */
type PlaywrightMessage = { type: () => string; text: () => string };
type PlaywrightReponse = { status: () => number; url: () => string };

type PlaywrightLocalisateur = {
  count: () => Promise<number>;
  click: () => Promise<void>;
  first: () => PlaywrightLocalisateur;
  getAttribute: (nom: string) => Promise<string | null>;
};

type PlaywrightPage = {
  on: (evenement: string, fn: (a: never) => void) => void;
  goto: (url: string, o?: unknown) => Promise<unknown>;
  fill: (selecteur: string, valeur: string) => Promise<void>;
  click: (selecteur: string) => Promise<void>;
  waitForURL: (motif: RegExp, o?: unknown) => Promise<void>;
  waitForLoadState: (etat: string) => Promise<void>;
  waitForTimeout: (ms: number) => Promise<void>;
  textContent: (selecteur: string) => Promise<string | null>;
  inputValue: (selecteur: string) => Promise<string>;
  locator: (selecteur: string) => PlaywrightLocalisateur;
  getByRole: (role: string, o: unknown) => PlaywrightLocalisateur;
};

type PlaywrightContexte = {
  newPage: () => Promise<PlaywrightPage>;
  close: () => Promise<void>;
};

type PlaywrightNavigateur = {
  newContext: (o?: unknown) => Promise<PlaywrightContexte>;
  close: () => Promise<void>;
};
