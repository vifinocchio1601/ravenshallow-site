import "server-only";
import { transaction } from "@/lib/base/transaction";
import { prisma } from "@/lib/prisma";

/**
 * **L’archivage d’un compte — art. 7.3.**
 *
 * « Après trois mois d’inactivité, le compte peut être archivé. Le retour
 * reste possible : le personnage est restauré avec sa progression. »
 *
 * ── Ce que l’archivage est, et ce qu’il n’est pas ──
 *
 * Il **ne touche pas à `statutAcces`**, et c’est ce qui le distingue d’une
 * sanction : un compte archivé n’est pas mis à la porte. Il sort seulement de
 * l’effectif de sa maison — sans quoi une maison à moitié absente serait
 * pénalisée au tournoi par des joueurs qui ne jouent plus.
 *
 * **Une connexion le lève d’elle-même.** L’article le promet ; le code doit le
 * tenir sans qu’il faille écrire à l’administration pour rentrer chez soi.
 *
 * ── Pourquoi ce fichier n’est pas dans `depot.ts` ──
 *
 * Le dépôt des dossiers aiguille encore entre PostgreSQL et l’échafaudage
 * JSON des débuts. L’archivage arrive bien après la base et n’a jamais eu de
 * version en mémoire : lui inventer une aujourd’hui serait écrire un chemin
 * que personne n’emprunte, et que personne ne vérifierait.
 */

/** Le nom qui reste au journal. La zone d’administration n’a pas de comptes. */
const AUTEUR = "Administration";

/**
 * **La connexion réussie, notée — et l’archivage levé s’il y en avait un.**
 *
 * Appelée par la route de connexion, après vérification du mot de passe et
 * jamais avant : une tentative ratée n’est pas une visite.
 *
 * Elle **n’échoue jamais bruyamment**. Si l’écriture rate — base endormie,
 * incident —, le joueur entre quand même : il vient de donner le bon mot de
 * passe, et une statistique de fréquentation n’a pas à lui fermer la porte.
 * Le seul coût est une date un peu ancienne, qu’une prochaine visite corrigera.
 */
export async function noterLaConnexion(utilisateurId: string): Promise<void> {
  try {
    const avant = await prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { archiveLe: true },
    });

    if (!avant?.archiveLe) {
      await prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: { derniereConnexionLe: new Date() },
      });
      return;
    }

    // Le retour d'un absent : la date et la levée dans la même transaction,
    // avec sa trace. Sans le journal, il ne resterait rien de l'archivage
    // une fois les deux colonnes vidées.
    await transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id: utilisateurId },
        data: {
          derniereConnexionLe: new Date(),
          archiveLe: null,
          archivePar: null,
        },
      });
      await tx.journalMembre.create({
        data: {
          utilisateurId,
          type: "COMPTE_RESTAURE",
          note: "Retour du membre : l’archivage est levé de lui-même (art. 7.3).",
          parNom: AUTEUR,
        },
      });
    });
  } catch (erreur) {
    console.error("[archivage] la connexion n’a pas pu être notée", erreur);
  }
}

// ─────────────────────────────────────────────────────────────
//  Les gestes de l’administration
// ─────────────────────────────────────────────────────────────

/**
 * Mettre un compte de côté.
 *
 * Rien n’est effacé, rien n’est fermé : la fiche, les scènes, les points et
 * la boîte restent entiers. **Le retour est un simple retour**, pas une
 * demande à formuler.
 */
export async function archiverLeCompte(
  utilisateurId: string,
  parNom: string = AUTEUR,
): Promise<boolean> {
  return transaction(async (tx) => {
    const { count } = await tx.utilisateur.updateMany({
      // Un second clic n'archive pas deux fois, et n'écrit pas deux lignes.
      where: { id: utilisateurId, archiveLe: null },
      data: { archiveLe: new Date(), archivePar: parNom },
    });
    if (count === 0) return false;

    await tx.journalMembre.create({
      data: { utilisateurId, type: "COMPTE_ARCHIVE", parNom },
    });
    return true;
  });
}

/** Le rendre à l’école, à la main — l’autre chemin étant la connexion. */
export async function restaurerLeCompte(
  utilisateurId: string,
  parNom: string = AUTEUR,
): Promise<boolean> {
  return transaction(async (tx) => {
    const { count } = await tx.utilisateur.updateMany({
      where: { id: utilisateurId, NOT: { archiveLe: null } },
      data: { archiveLe: null, archivePar: null },
    });
    if (count === 0) return false;

    await tx.journalMembre.create({
      data: { utilisateurId, type: "COMPTE_RESTAURE", parNom },
    });
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  Lire — l’écran des absences
// ─────────────────────────────────────────────────────────────

/** Trois mois, en jours — art. 7.3. C’est le règlement, pas un réglage. */
export const JOURS_AVANT_ARCHIVAGE = 90;

export type LigneAbsence = {
  utilisateurId: string;
  prenomNom: string;
  email: string;
  /** Nulle si le compte ne s’est jamais connecté depuis que la date est notée. */
  derniereConnexionLe: string | null;
  /** Nul si le compte est actif. */
  archiveLe: string | null;
  archivePar: string | null;
  /** Depuis combien de jours ce compte n’est pas venu, ou `null` si on l’ignore. */
  joursDAbsence: number | null;
  /** L’article 7.3 est-il atteint ? Faux quand la date manque : on ne devine pas. */
  archivable: boolean;
};

/**
 * Les membres, du plus absent au plus récent.
 *
 * **Rien ne s’archive tout seul** : cet écran donne le fait, et c’est le
 * joueur qui décide. Décision du 27 août 2026, la même que pour la clôture
 * d’année — un compte fermé sans que personne l’ait voulu se vit très mal.
 *
 * ⚠️ **Une date manquante ne vaut PAS une absence.** La colonne n’existe que
 * depuis le 27 août 2026 : tous les comptes créés avant sont à `null` sans
 * s’être absentés une seule journée. Les archiver sur cette base fermerait
 * l’école à tout le monde d’un clic. C’est pourquoi `archivable` est faux
 * dans ce cas, et le restera jusqu’à ce que chacun soit repassé.
 */
export async function listerLesAbsences(): Promise<LigneAbsence[]> {
  const membres = await prisma.utilisateur.findMany({
    where: { eleve: { statut: "ACCEPTE" } },
    select: {
      id: true,
      email: true,
      derniereConnexionLe: true,
      archiveLe: true,
      archivePar: true,
      eleve: { select: { prenomNom: true } },
    },
  });

  const maintenant = Date.now();
  const UN_JOUR = 24 * 60 * 60 * 1000;

  return membres
    .map((m) => {
      const jours = m.derniereConnexionLe
        ? Math.floor((maintenant - m.derniereConnexionLe.getTime()) / UN_JOUR)
        : null;
      return {
        utilisateurId: m.id,
        prenomNom: m.eleve?.prenomNom ?? m.email,
        email: m.email,
        derniereConnexionLe: m.derniereConnexionLe?.toISOString() ?? null,
        archiveLe: m.archiveLe?.toISOString() ?? null,
        archivePar: m.archivePar,
        joursDAbsence: jours,
        archivable:
          m.archiveLe === null && jours !== null && jours >= JOURS_AVANT_ARCHIVAGE,
      };
    })
    .sort((a, b) => {
      // Les archivés à la fin : ce sont les absents qu'on vient chercher ici.
      if ((a.archiveLe === null) !== (b.archiveLe === null)) {
        return a.archiveLe === null ? -1 : 1;
      }
      // Puis du plus absent au plus récent. Une date inconnue passe après
      // celles qu'on connaît : on ne peut rien en dire.
      const ja = a.joursDAbsence ?? -1;
      const jb = b.joursDAbsence ?? -1;
      return jb - ja;
    });
}
