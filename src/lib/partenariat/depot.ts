import "server-only";
import { Prisma, type SuiteDemande } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TEXTES_PARTENARIAT } from "./constantes";
import { verifierLesFreins } from "./freins";
import {
  validerCourriel,
  validerDescriptionPartenaire,
  validerJourNoue,
  validerMessageDemande,
  validerNomForum,
  validerUrlBanniere,
  validerUrlForum,
  type Resultat,
} from "./schema";

/**
 * L'accès aux partenariats.
 *
 * **Le seul endroit qui compose une requête sur `partenaires` et
 * `demandes_partenariat`** — comme `annonces/depot.ts` et
 * `calendrier/depot.ts`. Une table dont les lectures s'écrivent en dix
 * endroits finit par en avoir une qui oublie le filtre, et ici le filtre est
 * ce qui distingue un partenaire affiché d'un partenariat rompu.
 *
 * **Le dépôt appelle la validation et les freins lui-même** : l'action serveur
 * ne fait que traduire le résultat. Une seule porte, qu'aucun écran ne
 * contourne — le parti pris d'`envoyerCorbeau`, puis d'`ouvrirSujet`, puis de
 * `publierAnnonce`.
 *
 * ⚠️ **Rien n'est jamais effacé.** Retirer pose une date ; la ligne reste, et
 * « Remettre au bloc » existe pour la même raison qu'au Grand Hall.
 */

/** Un partenaire, tel qu'il s'affiche sur la page publique. */
export type PartenaireAffiche = {
  id: string;
  nom: string;
  url: string;
  banniereUrl: string | null;
  description: string | null;
  noueLe: string;
};

/** Tout, plus ce que seule l'administration a besoin de voir. */
export type PartenaireEnAdministration = PartenaireAffiche & {
  modifieLe: string | null;
  retireLe: string | null;
  retirePar: string | null;
};

/** Une demande, telle que l'écran d'administration la lit. */
export type DemandeEnAdministration = {
  id: string;
  nomDuForum: string;
  url: string;
  courriel: string;
  message: string;
  suite: SuiteDemande;
  recuLe: string;
  traiteLe: string | null;
};

const CHAMPS = {
  id: true,
  nom: true,
  url: true,
  banniereUrl: true,
  description: true,
  noueLe: true,
} as const;

type LigneBrute = {
  id: string;
  nom: string;
  url: string;
  banniereUrl: string | null;
  description: string | null;
  noueLe: Date;
};

function affiche(ligne: LigneBrute): PartenaireAffiche {
  return {
    id: ligne.id,
    nom: ligne.nom,
    url: ligne.url,
    banniereUrl: ligne.banniereUrl,
    description: ligne.description,
    noueLe: ligne.noueLe.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// Le bloc de liens
// ─────────────────────────────────────────────────────────────

/**
 * **Les partenaires affichés**, dans l'ordre alphabétique.
 *
 * ⚠️ **Jamais par date d'ajout.** Un bloc rangé par ancienneté classe des
 * partenaires — le premier arrivé en tête, le dernier tout en bas —, et
 * personne n'a demandé de classement. Même parti pris que les quatre maisons,
 * qui sortent toujours dans l'ordre de `MAISONS` plutôt que par rang.
 */
export async function listerPartenaires(): Promise<PartenaireAffiche[]> {
  const lignes = await prisma.partenaire.findMany({
    where: { retireLe: null },
    orderBy: { nom: "asc" },
    select: CHAMPS,
  });
  return lignes.map(affiche);
}

/**
 * Tout, retirés compris — **et cette fonction n'est appelée que par
 * `/admin/partenaires`**. Elle porte le seul chemin qui voie un partenariat
 * rompu : le retrait n'est pas un effacement, mais il ne se lit pas depuis la
 * page publique pour autant.
 */
export async function listerPourAdministration(): Promise<
  PartenaireEnAdministration[]
> {
  const lignes = await prisma.partenaire.findMany({
    orderBy: [{ retireLe: "asc" }, { nom: "asc" }],
    select: { ...CHAMPS, modifieLe: true, retireLe: true, retirePar: true },
  });

  return lignes.map((ligne) => ({
    ...affiche(ligne),
    modifieLe: ligne.modifieLe?.toISOString() ?? null,
    retireLe: ligne.retireLe?.toISOString() ?? null,
    retirePar: ligne.retirePar,
  }));
}

type EntreesPartenaire = {
  nom: unknown;
  url: unknown;
  banniere: unknown;
  description: unknown;
  noue: unknown;
};

function valider(entrees: EntreesPartenaire) {
  const nom = validerNomForum(entrees.nom);
  if (!nom.ok) return nom;
  const url = validerUrlForum(entrees.url);
  if (!url.ok) return url;
  const banniere = validerUrlBanniere(entrees.banniere);
  if (!banniere.ok) return banniere;
  const description = validerDescriptionPartenaire(entrees.description);
  if (!description.ok) return description;
  const noue = validerJourNoue(entrees.noue);
  if (!noue.ok) return noue;

  return {
    ok: true as const,
    valeur: {
      nom: nom.valeur,
      url: url.valeur,
      banniereUrl: banniere.valeur,
      description: description.valeur,
      noueLe: noue.valeur,
    },
  };
}

/**
 * Ajouter un forum au bloc.
 *
 * ⚠️ **C'est la base qui refuse le doublon**, par un index unique partiel sur
 * l'adresse — et « partiel » est tout le sujet : un partenariat rompu puis
 * renoué doit rester possible, alors que sa ligne, elle, reste. On traduit
 * ici le refus en une phrase ; on ne le devine pas par une lecture préalable,
 * qui laisserait passer deux ajouts simultanés.
 */
export async function ajouterPartenaire(
  entrees: EntreesPartenaire,
): Promise<Resultat<{ id: string }>> {
  const valide = valider(entrees);
  if (!valide.ok) return valide;

  try {
    const pose = await prisma.partenaire.create({
      data: valide.valeur,
      select: { id: true },
    });
    return { ok: true, valeur: { id: pose.id } };
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, message: TEXTES_PARTENARIAT.erreurs.dejaPartenaire };
    }
    throw erreur;
  }
}

/**
 * Corriger une ligne du bloc.
 *
 * `modifieLe` marque la reprise, comme sur une annonce et sur un post : un
 * partenaire qui change de nom ou d'adresse a le droit d'être corrigé, mais il
 * faut que cela se voie côté administration.
 */
export async function corrigerPartenaire(
  id: string,
  entrees: EntreesPartenaire,
): Promise<Resultat<{ id: string }>> {
  const existant = await prisma.partenaire.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existant) {
    return { ok: false, message: TEXTES_PARTENARIAT.erreurs.introuvable };
  }

  const valide = valider(entrees);
  if (!valide.ok) return valide;

  try {
    await prisma.partenaire.update({
      where: { id },
      data: { ...valide.valeur, modifieLe: new Date() },
    });
    return { ok: true, valeur: { id } };
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, message: TEXTES_PARTENARIAT.erreurs.dejaPartenaire };
    }
    throw erreur;
  }
}

/**
 * Retirer un partenaire du bloc — **sans rien effacer**.
 *
 * Les deux colonnes sont posées ensemble ; la base refuse l'une sans l'autre.
 * Reposer le geste sur une ligne déjà retirée ne change rien : le `where` s'en
 * charge, et il n'y a pas de second retrait à dater.
 */
export async function retirerPartenaire(id: string): Promise<void> {
  await prisma.partenaire.updateMany({
    where: { id, retireLe: null },
    data: {
      retireLe: new Date(),
      retirePar: TEXTES_PARTENARIAT.administration.posePar,
    },
  });
}

/**
 * Remettre au bloc ce qui en avait été retiré.
 *
 * ⚠️ **Peut échouer**, à la différence des autres remises du site : l'index
 * unique partiel ne tolère qu'une ligne active par adresse, et un forum
 * ajouté de nouveau entre-temps occupe la place. Le refus est traduit, jamais
 * laissé remonter en erreur 500.
 */
export async function remettrePartenaire(id: string): Promise<Resultat<null>> {
  try {
    await prisma.partenaire.updateMany({
      where: { id, NOT: { retireLe: null } },
      data: { retireLe: null, retirePar: null },
    });
    return { ok: true, valeur: null };
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return { ok: false, message: TEXTES_PARTENARIAT.erreurs.dejaPartenaire };
    }
    throw erreur;
  }
}

// ─────────────────────────────────────────────────────────────
// Les demandes
// ─────────────────────────────────────────────────────────────

/** Ce que le formulaire public rapporte de son envoi. */
export type SuiteDuDepot =
  | { ok: true }
  /** Une saisie qui ne tient pas. La phrase est pour la personne. */
  | { ok: false; raison: "INVALIDE"; message: string }
  /** Le plafond horaire. **Pas un refus** : la phrase dit de revenir. */
  | { ok: false; raison: "ATTENDRE"; message: string };

/**
 * **Déposer une demande de partenariat.**
 *
 * Les freins passent d'abord, la validation ensuite : inutile de dire à un
 * robot que son adresse est mal formée.
 *
 * ⚠️ **Un envoi avalé rend `ok: true`.** L'écran affiche alors le même accusé
 * de réception que pour un envoi réel, et rien n'entre en base. Répondre « vous
 * êtes un robot » revient à donner le mode d'emploi du contournement — c'est
 * le principe de `PART_DANS_LE_VIDE` dans la Tour aux Corbeaux, appliqué aux
 * machines.
 */
export async function deposerDemande(entrees: {
  nom: unknown;
  url: unknown;
  courriel: unknown;
  message: unknown;
  pot: unknown;
  ouvertLe: unknown;
}): Promise<SuiteDuDepot> {
  const ilYAUneHeure = new Date(Date.now() - 60 * 60 * 1000);
  const demandesDansLHeure = await prisma.demandePartenariat.count({
    where: { recuLe: { gte: ilYAUneHeure } },
  });

  const ouvert = Number(entrees.ouvertLe);
  const verdict = verifierLesFreins({
    pot: typeof entrees.pot === "string" ? entrees.pot : null,
    ouvertLe: Number.isFinite(ouvert) && ouvert > 0 ? ouvert : null,
    maintenant: Date.now(),
    demandesDansLHeure,
  });

  if (verdict.suite === "AVALE") return { ok: true };
  if (verdict.suite === "ATTENDRE") {
    return {
      ok: false,
      raison: "ATTENDRE",
      message: TEXTES_PARTENARIAT.erreurs.tropDeDemandes,
    };
  }

  const nom = validerNomForum(entrees.nom);
  if (!nom.ok) return { ok: false, raison: "INVALIDE", message: nom.message };
  const url = validerUrlForum(entrees.url);
  if (!url.ok) return { ok: false, raison: "INVALIDE", message: url.message };
  const courriel = validerCourriel(entrees.courriel);
  if (!courriel.ok) {
    return { ok: false, raison: "INVALIDE", message: courriel.message };
  }
  const message = validerMessageDemande(entrees.message);
  if (!message.ok) {
    return { ok: false, raison: "INVALIDE", message: message.message };
  }

  await prisma.demandePartenariat.create({
    data: {
      nomDuForum: nom.valeur,
      url: url.valeur,
      courriel: courriel.valeur,
      message: message.valeur,
    },
  });

  return { ok: true };
}

/** Les demandes, la plus récente d'abord — écran d'administration seul. */
export async function listerDemandes(): Promise<DemandeEnAdministration[]> {
  const lignes = await prisma.demandePartenariat.findMany({
    orderBy: { recuLe: "desc" },
  });

  return lignes.map((ligne) => ({
    id: ligne.id,
    nomDuForum: ligne.nomDuForum,
    url: ligne.url,
    courriel: ligne.courriel,
    message: ligne.message,
    suite: ligne.suite,
    recuLe: ligne.recuLe.toISOString(),
    traiteLe: ligne.traiteLe?.toISOString() ?? null,
  }));
}

/** Combien attendent une réponse — pour la carte de `/admin`. */
export async function demandesEnAttente(): Promise<number> {
  return prisma.demandePartenariat.count({ where: { suite: "EN_ATTENTE" } });
}

/**
 * Marquer une demande traitée, ou la remettre en attente.
 *
 * ⚠️ **La date suit la suite, dans les deux sens** — la base l'exige :
 * `EN_ATTENTE` la vide, toute autre valeur la pose. Une demande acceptée sans
 * date de traitement ne se relit pas six mois plus tard.
 *
 * **Ce geste n'ajoute personne au bloc.** Une demande porte ce qu'ils ont
 * écrit, le bloc ce que nous affichons, et les deux ne disent presque jamais
 * la même chose : le nom qu'ils se donnent est parfois à rallonge, et
 * l'adresse de leur bannière ne figure pas dans le formulaire.
 */
export async function changerLaSuite(
  id: string,
  suite: SuiteDemande,
): Promise<void> {
  await prisma.demandePartenariat.updateMany({
    where: { id },
    data: {
      suite,
      traiteLe: suite === "EN_ATTENTE" ? null : new Date(),
    },
  });
}
