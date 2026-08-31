/**
 * Ce qui ne va pas — et depuis quand.
 *
 * ── Une anomalie porte une CLÉ, et c'est tout le sujet ──
 *
 * Sans elle, chaque ronde redécouvrirait les mêmes défauts au matin, et le
 * rapport dirait tous les jours la même chose sans jamais dire « ça dure ».
 * Or « le grimoire répond 500 » et « le grimoire répond 500 **depuis quatre
 * jours** » ne demandent pas la même réaction.
 *
 * ⚠️ **La clé ne doit contenir ni chiffre variable ni horodatage.** Un temps
 * de réponse dans la clé ferait de chaque lenteur une anomalie neuve, et rien
 * ne durerait jamais. Elle nomme le DÉFAUT, pas sa mesure du jour : le détail
 * chiffré vit à côté, dans `detail`, où il peut bouger librement.
 *
 * ── Trois gravités, et pas une de plus ──
 *
 * Quatre niveaux invitent à hésiter entre les deux du milieu, et l'on finit
 * par ne plus lire que le premier. Trois se distinguent d'un coup d'œil :
 *
 *   PANNE       le site est cassé pour un joueur, maintenant
 *   DEGAT       rien ne se voit, mais les données s'abîment
 *   A_SURVEILLER quelque chose sort de l'ordinaire, sans certitude
 *
 * ── Ce fichier est PUR ──
 *
 * Ni horloge, ni base, ni réseau : on lui donne des anomalies et une mémoire,
 * il rend ce qui dure. C'est ce qui permet d'éprouver « présente deux jours de
 * suite » sans attendre deux jours.
 */

export type Gravite = "PANNE" | "DEGAT" | "A_SURVEILLER";

/** De la plus urgente à la moins pressée. L'ordre du rapport. */
export const GRAVITES: readonly Gravite[] = ["PANNE", "DEGAT", "A_SURVEILLER"];

export type Anomalie = {
  /**
   * L'empreinte du défaut, stable d'un jour à l'autre.
   * Sans chiffre variable : voir l'avertissement en tête de fichier.
   */
  cle: string;
  gravite: Gravite;
  /** Ce qui a été observé, en une phrase. */
  quoi: string;
  /** Où : une adresse, une table, un écran. Jamais un nom de membre. */
  ou: string;
  /** La mesure du jour. Elle peut bouger sans que l'anomalie change. */
  detail?: string;
};

/** Une anomalie, une fois qu'on sait depuis quand elle est là. */
export type AnomalieDatee = Anomalie & {
  /** Le jour où on l'a vue pour la première fois, en ISO court. */
  depuis: string;
  /** Nombre de jours consécutifs où elle est apparue, celui-ci compris. */
  jours: number;
};

/** Ce qu'une ronde laisse à la suivante. */
export type Memoire = {
  /**
   * Par clé d'anomalie : le premier jour vu, le dernier, et le compte.
   *
   * ⚠️ **`dernier` n'est pas redondant avec `depuis`.** Sans lui, deux rondes
   * du même jour — le déclenchement manuel après la ronde de 5 h — feraient
   * passer une anomalie de « depuis 1 jour » à « depuis 2 jours » alors
   * qu'elle n'a duré qu'une matinée. C'est le genre de chiffre faux qu'on ne
   * remarque jamais et sur lequel on finit par décider.
   */
  anomalies: Record<string, { depuis: string; dernier: string; jours: number }>;
  /** Les chiffres de vie de la veille et des jours d'avant. */
  vie: { jour: string; chiffres: Record<string, number> }[];
};

export function memoireVide(): Memoire {
  return { anomalies: {}, vie: [] };
}

/** Le jour d'un instant, en `AAAA-MM-JJ`, lu à Bruxelles. */
export function jourDe(instant: Date): string {
  const parties = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const morceau = (type: string) =>
    parties.find((p) => p.type === type)?.value ?? "";
  return `${morceau("year")}-${morceau("month")}-${morceau("day")}`;
}

/**
 * Les anomalies du jour, datées d'après la mémoire — **et la mémoire mise à
 * jour**.
 *
 * ⚠️ **Ce qui n'est plus vu disparaît de la mémoire**, sans quoi une anomalie
 * réparée en février reviendrait « présente depuis 200 jours » le jour où elle
 * réapparaîtrait en septembre. Le compteur dit « de suite », il doit donc se
 * remettre à zéro dès qu'une ronde ne la voit pas.
 *
 * ⚠️ **Deux rondes le même jour ne comptent pas double.** Un déclenchement
 * manuel à midi ne doit pas faire passer une anomalie de « 1 jour » à
 * « 2 jours » alors qu'elle n'a duré qu'une matinée.
 */
export function daterLesAnomalies(
  anomalies: readonly Anomalie[],
  memoire: Memoire,
  instant: Date,
): { datees: AnomalieDatee[]; memoire: Memoire } {
  const aujourdhui = jourDe(instant);
  const suivante: Memoire["anomalies"] = {};

  const datees = anomalies.map((anomalie) => {
    const connue = memoire.anomalies[anomalie.cle];

    // Jamais vue : elle commence aujourd'hui.
    // Déjà vue aujourd'hui : le compteur ne bouge pas.
    // Vue un autre jour : un jour de plus.
    const depuis = connue?.depuis ?? aujourdhui;
    const jours =
      connue === undefined
        ? 1
        : connue.dernier === aujourdhui
          ? connue.jours
          : connue.jours + 1;

    suivante[anomalie.cle] = { depuis, dernier: aujourdhui, jours };
    return { ...anomalie, depuis, jours };
  });

  return {
    datees: trier(datees),
    // Ce qui n'a pas été revu ce matin sort de la mémoire.
    memoire: { ...memoire, anomalies: suivante },
  };
}

/** Les plus graves d'abord, puis les plus anciennes, puis par clé. */
export function trier(anomalies: readonly AnomalieDatee[]): AnomalieDatee[] {
  return [...anomalies].sort(
    (a, b) =>
      GRAVITES.indexOf(a.gravite) - GRAVITES.indexOf(b.gravite) ||
      b.jours - a.jours ||
      a.cle.localeCompare(b.cle, "fr"),
  );
}

/** Une anomalie vue plus d'un jour de suite : celle dont il faut s'occuper. */
export function estPersistante(anomalie: AnomalieDatee): boolean {
  return anomalie.jours > 1;
}

/** Combien de chaque gravité, toujours les trois clés, même à zéro. */
export function parGravite(
  anomalies: readonly AnomalieDatee[],
): Record<Gravite, number> {
  const compte = Object.fromEntries(GRAVITES.map((g) => [g, 0])) as Record<
    Gravite,
    number
  >;
  for (const anomalie of anomalies) compte[anomalie.gravite] += 1;
  return compte;
}
