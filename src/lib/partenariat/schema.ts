import { z } from "zod";
import { jourSaisi } from "@/lib/dates";
import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import { TEXTES_PARTENARIAT } from "./constantes";
import {
  BANNIERE_URL_MAX,
  COURRIEL_MAX,
  DESCRIPTION_PARTENAIRE_MAX,
  MESSAGE_DEMANDE_MAX,
  MESSAGE_DEMANDE_MIN,
  NOM_FORUM_MAX,
  URL_MAX,
} from "./limites";

/**
 * Ce qu'un partenaire et une demande ont le droit d'être — **partagé mot pour
 * mot entre le champ de saisie et l'action serveur**.
 *
 * ⚠️ **Pas de `server-only`**, comme le calendrier et le tableau d'affichage :
 * tout est du texte brut, rendu par React donc échappé d'office. Il n'y a
 * aucune liste blanche à tenir de ce côté, donc rien à cacher au navigateur —
 * et le formulaire peut refuser sur place ce que la route refuserait.
 *
 * La base porte les mêmes règles **en plus grossier** : au moins un signe qui
 * ne soit pas un blanc, une adresse qui commence par `https://`, un courriel
 * qui ressemble à un courriel. Elle n'arrête que ce qui rendrait la ligne
 * inexploitable, et le fait sur tous les chemins. Le travail fin est ici.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_PARTENARIAT.erreurs;

/** Le nom d'un forum, ramené à une ligne : un bloc de liens ne s'aligne pas sinon. */
export function validerNomForum(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.nomVide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: E.nomVide };
  if (net.length > NOM_FORUM_MAX) {
    return {
      ok: false,
      message: E.nomTropLong.replace("{max}", String(NOM_FORUM_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * Une adresse de forum, ou d'image.
 *
 * **`https` seulement**, et c'est la même règle que les images d'un post : le
 * site n'envoie pas ses visiteurs sur du trafic en clair, et une image en
 * `http` déclencherait l'avertissement du navigateur sur notre propre page.
 *
 * ⚠️ **On valide sans jamais réécrire.** `new URL()` sert à savoir si
 * l'adresse tient debout ; c'est la chaîne d'origine qui est conservée. Une
 * adresse ré-encodée par le passage dans `URL` change parfois de sens —
 * c'est le piège déjà payé sur la chaîne de connexion de la base.
 */
function validerAdresse(
  brut: unknown,
  max: number,
  erreurVide: string,
  erreurTropLongue: string,
): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: erreurVide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: erreurVide };
  if (net.length > max) {
    return { ok: false, message: erreurTropLongue.replace("{max}", String(max)) };
  }

  let adresse: URL;
  try {
    adresse = new URL(net);
  } catch {
    return { ok: false, message: E.urlIllisible };
  }

  // Un hôte sans point n'est joignable que sur un réseau local : « http://intranet »
  // n'a rien à faire dans un bloc de liens public.
  if (adresse.protocol !== "https:" || !adresse.hostname.includes(".")) {
    return { ok: false, message: E.urlIllisible };
  }

  return { ok: true, valeur: net };
}

/** L'adresse d'un forum — obligatoire. */
export function validerUrlForum(brut: unknown): Resultat<string> {
  return validerAdresse(brut, URL_MAX, E.urlVide, E.urlTropLongue);
}

/**
 * L'adresse de LEUR bannière — **facultative**.
 *
 * Vide, absente ou faite d'espaces vaut « pas de bannière », jamais une
 * erreur : c'est le cas de tout partenaire qui n'en a pas fait, et attendre
 * une image bloquerait l'échange.
 */
export function validerUrlBanniere(brut: unknown): Resultat<string | null> {
  if (brut === null || brut === undefined) return { ok: true, valeur: null };
  if (typeof brut === "string" && brut.trim().length === 0) {
    return { ok: true, valeur: null };
  }

  const adresse = validerAdresse(
    brut,
    BANNIERE_URL_MAX,
    E.banniereIllisible,
    E.urlTropLongue,
  );
  if (!adresse.ok) return { ok: false, message: E.banniereIllisible };
  return { ok: true, valeur: adresse.valeur };
}

/** Une ligne pour dire ce qu'on y joue — facultative elle aussi. */
export function validerDescriptionPartenaire(
  brut: unknown,
): Resultat<string | null> {
  if (brut === null || brut === undefined) return { ok: true, valeur: null };
  if (typeof brut !== "string") return { ok: true, valeur: null };

  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: true, valeur: null };
  if (net.length > DESCRIPTION_PARTENAIRE_MAX) {
    return {
      ok: false,
      message: E.descriptionTropLongue.replace(
        "{max}",
        String(DESCRIPTION_PARTENAIRE_MAX),
      ),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * L'adresse de courriel de qui demande.
 *
 * **La validation fine passe par Zod**, comme celle du dossier d'admission :
 * une seconde expression régulière écrite à la main accepterait ou refuserait
 * autre chose que la première, et c'est le genre d'écart qu'on ne découvre que
 * le jour où quelqu'un se plaint.
 */
export function validerCourriel(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.courrielVide };
  const net = brut.trim().toLowerCase();
  if (net.length === 0) return { ok: false, message: E.courrielVide };
  if (net.length > COURRIEL_MAX) {
    return { ok: false, message: E.courrielIllisible };
  }
  if (!z.string().email().safeParse(net).success) {
    return { ok: false, message: E.courrielIllisible };
  }
  return { ok: true, valeur: net };
}

/** Le mot qui accompagne la demande. */
export function validerMessageDemande(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.messageVide };
  const net = nettoyerTexteLibre(brut);
  if (net.length === 0) return { ok: false, message: E.messageVide };
  if (net.length < MESSAGE_DEMANDE_MIN) {
    return {
      ok: false,
      message: E.messageTropCourt.replace("{min}", String(MESSAGE_DEMANDE_MIN)),
    };
  }
  if (net.length > MESSAGE_DEMANDE_MAX) {
    return {
      ok: false,
      message: E.messageTropLong.replace("{max}", String(MESSAGE_DEMANDE_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * Le jour où le partenariat a été noué.
 *
 * ⚠️ **Posé à midi**, jamais à minuit — `jourSaisi` s'en charge : à minuit
 * UTC, la moitié de la planète lirait la veille. Même précaution que l'entrée
 * en vigueur d'une annonce et que les dates du calendrier.
 */
export function validerJourNoue(brut: unknown): Resultat<Date> {
  if (
    brut === null ||
    brut === undefined ||
    (typeof brut === "string" && brut.trim().length === 0)
  ) {
    return { ok: false, message: E.dateRequise };
  }

  const jour = jourSaisi(brut);
  if (!jour) return { ok: false, message: E.dateIllisible };
  return { ok: true, valeur: jour };
}
