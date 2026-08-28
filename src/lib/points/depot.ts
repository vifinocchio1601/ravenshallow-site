import "server-only";
import type { Prisma } from "@prisma/client";
import { transaction } from "@/lib/base/transaction";
import { libellePlace, MAISONS, type Maison } from "@/lib/dossier/etats";
import {
  classement,
  effectifsParMaison,
  maisonQuiCompte,
  totauxVides,
  type LigneDeClassement,
} from "@/lib/ecole/tournoi";
import { prisma } from "@/lib/prisma";
import { nettoyerTexteLibre } from "@/lib/texte";
import { TEXTES_POINTS } from "./constantes";
import {
  bornesDuMois,
  etatDuPlafond,
  pointDUnPost,
  rangsPartages,
  type VerdictPoint,
} from "./regles";

/**
 * L’accès aux points.
 *
 * **Le seul endroit qui écrit dans `points_gagnes`, `compteurs_maison` et
 * `ajustements_maison`** — et le seul qui touche à `Eleve.points`. Trois
 * tables et une colonne qui doivent bouger ensemble ou pas du tout : les
 * laisser s’écrire depuis plusieurs endroits, c’est garantir qu’un jour l’une
 * bougera sans l’autre, et qu’un total sera faux sans que rien ne le dise.
 *
 * ── Deux compteurs, jamais confondus ──
 *
 *   `Eleve.points`    — la progression personnelle, qui traverse les années
 *   `CompteurMaison`  — le tournoi, remis à zéro à chaque saison
 *
 * Les points gagnés alimentent **les deux**. Un ajustement de l’administration
 * (art. 19.1) n’alimente **que le second** : une sanction jouée en RP ne doit
 * pas coûter son année à un élève (art. 18.4).
 *
 * ── Tout passe par une transaction ──
 *
 * Écrire la ligne du carnet sans corriger les compteurs, ou l’inverse, laisse
 * la base dans un état qu’aucune lecture ne peut plus expliquer. Les fonctions
 * d’écriture reçoivent donc un `tx` : elles s’inscrivent **dans la transaction
 * de l’appelant** — celle qui crée le post, celle qui le masque — plutôt que
 * d’en ouvrir une à côté.
 */

/** Le client, ou la transaction en cours. Jamais autre chose. */
type Base = Prisma.TransactionClient | typeof prisma;

// ─────────────────────────────────────────────────────────────
//  La saison
// ─────────────────────────────────────────────────────────────

export type Saison = { id: string; nom: string };

/**
 * La saison ouverte, ou `null`.
 *
 * `null` ne devrait jamais arriver — la base garantit qu’il y en a au plus
 * une, la migration en a ouvert une, et la clôture en ouvrira la suivante
 * dans la même transaction. Mais **un point qui n’a nulle part où se poser ne
 * doit pas faire échouer la publication d’un post** : le joueur a écrit, son
 * texte part, et c’est tout ce qui compte pour lui. On rend `null`, l’appelant
 * n’accorde rien, et rien ne casse.
 */
export async function saisonEnCours(base: Base = prisma): Promise<Saison | null> {
  return base.saisonScolaire.findFirst({
    where: { closeLe: null },
    select: { id: true, nom: true },
  });
}

// ─────────────────────────────────────────────────────────────
//  Accorder le point d’un post
// ─────────────────────────────────────────────────────────────

/** Le strict nécessaire pour décider — pas la fiche entière. */
export type AuteurDUnPost = {
  eleveId: string;
  maison: string | null;
  etatMaison: "NON_FAIT" | "FAIT" | "SANS_OBJET";
};

/**
 * **Ce post rapporte-t-il, et à qui ?**
 *
 * Appelée dans la transaction qui vient de créer le post. Elle relit le
 * plafond en base, demande le verdict à la règle pure, puis écrit d’un seul
 * geste : la ligne du carnet, les points personnels, le compteur de la maison.
 *
 * Rend le verdict pour que l’appelant sache ce qui s’est passé — aucun d’eux
 * n’en fait rien aujourd’hui, et c’est volontaire : **un post ne doit jamais
 * échouer parce qu’il n’a pas rapporté de point.** Le joueur écrit une scène,
 * il ne dépose pas une note de frais.
 *
 * ── La maison est figée ici, et nulle part ailleurs ──
 *
 * `maisonQuiCompte` est interrogée **au moment du gain**, et sa réponse est
 * recopiée dans la ligne. Une joueuse de Bryggeld nommée professeure quitte
 * l’effectif sans que sa maison perde ce qu’elle avait vraiment gagné pour
 * elle ; un professeur, lui, gagne ses points personnels sans que personne
 * n’en profite au tournoi. La base refuse ensuite de changer cette colonne.
 */
export async function accorderLePointDUnPost(
  tx: Prisma.TransactionClient,
  auteur: AuteurDUnPost,
  postId: string,
  comptePourLesPoints: boolean,
  respecteLeMinimum: boolean,
  maintenant = new Date(),
): Promise<VerdictPoint> {
  // Le plafond ne se lit que si le lieu compte : interroger la base pour un
  // post chez les non-mages serait une requête par post, pour rien.
  if (!comptePourLesPoints) {
    return pointDUnPost({
      comptePourLesPoints: false,
      respecteLeMinimum,
      plafond: { atteint: false, restants: null },
    });
  }

  const saison = await saisonEnCours(tx);
  if (!saison) return { gagne: false, raison: "LIEU_SANS_POINTS" };

  // **Ce qui vient du jeu, et rien d'autre.** Un point accordé à la main par
  // l'administration n'a pas à remplir le plafond de quelqu'un : celui-ci
  // existe pour qu'un seul membre très actif ne fasse pas gagner sa maison à
  // lui seul, et un geste délibéré n'est pas cela.
  const recents = await tx.pointGagne.findMany({
    where: {
      eleveId: auteur.eleveId,
      source: { not: "ADMINISTRATION" },
      gagneLe: { gte: new Date(maintenant.getTime() - 24 * 60 * 60 * 1000) },
    },
    select: { gagneLe: true, points: true },
  });

  const verdict = pointDUnPost({
    comptePourLesPoints,
    respecteLeMinimum,
    plafond: etatDuPlafond(recents, maintenant),
  });
  if (!verdict.gagne) return verdict;

  const maison = maisonQuiCompte(auteur);

  await tx.pointGagne.create({
    data: {
      saisonId: saison.id,
      eleveId: auteur.eleveId,
      maison,
      points: verdict.points,
      source: "POST",
      postId,
      gagneLe: maintenant,
    },
  });

  await tx.eleve.update({
    where: { id: auteur.eleveId },
    data: { points: { increment: verdict.points } },
  });

  if (maison) {
    await crediterLaMaison(tx, saison.id, maison, verdict.points);
  }

  return verdict;
}

// ─────────────────────────────────────────────────────────────
//  Reprendre et rendre — le post masqué (art. 19.3)
// ─────────────────────────────────────────────────────────────

/**
 * **Le point d’un post masqué s’en va, et revient au démasquage.**
 *
 * La ligne du carnet n’est pas effacée : elle porte une date de reprise, et
 * cesse de compter tant qu’elle la porte. C’est ce qui rend le geste
 * réversible à l’identique — rendre un point effacé obligerait à le
 * réinventer, et à deviner ce qu’il valait.
 *
 * ⚠️ **À ne pas confondre avec un post RETIRÉ, qui garde ses points.**
 * Décision du joueur, 27 août 2026 : « les points acquis restent acquis »
 * (art. 17.2). Retirer est le geste de l’auteur sur son propre texte ;
 * masquer est une mesure du staff, temporaire, sur un post non conforme.
 * `retirerSonPost` et `retirerLaScene` ne passent donc jamais par ici.
 *
 * Rend `true` si un point a bougé — faux quand le post n’en avait pas, ou
 * qu’il était déjà repris. Un second masquage ne retire pas deux fois.
 */
export async function reprendreLePointDUnPost(
  tx: Prisma.TransactionClient,
  postId: string,
  maintenant = new Date(),
): Promise<boolean> {
  const ligne = await tx.pointGagne.findUnique({
    where: { postId },
    select: { id: true, points: true, maison: true, eleveId: true, saisonId: true, repriseLe: true },
  });
  if (!ligne || ligne.repriseLe) return false;

  await tx.pointGagne.update({
    where: { id: ligne.id },
    data: { repriseLe: maintenant },
  });
  await appliquer(tx, ligne, -ligne.points);
  return true;
}

/** Le post rouvre : son point revient, identique. */
export async function rendreLePointDUnPost(
  tx: Prisma.TransactionClient,
  postId: string,
): Promise<boolean> {
  const ligne = await tx.pointGagne.findUnique({
    where: { postId },
    select: { id: true, points: true, maison: true, eleveId: true, saisonId: true, repriseLe: true },
  });
  if (!ligne || !ligne.repriseLe) return false;

  await tx.pointGagne.update({
    where: { id: ligne.id },
    data: { repriseLe: null },
  });
  await appliquer(tx, ligne, ligne.points);
  return true;
}

/**
 * Porter un écart sur les deux compteurs à la fois.
 *
 * Une fiche supprimée laisse `eleveId` nul : la ligne du carnet reste, le
 * compteur de la maison reste juste, et il n’y a simplement plus de points
 * personnels à corriger. Un total de maison qui baisserait parce que
 * quelqu’un s’en va punirait sa maison de son départ.
 */
async function appliquer(
  tx: Prisma.TransactionClient,
  ligne: { eleveId: string | null; maison: Maison | null; saisonId: string },
  ecart: number,
): Promise<void> {
  if (ligne.eleveId) {
    await tx.eleve.update({
      where: { id: ligne.eleveId },
      data: { points: { increment: ecart } },
    });
  }
  if (ligne.maison) {
    await crediterLaMaison(tx, ligne.saisonId, ligne.maison, ecart);
  }
}

/**
 * Le compteur de la maison, corrigé.
 *
 * `upsert` et non `update` : les quatre lignes existent, mais une saison
 * ouverte à la main ou par un script pourrait n’en avoir aucune. **Un point
 * ne doit jamais se perdre en silence parce qu’une ligne de résumé manquait.**
 */
async function crediterLaMaison(
  tx: Prisma.TransactionClient,
  saisonId: string,
  maison: Maison,
  ecart: number,
): Promise<void> {
  await tx.compteurMaison.upsert({
    where: { saisonId_maison: { saisonId, maison } },
    update: { points: { increment: ecart } },
    create: { saisonId, maison, points: ecart },
  });
}

// ─────────────────────────────────────────────────────────────
//  Accorder des points à un élève, à la main — art. 18.1
// ─────────────────────────────────────────────────────────────

export type ResultatDon =
  | { ok: true; id: string; maison: Maison | null }
  | { ok: false; message: string };

/**
 * **Donner des points à quelqu’un.**
 *
 * L’article 18.1 fait gagner des points par « la participation aux cours, la
 * présence aux événements et la qualité d’écriture ». Les deux premières
 * viendront avec les cours ; la troisième ne se mesure pas, elle se lit — d’où
 * ce geste, demandé par le joueur.
 *
 * ⚠️ **À ne pas confondre avec `ajusterLaMaison`**, qui lui ressemble et ne
 * fait pas la même chose :
 *
 *     ajusterLaMaison            — une maison, et le compteur du tournoi seul
 *     accorderDesPointsAUnEleve  — un élève, et **les deux compteurs**
 *
 * Le second est un point au sens de l’article 18.2 — « ces points alimentent
 * la progression individuelle ET le compteur de la maison ». Il entre donc
 * dans le carnet comme un point de post, se recalcule avec eux, et suit son
 * élève : s’il ne marque pour personne, sa maison ne reçoit rien.
 *
 * **Le plafond quotidien ne s’applique pas.** Il ralentit un joueur très
 * actif ; il n’a pas à brider une décision prise en connaissance de cause.
 *
 * Le motif est **obligatoire**, ici et en base : ces points s’affichent, et
 * personne ne doit les trouver sans explication.
 */
export async function accorderDesPointsAUnEleve(
  eleveId: string,
  points: number,
  motif: string,
  parNom: string = TEXTES_POINTS.ajustement.parDefautAuteur,
): Promise<ResultatDon> {
  const E = TEXTES_POINTS.ajustement.erreurs;

  if (!Number.isFinite(points) || points === 0) {
    return { ok: false, message: E.valeurRequise };
  }
  if (!Number.isInteger(points)) {
    return { ok: false, message: E.valeurEntiere };
  }

  const motifNet = nettoyerTexteLibre(motif);
  if (motifNet.length === 0) return { ok: false, message: E.motifRequis };

  const fiche = await prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { maison: true, etatMaison: true },
  });
  if (!fiche) return { ok: false, message: E.eleveIntrouvable };

  const saison = await saisonEnCours();
  if (!saison) return { ok: false, message: E.saisonFermee };

  // La maison est figée ici, comme pour un point de post — et par la même
  // question. Une professeure garde ses points personnels sans que Tideål,
  // écrite sur sa fiche, n'en profite au tournoi.
  const maison = maisonQuiCompte(fiche);

  const id = await transaction(async (tx) => {
    const ligne = await tx.pointGagne.create({
      data: {
        saisonId: saison.id,
        eleveId,
        maison,
        points,
        source: "ADMINISTRATION",
        motif: motifNet,
        parNom,
      },
      select: { id: true },
    });
    await tx.eleve.update({
      where: { id: eleveId },
      data: { points: { increment: points } },
    });
    if (maison) await crediterLaMaison(tx, saison.id, maison, points);
    return ligne.id;
  });

  return { ok: true, id, maison };
}

/**
 * **Reprendre des points accordés à la main.**
 *
 * La ligne du carnet n’est pas effacée : elle porte une date de reprise et
 * cesse de compter — exactement comme un point de post masqué. L’historique
 * garde donc le geste **et** son retrait : des points retirés sans qu’on sache
 * pourquoi ils avaient été donnés seraient pires qu’un don injuste.
 */
export async function reprendreLesPointsAccordes(id: string): Promise<boolean> {
  return transaction(async (tx) => {
    const ligne = await tx.pointGagne.findUnique({
      where: { id },
      select: {
        points: true, maison: true, eleveId: true, saisonId: true,
        repriseLe: true, source: true,
      },
    });
    // Uniquement ce qui a été donné à la main : reprendre un point de post
    // depuis cet écran contournerait le masquage, qui est l'autre geste et
    // qui, lui, rend le point au démasquage.
    if (!ligne || ligne.repriseLe || ligne.source !== "ADMINISTRATION") return false;

    await tx.pointGagne.update({ where: { id }, data: { repriseLe: new Date() } });
    await appliquer(tx, ligne, -ligne.points);
    return true;
  });
}

/** Les points accordés à la main cette saison — le plus récent d’abord. */
export async function historiqueDesDons(saisonId: string) {
  return prisma.pointGagne.findMany({
    where: { saisonId, source: "ADMINISTRATION" },
    orderBy: { gagneLe: "desc" },
    select: {
      id: true,
      points: true,
      maison: true,
      motif: true,
      parNom: true,
      gagneLe: true,
      // Les repris restent visibles, barrés : c'est le principe même de
      // « tracé et réversible ».
      repriseLe: true,
      // Nul si la fiche a été supprimée depuis : la ligne, elle, reste.
      eleve: { select: { prenomNom: true } },
    },
  });
}

/**
 * Les élèves à qui l’on peut donner des points, par ordre alphabétique.
 *
 * Tous les dossiers acceptés, **professeurs compris** : l’article 18.1 ne
 * réserve pas la qualité d’écriture aux élèves, et un `roleAffiche` ne se lit
 * pas pour décider d’un affichage. La maison affichée à côté du nom est celle
 * qui compte — nulle pour qui ne marque pour personne, et l’écran le dit.
 */
export async function listerLesElevesPourLesPoints(): Promise<
  { eleveId: string; prenomNom: string; maison: Maison | null; points: number }[]
> {
  const fiches = await prisma.eleve.findMany({
    where: { statut: "ACCEPTE" },
    orderBy: { prenomNom: "asc" },
    select: { id: true, prenomNom: true, maison: true, etatMaison: true, points: true },
  });

  return fiches.map((f) => ({
    eleveId: f.id,
    prenomNom: f.prenomNom,
    maison: maisonQuiCompte(f),
    points: f.points,
  }));
}

/** Une ligne du top du mois, telle que le tableau d’une maison l’affiche. */
export type LigneDuTop = {
  eleveId: string;
  prenomNom: string;
  /** L’année, ou le titre au château qui la remplace. */
  place: string;
  /** Ce qu’il a rapporté À SA MAISON ce mois-ci. Jamais son total personnel. */
  points: number;
  /** Les ex æquo partagent leur rang : 1, 2, 2, 4. */
  rang: number;
};

/**
 * **Le top du mois d’une maison** — les cinq qui lui ont le plus rapporté.
 *
 * ⚠️ **Ce n’est pas un extrait de `Eleve.points`.** Le compteur personnel
 * traverse les années et porte les dons de l’administration ; ce top-ci
 * répond à « qui a fait vivre la maison ce mois-ci ». Il se lit donc dans le
 * carnet, sur la colonne `maison` **figée au moment du gain** : une joueuse de
 * Bryggeld nommée professeure garde ce qu’elle a rapporté en août, et ne
 * figure plus dans le top de septembre.
 *
 * **Cinq lignes quoi qu’il arrive** — décision du joueur, 28 août 2026 —, les
 * zéros compris. L’effectif vient de `maisonQuiCompte` et jamais de la colonne
 * `maison` : un professeur ne marque pour personne et n’a rien à y faire.
 *
 * Les lignes du carnet **reprises** ne comptent pas : un post masqué pour
 * correction (art. 19.3) retire son point, et le top doit dire la même chose
 * que le tube.
 *
 * À égalité, l’ordre alphabétique départage — sinon le tableau change d’ordre
 * entre deux visites sans que rien n’ait bougé.
 */
export async function topDuMois(
  maison: Maison,
  instant: Date,
  combien = 5,
): Promise<LigneDuTop[]> {
  const { debut, fin } = bornesDuMois(instant);

  // L’effectif d’abord : ce sont des têtes, et il en faut cinq même si aucune
  // n’a marqué. Une requête sur le carnet seul ne rendrait que ceux qui ont
  // des points, et le top serait vide en début de mois.
  const fiches = await prisma.eleve.findMany({
    where: { statut: "ACCEPTE", maison },
    orderBy: { prenomNom: "asc" },
    select: {
      id: true,
      prenomNom: true,
      maison: true,
      etatMaison: true,
      fonction: true,
      roleAffiche: true,
    },
  });
  const effectif = fiches.filter((f) => maisonQuiCompte(f) === maison);
  if (effectif.length === 0) return [];

  const gains = await prisma.pointGagne.groupBy({
    by: ["eleveId"],
    where: {
      maison,
      repriseLe: null,
      gagneLe: { gte: debut, lt: fin },
      eleveId: { in: effectif.map((f) => f.id) },
    },
    _sum: { points: true },
  });

  const parEleve = new Map(
    gains.map((g) => [g.eleveId, g._sum.points ?? 0] as const),
  );

  const classees = effectif
    .map((fiche) => ({
      eleveId: fiche.id,
      prenomNom: fiche.prenomNom,
      place: libellePlace(fiche.fonction, fiche.roleAffiche),
      points: parEleve.get(fiche.id) ?? 0,
    }))
    // `localeCompare` et non `<` : « Élise » se range après « Erik » avec une
    // comparaison de codes, et avant avec celle du français.
    .sort(
      (a, b) =>
        b.points - a.points || a.prenomNom.localeCompare(b.prenomNom, "fr"),
    )
    .slice(0, combien);

  const rangs = rangsPartages(classees.map((l) => l.points));
  return classees.map((ligne, i) => ({ ...ligne, rang: rangs[i]! }));
}

// ─────────────────────────────────────────────────────────────
//  Les ajustements de l’administration — art. 19.1
// ─────────────────────────────────────────────────────────────

export type ResultatAjustement =
  | { ok: true; id: string }
  | { ok: false; message: string };

/**
 * **Ajouter ou retirer des points à une maison.**
 *
 * ⚠️ **Ne touche JAMAIS aux points personnels**, et c’est toute la mesure :
 * une entorse jouée en RP (art. 19.1) coûte des points à la maison, pas son
 * année à l’élève (art. 18.4). Confondre les deux ferait redoubler quelqu’un
 * pour une retenue de fiction.
 *
 * Le motif est **obligatoire**, ici et en base : ces points s’affichent dans
 * l’historique de la maison, et personne ne doit les y trouver sans
 * explication. C’est l’inverse d’un signalement, où le motif est facultatif
 * parce que celui qui subit n’a pas à rédiger un dossier.
 *
 * **Aucun bouton ailleurs sur le site.** Un professeur ou un modérateur qui
 * veut faire retirer des points écrit à l’administration par la Tour aux
 * Corbeaux — décision du joueur. Il n’existe donc pas de permission
 * attribuable qui ouvre ce geste, et il ne faut pas en ajouter une.
 */
export async function ajusterLaMaison(
  saisonId: string,
  maison: Maison,
  points: number,
  motif: string,
  parNom: string = TEXTES_POINTS.ajustement.parDefautAuteur,
): Promise<ResultatAjustement> {
  const E = TEXTES_POINTS.ajustement.erreurs;

  if (!Number.isFinite(points) || points === 0) {
    return { ok: false, message: E.valeurRequise };
  }
  if (!Number.isInteger(points)) {
    return { ok: false, message: E.valeurEntiere };
  }

  const motifNet = nettoyerTexteLibre(motif);
  if (motifNet.length === 0) return { ok: false, message: E.motifRequis };

  const id = await transaction(async (tx) => {
    const ecrit = await tx.ajustementMaison.create({
      data: { saisonId, maison, points, motif: motifNet, parNom },
      select: { id: true },
    });
    await crediterLaMaison(tx, saisonId, maison, points);
    return ecrit.id;
  });

  return { ok: true, id };
}

/**
 * **Annuler un ajustement, sans l’effacer.**
 *
 * L’historique garde le geste ET son retrait. Un retrait de points qui
 * disparaîtrait de l’histoire serait pire qu’un retrait injuste : une maison
 * verrait son compteur remonter sans que rien n’explique pourquoi il avait
 * baissé.
 */
export async function annulerLAjustement(
  id: string,
  parNom: string = TEXTES_POINTS.ajustement.parDefautAuteur,
): Promise<boolean> {
  return transaction(async (tx) => {
    const ligne = await tx.ajustementMaison.findUnique({
      where: { id },
      select: { saisonId: true, maison: true, points: true, annuleLe: true },
    });
    if (!ligne || ligne.annuleLe) return false;

    await tx.ajustementMaison.update({
      where: { id },
      data: { annuleLe: new Date(), annulePar: parNom },
    });
    await crediterLaMaison(tx, ligne.saisonId, ligne.maison, -ligne.points);
    return true;
  });
}

/** L’historique d’une saison — le plus récent d’abord. Tout y figure. */
export async function historiqueDesAjustements(saisonId: string, maison?: Maison) {
  return prisma.ajustementMaison.findMany({
    where: { saisonId, ...(maison ? { maison } : {}) },
    orderBy: { creeLe: "desc" },
    select: {
      id: true,
      maison: true,
      points: true,
      motif: true,
      parNom: true,
      creeLe: true,
      // Les annulés restent visibles, barrés : c'est le principe même de
      // « tracé et réversible ».
      annuleLe: true,
      annulePar: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  Lire — ce que le bureau affiche
// ─────────────────────────────────────────────────────────────

/**
 * Le compteur des quatre maisons pour la saison en cours.
 *
 * **Les quatre, toujours**, même à zéro : une maison qui disparaît du tableau
 * parce qu’elle n’a rien marqué serait illisible, et le tube manquant se
 * lirait comme un défaut d’affichage.
 */
export async function compteursDeLaSaison(
  saisonId: string,
): Promise<Record<Maison, number>> {
  const lignes = await prisma.compteurMaison.findMany({
    where: { saisonId },
    select: { maison: true, points: true },
  });

  const totaux = totauxVides();
  for (const ligne of lignes) {
    if ((MAISONS as readonly string[]).includes(ligne.maison)) {
      totaux[ligne.maison] = ligne.points;
    }
  }
  return totaux;
}

/**
 * **Refaire les quatre compteurs depuis le carnet.**
 *
 * C’est le filet du lot entier. Les compteurs ne sont qu’un résumé : le jour
 * où l’un serait faux — un bug, une transaction à moitié passée, une commande
 * tapée à la main —, cette fonction le refait à partir de ce qui s’est
 * réellement produit. Sans la trace, il n’y aurait rien à quoi le comparer, et
 * il faudrait deviner.
 *
 * Ce qui entre dans le total, et rien d’autre :
 *   • les points du carnet **non repris** — un post masqué ne compte pas
 *   • les ajustements de l’administration **non annulés**
 *
 * Elle ne touche **pas** aux points personnels : ce sont deux compteurs, et
 * un ajustement de maison n’a jamais rien à voir avec eux.
 *
 * Rend les quatre totaux tels qu’ils viennent d’être écrits.
 */
export async function recalculerLesCompteurs(
  saisonId: string,
): Promise<Record<Maison, number>> {
  const [gagnes, ajustements] = await Promise.all([
    prisma.pointGagne.findMany({
      where: { saisonId, repriseLe: null, NOT: { maison: null } },
      select: { maison: true, points: true },
    }),
    prisma.ajustementMaison.findMany({
      where: { saisonId, annuleLe: null },
      select: { maison: true, points: true },
    }),
  ]);

  const totaux = totauxVides();
  for (const ligne of [...gagnes, ...ajustements]) {
    if (ligne.maison) totaux[ligne.maison] += ligne.points;
  }

  // Les quatre ensemble, dans une transaction : un recalcul à moitié écrit
  // laisserait des compteurs plus faux qu’avant de le lancer.
  await transaction(async (tx) => {
    for (const maison of MAISONS) {
      await tx.compteurMaison.upsert({
        where: { saisonId_maison: { saisonId, maison } },
        update: { points: totaux[maison] },
        create: { saisonId, maison, points: totaux[maison] },
      });
    }
  });

  return totaux;
}

/**
 * Les points personnels d’un élève — art. 18.1.
 *
 * ⚠️ **À ne jamais sommer pour obtenir le total d’une maison.** Les deux
 * compteurs ne portent pas la même chose : un ajustement de l’administration
 * (art. 19.1) va au compteur de la maison et jamais ici. Le total d’une
 * maison se lit dans `compteursDeLaSaison`, et nulle part ailleurs.
 *
 * Zéro pour une fiche qui n’existe pas — le bureau ne doit pas s’effondrer
 * pour un compte sans fiche, un cas qui ne devrait de toute façon pas exister.
 */
export async function pointsPersonnelsDe(eleveId: string): Promise<number> {
  const fiche = await prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { points: true },
  });
  return fiche?.points ?? 0;
}

/**
 * **Le tournoi, tel qu’il s’affiche** — la saison, et les quatre maisons
 * classées.
 *
 * Une seule porte pour les deux écrans qui le montrent : les tubes du bureau
 * et le tableau de l’administration. Deux lectures qui calculeraient chacune
 * leur moyenne finiraient par se contredire, et c’est le genre de désaccord
 * qu’on ne remarque qu’en le voyant à l’écran, trop tard.
 *
 * Rend `null` s’il n’y a pas de saison ouverte — l’écran le dit alors, plutôt
 * que d’afficher quatre zéros qui laisseraient croire à un tournoi vide.
 */
export type Tournoi = {
  saison: Saison & { ouverteLe: Date };
  lignes: LigneDeClassement[];
};

export async function lireLeTournoi(): Promise<Tournoi | null> {
  const saison = await prisma.saisonScolaire.findFirst({
    where: { closeLe: null },
    select: { id: true, nom: true, ouverteLe: true },
  });
  if (!saison) return null;

  const [totaux, compte] = await Promise.all([
    compteursDeLaSaison(saison.id),
    effectifs(),
  ]);

  return { saison, lignes: classement(totaux, compte) };
}

/**
 * L’effectif des quatre maisons.
 *
 * Le dépôt écarte ce qui relève du dossier — candidature non acceptée, compte
 * archivé (art. 7.3) — puis passe la liste **brute** à `effectifsParMaison`,
 * qui fait le tri des maisons lui-même. C’est le même parti pris que partout
 * ailleurs : la règle « qui compte pour sa maison » ne se recopie pas dans un
 * `where`, elle s’appelle.
 *
 * Un membre suspendu compte — il garde son blason, il reste de sa maison.
 */
export async function effectifs(): Promise<Record<Maison, number>> {
  const membres = await prisma.eleve.findMany({
    where: { statut: "ACCEPTE", utilisateur: { archiveLe: null } },
    select: { maison: true, etatMaison: true },
  });
  return effectifsParMaison(membres);
}

// ─────────────────────────────────────────────────────────────
//  Lire — les années passées
// ─────────────────────────────────────────────────────────────

/** Une année close, telle qu’elle a été figée le soir de sa clôture. */
export type AnneeArchivee = {
  saison: Saison & { ouverteLe: Date; closeLe: Date };
  /** Les quatre maisons, **dans l’ordre de `MAISONS`** — jamais triées. */
  lignes: {
    maison: Maison;
    points: number;
    effectif: number;
    moyenne: number;
    rang: number;
  }[];
  /** La maison de rang 1, ou `null` si les quatre étaient à zéro. */
  gagnante: Maison | null;
};

/**
 * **Le palmarès : ce que chaque année close a donné.**
 *
 * `ClassementArchive` était écrit à chaque clôture depuis le 27 août 2026 et
 * **n’était lu nulle part** — un déclencheur le protège de toute réécriture,
 * pour une table que personne ne voyait. C’est cette page qui lui donne sa
 * raison d’être : sans elle, clore une année ne laissait aucune trace visible
 * d’un joueur.
 *
 * ⚠️ **Rien n’est recalculé ici, et il ne faut pas le faire.** Les chiffres
 * sortent de l’archive telle quelle : les effectifs ont bougé depuis, des
 * comptes sont partis, et une moyenne refaite aujourd’hui donnerait un autre
 * classement que celui qu’on a annoncé le soir de la clôture. C’est le même
 * principe que `placeConservee` et que l’année figée d’un sujet.
 *
 * L’ordre des quatre lignes est celui de `MAISONS`, comme partout : le rang
 * voyage sur la ligne, et un tableau dont les lignes changent de place entre
 * deux visites est illisible.
 */
export async function palmares(): Promise<AnneeArchivee[]> {
  const saisons = await prisma.saisonScolaire.findMany({
    where: { NOT: { closeLe: null } },
    orderBy: { closeLe: "desc" },
    select: {
      id: true,
      nom: true,
      ouverteLe: true,
      closeLe: true,
      classement: {
        select: {
          maison: true,
          points: true,
          effectif: true,
          moyenne: true,
          rang: true,
        },
      },
    },
  });

  return saisons.map((saison) => {
    const parMaison = new Map(saison.classement.map((l) => [l.maison, l]));
    const lignes = MAISONS.map((maison) => {
      const ligne = parMaison.get(maison);
      // Une maison absente de l'archive n'est pas censée exister — la clôture
      // pose les quatre ensemble. On la montre à zéro plutôt que de la faire
      // disparaître du tableau : un trou se lirait comme un défaut d'écran.
      return {
        maison,
        points: ligne?.points ?? 0,
        effectif: ligne?.effectif ?? 0,
        moyenne: ligne?.moyenne ?? 0,
        rang: ligne?.rang ?? 1,
      };
    });

    return {
      saison: {
        id: saison.id,
        nom: saison.nom,
        ouverteLe: saison.ouverteLe,
        closeLe: saison.closeLe as Date,
      },
      lignes,
      // **Pas de colonne « gagnante »** : c'est la maison de rang 1, et
      // encore faut-il qu'elle ait marqué. Quatre maisons à zéro n'ont pas de
      // vainqueur, et en désigner un par le seul ordre alphabétique serait
      // faux. Même lecture qu'à la clôture.
      gagnante: lignes.find((l) => l.rang === 1 && l.points > 0)?.maison ?? null,
    };
  });
}
