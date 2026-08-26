import "server-only";
import { prisma } from "@/lib/prisma";
import type { LigneContexte } from "./depot";

/**
 * **La seule fenêtre du staff sur les échanges privés.**
 *
 * Ce fichier est séparé de `depot.ts`, et cette séparation est la mesure
 * elle-même : il ne touche qu’à une table, `signalements`, et n’importe **rien**
 * de l’autre côté — ni conversations, ni messages, ni participations, ni
 * blocages. Il n’en a pas besoin, parce que tout ce que la modération lit
 * tient dans `Signalement.contexte` : une copie figée, recopiée au moment du
 * clic, qu’un déclencheur en base interdit de réécrire.
 *
 * Autrement dit : il n’existe **aucun chemin** de `/admin` vers une
 * conversation. Pas une requête à ne pas écrire — un chemin qui n’existe pas.
 * `etancheite.test.ts` relit le code source des deux fichiers et le vérifie.
 *
 * ── Ce qu’on ne trouvera jamais ici ──
 *
 *   • lire la boîte d’un membre
 *   • chercher dans les messages
 *   • ouvrir la conversation d’où vient un signalement
 *   • exporter quoi que ce soit
 *
 * Si l’un de ces besoins se présente un jour, **c’est une décision du joueur**,
 * pas un ajout de commodité. Le dire au lieu de l’écrire.
 *
 * Art. 8.6 — les signalements sont confidentiels. Le staff voit qui a
 * signalé, parce qu’il doit pouvoir repérer les signalements abusifs et
 * répétés, qui sont eux-mêmes sanctionnables. **La personne visée, elle, ne
 * l’apprend jamais** : rien de cette table ne redescend côté joueur.
 */

export type StatutSignalement = "EN_ATTENTE" | "TRAITE" | "CLASSE_SANS_SUITE";

export type SignalementEnListe = {
  id: string;
  creeLe: string;
  statut: StatutSignalement;
  /** Le nom du personnage visé, ou `null` si le compte a été supprimé. */
  vise: string | null;
  /** Celui qui a signalé — pour repérer les abus (art. 8.6). */
  par: string | null;
  motif: string | null;
  /** Combien de corbeaux dans la copie. Le contenu ne voyage pas dans la liste. */
  corbeaux: number;
  traiteLe: string | null;
  traitePar: string | null;
  noteTraitement: string | null;
};

export type SignalementComplet = SignalementEnListe & {
  contexte: LigneContexte[];
  /** Le corbeau visé existe-t-il encore ? Sa copie, elle, est là quoi qu’il arrive. */
  messageEncoreLa: boolean;
};

const CHAMPS = {
  id: true,
  creeLe: true,
  statut: true,
  motif: true,
  messageId: true,
  traiteLe: true,
  traitePar: true,
  noteTraitement: true,
  contexte: true,
  vise: { select: { eleve: { select: { prenomNom: true } } } },
  par: { select: { eleve: { select: { prenomNom: true } } } },
} as const;

type Ligne = {
  id: string;
  creeLe: Date;
  statut: string;
  motif: string | null;
  messageId: string | null;
  traiteLe: Date | null;
  traitePar: string | null;
  noteTraitement: string | null;
  contexte: unknown;
  vise: { eleve: { prenomNom: string } | null } | null;
  par: { eleve: { prenomNom: string } | null } | null;
};

/**
 * Le contexte est un `Json` : la base garantit que c’est une liste non vide,
 * mais pas ce qu’il y a dedans. On le relit donc prudemment plutôt que de
 * faire confiance au type — une ligne écrite par une version antérieure ne
 * doit pas casser l’écran de modération.
 */
function lireContexte(brut: unknown): LigneContexte[] {
  if (!Array.isArray(brut)) return [];
  return brut.flatMap((ligne) => {
    if (!ligne || typeof ligne !== "object") return [];
    const l = ligne as Record<string, unknown>;
    if (typeof l.corps !== "string") return [];
    return [
      {
        auteur: typeof l.auteur === "string" ? l.auteur : "—",
        envoyeLe: typeof l.envoyeLe === "string" ? l.envoyeLe : "",
        corps: l.corps,
        ...(l.vise === true ? { vise: true as const } : {}),
      },
    ];
  });
}

function enListe(ligne: Ligne): SignalementEnListe {
  return {
    id: ligne.id,
    creeLe: ligne.creeLe.toISOString(),
    statut: ligne.statut as StatutSignalement,
    vise: ligne.vise?.eleve?.prenomNom ?? null,
    par: ligne.par?.eleve?.prenomNom ?? null,
    motif: ligne.motif,
    corbeaux: lireContexte(ligne.contexte).length,
    traiteLe: ligne.traiteLe?.toISOString() ?? null,
    traitePar: ligne.traitePar,
    noteTraitement: ligne.noteTraitement,
  };
}

/**
 * La file de la modération : ce qui attend d’abord, le reste ensuite.
 *
 * Le contenu des corbeaux ne voyage pas jusqu’ici — seulement leur nombre.
 * Une liste qui afficherait les textes mettrait des fragments d’échanges
 * privés sur un écran qu’on laisse ouvert.
 */
export async function listerSignalements(): Promise<SignalementEnListe[]> {
  const lignes = await prisma.signalement.findMany({
    orderBy: [{ statut: "asc" }, { creeLe: "desc" }],
    take: 100,
    select: CHAMPS,
  });
  return lignes.map(enListe);
}

/** Un signalement, avec sa copie. Rien d’autre n’est joignable depuis ici. */
export async function lireSignalement(
  id: string,
): Promise<SignalementComplet | null> {
  const ligne = await prisma.signalement.findUnique({
    where: { id },
    select: CHAMPS,
  });
  if (!ligne) return null;

  return {
    ...enListe(ligne),
    contexte: lireContexte(ligne.contexte),
    messageEncoreLa: ligne.messageId !== null,
  };
}

/** Combien attendent d’être lus — pour l’accueil de l’administration. */
export async function signalementsEnAttente(): Promise<number> {
  return prisma.signalement.count({ where: { statut: "EN_ATTENTE" } });
}

/**
 * Traiter un signalement, ou le classer sans suite.
 *
 * Ni le contexte ni la personne visée ne peuvent bouger : le déclencheur en
 * base le refuse. Ce qu’on écrit ici est une décision, jamais une correction
 * de la preuve.
 *
 * `traitePar` vaut « Administration » tant que la zone d’administration n’est
 * qu’un mot de passe partagé, sans comptes distincts : le site n’a personne
 * d’autre à nommer. Même convention que `roleAffichePosePar`.
 */
export async function traiterSignalement(
  id: string,
  statut: Exclude<StatutSignalement, "EN_ATTENTE">,
  note: string | null,
): Promise<boolean> {
  const ecrit = await prisma.signalement.updateMany({
    where: { id },
    data: {
      statut,
      traiteLe: new Date(),
      traitePar: "Administration",
      noteTraitement: note,
    },
  });
  return ecrit.count === 1;
}
