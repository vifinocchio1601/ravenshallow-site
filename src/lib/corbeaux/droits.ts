/**
 * **Qui peut écrire à qui, et ce qu’un corbeau devient.**
 *
 * C’est le seul endroit du site qui répond à ces questions. Le champ de
 * saisie s’y réfère pour se griser, la route d’API pour accepter ou refuser —
 * et elle refait le contrôle **en entier**, sans se reposer sur l’écran : une
 * route d’API est publique, et rien n’oblige un joueur à passer par la page
 * avant de l’appeler.
 *
 * Pas de `server-only` ici, et c’est voulu : le fichier ne contient aucune
 * donnée, seulement des règles, et les deux côtés doivent les lire au mot
 * près. C’est le même choix que `lib/dossier/role-affiche.ts`.
 *
 * ── Le point délicat, à lire avant de toucher quoi que ce soit ──
 *
 * Un blocage ne se voit pas de la même façon des deux côtés, et **c’est toute
 * la difficulté de ce fichier** :
 *
 *   côté bloqueur — la conversation est close. Il a bloqué, il le sait, on
 *                   le lui dit.
 *   côté bloqué   — **rien ne change.** Il écrit, son corbeau part, il le
 *                   relit dans son fil. Il ne reçoit ni erreur, ni silence
 *                   suspect, ni délai inhabituel.
 *
 * Ce n’est pas une commodité, c’est la mesure de protection elle-même : un
 * refus explicite déclenche l’escalade — un second compte, un message ailleurs,
 * une rancune — et l’escalade est le vrai risque. D’où `PART_DANS_LE_VIDE`,
 * qui doit être **indiscernable de `PART`** pour celui qui envoie : même
 * réponse, même apparence, même tout.
 */

import type { StatutAcces, StatutDossier } from "@/lib/dossier/etats";
import { estBanni, peutEntrerDansLEcole } from "@/lib/session/acces";

/** Le strict nécessaire pour décider — ni la fiche, ni la maison, ni les étapes. */
export type PourLesCorbeaux = {
  id: string;
  statut: StatutDossier;
  statutAcces: StatutAcces;
};

/**
 * Ce que ce compte voit de la Tour.
 *
 * Trois réponses et non deux, pour la même raison que les trois états d’une
 * étape : « pas d’accès » et « accès à l’administration seule » ne sont pas la
 * même chose, et les confondre fermerait au membre suspendu le recours que
 * l’article 8.5 lui garantit — contester sa sanction dans les quinze jours.
 *
 *   TOUT                 — dossier accepté, accès en règle
 *   ADMINISTRATION_SEULE — suspendu : il écrit au staff, et à personne d’autre.
 *                          Ses conversations entre joueurs l’attendent, sans
 *                          s’afficher.
 *   RIEN                 — dossier en attente, à corriger ou refusé
 */
export type PorteeDeLaTour = "TOUT" | "ADMINISTRATION_SEULE" | "RIEN";

export function porteeDeLaTour(compte: PourLesCorbeaux): PorteeDeLaTour {
  if (peutEntrerDansLEcole(compte)) return "TOUT";
  if (estBanni(compte)) return "ADMINISTRATION_SEULE";
  return "RIEN";
}

/**
 * La Tour s’ouvre-t-elle, d’une façon ou d’une autre ?
 *
 * C’est cette question-là que pose le bandeau, et non « a-t-il tous les
 * droits ? » : un membre suspendu voit l’entrée « Les Corbeaux », et la page
 * lui explique ce qu’il y trouve.
 *
 * Elle ne regarde **ni la maison ni la baguette**, à dessein : un nouvel
 * arrivant qui n’a franchi aucun de ses deux premiers pas peut écrire dès le
 * premier jour. C’est même le moment où il en a le plus besoin — pour
 * demander de l’aide.
 */
export function peutOuvrirLaTour(compte: PourLesCorbeaux): boolean {
  return porteeDeLaTour(compte) !== "RIEN";
}

/**
 * Ce membre peut-il recevoir un corbeau, et donc figurer dans la recherche ?
 *
 * **Le dossier accepté, et lui seul.** Un compte en attente, à corriger ou
 * refusé n’existe pas encore pour les autres joueurs.
 *
 * Un membre suspendu, lui, reste joignable : sa suspension est le plus
 * souvent temporaire, et le corbeau l’attendra à son retour. Le lui cacher
 * reviendrait à annoncer sa sanction à tout le forum.
 */
export function peutRecevoirUnCorbeau(membre: {
  statut: StatutDossier;
}): boolean {
  return membre.statut === "ACCEPTE";
}

/**
 * Les blocages entre deux personnes, dans les deux sens.
 *
 * Les deux sont portés séparément parce qu’ils ne produisent **pas du tout**
 * le même effet, et que les additionner en un seul booléen « bloqué » serait
 * l’erreur qui trahit le blocage.
 */
export type Blocages = {
  /** J’ai bloqué l’autre. La conversation est close, et je le sais. */
  jeLaiBloque: boolean;
  /** L’autre m’a bloqué. **Je ne dois jamais l’apprendre.** */
  ilMaBloque: boolean;
};

export const AUCUN_BLOCAGE: Blocages = { jeLaiBloque: false, ilMaBloque: false };

/**
 * Le fil est-il clos pour moi ?
 *
 * **Ne lit que `jeLaiBloque`, jamais `ilMaBloque`.** Ajouter le second par
 * souci de symétrie afficherait « conversation close » à quelqu’un qui vient
 * d’être bloqué : ce serait lui annoncer le blocage, exactement ce que tout
 * ce fichier s’emploie à éviter.
 */
export function conversationClosePourMoi(blocages: Blocages): boolean {
  return blocages.jeLaiBloque;
}

/**
 * Ce qu’il advient d’un corbeau.
 *
 * `PART` et `PART_DANS_LE_VIDE` doivent être **indiscernables** pour celui
 * qui écrit : la route rend la même réponse, avec le même code et le même
 * corps. Seul le dépôt fait la différence, en posant un masquage pour le
 * destinataire dans la même écriture.
 */
export type SortDuCorbeau = "PART" | "PART_DANS_LE_VIDE" | "REFUSE";

export type RaisonRefus =
  /** Le dossier de l’expéditeur n’est pas accepté. */
  | "TOUR_FERMEE"
  /** Suspendu : il ne lui reste que l’administration. */
  | "SUSPENDU"
  /** Destinataire au dossier non accepté, ou soi-même. */
  | "DESTINATAIRE_INCONNU"
  /** L’expéditeur a bloqué le destinataire : c’est lui qui a fermé la porte. */
  | "CONVERSATION_CLOSE";

/**
 * `ATTENDRE` n’est **pas** un refus, et c’est pourquoi il ne se range pas dans
 * `RaisonRefus`.
 *
 * Un corbeau refusé ne partira jamais ; celui-ci partira dans un quart
 * d’heure. Les confondre produirait le message qu’on veut éviter — « vous
 * n’avez pas le droit » là où il faut lire « pas si vite ». Le site le dit
 * avec le délai, et la route répond 429, jamais 403.
 */
export type Verdict =
  | { sort: "PART" }
  | { sort: "PART_DANS_LE_VIDE" }
  | { sort: "REFUSE"; raison: RaisonRefus }
  | { sort: "ATTENDRE"; minutes: number };

/**
 * Le sort d’un corbeau adressé à un autre membre.
 *
 * L’ordre des questions n’est pas indifférent : **le blocage subi se teste en
 * dernier**, une fois que tout le reste est en règle. Le tester plus tôt
 * ferait apparaître une différence de comportement là où il ne doit y en
 * avoir aucune.
 */
export function sortDuCorbeau(
  expediteur: PourLesCorbeaux,
  destinataire: PourLesCorbeaux,
  blocages: Blocages,
): Verdict {
  const portee = porteeDeLaTour(expediteur);
  if (portee === "RIEN") return { sort: "REFUSE", raison: "TOUR_FERMEE" };
  if (portee === "ADMINISTRATION_SEULE") {
    return { sort: "REFUSE", raison: "SUSPENDU" };
  }

  // On ne s’écrit pas à soi-même : ce serait un carnet, pas une conversation.
  if (expediteur.id === destinataire.id) {
    return { sort: "REFUSE", raison: "DESTINATAIRE_INCONNU" };
  }

  if (!peutRecevoirUnCorbeau(destinataire)) {
    return { sort: "REFUSE", raison: "DESTINATAIRE_INCONNU" };
  }

  // J’ai bloqué : j’ai fermé cette porte moi-même, et on me le dit.
  if (blocages.jeLaiBloque) {
    return { sort: "REFUSE", raison: "CONVERSATION_CLOSE" };
  }

  // Il m’a bloqué. Le corbeau part — pour moi, tout est normal — et n’arrive
  // jamais. C’est la seule branche de ce fichier qui ne se voit pas à l’écran.
  if (blocages.ilMaBloque) return { sort: "PART_DANS_LE_VIDE" };

  return { sort: "PART" };
}

/**
 * Le sort d’un corbeau adressé à l’administration.
 *
 * Jamais bloqué, jamais clos, **et jamais fermé au membre suspendu** : c’est
 * la voie de recours de l’article 8.5, et la fermer à celui qui est sanctionné
 * reviendrait à la supprimer pour la seule personne à qui elle sert.
 */
export function sortDuCorbeauVersAdministration(
  expediteur: PourLesCorbeaux,
): Verdict {
  if (!peutOuvrirLaTour(expediteur)) {
    return { sort: "REFUSE", raison: "TOUR_FERMEE" };
  }
  return { sort: "PART" };
}

/**
 * La clé d’une conversation — le verrou en base contre les fils en double.
 *
 * Deux identifiants triés et collés. Le tri est ce qui fait qu’Alice écrivant
 * à Bob et Bob écrivant à Alice tombent sur la **même** clé, donc sur le même
 * fil, quel que soit celui qui parle en premier.
 */
export function clePaire(unId: string, autreId: string): string {
  return [unId, autreId].sort().join(":");
}

/** Celle du fil avec l’administration. Le préfixe est vérifié par la base. */
export function cleAdministration(utilisateurId: string): string {
  return `administration:${utilisateurId}`;
}

// ─────────────────────────────────────────────────────────────
//  L’anti-démarchage — art. 3.6
// ─────────────────────────────────────────────────────────────

/**
 * « La publicité non sollicitée, le spam, le démarchage vers d’autres forums
 * en messagerie privée. » (art. 3.6)
 *
 * Tout le monde peut écrire à tout le monde : c’est ce qui rend le forum
 * accueillant, et c’est aussi ce qui le rend ratissable. D’où un plafond — et
 * **un plafond sur les seules conversations NOUVELLES**.
 *
 * Ce que le plafond ne touche jamais :
 *   • **répondre** dans un fil ouvert. Une conversation animée n’a rien d’un
 *     démarchage, et se faire arrêter au milieu d’un échange serait absurde.
 *   • **écrire à l’administration**. La plafonner fermerait le recours de
 *     l’article 8.5 à celui qui en a besoin, un jour où il en a besoin.
 *
 * Calibré pour qu’un membre ordinaire ne le rencontre jamais : le jour de son
 * arrivée, il se présente à deux ou trois personnes. Un démarcheur en ouvre
 * trente.
 */
export type Plafond = {
  parHeure: number;
  parJour: number;
};

/** Les sept premiers jours après l’acceptation du dossier. */
export const JOURS_NOUVEAU_VENU = 7;

/**
 * Plus strict pour un compte récent, et c’est là tout l’intérêt : un
 * démarcheur arrive, ratisse et repart. Il n’attend pas une semaine.
 */
export const PLAFOND_NOUVEAU_VENU: Plafond = { parHeure: 3, parJour: 10 };
export const PLAFOND_ETABLI: Plafond = { parHeure: 10, parJour: 40 };

const UNE_HEURE = 60 * 60 * 1000;
const UN_JOUR = 24 * UNE_HEURE;

/**
 * Le plafond qui s’applique à ce compte.
 *
 * L’ancienneté se compte depuis l’**acceptation du dossier**, et non depuis la
 * création du compte : quelqu’un dont la candidature a mis trois semaines à
 * être lue est un nouveau venu le jour où on lui ouvre la porte, pas un
 * habitué. Une date absente vaut « nouveau », le sens prudent.
 */
export function plafondDe(
  membreDepuis: Date | string | null,
  maintenant: Date,
): Plafond {
  if (!membreDepuis) return PLAFOND_NOUVEAU_VENU;
  const depuis = new Date(membreDepuis);
  if (Number.isNaN(depuis.getTime())) return PLAFOND_NOUVEAU_VENU;

  const anciennete = maintenant.getTime() - depuis.getTime();
  return anciennete >= JOURS_NOUVEAU_VENU * UN_JOUR
    ? PLAFOND_ETABLI
    : PLAFOND_NOUVEAU_VENU;
}

/**
 * Le plafond est-il atteint — et si oui, quand la place se libère-t-elle ?
 *
 * **Une attente, pas une erreur.** On ne dit pas « refusé » : on dit quand
 * réessayer. La différence n’est pas cosmétique — un joueur qui lit une erreur
 * technique croit avoir cassé quelque chose, et il écrit à l’administration.
 *
 * Fonction pure : elle reçoit les ouvertures des vingt-quatre dernières heures
 * et l’instant présent, et ne lit ni horloge ni base. C’est ce qui la rend
 * testable sans attendre une heure.
 */
export type EtatPlafond =
  | { ouvert: true }
  | { ouvert: false; reprendLe: Date; minutes: number };

export function etatDuPlafond(
  ouverturesRecentes: readonly (Date | string)[],
  plafond: Plafond,
  maintenant: Date,
): EtatPlafond {
  const instants = ouverturesRecentes
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t) && maintenant.getTime() - t < UN_JOUR)
    // De la plus récente à la plus ancienne : la N-ième en partant de
    // maintenant est celle dont l'expiration libère une place.
    .sort((a, b) => b - a);

  const dansLHeure = instants.filter(
    (t) => maintenant.getTime() - t < UNE_HEURE,
  );

  const liberations: number[] = [];
  if (dansLHeure.length >= plafond.parHeure) {
    liberations.push(dansLHeure[plafond.parHeure - 1] + UNE_HEURE);
  }
  if (instants.length >= plafond.parJour) {
    liberations.push(instants[plafond.parJour - 1] + UN_JOUR);
  }

  if (liberations.length === 0) return { ouvert: true };

  // Les deux plafonds peuvent bloquer en même temps : il faut attendre que le
  // dernier des deux se relâche, pas le premier.
  const reprend = Math.max(...liberations);
  return {
    ouvert: false,
    reprendLe: new Date(reprend),
    // Arrondi au supérieur, et jamais zéro : « réessayez dans 0 minute » se
    // lit comme une panne.
    minutes: Math.max(1, Math.ceil((reprend - maintenant.getTime()) / 60000)),
  };
}
