import "server-only";
import { transaction } from "@/lib/base/transaction";
import {
  anneeSuivante,
  libelleAnnee,
  MAISONS,
  type Fonction,
  type Maison,
} from "@/lib/dossier/etats";
import { classement, maisonQuiCompte } from "@/lib/ecole/tournoi";
import { prisma } from "@/lib/prisma";
import { nettoyerTexteLibre } from "@/lib/texte";
import { TEXTES_POINTS } from "./constantes";
import { compteursDeLaSaison, effectifs } from "./depot";

/**
 * **La clôture d’une année scolaire — art. 18.3.**
 *
 * « Une année scolaire dure six mois en temps réel. Elle se clôt à une date
 * d’épreuves finales commune à tout le site. »
 *
 * Trois gestes, et un seul instant :
 *
 *   1. le classement final est **archivé**, figé — maison gagnante, moyennes,
 *      effectifs du jour
 *   2. les compteurs de maison **repartent à zéro**
 *   3. les élèves cochés **passent à l’année suivante**
 *
 * ⚠️ **Les points personnels ne sont PAS remis à zéro.** Ils portent la
 * progression de l’élève et traversent les années (art. 18.4). C’est le
 * compteur de la maison, et lui seul, qui repart de zéro.
 *
 * ── Rien ne se remet à zéro, en vérité ──
 *
 * On n’efface aucun compteur : on **ouvre une saison neuve**, et les points
 * y vont désormais. Ceux de l’année passée restent lisibles dans leur saison,
 * avec leur carnet entier. C’est la règle de toute la maison — rien n’est
 * jamais effacé — et c’est ce qui permet de refaire un total six mois après.
 *
 * ── Qui passe : le joueur, élève par élève ──
 *
 * Le règlement dit « conditions de passage précises à définir » (art. 18.5) :
 * il n’y a donc **aucune règle à appliquer**, et en inventer une trancherait à
 * la place du joueur. L’écran montre chaque élève avec ses points, et il coche.
 * La règle s’écrira quand il l’aura vue à l’œuvre une fois.
 *
 * ── Rien ne se déclenche sur une date ──
 *
 * Décision du joueur : il veut lancer la première lui-même. Aucune tâche
 * planifiée, aucun calendrier — un bouton, dans la zone d’administration.
 */

export type Passage = {
  eleveId: string;
  prenomNom: string;
  /** Son année aujourd’hui. */
  fonction: Fonction;
  /** L’année d’après, ou `null` en septième : la ligne n’est alors pas cochable. */
  versLAnnee: Fonction | null;
  points: number;
  maison: Maison | null;
};

export type AVenir = {
  saison: { id: string; nom: string; ouverteLe: Date };
  /** Le classement tel qu’il sera archivé si l’on clôt maintenant. */
  classement: ReturnType<typeof classement>;
  /** Les élèves, du plus avancé au moins avancé. */
  eleves: Passage[];
};

/**
 * Ce que la clôture ferait, si on la lançait maintenant.
 *
 * **Aucune écriture.** L’écran montre exactement ce qui sera figé, et le
 * joueur décide ensuite. Un bouton qui archive sans montrer ce qu’il archive
 * ne se presse pas deux fois.
 */
export async function ceQueLaClotureFerait(): Promise<AVenir | null> {
  const saison = await prisma.saisonScolaire.findFirst({
    where: { closeLe: null },
    select: { id: true, nom: true, ouverteLe: true },
  });
  if (!saison) return null;

  const [totaux, compte, fiches] = await Promise.all([
    compteursDeLaSaison(saison.id),
    effectifs(),
    prisma.eleve.findMany({
      where: {
        statut: "ACCEPTE",
        utilisateur: { archiveLe: null, compteDeService: false },
      },
      select: {
        id: true,
        prenomNom: true,
        fonction: true,
        points: true,
        maison: true,
        etatMaison: true,
      },
    }),
  ]);

  const eleves: Passage[] = fiches
    .map((f) => ({
      eleveId: f.id,
      prenomNom: f.prenomNom,
      fonction: f.fonction as Fonction,
      versLAnnee: anneeSuivante(f.fonction as Fonction),
      points: f.points,
      // La maison qui compte, jamais la colonne : une directrice n'apparaît
      // sous aucune bannière, même si Tideål reste écrite sur sa fiche.
      maison: maisonQuiCompte(f),
    }))
    .sort((a, b) => b.points - a.points || a.prenomNom.localeCompare(b.prenomNom, "fr"));

  return { saison, classement: classement(totaux, compte), eleves };
}

export type ResultatCloture =
  | {
      ok: true;
      /** La maison de rang 1, ou `null` si les quatre sont à égalité à zéro. */
      gagnante: Maison | null;
      passes: number;
      nouvelleSaisonId: string;
    }
  | { ok: false; message: string };

/**
 * **Clore la saison, et ouvrir la suivante.**
 *
 * Tout dans une seule transaction : une clôture à moitié faite laisserait
 * deux saisons ouvertes — la base l’interdit —, ou aucune, et les points
 * suivants n’auraient nulle part où se poser.
 *
 * ⚠️ Le passage des élèves y est compris. À quelques dizaines de fiches, la
 * transaction tient largement dans ses quinze secondes ; à plusieurs
 * centaines, c’est **ici** qu’il faudra la couper en deux, et nulle part
 * ailleurs.
 */
export async function cloturerLaSaison(
  nomDeLaSuivante: string,
  passages: readonly string[],
  parNom: string = TEXTES_POINTS.ajustement.parDefautAuteur,
): Promise<ResultatCloture> {
  const E = TEXTES_POINTS.cloture.erreurs;

  const nomNet = nettoyerTexteLibre(nomDeLaSuivante);
  if (nomNet.length === 0) return { ok: false, message: E.nomRequis };

  const avenir = await ceQueLaClotureFerait();
  if (!avenir) return { ok: false, message: E.aucuneSaison };

  // Les fiches à faire passer, relues ici : l'écran a pu être laissé ouvert
  // une heure, et une année ne se lit pas dans un champ caché.
  const aFairePasser = avenir.eleves.filter(
    (e) => passages.includes(e.eleveId) && e.versLAnnee !== null,
  );

  const gagnante =
    avenir.classement.find((l) => l.rang === 1 && l.pointsAuTournoi > 0)?.maison ??
    null;

  const nouvelle = await transaction(async (tx) => {
    // 1 — Le classement, figé. La base refusera toute réécriture ensuite.
    await tx.classementArchive.createMany({
      data: avenir.classement.map((l) => ({
        saisonId: avenir.saison.id,
        maison: l.maison,
        // Ce qui est archivé est ce qui a compté : le plancher à zéro est
        // déjà appliqué, et l'archive ne doit pas dire autre chose que ce
        // que les tubes montraient la veille.
        points: l.pointsAuTournoi,
        effectif: l.effectif,
        moyenne: l.moyenne,
        rang: l.rang,
      })),
    });

    // 2 — La saison se ferme, et la suivante s'ouvre. Dans cet ordre : la
    // base n'accepte qu'une seule saison ouverte à la fois.
    await tx.saisonScolaire.update({
      where: { id: avenir.saison.id },
      data: { closeLe: new Date() },
    });

    const suivante = await tx.saisonScolaire.create({
      data: { nom: nomNet },
      select: { id: true },
    });

    // 3 — Les quatre compteurs neufs, à zéro. Posés ensemble : une maison
    // sans ligne disparaîtrait du tableau au lieu d'y figurer vide.
    await tx.compteurMaison.createMany({
      data: MAISONS.map((maison) => ({ saisonId: suivante.id, maison, points: 0 })),
    });

    // 4 — Les passages. Les points personnels ne bougent pas : ils portent la
    // progression, et c'est justement ce qu'on vient de récompenser.
    for (const eleve of aFairePasser) {
      await tx.eleve.update({
        where: { id: eleve.eleveId },
        data: { fonction: eleve.versLAnnee! },
      });
      const compte = await tx.eleve.findUnique({
        where: { id: eleve.eleveId },
        select: { utilisateurId: true },
      });
      if (!compte) continue;
      await tx.journalMembre.create({
        data: {
          utilisateurId: compte.utilisateurId,
          type: "FONCTION_MODIFIEE",
          valeurAvant: libelleAnnee(eleve.fonction),
          valeurApres: libelleAnnee(eleve.versLAnnee!),
          note: TEXTES_POINTS.cloture.noteJournal.replace("{saison}", avenir.saison.nom),
          parNom,
        },
      });
    }

    return suivante.id;
  });

  return { ok: true, gagnante, passes: aFairePasser.length, nouvelleSaisonId: nouvelle };
}

/** Les saisons closes et leur classement — la mémoire du tournoi. */
export async function listerLesSaisonsCloses() {
  return prisma.saisonScolaire.findMany({
    where: { NOT: { closeLe: null } },
    orderBy: { closeLe: "desc" },
    select: {
      id: true,
      nom: true,
      ouverteLe: true,
      closeLe: true,
      classement: {
        orderBy: { rang: "asc" },
        select: { maison: true, points: true, effectif: true, moyenne: true, rang: true },
      },
    },
  });
}
