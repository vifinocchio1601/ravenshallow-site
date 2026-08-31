/**
 * L'heure de la ronde — et pourquoi il en faut deux.
 *
 * ── Le défaut que ce fichier corrige ──
 *
 * Le planificateur de GitHub ne connaît que l'heure universelle, et **ignore
 * l'heure d'été**. Une ronde programmée « à 3 h UTC » part à 4 h à Bruxelles
 * l'hiver et à 5 h l'été : posée une fois pour toutes, elle se décale d'une
 * heure deux fois par an, et personne ne s'en aperçoit avant de trouver son
 * rapport à une heure qui n'est pas la bonne.
 *
 * ── Le remède : deux départs, un seul travail ──
 *
 * On déclenche à 3 h ET à 4 h UTC, et l'on sort immédiatement si l'heure
 * locale de Bruxelles n'est pas 5 h. Une seule des deux exécutions travaille,
 * selon la saison :
 *
 *   hiver (UTC+1)   3 h UTC → 4 h à Bruxelles → elle sort
 *                   4 h UTC → 5 h à Bruxelles → ELLE TRAVAILLE
 *   été   (UTC+2)   3 h UTC → 5 h à Bruxelles → ELLE TRAVAILLE
 *                   4 h UTC → 6 h à Bruxelles → elle sort
 *
 * L'exécution qui sort ne coûte que quelques secondes, et le dépôt étant
 * public, ses minutes ne sont pas comptées.
 *
 * ── Ce que ce fichier n'est pas ──
 *
 * ⚠️ **Ce n'est pas un réveil de précision.** Le planificateur de GitHub part
 * en retard quand la plateforme est chargée — quelques minutes, parfois
 * davantage. Une ronde qui s'exécuterait à 5 h 08 est une ronde normale ; ce
 * n'est pas un défaut à corriger, et surtout pas en resserrant la garde, qui
 * ferait alors sauter la ronde du jour.
 *
 * C'est aussi pourquoi la garde compare une HEURE et non un instant : à
 * 5 h 08 comme à 5 h 59, l'heure locale est cinq.
 *
 * Pur : ni horloge lue en cachette, ni base, ni environnement. On lui donne
 * un instant, il répond.
 */

/** L'heure locale à laquelle la ronde travaille. */
export const HEURE_DE_LA_RONDE = 5;

/** Le fuseau du joueur. Ce n'est pas celui du serveur, qui vit en UTC. */
export const FUSEAU = "Europe/Brussels";

/**
 * L'heure qu'il est à Bruxelles, en nombre entier de 0 à 23.
 *
 * ⚠️ **On passe par `formatToParts`, jamais par `format`.** Selon la langue
 * demandée, `format` rend « 04 », « 04 h » ou « 4 AM », et `Number` de l'un
 * des deux derniers donne `NaN` — c'est-à-dire une ronde qui ne part jamais,
 * sans que rien ne le dise. Les parties, elles, sont nommées.
 */
export function heureABruxelles(instant: Date): number {
  const parties = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSEAU,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const heure = parties.find((p) => p.type === "hour")?.value;
  if (heure === undefined) {
    throw new Error(`Heure illisible pour le fuseau ${FUSEAU}.`);
  }
  // « 24 » existe dans certaines mises en forme de minuit : on le ramène à 0.
  return Number(heure) % 24;
}

export type Verdict =
  | { travaille: true; heureLocale: number }
  | { travaille: false; heureLocale: number; raison: string };

/**
 * Cette exécution-ci doit-elle travailler ?
 *
 * `manuelle` passe outre — sinon le déclenchement à la demande ne servirait à
 * rien : lancé à 14 h, il sortirait aussitôt.
 */
export function verdictDeLaRonde(instant: Date, manuelle = false): Verdict {
  const heureLocale = heureABruxelles(instant);

  if (manuelle) return { travaille: true, heureLocale };

  if (heureLocale !== HEURE_DE_LA_RONDE) {
    return {
      travaille: false,
      heureLocale,
      raison:
        `Il est ${String(heureLocale).padStart(2, "0")} h à Bruxelles, ` +
        `et la ronde part à ${HEURE_DE_LA_RONDE} h. ` +
        "C’est l’autre exécution qui travaille aujourd’hui.",
    };
  }

  return { travaille: true, heureLocale };
}
