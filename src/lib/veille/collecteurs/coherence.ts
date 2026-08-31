import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { MAISONS, type Maison } from "@/lib/dossier/etats";
import { totauxDepuisLeCarnet } from "@/lib/points/carnet";
import type { Anomalie } from "../anomalies";
import type { Recolte } from "../collecte";
import { TEXTES } from "../constantes";
import { PREMIERS_PAS_EN_ATTENTE_JOURS } from "../reglages";

/**
 * Les dégâts silencieux — ceux que personne ne voit à l'écran.
 *
 * ── Ce que ce collecteur cherche ──
 *
 * Pas des pannes : des choses qui ne vont pas et qui ne se plaindront jamais.
 * Un compteur de maison qui a dérivé de son carnet s'affiche parfaitement ; il
 * est simplement faux, et le tournoi se joue dessus.
 *
 * ── Chaque contrôle est indépendant ──
 *
 * Un contrôle qui tombe n'emporte pas les six autres. C'est le principe de la
 * ronde, appliqué un cran plus bas : si la table des permissions disparaissait,
 * on veut quand même savoir si les compteurs sont justes.
 */

export type Coherence = {
  /** Ce qui a été vérifié, et ce qui a été trouvé. */
  controles: { nom: string; verifie: number; fautifs: number; tombe: string | null }[];
};

/** Le client, réduit à ce que ce collecteur lit. */
export type Lecteur = PrismaClient;

export type Options = {
  base: Lecteur;
  instant: Date;
  /** La racine du dépôt, pour vérifier les fichiers. Absente, on saute. */
  racine?: string;
};

type Controle = {
  nom: string;
  /** Rend ce qui a été vérifié, ce qui est fautif, et les anomalies. */
  faire: () => Promise<{ verifie: number; anomalies: Anomalie[] }>;
};

export async function collecterLaCoherence({
  base,
  instant,
  racine,
}: Options): Promise<Recolte<Coherence>> {
  const controles: Controle[] = [
    { nom: "compteurs de maison", faire: () => compteursContreCarnet(base) },
    { nom: "états de maison et de baguette", faire: () => etatsIncoherents(base) },
    { nom: "premiers pas en attente", faire: () => premiersPasEnAttente(base, instant) },
    { nom: "scènes sans message", faire: () => scenesSansMessage(base) },
    { nom: "portraits illisibles", faire: () => portraitsIllisibles(base) },
    { nom: "pouvoirs sur comptes archivés", faire: () => pouvoirsOrphelins(base) },
    { nom: "images du dépôt", faire: () => imagesManquantes(racine) },
    { nom: "consignes apparentes", faire: () => consignesApparentes(base) },
  ];

  const anomalies: Anomalie[] = [];
  const resultats: Coherence["controles"] = [];

  for (const controle of controles) {
    try {
      const { verifie, anomalies: siennes } = await controle.faire();
      anomalies.push(...siennes);
      resultats.push({
        nom: controle.nom,
        verifie,
        fautifs: siennes.length,
        tombe: null,
      });
    } catch (erreur) {
      // ⚠️ Un contrôle qui tombe est lui-même une anomalie : le taire ferait
      // passer un trou pour un calme.
      resultats.push({
        nom: controle.nom,
        verifie: 0,
        fautifs: 0,
        tombe: erreur instanceof Error ? erreur.message : String(erreur),
      });
      anomalies.push({
        cle: `coherence:controle-tombe:${controle.nom}`,
        gravite: "A_SURVEILLER",
        quoi: `Le contrôle « ${controle.nom} » n’a pas abouti.`,
        ou: "la ronde elle-même",
        detail: erreur instanceof Error ? erreur.message : undefined,
      });
    }
  }

  return { donnees: { controles: resultats }, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  1. Les compteurs correspondent-ils au carnet ?
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **L'addition n'est pas refaite ici** : elle vient de
 * `points/carnet.ts`, la même que celle dont le site se sert pour recalculer.
 * La recopier ferait de La Veille le juge de ses propres calculs.
 */
async function compteursContreCarnet(base: Lecteur) {
  const saison = await base.saisonScolaire.findFirst({
    where: { closeLe: null },
    select: { id: true, nom: true },
  });
  if (!saison) return { verifie: 0, anomalies: [] };

  const attendus = await totauxDepuisLeCarnet(base, saison.id);
  const compteurs = await base.compteurMaison.findMany({
    where: { saisonId: saison.id },
    select: { maison: true, points: true },
  });

  const tenus = Object.fromEntries(compteurs.map((c) => [c.maison, c.points])) as Record<
    Maison,
    number | undefined
  >;

  const anomalies: Anomalie[] = [];
  for (const maison of MAISONS) {
    const tenu = tenus[maison];
    const attendu = attendus[maison];

    if (tenu === undefined) {
      anomalies.push({
        cle: `coherence:compteur-absent:${maison}`,
        gravite: "DEGAT",
        quoi: `La maison n’a pas de compteur pour la saison en cours.`,
        ou: `compteurs_maison — ${maison}`,
      });
      continue;
    }

    if (tenu !== attendu) {
      anomalies.push({
        // ⚠️ Ni l'écart ni les totaux dans la clé : ils changent à chaque
        // point marqué, et l'anomalie ne durerait jamais.
        cle: `coherence:compteur-derive:${maison}`,
        gravite: "DEGAT",
        quoi:
          "Le compteur de la maison ne correspond pas au carnet. " +
          "Un recalcul depuis /admin/points remettrait les quatre d’aplomb.",
        ou: `compteurs_maison — ${maison}`,
        detail: `compteur ${tenu}, carnet ${attendu}`,
      });
    }
  }

  return { verifie: MAISONS.length, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  2. Un état qui ne s'accorde pas avec sa valeur
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **La base l'interdit déjà**, par une contrainte de
 * `20260825220000_etat_maison_baguette`. Ce contrôle est donc censé ne rien
 * trouver — et c'est précisément pour cela qu'il vaut la peine : s'il trouve
 * quelque chose, c'est que la contrainte a été levée, ou qu'une migration l'a
 * défaite. C'est la ceinture par-dessus les bretelles.
 */
async function etatsIncoherents(base: Lecteur) {
  const fiches = await base.eleve.findMany({
    select: {
      id: true,
      etatMaison: true,
      maison: true,
      etatBaguette: true,
      baguetteBois: true,
      baguetteCoeur: true,
    },
  });

  const anomalies: Anomalie[] = [];
  const fautifs: string[] = [];

  for (const f of fiches) {
    const maisonFautive =
      (f.etatMaison === "FAIT" && !f.maison) ||
      (f.etatMaison === "NON_FAIT" && f.maison);
    const baguetteFautive =
      (f.etatBaguette === "FAIT" && (!f.baguetteBois || !f.baguetteCoeur)) ||
      (f.etatBaguette === "NON_FAIT" && (f.baguetteBois || f.baguetteCoeur));

    if (maisonFautive || baguetteFautive) fautifs.push(f.id);
  }

  if (fautifs.length > 0) {
    anomalies.push({
      cle: "coherence:etat-contre-valeur",
      gravite: "DEGAT",
      quoi:
        "Des fiches portent un état qui ne s’accorde pas avec leur valeur — " +
        "« fait » sans maison, ou une maison sous « non fait ». La base " +
        "l’interdit : si cela remonte, une contrainte a sauté.",
      ou: "eleves",
      // ⚠️ Un identifiant de fiche, jamais un nom : il faut pouvoir la
      // retrouver dans l’administration sans nommer personne.
      detail: `${fautifs.length} fiche(s) : ${fautifs.slice(0, 5).join(", ")}`,
    });
  }

  return { verifie: fiches.length, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  3. Des dossiers acceptés qui n'ont jamais fait leurs premiers pas
// ─────────────────────────────────────────────────────────────

async function premiersPasEnAttente(base: Lecteur, instant: Date) {
  const limite = new Date(
    instant.getTime() - PREMIERS_PAS_EN_ATTENTE_JOURS * 24 * 60 * 60 * 1000,
  );

  const fiches = await base.eleve.findMany({
    where: {
      statut: "ACCEPTE",
      decideLe: { lt: limite },
      // « Sans objet » est une réponse, pas une attente : une directrice n’a
      // rien à faire au Miroir.
      OR: [{ etatMaison: "NON_FAIT" }, { etatBaguette: "NON_FAIT" }],
      utilisateur: { compteDeService: false, archiveLe: null },
    },
    select: { id: true },
  });

  const anomalies: Anomalie[] =
    fiches.length === 0
      ? []
      : [
          {
            cle: "coherence:premiers-pas-en-attente",
            gravite: "A_SURVEILLER",
            quoi:
              `${fiches.length} dossier(s) acceptés depuis plus de ` +
              `${PREMIERS_PAS_EN_ATTENTE_JOURS} jours n’ont toujours ni maison ` +
              "ni baguette. Joueurs perdus, ou écran qui ne s’ouvre pas.",
            ou: "la Cérémonie et Bjornstav",
            detail: `${fiches.length} fiche(s)`,
          },
        ];

  return { verifie: fiches.length, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  4. Des scènes sans le moindre message
// ─────────────────────────────────────────────────────────────

async function scenesSansMessage(base: Lecteur) {
  const sujets = await base.sujet.findMany({
    where: { supprimeLe: null },
    select: { id: true, _count: { select: { posts: true } } },
  });

  const vides = sujets.filter((s) => s._count.posts === 0);

  const anomalies: Anomalie[] =
    vides.length === 0
      ? []
      : [
          {
            cle: "coherence:scene-sans-message",
            gravite: "DEGAT",
            quoi:
              "Des scènes existent sans le moindre message. Elles s’affichent " +
              "dans les listes et s’ouvrent sur rien.",
            ou: "sujets",
            detail: `${vides.length} scène(s) : ${vides.slice(0, 5).map((s) => s.id).join(", ")}`,
          },
        ];

  return { verifie: sujets.length, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  5. Des portraits référencés mais illisibles
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **On ne lit jamais `portraitUrl` lui-même** — deux cents kilo-octets par
 * fiche, et la ronde en lirait des dizaines pour rien. On demande à Postgres
 * de juger sur place : la colonne commence-t-elle par `data:image/` ?
 */
async function portraitsIllisibles(base: Lecteur) {
  const lignes = await base.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "eleves"
      WHERE "portraitUrl" IS NOT NULL
        AND LEFT("portraitUrl", 11) <> 'data:image/'`,
  );
  const total = await base.eleve.count({ where: { portraitUrl: { not: null } } });

  const anomalies: Anomalie[] =
    lignes.length === 0
      ? []
      : [
          {
            cle: "coherence:portrait-illisible",
            gravite: "DEGAT",
            quoi:
              "Des fiches portent un portrait que le navigateur ne saura pas " +
              "afficher : le cadre restera cassé.",
            ou: "eleves.portraitUrl",
            detail: `${lignes.length} fiche(s) : ${lignes.slice(0, 5).map((l) => l.id).join(", ")}`,
          },
        ];

  return { verifie: total, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  6. Des pouvoirs restés sur des comptes archivés
// ─────────────────────────────────────────────────────────────

/**
 * Art. 7.3 — un compte archivé n'est pas sanctionné, et garde donc ses
 * permissions. Ce n'est pas une faute ; c'est une chose à savoir. Un préfet
 * absent depuis trois mois qui garde le tableau de sa maison bloque
 * quelqu'un d'autre.
 */
async function pouvoirsOrphelins(base: Lecteur) {
  const [permissions, prefets] = await Promise.all([
    base.permissionAccordee.count({
      where: { utilisateur: { archiveLe: { not: null } } },
    }),
    base.prefet.count({
      where: { eleve: { utilisateur: { archiveLe: { not: null } } } },
    }),
  ]);

  const total = permissions + prefets;
  const anomalies: Anomalie[] =
    total === 0
      ? []
      : [
          {
            cle: "coherence:pouvoirs-sur-compte-archive",
            gravite: "A_SURVEILLER",
            quoi:
              "Des pouvoirs sont posés sur des comptes archivés (art. 7.3). " +
              "Ce n’est pas une faute, mais une charge que personne n’exerce.",
            ou: "/admin/pouvoirs",
            detail: `${permissions} permission(s), ${prefets} préfecture(s)`,
          },
        ];

  return { verifie: total, anomalies };
}

// ─────────────────────────────────────────────────────────────
//  7. Des images que le code nomme et que le dépôt n'a pas
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **La liste des images n'est pas tenue à la main, elle est DÉDUITE du code
 * source.** Une liste écrite à côté finirait par diverger, et l'image ajoutée
 * demain serait la seule à n'être jamais vérifiée — c'est la leçon
 * d'`ENTREES_MENU`, déduit de `MENU` pour la même raison.
 *
 * Ne tourne que si la ronde a le dépôt sous la main : c'est le cas dans les
 * Actions, qui commencent par le récupérer.
 */
async function imagesManquantes(racine: string | undefined) {
  if (!racine) return { verifie: 0, anomalies: [] };

  const sources = fichiersSource(join(racine, "src"));
  const citees = new Set<string>();

  for (const fichier of sources) {
    const texte = readFileSync(fichier, "utf8");
    for (const trouve of texte.matchAll(
      /["'`](\/[a-z0-9-]+\/[a-zA-Z0-9_.-]+\.(?:webp|jpg|jpeg|png|svg|gif|ico))["'`]/g,
    )) {
      citees.add(trouve[1]);
    }
  }

  const absentes = [...citees]
    .filter((chemin) => !existsSync(join(racine, "public", chemin)))
    .sort();

  const anomalies: Anomalie[] =
    absentes.length === 0
      ? []
      : [
          {
            cle: "coherence:image-absente",
            gravite: "DEGAT",
            quoi:
              "Le code renvoie vers des images que le dépôt ne contient pas. " +
              "Elles s’afficheront en cadre cassé.",
            ou: "public/",
            detail: absentes.slice(0, 6).join(", "),
          },
        ];

  return { verifie: citees.size, anomalies };
}

/** Tous les fichiers de code sous un dossier. */
function fichiersSource(dossier: string): string[] {
  const trouves: string[] = [];
  const parcourir = (ou: string) => {
    for (const entree of readdirSync(ou)) {
      const chemin = resolve(ou, entree);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(ts|tsx|json)$/.test(entree)) trouves.push(chemin);
    }
  };
  parcourir(dossier);
  return trouves;
}

// ─────────────────────────────────────────────────────────────
//  8. Du texte de membre qui se fait passer pour une consigne
// ─────────────────────────────────────────────────────────────

/**
 * Les tournures d'une consigne adressée à une machine.
 *
 * ⚠️ **Volontairement grossier, et jamais un filtre de sécurité.** Une liste
 * de motifs ne peut pas être exhaustive, et prétendre le contraire ferait
 * croire à une protection qui n'existe pas. Elle attrape ce qui saute aux
 * yeux, ce qui suffit à alerter un modérateur.
 *
 * Exportée pour être éprouvée : `en-base.essai.ts` la passe à Postgres contre
 * une liste de fausses consignes et une liste de vrais textes de jeu de rôle,
 * et exige qu'elle attrape les premières sans toucher aux seconds.
 */
export const MOTIF_CONSIGNE =
  // « ignore tes instructions », « oublie les consignes »
  "(ignore|oublie|disregard|forget).{0,40}(instruction|consigne|prompt|r[e\u00e8]gle)" +
  // « tu es maintenant un assistant », « you are now a helpful assistant »
  //
  // \u26a0\ufe0f Le mot de machine est EXIG\u00c9 apr\u00e8s « tu es maintenant » : sans lui,
  // « Tu es maintenant une \u00e9l\u00e8ve de Nattorm, lui dit la directrice » tombait,
  // et c\u2019est une phrase de jeu de r\u00f4le parfaitement ordinaire.
  "|(you are|tu es|vous [\u00eae]tes) (now |maintenant )?(an?|une?)?\\s*" +
  "([a-zA-Z\u00e9\u00e8\u00ea\u00e0]+\\s+){0,3}(assistant|chatbot|llm|mod[e\u00e8]le de langage|intelligence artificielle)" +
  // les marqueurs techniques, qui n\u2019ont aucune raison d\u2019appara\u00eetre dans du RP
  "|system prompt|<\\|im_start\\|>" +
  // l\u2019exfiltration demand\u00e9e en clair
  //
  // \u26a0\ufe0f « les adresses » seul attrapait « Elle donne les adresses des
  // boutiques de Kaldvik ». Il faut dire de QUOI : des membres, du courriel.
  "|(envoie|donne|liste|affiche|export).{0,40}" +
  "(la liste des (membres|comptes|joueurs)|les adresses (de |des )?(courriel|mail|membres|joueurs)" +
  "|le mot de passe|les mots de passe)" +
  // « Assistant: fais ceci »
  "|(assistant|chatgpt|claude)\\s*[:>]\\s";

/**
 * ⚠️ **Ce que ce contrôle est, et ce qu'il n'est pas.**
 *
 * Il ne protège pas La Veille : elle est déjà protégée, et pas par une
 * détection. Ce qui la protège, c'est qu'elle **ne lit aucun texte de membre**
 * — ni un post, ni un titre, ni un corbeau. Aucune chaîne écrite par un joueur
 * ne traverse ce domaine, et la synthèse par le modèle ne reçoit que des
 * nombres. Il n'y a donc rien à détourner.
 *
 * Ce contrôle sert à **prévenir le joueur** que quelqu'un a écrit sur son
 * forum un texte qui vise un automate. C'est un signalement de modération, pas
 * une défense.
 *
 * ── Comment il regarde sans lire ──
 *
 * Le motif est appliqué **par Postgres**, et la requête ne rend que des
 * identifiants et un compte. Le texte suspect ne quitte jamais la base : il ne
 * passe ni dans le rapport, ni dans le courriel, ni dans le prompt du modèle.
 * On dit « une scène porte une consigne apparente, la voici : <identifiant> »,
 * et le joueur va la lire sur son site.
 *
 * C'est le même procédé que pour `portraitUrl` : on demande à la base de
 * juger sur place plutôt que de rapatrier ce qu'on ne veut pas manipuler.
 */
async function consignesApparentes(base: Lecteur) {
  const [titres, posts] = await Promise.all([
    base.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "sujets"
        WHERE "supprimeLe" IS NULL AND "titre" ~* $1 LIMIT 20`,
      MOTIF_CONSIGNE,
    ),
    base.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "posts"
        WHERE "retireLe" IS NULL AND "corps" ~* $1 LIMIT 20`,
      MOTIF_CONSIGNE,
    ),
  ]);

  const total = titres.length + posts.length;
  const anomalies: Anomalie[] =
    total === 0
      ? []
      : [
          {
            cle: "coherence:consigne-apparente",
            gravite: "A_SURVEILLER",
            quoi: TEXTES.consigneApparente,
            ou: "le forum",
            // ⚠️ Des identifiants, jamais le texte. Le joueur va le lire sur
            // son site ; il n’a pas à voyager dans un courriel.
            detail:
              `${titres.length} titre(s), ${posts.length} post(s) — ` +
              [...titres, ...posts]
                .slice(0, 5)
                .map((l) => l.id)
                .join(", "),
          },
        ];

  return { verifie: total, anomalies };
}
