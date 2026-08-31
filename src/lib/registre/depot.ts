import "server-only";
import { adressePortrait } from "@/lib/ecole/portrait";
import { prisma } from "@/lib/prisma";
import {
  libellePlace,
  rangAnnee,
  MAISONS,
  type EtatEtape,
  type Maison,
} from "@/lib/dossier/etats";

/**
 * L'accès au Registre — l'annuaire des membres.
 *
 * **Seul endroit qui compose une requête de liste sur les fiches.** Il n'écrit
 * rien : le Registre est une lecture, et les fiches se modifient depuis
 * « Ma fiche » ou depuis l'administration.
 *
 * ⚠️ **Aucune sanction ne s'y voit, jamais** — art. 8.2 : les décisions de
 * modération « ne sont jamais exposées publiquement pour l'humilier ». Un
 * membre suspendu figure au Registre **exactement comme les autres**, sans
 * pastille, sans mention, sans tri à part. Ne jamais ajouter `statutAcces` à
 * ces requêtes, même « pour information ».
 *
 * ⚠️ **`portraitUrl` ne sort JAMAIS d'une requête de liste.** Les portraits
 * sont stockés en base, en texte encodé — deux cents kilo-octets par membre.
 * On demande donc seulement **quelles fiches en ont un**, par une requête qui
 * ne rend que des identifiants, et l'image passe ensuite par
 * `/api/portraits/[id]`, qui se met en cache. Piège déjà payé sur la carte de
 * l'auteur d'un post.
 *
 * ⚠️ **Les comptes de service n'y figurent pas** — celui de La Veille, qui se
 * connecte chaque matin pour vérifier que les écrans s'affichent. La condition
 * est écrite en toutes lettres dans les deux requêtes, jamais factorisée : la
 * sortir d'ici la rendrait invisible, et c'est la leçon du courrier du
 * château. `veille/etancheite.test.ts` la vérifie fonction par fonction.
 */

export type LigneDuRegistre = {
  eleveId: string;
  prenomNom: string;
  /** L'année, ou le titre au château qui la remplace. */
  place: string;
  /** L'adresse du portrait, ou `null` si la fiche n'en porte pas. */
  portrait: string | null;
};

export type GroupeDuRegistre = {
  /** La maison, ou `null` pour les deux groupes qui n'en sont pas une. */
  maison: Maison | null;
  /** Ce qui titre le groupe : le nom de la maison, ou une phrase. */
  cle: "MAISON" | "CHATEAU" | "ATTENTE";
  membres: LigneDuRegistre[];
};

type FicheLue = {
  id: string;
  prenomNom: string;
  fonction: string;
  roleAffiche: string | null;
  maison: string | null;
  etatMaison: EtatEtape;
  majLe: Date;
};

/**
 * **Tout le monde, groupé.**
 *
 * Les quatre maisons dans l'ordre de `MAISONS`, puis ceux que le Miroir ne
 * concerne pas — la directrice, les professeurs —, puis ceux qu'il attend.
 *
 * ⚠️ **Ces trois groupes se lisent sur `etatMaison`, jamais sur la colonne
 * `maison`.** Une case vide ne dit rien : la directrice garde sa maison écrite
 * au chaud sous `SANS_OBJET`, et un élève accepté qui attend le Miroir a la
 * même case vide qu'elle. C'est l'état qui tranche, et lui seul.
 */
export async function lireLeRegistre(): Promise<GroupeDuRegistre[]> {
  const fiches: FicheLue[] = await prisma.eleve.findMany({
    where: { statut: "ACCEPTE", utilisateur: { compteDeService: false } },
    select: {
      id: true,
      prenomNom: true,
      fonction: true,
      roleAffiche: true,
      maison: true,
      etatMaison: true,
      majLe: true,
    },
  });

  const avecPortrait = await idsAvecPortrait(fiches.map((f) => f.id));

  const enLigne = (f: FicheLue): LigneDuRegistre => ({
    eleveId: f.id,
    prenomNom: f.prenomNom,
    place: libellePlace(
      f.fonction as Parameters<typeof libellePlace>[0],
      f.roleAffiche,
    ),
    portrait: avecPortrait.has(f.id) ? adressePortrait(f.id, f.majLe) : null,
  });

  // Par année croissante puis par nom : un annuaire d'école se parcourt des
  // plus jeunes aux plus âgés, et l'alphabet départage — sinon l'ordre change
  // entre deux visites sans que rien n'ait bougé.
  const ranger = (a: FicheLue, b: FicheLue) =>
    rangAnnee(a.fonction as Parameters<typeof rangAnnee>[0]) -
      rangAnnee(b.fonction as Parameters<typeof rangAnnee>[0]) ||
    a.prenomNom.localeCompare(b.prenomNom, "fr");

  const groupes: GroupeDuRegistre[] = MAISONS.map((maison) => ({
    maison,
    cle: "MAISON" as const,
    membres: fiches
      .filter((f) => f.etatMaison === "FAIT" && f.maison === maison)
      .sort(ranger)
      .map(enLigne),
  }));

  // Le château : la directrice et les professeurs. Rangés par nom — leur
  // titre est leur identité, et une année n'y voudrait rien dire.
  const chateau = fiches
    .filter((f) => f.etatMaison === "SANS_OBJET")
    .sort((a, b) => a.prenomNom.localeCompare(b.prenomNom, "fr"))
    .map(enLigne);
  if (chateau.length > 0) {
    groupes.push({ maison: null, cle: "CHATEAU", membres: chateau });
  }

  const attente = fiches
    .filter((f) => f.etatMaison === "NON_FAIT")
    .sort(ranger)
    .map(enLigne);
  if (attente.length > 0) {
    groupes.push({ maison: null, cle: "ATTENTE", membres: attente });
  }

  return groupes;
}

/** Ce qu'une fiche publique montre — toute la fiche de jeu. */
export type FichePublique = {
  eleveId: string;
  /** L'identifiant du COMPTE : on écrit à un joueur, pas à une fiche. */
  compteId: string;
  prenomNom: string;
  place: string;
  age: number;
  genre: string;
  famille: string;
  maison: Maison | null;
  etatMaison: EtatEtape;
  baguette: string | null;
  portrait: string | null;
  /** Le visage d'emprunt, quand c'est celui d'une célébrité (art. 6.2). */
  acteurNom: string | null;
  biographie: string;
  qualites: string[];
  defauts: string[];
  plusGrandePeur: string;
  /** Art. 15.4 — affichés publiquement, et c'est écrit dans le règlement. */
  avertissements: string[];
  points: number;
};

/**
 * Une fiche, par son identifiant.
 *
 * Rend `null` pour un dossier qui n'est pas accepté **comme** pour un
 * identifiant qui ne correspond à rien : l'écran répond « Ce couloir ne mène
 * nulle part » dans les deux cas. Distinguer les deux dirait qu'un dossier
 * existe et attend — ce qui ne regarde personne.
 */
export async function lireLaFiche(
  eleveId: string,
): Promise<FichePublique | null> {
  const f = await prisma.eleve.findFirst({
    where: {
      id: eleveId,
      statut: "ACCEPTE",
      utilisateur: { compteDeService: false },
    },
    select: {
      id: true,
      utilisateurId: true,
      prenomNom: true,
      fonction: true,
      roleAffiche: true,
      age: true,
      genre: true,
      famille: true,
      maison: true,
      etatMaison: true,
      etatBaguette: true,
      baguetteBois: true,
      baguetteCoeur: true,
      acteurNom: true,
      biographie: true,
      qualite1: true,
      qualite2: true,
      qualite3: true,
      defaut1: true,
      defaut2: true,
      defaut3: true,
      plusGrandePeur: true,
      points: true,
      majLe: true,
      // ⚠️ **Jamais `portraitUrl`.** On demande s'il y en a un, pas lequel.
      utilisateur: { select: { limitesEcriture: true } },
    },
  });
  if (!f) return null;

  const avecPortrait = await idsAvecPortrait([f.id]);

  return {
    eleveId: f.id,
    compteId: f.utilisateurId,
    prenomNom: f.prenomNom,
    place: libellePlace(
      f.fonction as Parameters<typeof libellePlace>[0],
      f.roleAffiche,
    ),
    age: f.age,
    genre: f.genre,
    famille: f.famille,
    // La maison ne s'affiche que si son ÉTAT le dit — une case vide ne dit
    // rien, et la directrice garde la sienne au chaud sous `SANS_OBJET`.
    maison: f.etatMaison === "FAIT" ? (f.maison as Maison | null) : null,
    etatMaison: f.etatMaison,
    baguette:
      f.etatBaguette === "FAIT" && f.baguetteBois && f.baguetteCoeur
        ? `${f.baguetteBois}|${f.baguetteCoeur}`
        : null,
    portrait: avecPortrait.has(f.id) ? adressePortrait(f.id, f.majLe) : null,
    acteurNom: f.acteurNom,
    biographie: f.biographie,
    qualites: [f.qualite1, f.qualite2, f.qualite3],
    defauts: [f.defaut1, f.defaut2, f.defaut3],
    plusGrandePeur: f.plusGrandePeur,
    avertissements: f.utilisateur.limitesEcriture,
    points: f.points,
  };
}

/**
 * **Quelles fiches portent un portrait** — et rien d'autre.
 *
 * Une requête qui ne rend que des identifiants : demander `portraitUrl` pour
 * savoir s'il est nul tirerait l'image entière de la base, deux cents
 * kilo-octets par membre, pour n'en regarder que la présence.
 */
async function idsAvecPortrait(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const avec = await prisma.eleve.findMany({
    where: { id: { in: ids }, portraitUrl: { not: null } },
    select: { id: true },
  });
  return new Set(avec.map((e) => e.id));
}
