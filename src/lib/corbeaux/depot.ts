import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { EtatEtape, StatutAcces, StatutDossier } from "@/lib/dossier/etats";
import {
  AUCUN_BLOCAGE,
  cleAdministration,
  clePaire,
  conversationClosePourMoi,
  etatDuPlafond,
  plafondDe,
  porteeDeLaTour,
  sortDuCorbeau,
  sortDuCorbeauVersAdministration,
  type Blocages,
  type PourLesCorbeaux,
  type Verdict,
} from "./droits";

/**
 * L’accès au stockage de la Tour aux Corbeaux.
 *
 * **C’est la seule couture entre l’interface et la base** : les pages et les
 * routes ne composent jamais de requête elles-mêmes. Toutes les décisions,
 * elles, viennent de `droits.ts` — ce fichier-ci ne fait qu’exécuter ce que
 * l’autre a tranché.
 *
 * ── Deux règles traversent tout ce fichier ──
 *
 * **1. Ce qu’on voit est personnel.** Chaque lecture filtre sur `messages_masques`
 * et sur `masqueeLe`, sans exception. Un corbeau retiré de MA vue reste chez
 * l’autre, et c’est ce qui protège un membre harcelé dont l’agresseur voudrait
 * effacer ses traces.
 *
 * **2. Un corbeau bloqué part quand même.** Il est écrit, puis masqué pour le
 * destinataire dans la MÊME transaction. Vu de l’expéditeur, absolument rien
 * ne diffère d’un envoi ordinaire — pas un code de retour, pas un délai.
 */

// ─────────────────────────────────────────────────────────────
//  Ce que l’interface reçoit
// ─────────────────────────────────────────────────────────────

/** De quoi afficher un nom et un blason — rien de plus. */
export type Correspondant = {
  /** L’identifiant du COMPTE : on écrit à un joueur, pas à une fiche. */
  id: string;
  prenomNom: string;
  maison: string | null;
  etatMaison: EtatEtape;
};

export type ResumeConversation = {
  id: string;
  /** Nul pour le fil de l’administration, qui n’a pas de correspondant. */
  correspondant: Correspondant | null;
  avecAdministration: boolean;
  /** La première ligne du dernier corbeau visible, ou `null` s’il n’y en a plus. */
  extrait: string | null;
  dernierMessageLe: string;
  nonLus: number;
  /**
   * J’ai bloqué cette personne : le fil est clos, je le sais, on me le dit.
   * **Ne vaut jamais `true` parce que l’autre m’a bloqué** — voir `droits.ts`.
   */
  close: boolean;
};

export type CorbeauAffiche = {
  id: string;
  /** Écrit par moi : l’affichage s’aligne à droite, sans blason. */
  deMoi: boolean;
  /** Nul si le compte a été supprimé depuis. */
  auteur: Correspondant | null;
  corps: string;
  envoyeLe: string;
};

export type FilCharge = {
  conversation: {
    id: string;
    correspondant: Correspondant | null;
    avecAdministration: boolean;
    close: boolean;
  };
  corbeaux: CorbeauAffiche[];
  /** Reste-t-il du passé à charger en remontant ? */
  encoreAvant: boolean;
};

/** Combien de fils on rend d’un coup, et combien de corbeaux par page. */
export const CONVERSATIONS_PAR_PAGE = 30;
export const CORBEAUX_PAR_PAGE = 40;

/** Ce qu’on montre du dernier corbeau, dans la liste. */
const EXTRAIT_MAX = 120;

function extraitDe(corps: string): string {
  const uneLigne = corps.replace(/\s+/g, " ").trim();
  return uneLigne.length <= EXTRAIT_MAX
    ? uneLigne
    : `${uneLigne.slice(0, EXTRAIT_MAX - 1).trimEnd()}…`;
}

/** L’époque, pour « rien n’a encore été lu » — plus simple qu’un cas à part. */
const AVANT_TOUT = new Date(0);

// ─────────────────────────────────────────────────────────────
//  Lire un correspondant
// ─────────────────────────────────────────────────────────────

/**
 * La sélection Prisma d’un correspondant.
 *
 * `maison` et `etatMaison` voyagent ensemble et ne se lisent jamais l’une
 * sans l’autre : c’est `blasonAffiche` qui tranche, et une maison écrite sous
 * un état `SANS_OBJET` ne doit pas s’afficher.
 */
const CHAMPS_CORRESPONDANT = {
  id: true,
  eleve: { select: { prenomNom: true, maison: true, etatMaison: true } },
} as const;

type LigneCorrespondant = {
  id: string;
  eleve: { prenomNom: string; maison: string | null; etatMaison: string } | null;
};

function versCorrespondant(ligne: LigneCorrespondant | null): Correspondant | null {
  if (!ligne?.eleve) return null;
  return {
    id: ligne.id,
    prenomNom: ligne.eleve.prenomNom,
    maison: ligne.eleve.maison,
    etatMaison: ligne.eleve.etatMaison as EtatEtape,
  };
}

/**
 * Les blocages entre moi et quelqu’un d’autre, dans les deux sens.
 *
 * Une seule requête pour les deux : les additionner en un booléen unique
 * serait l’erreur qui trahit le blocage — voir `droits.ts`.
 */
async function blocagesEntre(moi: string, autre: string): Promise<Blocages> {
  const lignes = await prisma.blocage.findMany({
    where: {
      OR: [
        { bloqueurId: moi, bloqueId: autre },
        { bloqueurId: autre, bloqueId: moi },
      ],
    },
    select: { bloqueurId: true },
  });
  return {
    jeLaiBloque: lignes.some((l) => l.bloqueurId === moi),
    ilMaBloque: lignes.some((l) => l.bloqueurId === autre),
  };
}

// ─────────────────────────────────────────────────────────────
//  La liste des conversations
// ─────────────────────────────────────────────────────────────

/**
 * Les fils de ce compte, du plus récemment animé au plus ancien.
 *
 * Trois filtres personnels, et aucun n’est facultatif :
 *
 *   `masqueeLe`      — un fil retiré de ma vue ne revient que si l’autre
 *                      réécrit, et vidé de ce qui précède
 *   `messages_masques` — un corbeau que j’ai retiré, ou qui ne m’est jamais
 *                      parvenu, ne fournit ni extrait ni non-lu
 *   la portée        — un membre suspendu ne voit que le fil de
 *                      l’administration ; ses autres conversations l’attendent
 */
export async function listerConversations(
  compte: PourLesCorbeaux,
): Promise<ResumeConversation[]> {
  const portee = porteeDeLaTour(compte);
  if (portee === "RIEN") return [];

  const participations = await prisma.participation.findMany({
    where: {
      utilisateurId: compte.id,
      conversation: {
        ...(portee === "ADMINISTRATION_SEULE"
          ? { type: "AVEC_ADMINISTRATION" as const }
          : {}),
        /**
         * **Un fil dont AUCUN corbeau ne m’est visible n’a rien à faire dans
         * ma liste.**
         *
         * C’est le cas le plus subtil du blocage, et il ne saute pas aux yeux :
         * une personne bloquée qui ouvre un fil neuf voit bien son corbeau
         * masqué à l’arrivée — mais la conversation, elle, est créée, avec une
         * participation pour le bloqueur. Sans cette condition, il verrait donc
         * surgir dans sa liste un fil vide portant le nom de quelqu’un qu’il a
         * bloqué : exactement ce qu’il a demandé à ne plus voir.
         *
         * Elle règle du même coup le fil dont on a retiré tous les corbeaux :
         * il n’a plus rien à montrer, il s’en va — et revient si l’autre
         * réécrit.
         */
        messages: { some: { masques: { none: { utilisateurId: compte.id } } } },
      },
    },
    orderBy: { conversation: { dernierMessageLe: "desc" } },
    take: CONVERSATIONS_PAR_PAGE,
    select: {
      luJusquau: true,
      masqueeLe: true,
      conversation: {
        select: {
          id: true,
          type: true,
          dernierMessageLe: true,
          participations: {
            where: { utilisateurId: { not: compte.id } },
            select: { utilisateur: { select: CHAMPS_CORRESPONDANT } },
          },
          // Les derniers corbeaux, pour en tirer un extrait. On en prend
          // plusieurs parce que les plus récents peuvent être masqués pour
          // moi : c'est le premier VISIBLE qui s'affiche, pas le dernier écrit.
          messages: {
            orderBy: { envoyeLe: "desc" },
            take: 5,
            select: {
              corps: true,
              envoyeLe: true,
              masques: { where: { utilisateurId: compte.id }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  // Un fil masqué ne reparaît que si quelque chose s'y est dit depuis.
  const visibles = participations.filter(
    (p) => !p.masqueeLe || p.conversation.dernierMessageLe > p.masqueeLe,
  );
  if (visibles.length === 0) return [];

  const nonLus = await compterNonLusParConversation(
    compte.id,
    visibles.map((p) => ({
      conversationId: p.conversation.id,
      depuis: plusRecente(p.luJusquau, p.masqueeLe),
    })),
  );

  // Les blocages posés PAR moi, en une fois : c'est ce qui ferme un fil de mon
  // côté. Ceux posés CONTRE moi ne sont pas lus ici — ils ne changent rien à
  // ce que je vois, et c'est tout l'objet du dispositif.
  const bloquesParMoi = new Set(
    (
      await prisma.blocage.findMany({
        where: { bloqueurId: compte.id },
        select: { bloqueId: true },
      })
    ).map((b) => b.bloqueId),
  );

  return visibles.map((p) => {
    const conv = p.conversation;
    // L'extrait ne remonte jamais avant le moment où j'ai retiré ce fil de ma
    // vue : ce qui précède n'existe plus pour moi.
    const dernierVisible = conv.messages.find(
      (m) =>
        m.masques.length === 0 && (!p.masqueeLe || m.envoyeLe > p.masqueeLe),
    );
    const correspondant = versCorrespondant(
      conv.participations[0]?.utilisateur ?? null,
    );

    return {
      id: conv.id,
      correspondant,
      avecAdministration: conv.type === "AVEC_ADMINISTRATION",
      extrait: dernierVisible ? extraitDe(dernierVisible.corps) : null,
      dernierMessageLe: conv.dernierMessageLe.toISOString(),
      nonLus: nonLus.get(conv.id) ?? 0,
      // `ilMaBloque` reste faux ici, et ce n'est pas un raccourci : on ne l'a
      // délibérément pas lu. Un fil ne se ferme jamais du côté de celui qui
      // vient d'être bloqué — sans quoi il l'apprendrait.
      close: conversationClosePourMoi({
        ...AUCUN_BLOCAGE,
        jeLaiBloque: correspondant ? bloquesParMoi.has(correspondant.id) : false,
      }),
    };
  });
}

/** La plus récente de deux dates, `null` si les deux le sont. */
function plusRecente(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Combien de corbeaux non lus dans chacun de ces fils.
 *
 * Le `OR` porte une clause par conversation parce que le seuil — la date de
 * dernière lecture — change d’un fil à l’autre. C’est tenable pour la
 * trentaine de fils d’une page ; si la liste devait s’allonger, c’est ici
 * qu’un compteur tenu à jour prendrait sa place, et nulle part ailleurs.
 */
async function compterNonLusParConversation(
  utilisateurId: string,
  fils: readonly { conversationId: string; depuis: Date | null }[],
): Promise<Map<string, number>> {
  if (fils.length === 0) return new Map();

  const lignes = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      // Ni ceux que j'ai retirés, ni ceux qui ne me sont jamais parvenus.
      masques: { none: { utilisateurId } },
      AND: [
        {
          /**
           * ⚠️ **`not` de Prisma exclut les valeurs nulles**, là où le
           * `IS DISTINCT FROM` de `compterNonLus` les garde.
           *
           * Écrit `auteurId: { not: moi }`, ce filtre laissait donc tomber
           * tous les corbeaux **sans auteur** — c'est-à-dire les réponses de
           * l'administration, qui n'en portent jamais. Le bandeau les
           * comptait, la liste non : les deux se contredisaient à l'écran, et
           * une lettre du château n'apparaissait jamais comme non lue.
           *
           * Les deux branches sont donc écrites en toutes lettres. Le piège
           * est celui des trois valeurs du SQL, et il ne se voit pas.
           */
          OR: [{ auteurId: null }, { auteurId: { not: utilisateurId } }],
        },
        {
          OR: fils.map((f) => ({
            conversationId: f.conversationId,
            envoyeLe: { gt: f.depuis ?? AVANT_TOUT },
          })),
        },
      ],
    },
    _count: { _all: true },
  });

  return new Map(lignes.map((l) => [l.conversationId, l._count._all]));
}

/**
 * Le total, pour le compteur du bandeau et le panneau du bureau.
 *
 * En SQL brut, et pour une bonne raison : c’est la seule requête du site
 * appelée à **chaque page** de l’école. Elle doit tenir en un aller-retour,
 * quel que soit le nombre de fils — là où la version Prisma demanderait
 * d’abord la liste des participations, puis un `OR` long comme le bras.
 *
 * Les quatre conditions sont les mêmes que partout ailleurs dans ce fichier :
 * pas mes corbeaux, rien de masqué, rien d’antérieur à ma dernière lecture,
 * rien d’antérieur au moment où j’ai retiré le fil de ma vue.
 */
export async function compterNonLus(compte: PourLesCorbeaux): Promise<number> {
  const portee = porteeDeLaTour(compte);
  if (portee === "RIEN") return 0;

  /**
   * **Le compteur ne promet que ce qui est ouvrable.**
   *
   * Un membre suspendu ne voit que le fil de l’administration : compter aussi
   * les corbeaux de ses conversations entre joueurs lui afficherait un « 3 »
   * derrière lequel il ne trouverait rien. Une pastille qui envoie chercher ce
   * qu’on ne peut pas atteindre est pire que pas de pastille du tout.
   *
   * La même règle que `listerConversations`, dite en SQL — les deux doivent
   * s’accorder, sinon le bandeau et la page se contredisent à l’écran.
   */
  const seulementAdministration =
    portee === "ADMINISTRATION_SEULE"
      ? Prisma.sql`AND c."type" = 'AVEC_ADMINISTRATION'`
      : Prisma.empty;

  const lignes = await prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS total
    FROM "messages" m
    JOIN "participations" p
      ON p."conversationId" = m."conversationId"
     AND p."utilisateurId" = ${compte.id}
    JOIN "conversations" c ON c."id" = m."conversationId"
    WHERE m."auteurId" IS DISTINCT FROM ${compte.id}
      AND (p."luJusquau" IS NULL OR m."envoyeLe" > p."luJusquau")
      AND (p."masqueeLe" IS NULL OR m."envoyeLe" > p."masqueeLe")
      AND NOT EXISTS (
        SELECT 1 FROM "messages_masques" mm
        WHERE mm."messageId" = m."id" AND mm."utilisateurId" = ${compte.id}
      )
      ${seulementAdministration}
  `);

  return Number(lignes[0]?.total ?? 0);
}

// ─────────────────────────────────────────────────────────────
//  Un fil
// ─────────────────────────────────────────────────────────────

/**
 * Le fil d’une conversation, du plus ancien au plus récent à l’affichage.
 *
 * `avant` porte l’identifiant du corbeau le plus ancien déjà affiché : c’est
 * ce qui charge le passé en remontant. Rend `null` si le fil n’existe pas, ou
 * si ce compte n’y figure pas — la réponse est la même dans les deux cas, et
 * c’est voulu : « il existe mais pas pour vous » se lit comme une confirmation.
 */
export async function lireFil(
  compte: PourLesCorbeaux,
  conversationId: string,
  avant?: string,
): Promise<FilCharge | null> {
  const portee = porteeDeLaTour(compte);
  if (portee === "RIEN") return null;

  const participation = await prisma.participation.findUnique({
    where: {
      conversationId_utilisateurId: { conversationId, utilisateurId: compte.id },
    },
    select: {
      masqueeLe: true,
      conversation: {
        select: {
          id: true,
          type: true,
          participations: {
            where: { utilisateurId: { not: compte.id } },
            select: { utilisateur: { select: CHAMPS_CORRESPONDANT } },
          },
        },
      },
    },
  });

  if (!participation) return null;

  const conv = participation.conversation;

  // Un membre suspendu ne rouvre pas ses fils entre joueurs, même en tapant
  // l'adresse : la garde de la page ne suffirait pas, celle-ci est refaite ici.
  if (portee === "ADMINISTRATION_SEULE" && conv.type !== "AVEC_ADMINISTRATION") {
    return null;
  }

  const corbeaux = await prisma.message.findMany({
    where: {
      conversationId,
      masques: { none: { utilisateurId: compte.id } },
      ...(participation.masqueeLe ? { envoyeLe: { gt: participation.masqueeLe } } : {}),
    },
    orderBy: { envoyeLe: "desc" },
    // Un de plus que la page : c'est lui qui dit s'il reste du passé, sans
    // avoir à compter tout le fil.
    take: CORBEAUX_PAR_PAGE + 1,
    ...(avant ? { cursor: { id: avant }, skip: 1 } : {}),
    select: {
      id: true,
      corps: true,
      envoyeLe: true,
      auteurId: true,
      auteur: { select: CHAMPS_CORRESPONDANT },
    },
  });

  const encoreAvant = corbeaux.length > CORBEAUX_PAR_PAGE;
  const page = encoreAvant ? corbeaux.slice(0, CORBEAUX_PAR_PAGE) : corbeaux;

  const correspondant = versCorrespondant(conv.participations[0]?.utilisateur ?? null);
  const blocages = correspondant
    ? await blocagesEntre(compte.id, correspondant.id)
    : AUCUN_BLOCAGE;

  return {
    conversation: {
      id: conv.id,
      correspondant,
      avecAdministration: conv.type === "AVEC_ADMINISTRATION",
      close: conversationClosePourMoi(blocages),
    },
    // Rendus du plus ancien au plus récent : c'est l'ordre de lecture.
    corbeaux: page.reverse().map((m) => ({
      id: m.id,
      deMoi: m.auteurId === compte.id,
      auteur: versCorrespondant(m.auteur),
      corps: m.corps,
      envoyeLe: m.envoyeLe.toISOString(),
    })),
    encoreAvant,
  };
}

/**
 * « J’ai lu jusqu’ici. »
 *
 * Ne recule jamais : rouvrir un vieux fil ne doit pas faire réapparaître des
 * non-lus qu’on avait déjà vus.
 */
export async function marquerLu(
  compte: PourLesCorbeaux,
  conversationId: string,
): Promise<void> {
  await prisma.participation.updateMany({
    where: {
      conversationId,
      utilisateurId: compte.id,
      OR: [{ luJusquau: null }, { luJusquau: { lt: new Date() } }],
    },
    data: { luJusquau: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────
//  Envoyer
// ─────────────────────────────────────────────────────────────

export type ResultatEnvoi =
  | { envoye: true; conversationId: string; corbeauId: string }
  | { envoye: false; verdict: Verdict };

/** À qui l’on écrit : un autre membre, ou l’administration. */
export type Destinataire = { membreId: string } | { administration: true };

/**
 * L’envoi d’un corbeau.
 *
 * L’ordre importe : **on décide, puis on écrit, et tout tient dans une seule
 * transaction.** Le corbeau, son masquage éventuel, la date d’activité du fil
 * et ma propre lecture partent ensemble — un corbeau écrit sans son masquage
 * serait un corbeau arrivé chez quelqu’un qui avait bloqué.
 *
 * Le corps arrive **déjà validé** par `schema.ts`. Ce fichier ne revalide
 * rien : deux endroits qui nettoient le même texte finissent par le nettoyer
 * différemment.
 */
export async function envoyerCorbeau(
  expediteur: PourLesCorbeaux,
  destinataire: Destinataire,
  corps: string,
): Promise<ResultatEnvoi> {
  const versAdministration = "administration" in destinataire;

  let verdict: Verdict;
  let cle: string;
  let autreId: string | null = null;

  if (versAdministration) {
    verdict = sortDuCorbeauVersAdministration(expediteur);
    cle = cleAdministration(expediteur.id);
  } else {
    const autre = await lireCompteCible(destinataire.membreId);
    if (!autre) {
      return {
        envoye: false,
        verdict: { sort: "REFUSE", raison: "DESTINATAIRE_INCONNU" },
      };
    }
    autreId = autre.id;
    cle = clePaire(expediteur.id, autre.id);
    verdict = sortDuCorbeau(
      expediteur,
      autre,
      await blocagesEntre(expediteur.id, autre.id),
    );
  }

  if (verdict.sort === "REFUSE") return { envoye: false, verdict };

  // ── L'anti-démarchage, et seulement ici ──
  //
  // Le plafond ne pèse que sur les fils NOUVEAUX : on ne le consulte donc pas
  // avant de savoir si celui-ci en est un. Répondre dans une conversation
  // ouverte n'est jamais limité, et écrire à l'administration non plus — la
  // condition ci-dessous écarte les deux cas d'un coup.
  if (!versAdministration) {
    const dejaOuvert = await prisma.conversation.findUnique({
      where: { clePaire: cle },
      select: { id: true },
    });

    if (!dejaOuvert) {
      const attente = await plafondAtteint(expediteur.id);
      if (attente) return { envoye: false, verdict: attente };
    }
  }

  const ecrit = await prisma.$transaction(async (tx) => {
    const conversationId = await filExistantOuNeuf(tx, {
      cle,
      versAdministration,
      expediteurId: expediteur.id,
      autreId,
    });

    const corbeau = await tx.message.create({
      data: { conversationId, auteurId: expediteur.id, corps },
      select: { id: true, envoyeLe: true },
    });

    // Le corbeau part, et n'arrive pas. Posé dans la même transaction que le
    // message : il ne doit exister aucun instant où il serait visible.
    if (verdict.sort === "PART_DANS_LE_VIDE" && autreId) {
      await tx.messageMasque.create({
        data: { messageId: corbeau.id, utilisateurId: autreId, raison: "BLOQUE" },
      });
    }

    await tx.conversation.update({
      where: { id: conversationId },
      data: { dernierMessageLe: corbeau.envoyeLe },
    });

    // J'ai forcément lu ce que je viens d'écrire — et si j'avais retiré ce fil
    // de ma vue, y réécrire l'y ramène.
    await tx.participation.update({
      where: {
        conversationId_utilisateurId: {
          conversationId,
          utilisateurId: expediteur.id,
        },
      },
      data: { luJusquau: corbeau.envoyeLe, masqueeLe: null },
    });

    return { conversationId, corbeauId: corbeau.id };
  });

  return { envoye: true, ...ecrit };
}

/**
 * Ce compte a-t-il ouvert trop de fils, et pour combien de temps ?
 *
 * Deux lectures, faites **seulement** quand une conversation va réellement
 * naître : la date d’acceptation du dossier — qui décide du plafond — et les
 * ouvertures des vingt-quatre dernières heures. Le calcul, lui, est pur et
 * vit dans `droits.ts`.
 *
 * Deux ouvertures lancées au même instant peuvent passer toutes les deux.
 * C’est assumé : ce plafond ralentit un démarcheur, il ne garde pas une porte.
 * Le verrouiller vraiment coûterait une transaction sérialisée à chaque
 * premier corbeau, pour empêcher un trente-et-unième envoi dont personne ne
 * mourra.
 */
async function plafondAtteint(
  expediteurId: string,
): Promise<{ sort: "ATTENDRE"; minutes: number } | null> {
  const maintenant = new Date();
  const ilYAUnJour = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000);

  const [compte, ouvertures] = await Promise.all([
    prisma.utilisateur.findUnique({
      where: { id: expediteurId },
      select: { eleve: { select: { decideLe: true } }, creeLe: true },
    }),
    prisma.conversation.findMany({
      where: {
        ouvertParId: expediteurId,
        type: "ENTRE_MEMBRES",
        creeLe: { gte: ilYAUnJour },
      },
      select: { creeLe: true },
    }),
  ]);

  // L'ancienneté se compte depuis l'acceptation du dossier. À défaut — un
  // compte accepté avant que la colonne existe —, la création du compte fait
  // un repli honnête.
  const membreDepuis = compte?.eleve?.decideLe ?? compte?.creeLe ?? null;

  const etat = etatDuPlafond(
    ouvertures.map((o) => o.creeLe),
    plafondDe(membreDepuis, maintenant),
    maintenant,
  );

  return etat.ouvert ? null : { sort: "ATTENDRE", minutes: etat.minutes };
}

/**
 * Le fil de cette paire, créé s’il n’existe pas encore.
 *
 * Deux corbeaux partis au même instant — deux onglets, un double clic — visent
 * la même clé. La base en refuse un : on relit alors le fil que l’autre vient
 * de créer, au lieu d’échouer. C’est la contrainte d’unicité qui arbitre, pas
 * une vérification préalable, qui laisserait toujours une fenêtre entre le
 * moment où l’on regarde et celui où l’on écrit.
 */
async function filExistantOuNeuf(
  tx: Prisma.TransactionClient,
  args: {
    cle: string;
    versAdministration: boolean;
    expediteurId: string;
    autreId: string | null;
  },
): Promise<string> {
  const existant = await tx.conversation.findUnique({
    where: { clePaire: args.cle },
    select: { id: true },
  });
  if (existant) return existant.id;

  const participants = [{ utilisateurId: args.expediteurId }];
  if (args.autreId) participants.push({ utilisateurId: args.autreId });

  try {
    const cree = await tx.conversation.create({
      data: {
        clePaire: args.cle,
        type: args.versAdministration ? "AVEC_ADMINISTRATION" : "ENTRE_MEMBRES",
        ouvertParId: args.expediteurId,
        participations: { create: participants },
      },
      select: { id: true },
    });
    return cree.id;
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      const concurrent = await tx.conversation.findUnique({
        where: { clePaire: args.cle },
        select: { id: true },
      });
      if (concurrent) return concurrent.id;
    }
    throw erreur;
  }
}

/** L’état du destinataire, réduit à ce dont `droits.ts` a besoin. */
async function lireCompteCible(id: string): Promise<PourLesCorbeaux | null> {
  const ligne = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      id: true,
      statutAcces: true,
      eleve: { select: { statut: true } },
    },
  });
  if (!ligne) return null;

  return {
    id: ligne.id,
    // Un compte sans fiche est traité comme une demande jamais envoyée : le
    // sens qui n'ouvre rien, comme dans `garde.ts`.
    statut: (ligne.eleve?.statut ?? "BROUILLON") as StatutDossier,
    statutAcces: ligne.statutAcces as StatutAcces,
  };
}

// ─────────────────────────────────────────────────────────────
//  Trouver quelqu’un
// ─────────────────────────────────────────────────────────────

export type ResultatRecherche = Correspondant & {
  /** Un fil existe déjà : on n’en ouvre pas un second, on rejoint celui-là. */
  conversationId: string | null;
};

/**
 * Les personnages dont le nom contient cette suite de lettres.
 *
 * Trois exclusions, et la troisième est la seule qui demande réflexion :
 *
 *   moi-même            — on ne s’écrit pas à soi-même
 *   les dossiers non acceptés — ils n’existent pas encore pour les autres
 *   **ceux que J’AI bloqués** — je ne veux plus rien d’eux, les proposer
 *                         serait absurde
 *
 * Et une non-exclusion, qui compte autant : **ceux qui m’ont bloqué figurent
 * dans les résultats.** Les retirer reviendrait à leur faire dire « cette
 * personne vous a bloqué » par leur seule absence.
 */
export async function chercherPersonnages(
  compte: PourLesCorbeaux,
  requete: string,
  limite = 10,
): Promise<ResultatRecherche[]> {
  // Un membre suspendu n'écrit qu'à l'administration : la recherche n'a rien
  // à lui proposer.
  if (porteeDeLaTour(compte) !== "TOUT") return [];
  if (!requete) return [];

  const bloques = (
    await prisma.blocage.findMany({
      where: { bloqueurId: compte.id },
      select: { bloqueId: true },
    })
  ).map((b) => b.bloqueId);

  const trouves = await prisma.utilisateur.findMany({
    where: {
      id: { not: compte.id, notIn: bloques },
      eleve: {
        statut: "ACCEPTE",
        prenomNom: { contains: requete, mode: "insensitive" },
      },
    },
    orderBy: { eleve: { prenomNom: "asc" } },
    take: limite,
    select: CHAMPS_CORRESPONDANT,
  });

  if (trouves.length === 0) return [];

  // Les fils déjà ouverts avec ces personnes, pour y renvoyer plutôt que
  // d'essayer d'en créer un second — que la base refuserait de toute façon.
  const dejaOuverts = await prisma.conversation.findMany({
    where: {
      clePaire: { in: trouves.map((t) => clePaire(compte.id, t.id)) },
    },
    select: { id: true, clePaire: true },
  });
  const parCle = new Map(dejaOuverts.map((c) => [c.clePaire, c.id]));

  return trouves
    .map((t) => {
      const correspondant = versCorrespondant(t);
      if (!correspondant) return null;
      return {
        ...correspondant,
        conversationId: parCle.get(clePaire(compte.id, t.id)) ?? null,
      };
    })
    .filter((r): r is ResultatRecherche => r !== null);
}

/**
 * Le fil de l’administration de ce compte, s’il existe.
 *
 * Un seul par membre, comme un fil de support : c’est la clé qui le garantit,
 * et non une condition écrite quelque part.
 */
export async function filAdministrationDe(
  utilisateurId: string,
): Promise<string | null> {
  const fil = await prisma.conversation.findUnique({
    where: { clePaire: cleAdministration(utilisateurId) },
    select: { id: true },
  });
  return fil?.id ?? null;
}

// ─────────────────────────────────────────────────────────────
//  Bloquer, débloquer
// ─────────────────────────────────────────────────────────────

export type PersonneBloquee = Correspondant & {
  bloqueeLe: string;
};

/**
 * Les personnes que ce compte a bloquées.
 *
 * **Dans ce sens-là, et jamais dans l’autre.** Il n’existe et il n’existera
 * aucune fonction qui rende « qui m’a bloqué » à l’intéressé : ce serait
 * l’exposer d’une requête, et défaire tout ce que le reste du fichier
 * s’emploie à protéger.
 */
export async function listerBlocages(
  compte: PourLesCorbeaux,
): Promise<PersonneBloquee[]> {
  if (porteeDeLaTour(compte) === "RIEN") return [];

  const lignes = await prisma.blocage.findMany({
    where: { bloqueurId: compte.id },
    orderBy: { creeLe: "desc" },
    select: { creeLe: true, bloque: { select: CHAMPS_CORRESPONDANT } },
  });

  return lignes
    .map((l) => {
      const correspondant = versCorrespondant(l.bloque);
      return correspondant
        ? { ...correspondant, bloqueeLe: l.creeLe.toISOString() }
        : null;
    })
    .filter((p): p is PersonneBloquee => p !== null);
}

/** Ce que valent les deux commandes. `DEJA` n’est pas une erreur : un double
 *  clic, un rechargement, et l’état voulu est déjà celui qu’on a. */
export type ResultatBlocage = "FAIT" | "DEJA" | "REFUSE";

/**
 * Bloquer quelqu’un.
 *
 * **Rien n’est masqué rétroactivement**, et c’est délibéré : « l’historique
 * déjà échangé reste visible pour les deux ». Effacer d’un coup ce qui a été
 * dit priverait la personne qui bloque de la trace de ce qu’elle a subi —
 * précisément ce dont elle aura besoin si elle signale.
 *
 * À partir de maintenant, en revanche, chaque corbeau de la personne bloquée
 * est écrit puis masqué dans la même transaction. Elle ne le saura pas.
 */
export async function bloquer(
  compte: PourLesCorbeaux,
  membreId: string,
): Promise<ResultatBlocage> {
  // Un membre suspendu ne bloque pas : il ne reçoit plus rien d'un joueur,
  // et il n'a devant lui que le fil de l'administration.
  if (porteeDeLaTour(compte) !== "TOUT") return "REFUSE";
  // La base le refuserait aussi — `blocages_pas_soi_meme` —, mais autant ne
  // pas aller la déranger pour ça.
  if (compte.id === membreId) return "REFUSE";

  const cible = await lireCompteCible(membreId);
  if (!cible) return "REFUSE";

  try {
    await prisma.blocage.create({
      data: { bloqueurId: compte.id, bloqueId: membreId },
    });
    return "FAIT";
  } catch (erreur) {
    if (
      erreur instanceof Prisma.PrismaClientKnownRequestError &&
      erreur.code === "P2002"
    ) {
      return "DEJA";
    }
    throw erreur;
  }
}

/**
 * Débloquer.
 *
 * **Les corbeaux partis dans le vide y restent.** Ils ont été masqués au
 * moment où ils sont arrivés, et rien ne les ramène : voir surgir d’un coup
 * trois semaines de messages qu’on croyait écartés serait une mauvaise
 * surprise — c’est le choix du joueur, et la raison pour laquelle
 * `messages_masques` porte une `raison` plutôt qu’un simple drapeau.
 */
export async function debloquer(
  compte: PourLesCorbeaux,
  membreId: string,
): Promise<ResultatBlocage> {
  if (porteeDeLaTour(compte) === "RIEN") return "REFUSE";

  const efface = await prisma.blocage.deleteMany({
    where: { bloqueurId: compte.id, bloqueId: membreId },
  });
  return efface.count > 0 ? "FAIT" : "DEJA";
}

// ─────────────────────────────────────────────────────────────
//  Retirer de sa vue
// ─────────────────────────────────────────────────────────────

/**
 * Retirer un corbeau de **sa propre vue**.
 *
 * La copie de l’autre est intacte : on ne touche ni au message ni à sa ligne
 * à lui, on pose seulement un masquage pour soi. C’est ce qui protège un
 * membre harcelé dont l’agresseur voudrait faire disparaître ses traces — et
 * c’est pourquoi l’interface doit le dire **au moment du geste**, sans quoi
 * on croirait avoir effacé des deux côtés.
 *
 * Le masquage porte `SUPPRIME_PAR_SOI`, et non `BLOQUE` : la distinction ne
 * change rien à l’affichage, mais elle permet de répondre plus tard à « ce
 * corbeau est-il arrivé ? » sans avoir à le deviner.
 *
 * **Un corbeau signalé n’est pas concerné.** Le signalement en garde une copie
 * figée, hors de portée de toute suppression — voir `signaler`.
 */
export async function retirerDeMaVue(
  compte: PourLesCorbeaux,
  messageId: string,
): Promise<boolean> {
  if (porteeDeLaTour(compte) === "RIEN") return false;

  // Le corbeau doit exister dans un fil où ce compte figure. Sans cette
  // vérification, une requête forgée poserait des masquages à l'aveugle — sans
  // grand dommage, mais la table se remplirait de lignes qui ne servent rien.
  const visible = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversation: { participations: { some: { utilisateurId: compte.id } } },
    },
    select: { id: true },
  });
  if (!visible) return false;

  try {
    await prisma.messageMasque.create({
      data: {
        messageId,
        utilisateurId: compte.id,
        raison: "SUPPRIME_PAR_SOI",
      },
    });
  } catch (erreur) {
    // Déjà masqué — un double clic, un rechargement. L'état voulu est celui
    // qu'on a.
    if (
      !(
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === "P2002"
      )
    ) {
      throw erreur;
    }
  }
  return true;
}

/**
 * Retirer une conversation entière de sa vue.
 *
 * Même règle, à l’échelle du fil : il sort de MA liste, l’autre garde la
 * sienne, entière. Et **il revient si l’autre réécrit**, vidé de ce qui
 * précède — sans ce retour, on pourrait faire disparaître quelqu’un de sa
 * boîte pour de bon, ce qui est un piège pour un membre harcelé qui ne
 * verrait plus rien arriver.
 *
 * `masqueeLe` porte l’instant, et non un simple drapeau : c’est lui qui
 * distingue « avant » de « depuis ».
 */
export async function retirerLeFilDeMaVue(
  compte: PourLesCorbeaux,
  conversationId: string,
): Promise<boolean> {
  if (porteeDeLaTour(compte) === "RIEN") return false;

  const ecrit = await prisma.participation.updateMany({
    where: { conversationId, utilisateurId: compte.id },
    data: { masqueeLe: new Date() },
  });
  return ecrit.count > 0;
}

// ─────────────────────────────────────────────────────────────
//  Signaler
// ─────────────────────────────────────────────────────────────

/** Combien de corbeaux voyagent de part et d’autre de celui qu’on signale. */
export const CONTEXTE_AVANT = 5;
export const CONTEXTE_APRES = 5;

/**
 * Une ligne de la copie figée.
 *
 * Des noms et du texte, jamais des identifiants de fil ni de message : ce que
 * la modération lit ne doit pas lui donner de quoi remonter à la conversation.
 * Elle n’a pas à pouvoir la rouvrir — elle n’en a pas le droit.
 */
export type LigneContexte = {
  auteur: string;
  envoyeLe: string;
  corps: string;
  /** Vrai pour le corbeau signalé lui-même, un seul de la liste. */
  vise?: true;
};

export type ResultatSignalement =
  | { signale: true }
  | { signale: false; raison: "INTROUVABLE" | "ADMINISTRATION" | "TOUR_FERMEE" };

/**
 * Signaler un corbeau — et **c’est ici que se joue tout l’accès du staff aux
 * échanges privés**.
 *
 * Le contexte est recopié **maintenant**, tel que le signalant le voit : une
 * dizaine de corbeaux autour de celui qu’il vise, avec leur auteur et leur
 * date. Cette copie ne bouge plus — un déclencheur en base le refuse — et
 * c’est la seule chose que la modération lira jamais.
 *
 * Deux conséquences, et la seconde est l’essentiel :
 *
 *   1. Le corbeau signalé survit à tout : à sa suppression par son auteur, à
 *      l’effacement du compte, à celui du fil. Sans cela le signalement ne
 *      servirait à rien.
 *   2. **L’écran de modération n’a aucun besoin de lire `Message`.** Il lit
 *      cette colonne, et rien d’autre.
 *
 * Le contexte est filtré **comme le fil du signalant** : ce qu’il a retiré de
 * sa vue n’y figure pas. C’est lui qui transmet, il ne transmet que ce qu’il
 * voit — et le site ne montre pas au staff des corbeaux que le signalant
 * lui-même ne voit plus.
 *
 * On ne signale pas dans le fil de l’administration : ce serait signaler le
 * staff au staff.
 */
export async function signaler(
  compte: PourLesCorbeaux,
  messageId: string,
  motif: string | null,
): Promise<ResultatSignalement> {
  if (porteeDeLaTour(compte) === "RIEN") {
    return { signale: false, raison: "TOUR_FERMEE" };
  }

  const participation = await prisma.message.findFirst({
    where: {
      id: messageId,
      // Le corbeau doit être dans un fil où ce compte figure, et **visible
      // pour lui** : on ne signale pas ce qu'on ne voit pas.
      masques: { none: { utilisateurId: compte.id } },
      conversation: { participations: { some: { utilisateurId: compte.id } } },
    },
    select: {
      id: true,
      envoyeLe: true,
      auteurId: true,
      conversation: { select: { id: true, type: true } },
    },
  });

  if (!participation) return { signale: false, raison: "INTROUVABLE" };
  if (participation.conversation.type === "AVEC_ADMINISTRATION") {
    return { signale: false, raison: "ADMINISTRATION" };
  }

  const contexte = await assemblerContexte(
    compte.id,
    participation.conversation.id,
    participation.id,
    participation.envoyeLe,
  );

  await prisma.signalement.create({
    data: {
      messageId: participation.id,
      parId: compte.id,
      viseId: participation.auteurId,
      motif,
      contexte,
    },
  });

  return { signale: true };
}

/**
 * La copie : cinq corbeaux avant, celui qui est visé, cinq après.
 *
 * **Jamais la conversation entière, jamais la boîte du membre.** Cette borne
 * est la mesure elle-même : un contexte trop large donnerait au staff, à
 * chaque signalement, un fragment de plus en plus grand d’un échange privé.
 *
 * Les corbeaux postérieurs voyagent aussi, et ce n’est pas un détail : une
 * réponse qui suit dit souvent ce qu’une phrase isolée ne dit pas — une
 * plaisanterie entre amis et une menace se ressemblent, hors de leur suite.
 */
async function assemblerContexte(
  utilisateurId: string,
  conversationId: string,
  messageId: string,
  envoyeLe: Date,
): Promise<LigneContexte[]> {
  const visible = {
    conversationId,
    masques: { none: { utilisateurId } },
  } as const;

  const champs = {
    id: true,
    corps: true,
    envoyeLe: true,
    auteur: { select: { eleve: { select: { prenomNom: true } } } },
  } as const;

  const [avant, vise, apres] = await Promise.all([
    prisma.message.findMany({
      where: { ...visible, envoyeLe: { lt: envoyeLe } },
      orderBy: { envoyeLe: "desc" },
      take: CONTEXTE_AVANT,
      select: champs,
    }),
    prisma.message.findUnique({ where: { id: messageId }, select: champs }),
    prisma.message.findMany({
      where: { ...visible, envoyeLe: { gt: envoyeLe } },
      orderBy: { envoyeLe: "asc" },
      take: CONTEXTE_APRES,
      select: champs,
    }),
  ]);

  type Ligne = { id: string; corps: string; envoyeLe: Date; auteur: { eleve: { prenomNom: string } | null } | null };

  const enLigne = (m: Ligne): LigneContexte => ({
    // Le nom tel qu'il était au moment du signalement. Un changement de nom
    // ultérieur ne doit pas réécrire une preuve.
    auteur: m.auteur?.eleve?.prenomNom ?? "—",
    envoyeLe: m.envoyeLe.toISOString(),
    corps: m.corps,
    ...(m.id === messageId ? { vise: true as const } : {}),
  });

  return [...avant.reverse(), ...(vise ? [vise] : []), ...apres].map(enLigne);
}
