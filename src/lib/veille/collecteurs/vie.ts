import type { PrismaClient } from "@prisma/client";
import type { Anomalie, Memoire } from "../anomalies";
import { jourDe } from "../anomalies";
import type { Recolte } from "../collecte";
import { CHIFFRES_DE_VIE, type CleDeVie } from "../constantes";
import { ECART_NOTABLE_POURCENT, JOURS_D_HISTORIQUE, PLANCHE_POUR_L_ECART } from "../reglages";

/**
 * Les chiffres de vie du site — **et surtout leur écart**.
 *
 * ── Le chiffre brut n'apprend rien ──
 *
 * « 12 posts hier » ne dit ni que le site va bien ni qu'il va mal. « 12 posts,
 * contre 40 en moyenne » dit quelque chose : peut-être une panne que personne
 * n'a signalée, peut-être les vacances. C'est l'écart qui parle, et c'est
 * pourquoi ce collecteur a besoin d'une mémoire.
 *
 * Deux comparaisons, parce qu'elles ne disent pas la même chose :
 *
 *   la veille   attrape la chute brutale — le site est tombé cette nuit
 *   la moyenne  attrape la dérive lente — le forum s'éteint depuis un mois
 *
 * ── Ce que ce collecteur ne fait pas ──
 *
 * ⚠️ **Il ne juge jamais qu'une hausse ou une baisse est bonne.** Une envolée
 * des corbeaux peut être un démarchage ou une intrigue qui prend ; le rapport
 * signale l'écart, le joueur décide. La seule chose que La Veille se permet,
 * c'est de dire « c'est inhabituel ».
 *
 * ⚠️ **Aucun nom, nulle part.** On compte des posts, jamais qui les a écrits.
 */

export type Chiffre = {
  cle: CleDeVie;
  nom: string;
  aujourdhui: number;
  /** La veille, ou `null` si la ronde n'a pas encore tourné hier. */
  hier: number | null;
  /** La moyenne des sept derniers jours, ou `null` faute d'historique. */
  moyenne: number | null;
  /** L'écart à la moyenne, en pourcentage arrondi. `null` si incalculable. */
  ecartPourcent: number | null;
};

export type Vie = {
  jour: string;
  chiffres: Chiffre[];
  /** Le nombre de jours d'historique dont on disposait. */
  historique: number;
};

export type Options = { base: PrismaClient; instant: Date; memoire: Memoire };

const JOUR = 24 * 60 * 60 * 1000;

export async function collecterLaVie({
  base,
  instant,
  memoire,
}: Options): Promise<Recolte<Vie>> {
  const depuis = new Date(instant.getTime() - JOUR);
  const bornes = { gte: depuis, lt: instant };

  /**
   * ⚠️ **Le compte de service est écarté de TOUS les chiffres**, et ce n'est
   * pas une coquetterie : il se connecte chaque matin, ce qui le ferait
   * compter comme un membre actif tous les jours de l'année. Le rapport
   * annoncerait « 1 membre actif » un jour où personne n'est venu — c'est
   * exactement le genre de chiffre rassurant et faux qui vide un tableau de
   * bord de son sens.
   *
   * Vu pour de bon au premier essai : la création du compte a fait apparaître
   * « 1 nouveau dossier ».
   */
  const pasLaVeille = { utilisateur: { compteDeService: false } };

  const [
    membresActifs,
    posts,
    scenesOuvertes,
    scenesCloses,
    corbeaux,
    dossiers,
    points,
  ] = await Promise.all([
    // « Actif » = s'est connecté. C'est la seule trace d'activité que la base
    // porte, depuis que `derniereConnexionLe` existe.
    base.utilisateur.count({
      where: { compteDeService: false, derniereConnexionLe: bornes },
    }),
    base.post.count({ where: { publieLe: bornes, auteur: pasLaVeille } }),
    base.sujet.count({ where: { creeLe: bornes, auteur: pasLaVeille } }),
    // Une scène close n'a pas forcément été close par son auteur : on ne
    // filtre donc pas dessus, et le compte de service ne clôt jamais rien.
    base.sujet.count({ where: { closLe: bornes } }),
    base.message.count({ where: { envoyeLe: bornes, auteur: { compteDeService: false } } }),
    base.eleve.count({ where: { soumisLe: bornes, ...pasLaVeille } }),
    // Les points marqués, reprises comprises : on compte ce qui s'est passé,
    // pas ce qui reste. Un point donné puis repris est un événement.
    base.pointGagne.aggregate({
      where: { gagneLe: bornes, eleve: pasLaVeille },
      _sum: { points: true },
    }),
  ]);

  const bruts: Record<CleDeVie, number> = {
    membresActifs,
    posts,
    scenesOuvertes,
    scenesCloses,
    corbeaux,
    dossiers,
    points: points._sum.points ?? 0,
  };

  const jour = jourDe(instant);
  const passe = memoire.vie.filter((v) => v.jour !== jour);
  const hier = passe.at(-1)?.chiffres ?? null;
  const derniers = passe.slice(-JOURS_D_HISTORIQUE);

  const chiffres: Chiffre[] = CHIFFRES_DE_VIE.map(({ cle, nom }) => {
    const aujourdhui = bruts[cle];
    const valeursPassees = derniers
      .map((v) => v.chiffres[cle])
      .filter((v): v is number => typeof v === "number");

    const moyenne =
      valeursPassees.length === 0
        ? null
        : valeursPassees.reduce((a, b) => a + b, 0) / valeursPassees.length;

    return {
      cle,
      nom,
      aujourdhui,
      hier: hier?.[cle] ?? null,
      moyenne,
      ecartPourcent: ecart(aujourdhui, moyenne),
    };
  });

  return {
    donnees: { jour, chiffres, historique: derniers.length },
    anomalies: chiffres.flatMap(juger),
  };
}

/**
 * L'écart à la moyenne, en pourcentage.
 *
 * ⚠️ **Rend `null` sous le plancher**, et c'est ce qui rend le rapport
 * lisible : passer de 1 post à 3 est une hausse de 200 % qui n'apprend rien.
 * Sur un forum qui démarre, sans ce plancher le rapport crierait tous les
 * matins — et l'on cesserait de le lire, ce qui est le seul vrai risque.
 */
export function ecart(aujourdhui: number, moyenne: number | null): number | null {
  if (moyenne === null) return null;
  if (moyenne < PLANCHE_POUR_L_ECART && aujourdhui < PLANCHE_POUR_L_ECART) return null;
  if (moyenne === 0) return null;
  return Math.round(((aujourdhui - moyenne) / moyenne) * 100);
}

/** Un écart notable mérite un mot — jamais un jugement. */
function juger(chiffre: Chiffre): Anomalie[] {
  if (chiffre.ecartPourcent === null) return [];
  if (Math.abs(chiffre.ecartPourcent) < ECART_NOTABLE_POURCENT) return [];

  const enHausse = chiffre.ecartPourcent > 0;

  return [
    {
      // ⚠️ Ni le chiffre ni l'écart dans la clé : ils bougent tous les jours.
      // Le sens, lui, est stable — une baisse qui dure est une baisse qui dure.
      cle: `vie:${chiffre.cle}:${enHausse ? "hausse" : "baisse"}`,
      gravite: "A_SURVEILLER",
      quoi:
        `Les ${chiffre.nom} sont ${enHausse ? "bien au-dessus" : "bien en dessous"} ` +
        "de la moyenne des derniers jours.",
      ou: "la vie du site",
      detail:
        `${chiffre.aujourdhui} aujourd’hui, ` +
        `${chiffre.moyenne?.toFixed(1).replace(".", ",")} en moyenne ` +
        `(${enHausse ? "+" : "−"}${Math.abs(chiffre.ecartPourcent)} %)`,
    },
  ];
}

/** Range les chiffres du jour dans la mémoire, en gardant l'historique court. */
export function memoriserLaVie(memoire: Memoire, vie: Vie): Memoire {
  const chiffres = Object.fromEntries(
    vie.chiffres.map((c) => [c.cle, c.aujourdhui]),
  ) as Record<string, number>;

  return {
    ...memoire,
    vie: [...memoire.vie.filter((v) => v.jour !== vie.jour), { jour: vie.jour, chiffres }]
      // Un peu plus que la fenêtre : on garde de quoi calculer une moyenne
      // même si une ronde a sauté.
      .slice(-(JOURS_D_HISTORIQUE + 3)),
  };
}
