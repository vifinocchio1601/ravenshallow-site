import "server-only";
import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import { porteQuelqueChose } from "@/lib/forum/longueur";
import { nettoyerHtml } from "@/lib/forum/nettoyer-html";
import { TEXTES_ANNONCES } from "./constantes";
import { CORPS_ANNONCE_MAX, TITRE_ANNONCE_MAX } from "./limites";

/**
 * Ce qu'une annonce a le droit d'être — **seule porte par laquelle elle entre
 * en base**.
 *
 * `validerCorps` nettoie le balisage lui-même, si bien qu'aucune action
 * serveur ne peut l'oublier. C'est le parti pris d'`envoyerCorbeau`, puis de
 * `validerPost`, appliqué au Grand Hall. D'où le `server-only` : le nettoyeur
 * n'a rien à faire dans un paquet expédié au navigateur.
 *
 * **La liste blanche est celle du forum, et il ne doit y en avoir qu'une.**
 * `nettoyerHtml` porte le nom du forum parce qu'il y est né, mais c'est le
 * filtre du site entier : en écrire un second pour les annonces, ce serait
 * garantir qu'un jour l'un des deux laisse passer ce que l'autre refuse.
 *
 * La base porte les mêmes limites **en plus grossier** — au moins un signe
 * qui ne soit pas un blanc, et pas plus de tant. Elle n'arrête que ce qui
 * casserait l'affichage, et le fait sur tous les chemins. Le travail fin est
 * ici.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_ANNONCES.erreurs;

/** Le titre, ramené à une seule ligne : une liste ne s'aligne pas sinon. */
export function validerTitreAnnonce(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.titreVide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: E.titreVide };
  if (net.length > TITRE_ANNONCE_MAX) {
    return {
      ok: false,
      message: E.titreTropLong.replace("{max}", String(TITRE_ANNONCE_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * Le corps.
 *
 * **Aucun minimum**, à la différence d'un post du domaine : les dix lignes de
 * l'article 12.2 pèsent sur le jeu de rôle, et « Les inscriptions rouvrent
 * lundi » est une annonce complète.
 *
 * Le vide se juge sur le CONTENU et non sur la chaîne : « <p></p> » pèse sept
 * signes et ne dit rien.
 */
export function validerCorpsAnnonce(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.corpsVide };

  // Deux ménages, et l'ordre compte : le premier retire les caractères de
  // contrôle, que le nettoyeur de balisage laisserait passer ; le second
  // réduit le balisage à la liste blanche — et c'est lui qui protège.
  const net = nettoyerHtml(nettoyerTexteLibre(brut));

  if (!porteQuelqueChose(net)) return { ok: false, message: E.corpsVide };
  if (net.length > CORPS_ANNONCE_MAX) {
    return {
      ok: false,
      message: E.corpsTropLong.replace("{max}", String(CORPS_ANNONCE_MAX)),
    };
  }
  return { ok: true, valeur: net };
}

/**
 * L'entrée en vigueur — **facultative**, et c'est tout son sens.
 *
 * Vide, absente, faite d'espaces : `null`, jamais une erreur. Une annonce
 * ordinaire n'entre pas en vigueur, elle est affichée.
 *
 * Le champ du formulaire est un `<input type="date">` : il rend « 2026-09-04 »,
 * une journée et non un instant. On la fixe à **midi**, et non à minuit : une
 * date posée à minuit UTC devient la veille au soir pour la moitié de la
 * planète, et l'annonce afficherait un jour de moins que celui qu'on a saisi.
 *
 * ⚠️ **On compare des JOURS, et l'on stocke un instant.** La base exige que
 * l'entrée en vigueur ne précède pas l'affichage — mais une annonce publiée à
 * 14 h et applicable « aujourd'hui » porterait midi, donc deux heures avant sa
 * propre publication, et la contrainte la refuserait. Refuser aujourd'hui
 * serait absurde : « en vigueur immédiatement » est une annonce légitime.
 *
 * D'où : on refuse le jour choisi seulement s'il est **entièrement** derrière
 * l'affichage, et l'instant retenu est le plus tardif des deux. Le même jour
 * vaut donc l'instant de publication — ce que l'écran lit bien comme « en
 * vigueur le 28 août ».
 */
export function validerEntreeEnVigueur(
  brut: unknown,
  publieeLe: Date,
): Resultat<Date | null> {
  if (brut === null || brut === undefined) return { ok: true, valeur: null };
  if (typeof brut !== "string") return { ok: true, valeur: null };

  const net = brut.trim();
  if (net.length === 0) return { ok: true, valeur: null };

  const jour = /^(\d{4})-(\d{2})-(\d{2})$/.exec(net);
  if (!jour) return { ok: false, message: E.dateIllisible };

  const date = new Date(
    Number(jour[1]),
    Number(jour[2]) - 1,
    Number(jour[3]),
    12,
    0,
    0,
    0,
  );
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: E.dateIllisible };
  }
  // Le 31 février se lit sans broncher et devient le 3 mars : le rejeter
  // plutôt que d'afficher une date que personne n'a saisie.
  if (
    date.getFullYear() !== Number(jour[1]) ||
    date.getMonth() !== Number(jour[2]) - 1 ||
    date.getDate() !== Number(jour[3])
  ) {
    return { ok: false, message: E.dateIllisible };
  }

  // La base le refuserait de toute façon ; mieux vaut une phrase qu'une
  // erreur 500 sur une contrainte dont personne ne saura quoi faire.
  const finDuJour = new Date(date);
  finDuJour.setHours(23, 59, 59, 999);
  if (finDuJour.getTime() < publieeLe.getTime()) {
    return { ok: false, message: E.vigueurAvantAffichage };
  }

  return {
    ok: true,
    valeur: date.getTime() < publieeLe.getTime() ? publieeLe : date,
  };
}
