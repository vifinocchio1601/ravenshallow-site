import "server-only";
import { listerAnnonces } from "@/lib/annonces/depot";
import reglages from "@/config/bureau.json";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { listerConversations } from "@/lib/corbeaux/depot";
import { TEXTES_CALENDRIER } from "@/lib/calendrier/constantes";
import { prochaineEpreuve } from "@/lib/calendrier/depot";
import { jourEnToutesLettres } from "@/lib/dates";
import { compterScenesOuvertes, listerScenesDe } from "@/lib/forum/depot";
import { lireLeTournoi, pointsPersonnelsDe } from "@/lib/points/depot";
import { auDelaDuRepere, reperDeScenes } from "@/lib/forum/scenes";
import { libelleBaguette } from "@/lib/ecole/baguette";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";
import { ROUTES } from "@/lib/ecole/menu";
import {
  aFiniLesPremiersPas,
  aUneBaguette,
  doitPasserAKaldvik,
  doitPasserAuMiroir,
  estConcerneParLaBoutique,
  estConcerneParLeMiroir,
} from "@/lib/session/acces";
import { maisonQuiCompte, type LigneDeClassement } from "@/lib/ecole/tournoi";
import type { EtatEtape, Maison } from "@/lib/dossier/etats";
import type { CompteConnecte } from "@/lib/session/garde";

/**
 * Ce que Mon bureau affiche.
 *
 * Une fonction par panneau, et chaque lot en remplace **une seule** — sans
 * toucher aux panneaux eux-mêmes. C’était le plan depuis le lot du bureau, et
 * il a tenu quatre fois : le courrier avec la Tour aux Corbeaux, les scènes
 * avec le forum, la progression et le tournoi avec les points.
 *
 * Il a tenu cinq fois : le courrier avec la Tour aux Corbeaux, les scènes
 * avec le forum, la progression et le tournoi avec les points, les annonces
 * avec le Grand Hall, et **les épreuves avec le calendrier** — le 28 août
 * 2026. Le plan a tenu six fois, et il ne reste plus rien à remplir.
 *
 * Aucune ne lève d’exception. Un bureau qui s’effondre parce qu’une brique
 * n’est pas construite serait le pire des accueils.
 */

export type SceneEnCours = {
  id: string;
  titre: string;
  lieu: string;
  dernierMessageLe: string;
  auteurDernierMessage: string;
};

/**
 * Un fil de la Tour aux Corbeaux où quelque chose attend d’être lu.
 *
 * Pas de `sujet` : la Tour n’en a pas. C’est un outil de coordination entre
 * joueurs, pas un courrier administratif — on y écrit à quelqu’un, pas à
 * propos de quelque chose.
 */
export type CorbeauNonLu = {
  /** Le fil, pour y aller d’un clic. */
  conversationId: string;
  /** Le nom du personnage, ou « L’Administration ». */
  expediteur: string;
  extrait: string;
  recuLe: string;
  nonLus: number;
};

export type Progression = {
  /**
   * Les points de l’élève — art. 18.1. **Distincts du compteur de sa
   * maison**, qui vit dans les tubes : un ajustement de l’administration
   * (art. 19.1) touche le second et jamais le premier.
   */
  pointsPersonnels: number;
  /**
   * Où en est la répartition, transporté tel quel : le panneau doit
   * distinguer « le compteur s’ouvrira au Miroir » d’un compte que la
   * répartition ne concerne pas, qui n’affiche rien du tout.
   */
  etatMaison: EtatEtape;
  fonction: string;
  /**
   * Le titre au château, ou `null`. Transporté à côté de l’année plutôt qu’à
   * sa place : `libellePlace` est le seul endroit qui tranche entre les deux,
   * et l’année reste disponible si le rôle s’efface.
   */
  roleAffiche: string | null;
  /**
   * « Chêne des tempêtes, cœur de griffe d’ours des cavernes », ou `null`
   * tant que l’élève n’est pas passé à Kaldvik. La ligne reste alors masquée :
   * la note des premiers pas dit déjà ce qu’il lui reste à faire, et
   * l’annoncer deux fois ne l’aiderait pas.
   */
  baguette: string | null;
  prochainesEpreuves: string | null;
};

export type Annonce = {
  id: string;
  titre: string;
  publieeLe: string;
  extrait: string;
};

/**
 * Les scènes où ce joueur a écrit et qui ne sont pas closes.
 *
 * **Le deuxième panneau du bureau à cesser d’être vide**, et il n’a pas eu à
 * bouger — c’était le plan depuis le lot du bureau.
 *
 * Un compte sans fiche n’a rien écrit : liste vide, jamais d’exception.
 */
export async function scenesEnCours(
  compte: CompteConnecte,
): Promise<SceneEnCours[]> {
  if (!compte.eleveId) return [];
  return listerScenesDe(compte.eleveId);
}

/**
 * Le repère de l’article 17.3 — trois scènes, cinq dès la troisième année.
 *
 * **Affiché, jamais opposé.** Le joueur a tranché le 26 août 2026 : la limite
 * est un principe de confiance. Ce compte dit où l’on en est, et donne au
 * modérateur le fait dont il a besoin le jour de la remontrance — sans lui,
 * elle tomberait de nulle part.
 */
export type RepereScenes = {
  ouvertes: number;
  repere: number;
  auDela: boolean;
};

export async function repereDeScenes(
  compte: CompteConnecte,
): Promise<RepereScenes> {
  const ouvertes = compte.eleveId
    ? await compterScenesOuvertes(compte.eleveId)
    : 0;
  return {
    ouvertes,
    repere: reperDeScenes(compte.fonction),
    auDela: auDelaDuRepere(compte.fonction, ouvertes),
  };
}

/**
 * Ce qui attend dans la Tour aux Corbeaux.
 *
 * **Le premier panneau du bureau à cesser d’être vide.** Il ne recopie
 * aucune règle : `listerConversations` a déjà écarté ce qui est masqué, ce
 * qui vient d’une personne bloquée et ce qu’un membre suspendu ne doit pas
 * voir. Ici, on ne fait que garder les fils qui ont quelque chose à annoncer,
 * et on s’arrête aux quatre premiers — le bureau est un aperçu, pas la Tour.
 */
export async function courrierNonLu(
  compte: CompteConnecte,
): Promise<CorbeauNonLu[]> {
  const conversations = await listerConversations(compte);

  return conversations
    .filter((conv) => conv.nonLus > 0)
    .slice(0, 4)
    .map((conv) => ({
      conversationId: conv.id,
      expediteur:
        conv.correspondant?.prenomNom ?? TEXTES_CORBEAUX.administration.nom,
      extrait: conv.extrait ?? TEXTES_CORBEAUX.liste.videExtrait,
      recuLe: conv.dernierMessageLe,
      nonLus: conv.nonLus,
    }));
}

/**
 * **Le troisième panneau à cesser d’être vide.**
 *
 * Les points personnels sont désormais lus en base — ils portent la
 * progression de l’élève et traversent les années (art. 18.4). Le compteur de
 * SA MAISON, lui, n’est plus ici : les tubes le disent bien mieux qu’une
 * ligne de texte, et deux affichages du même nombre finiraient par se
 * contredire.
 *
 * **`prochainesEpreuves` a cessé d’être nul le 28 août 2026**, avec le
 * calendrier — et le panneau n’a pas eu à bouger. C’est **la sixième fois**
 * que ce plan tient : une fonction par panneau, et chaque lot en remplace une
 * seule. Il ne reste plus rien à remplir ici.
 *
 * ⚠️ **Seules les ÉPREUVES y montent.** Le panneau porte ce titre depuis le
 * lot du bureau : y faire monter la veillée des braises le contredirait, et
 * c’est exactement pour cela que `NatureEvenement` existe.
 */
export async function progression(compte: CompteConnecte): Promise<Progression> {
  const [points, epreuve] = await Promise.all([
    compte.eleveId ? pointsPersonnelsDe(compte.eleveId) : Promise.resolve(0),
    prochaineEpreuve(),
  ]);

  return {
    pointsPersonnels: points,
    etatMaison: compte.etatMaison,
    fonction: compte.fonction,
    roleAffiche: compte.roleAffiche,
    baguette: aUneBaguette(compte)
      ? libelleBaguette(compte.baguetteBois, compte.baguetteCoeur)
      : null,
    // La date est mise en forme ici plutôt qu’à l’écran : le panneau reçoit
    // une chaîne ou rien, et n’a jamais eu à connaître autre chose.
    prochainesEpreuves: epreuve
      ? TEXTES_CALENDRIER.bureau.ligne
          .replace("{titre}", epreuve.titre)
          .replace("{date}", jourEnToutesLettres(new Date(epreuve.debuteLe)))
      : null,
  };
}

/**
 * **Le tournoi des maisons** — les quatre tubes, en tête du bureau.
 *
 * Rend `null` quand aucune saison n’est ouverte : le panneau disparaît alors
 * plutôt que d’afficher quatre tubes vides, qui laisseraient croire à un
 * tournoi en cours que personne n’aurait commencé.
 *
 * `maMaison` passe par `maisonQuiCompte` — jamais par la colonne. Une
 * directrice ne voit aucun liseré : elle n’est d’aucune maison au tournoi,
 * même si Tideål reste écrite sur sa fiche.
 */
export type TournoiAffiche = {
  lignes: LigneDeClassement[];
  maMaison: Maison | null;
};

export async function tournoi(
  compte: CompteConnecte,
): Promise<TournoiAffiche | null> {
  const lu = await lireLeTournoi();
  if (!lu) return null;
  return { lignes: lu.lignes, maMaison: maisonQuiCompte(compte) };
}

/**
 * **Les dernières annonces du Grand Hall**, pour le journal du bureau.
 *
 * Le panneau n’a pas eu à bouger : il attendait cette liste depuis le lot du
 * journal, et l’adresse vers laquelle il pointe — `/annonces/<id>` — a été
 * écrite avant que la page n’existe.
 *
 * Le nombre est un réglage et non une règle : une colonne de journal est
 * étroite, et ce qui déborde ne se voit qu’à l’écran. Il vit donc dans
 * `config/bureau.json`, avec les bornes du cadre.
 *
 * ⚠️ **Le journal n’est pas le Grand Hall.** Il en montre les premiers, pas
 * la liste : `listerAnnonces` sans limite est ce que la page affiche.
 */
export async function annonces(): Promise<Annonce[]> {
  const dernieres = await listerAnnonces(reglages.journalAnnoncesMax);
  return dernieres.map((annonce) => ({
    id: annonce.id,
    titre: annonce.titre,
    publieeLe: annonce.publieeLe,
    extrait: annonce.extrait,
  }));
}

// ─────────────────────────────────────────────────────────────
//  Les premiers pas du nouvel arrivant
// ─────────────────────────────────────────────────────────────

export type PremierPas = {
  id: string;
  libelle: string;
  fait: boolean;
  /** Nul quand la ligne n’est pas cliquable : déjà faite, ou verrouillée. */
  href: string | null;
  /** La raison du verrou, en clair. Nulle si la ligne est ouverte. */
  verrou: string | null;
};

/**
 * La liste des premiers pas, ou `null` quand il n’y a plus rien à faire.
 *
 * Rendre `null` plutôt qu’une liste vide est ce qui fait **disparaître** la
 * note du bureau une fois les deux lignes cochées : elle n’a pas vocation à
 * rester là comme un panneau de plus.
 *
 * L’ordre compte : la baguette d’abord, le Miroir ensuite. La seconde ligne
 * reste verrouillée tant que la première n’est pas faite — affichée, mais
 * avec sa raison écrite à côté plutôt qu’un simple grisé.
 */
export async function premiersPas(
  compte: CompteConnecte,
): Promise<PremierPas[] | null> {
  if (aFiniLesPremiersPas(compte)) return null;

  const t = TEXTES_ECOLE.bureau.premiersPas;
  const versKaldvik = doitPasserAKaldvik(compte);
  const versLeMiroir = doitPasserAuMiroir(compte);

  const pas: PremierPas[] = [];

  // Une étape sans objet ne figure pas dans la note — et surtout pas cochée.
  // Une case cochée dit « c’est fait » ; pour une directrice, il n’y a jamais
  // rien eu à faire, et lui montrer une liste de ses non-devoirs n’aurait
  // aucun sens. La ligne n’existe pas, voilà tout.
  if (estConcerneParLaBoutique(compte)) {
    pas.push({
      id: "baguette",
      libelle: t.baguette,
      fait: !versKaldvik,
      // Le premier pas n’est jamais verrouillé : rien ne le précède.
      href: versKaldvik ? ROUTES.bjornstav : null,
      verrou: null,
    });
  }

  if (estConcerneParLeMiroir(compte)) {
    pas.push({
      id: "ceremonie",
      libelle: t.ceremonie,
      fait: !versLeMiroir,
      href: !versKaldvik && versLeMiroir ? ROUTES.ceremonie : null,
      // Le verrou ne tombe que sur une boutique encore attendue : un compte
      // qu’elle ne concerne pas n’a rien à aller y chercher d’abord.
      verrou: versKaldvik ? t.verrou : null,
    });
  }

  return pas;
}
