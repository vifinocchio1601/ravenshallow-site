import { TEXTES_CORBEAUX } from "./constantes";

/**
 * Les dates de la Tour, telles qu’elles s’affichent.
 *
 * ⚠️ **Toutes ces fonctions dépendent du fuseau de qui les exécute.** Le
 * serveur de Vercel vit en UTC, le joueur non : le même corbeau peut donc
 * s’écrire « 23:40 hier » sur le serveur et « 01:40 aujourd’hui » chez lui.
 *
 * C’est pourquoi tout ce qui les affiche porte `suppressHydrationWarning` et
 * une balise `<time dateTime>` : l’instant exact voyage en ISO, seule sa
 * mise en forme diffère, et c’est celle du navigateur qui doit gagner — c’est
 * la seule qui soit juste pour la personne qui lit.
 */

/** « 14:32 » — l’heure d’un corbeau dans le fil. */
export function heureDe(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** La journée d’un instant, pour regrouper les corbeaux sous un séparateur. */
export function jourDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * « Aujourd’hui », « Hier », ou « 12 août » — et l’année dès qu’on en change,
 * sans quoi un corbeau de l’an dernier se lirait comme un corbeau de la
 * semaine passée.
 */
export function journeeDe(iso: string): string {
  const quand = new Date(iso);
  const maintenant = new Date();

  if (jourDe(iso) === jourDe(maintenant.toISOString())) {
    return TEXTES_CORBEAUX.fil.aujourdhui;
  }

  const hier = new Date(maintenant);
  hier.setDate(hier.getDate() - 1);
  if (jourDe(iso) === jourDe(hier.toISOString())) {
    return TEXTES_CORBEAUX.fil.hier;
  }

  return quand.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    ...(quand.getFullYear() !== maintenant.getFullYear()
      ? { year: "numeric" }
      : {}),
  });
}

/**
 * Ce qu’on écrit à droite d’une conversation dans la liste : l’heure si
 * c’était aujourd’hui, la date sinon. Un « 14:32 » sans date, sur un fil
 * vieux de trois semaines, se lit comme une nouveauté.
 */
export function quandDansLaListe(iso: string): string {
  return jourDe(iso) === jourDe(new Date().toISOString())
    ? heureDe(iso)
    : journeeDe(iso);
}

/**
 * La même date, mais **prête à entrer dans une phrase** : « aujourd’hui »,
 * « hier », ou « le 12 août ».
 *
 * `journeeDe` sert de titre au-dessus d’un groupe de corbeaux, et se suffit à
 * lui-même. Collé dans un texte, il donnait « Blocage posé le Aujourd’hui » —
 * la préposition et la majuscule ne conviennent qu’à l’une des trois formes.
 * Celle-ci porte sa préposition quand il en faut une, et pas sinon.
 */
export function quandDansUnePhrase(iso: string): string {
  const journee = journeeDe(iso);
  const relatif =
    journee === TEXTES_CORBEAUX.fil.aujourdhui ||
    journee === TEXTES_CORBEAUX.fil.hier;
  return relatif ? journee.toLocaleLowerCase("fr-FR") : `le ${journee}`;
}
