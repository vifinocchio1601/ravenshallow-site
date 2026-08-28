import { jourSaisi } from "@/lib/dates";
import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import { TEXTES_CALENDRIER } from "./constantes";
import {
  DESCRIPTION_EVENEMENT_MAX,
  TITRE_EVENEMENT_MAX,
} from "./limites";
import { estUneNature, type NatureEvenement } from "./natures";

/**
 * Ce qu'un événement a le droit d'être — **partagé mot pour mot entre le
 * champ de saisie et l'action serveur**.
 *
 * ⚠️ **Pas de `server-only`, à la différence des annonces**, et c'est le même
 * raisonnement que pour un mot du tableau d'affichage : la description est du
 * **texte brut**. React l'échappe d'office, il n'y a donc aucune liste
 * blanche à tenir de ce côté — donc rien à cacher au navigateur, et le
 * formulaire peut refuser sur place ce que la route refuserait.
 *
 * La base porte les mêmes limites **en plus grossier** : au moins un signe
 * qui ne soit pas un blanc, et pas plus de tant. Elle n'arrête que ce qui
 * casserait l'affichage, et le fait sur tous les chemins — le site, un
 * script, une commande tapée à la main. Le travail fin est ici.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_CALENDRIER.erreurs;

/** Le titre, ramené à une ligne : une liste de dates ne s'aligne pas sinon. */
export function validerTitreEvenement(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.titreVide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: E.titreVide };
  if (net.length > TITRE_EVENEMENT_MAX) {
    return {
      ok: false,
      message: E.titreTropLong.replace("{max}", String(TITRE_EVENEMENT_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * La description — **obligatoire, et courte**.
 *
 * Obligatoire parce qu'une date sans un mot n'apprend rien : « 12 décembre »
 * seul laisse chacun deviner ce qui se passe ce jour-là. Courte parce qu'un
 * calendrier porte des repères ; le détail s'écrit dans une annonce, qui a la
 * mise en forme et que celle-ci ne remplace pas.
 */
export function validerDescriptionEvenement(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") {
    return { ok: false, message: E.descriptionVide };
  }
  const net = nettoyerTexteLibre(brut);
  if (net.length === 0) return { ok: false, message: E.descriptionVide };
  if (net.length > DESCRIPTION_EVENEMENT_MAX) {
    return {
      ok: false,
      message: E.descriptionTropLongue.replace(
        "{max}",
        String(DESCRIPTION_EVENEMENT_MAX),
      ),
    };
  }
  return { ok: true, valeur: net };
}

/** La nature. Le navigateur envoie ce qu'il veut ; on ne lui fait pas crédit. */
export function validerNature(brut: unknown): Resultat<NatureEvenement> {
  if (!estUneNature(brut)) return { ok: false, message: E.natureIllisible };
  return { ok: true, valeur: brut };
}

/**
 * **Les deux dates, ensemble** — parce que la seconde ne se juge que contre
 * la première.
 *
 * Le début est obligatoire : un événement sans date n'en est pas un, et rien
 * ne saurait où le ranger. La fin est facultative — un trimestre dure des
 * mois, une veillée un soir —, et le même jour est permis : une session
 * d'épreuves qui commence et finit le 12 est parfaitement lisible.
 *
 * ⚠️ **On compare des JOURS, et les deux sont posés à midi** par `jourSaisi`.
 * Comparer les instants revient donc à comparer les jours, sans qu'un fuseau
 * puisse s'intercaler. C'est la base qui aurait le dernier mot de toute
 * façon ; mieux vaut une phrase qu'une erreur 500 sur une contrainte dont
 * personne ne saura quoi faire.
 */
export function validerLesDates(
  debutBrut: unknown,
  finBrut: unknown,
): Resultat<{ debuteLe: Date; finitLe: Date | null }> {
  if (
    debutBrut === null ||
    debutBrut === undefined ||
    (typeof debutBrut === "string" && debutBrut.trim().length === 0)
  ) {
    return { ok: false, message: E.dateRequise };
  }

  const debuteLe = jourSaisi(debutBrut);
  if (!debuteLe) return { ok: false, message: E.dateIllisible };

  // Une fin absente, vide ou faite d'espaces vaut « pas de fin », jamais une
  // erreur : c'est le cas le plus courant.
  const finVide =
    finBrut === null ||
    finBrut === undefined ||
    (typeof finBrut === "string" && finBrut.trim().length === 0);
  if (finVide) return { ok: true, valeur: { debuteLe, finitLe: null } };

  const finitLe = jourSaisi(finBrut);
  if (!finitLe) return { ok: false, message: E.dateIllisible };
  if (finitLe.getTime() < debuteLe.getTime()) {
    return { ok: false, message: E.finAvantDebut };
  }

  return { ok: true, valeur: { debuteLe, finitLe } };
}
