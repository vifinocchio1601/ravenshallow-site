import type { PrismaClient } from "@prisma/client";
import { caviarder } from "@/lib/erreurs/caviardage";
import type { Anomalie } from "../anomalies";
import type { Recolte } from "../collecte";
import { ERREURS_DETAILLEES_MAX } from "../reglages";

/**
 * Les erreurs des dernières vingt-quatre heures — **groupées, jamais listées**.
 *
 * ── Pourquoi le groupement est la seule chose qui compte ici ──
 *
 * Une base qui s'endort produit cinquante fois `P2028` dans la nuit. Cinquante
 * lignes dans un courriel lu à 8 h sur un téléphone, c'est un rapport qu'on
 * referme — et le lendemain, on ne l'ouvre plus. Une ligne qui dit « 50 × la
 * transaction a expiré, dans la connexion » se lit en une seconde et dit
 * exactement la même chose.
 *
 * On groupe par **portée et type**, pas par message : deux messages qui ne
 * diffèrent que par un identifiant sont la même erreur.
 *
 * ── Ce qui remonte, et ce qui ne remonte pas ──
 *
 * ⚠️ **La pile ne remonte jamais**, et le message est déjà caviardé en base.
 * On le recaviarde quand même avant de le mettre dans le rapport : c'est bon
 * marché, et cela couvre le cas d'une ligne écrite avant que le caviardage
 * n'existe.
 *
 * ⚠️ **Une seule erreur n'est pas une anomalie.** Un `ECONNREFUSED` isolé à
 * 3 h du matin est la vie normale d'un serveur. Ce qui mérite un signalement,
 * c'est la répétition — ou une famille qu'on n'avait jamais vue.
 */

export type FamilleDErreurs = {
  portee: string;
  type: string;
  code: string | null;
  nombre: number;
  /** Un exemple, caviardé et tronqué. Jamais la pile. */
  exemple: string;
  /** La dernière fois qu'elle est survenue. */
  derniere: Date;
};

export type Erreurs = {
  total: number;
  familles: FamilleDErreurs[];
  /** Combien de familles n'ont pas été détaillées, faute de place. */
  nonDetaillees: number;
};

export type Options = { base: PrismaClient; instant: Date };

/** Au-delà, une famille se répète assez pour mériter d'être signalée. */
const REPETITION_NOTABLE = 5;

const JOUR = 24 * 60 * 60 * 1000;

export async function collecterLesErreurs({
  base,
  instant,
}: Options): Promise<Recolte<Erreurs>> {
  const depuis = new Date(instant.getTime() - JOUR);

  const groupes = await base.erreurServeur.groupBy({
    by: ["portee", "type", "code"],
    where: { survenuLe: { gte: depuis, lt: instant } },
    _count: { _all: true },
    _max: { survenuLe: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Un exemple par famille — une requête par groupe, mais il y en a peu, et
  // seulement celles qu'on va détailler.
  const familles: FamilleDErreurs[] = [];
  for (const groupe of groupes.slice(0, ERREURS_DETAILLEES_MAX)) {
    const exemple = await base.erreurServeur.findFirst({
      where: {
        portee: groupe.portee,
        type: groupe.type,
        code: groupe.code,
        survenuLe: { gte: depuis, lt: instant },
      },
      orderBy: { survenuLe: "desc" },
      select: { message: true },
    });

    familles.push({
      portee: groupe.portee,
      type: groupe.type,
      code: groupe.code,
      nombre: groupe._count._all,
      // Recaviardé par précaution, et tronqué : un rapport se lit sur un
      // téléphone, pas une trace de deux mille signes.
      exemple: caviarder(exemple?.message ?? "").slice(0, 200),
      derniere: groupe._max.survenuLe ?? depuis,
    });
  }

  const total = groupes.reduce((somme, g) => somme + g._count._all, 0);

  return {
    donnees: {
      total,
      familles,
      nonDetaillees: Math.max(0, groupes.length - ERREURS_DETAILLEES_MAX),
    },
    anomalies: familles.filter((f) => f.nombre >= REPETITION_NOTABLE).map(enAnomalie),
  };
}

function enAnomalie(famille: FamilleDErreurs): Anomalie {
  return {
    // ⚠️ Le NOMBRE n'entre pas dans la clé : il change tous les matins, et une
    // erreur qui changerait d'identité chaque jour ne durerait jamais. La
    // famille, elle, est stable.
    cle: `erreurs:${famille.portee}:${famille.type}${famille.code ? `:${famille.code}` : ""}`,
    gravite: "PANNE",
    quoi:
      `La même erreur s’est répétée ${famille.nombre} fois en vingt-quatre heures.`,
    ou: `${famille.portee} — ${famille.type}${famille.code ? ` (${famille.code})` : ""}`,
    detail: famille.exemple || undefined,
  };
}
