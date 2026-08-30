import "server-only";
import { MATIERES } from "@/lib/cours/cursus";
import { porteQuelqueChose } from "@/lib/forum/longueur";
import { nettoyerHtml } from "@/lib/forum/nettoyer-html";
import { nettoyerTexteLibre, nettoyerUneLigne } from "@/lib/texte";
import type { AccesGrimoire } from "./acces";
import {
  TYPES_BLOC,
  type Bloc,
  type DonneesFicheInterdite,
  type DonneesFicheSort,
  type DonneesParagraphe,
  type DonneesSousTitre,
  type DonneesTableau,
  type TypeBloc,
} from "./blocs";
import { TEXTES_GRIMOIRES } from "./constantes";
import {
  ANCRE_MAX,
  COLONNES_MAX,
  DESCRIPTION_GRIMOIRE_MAX,
  EFFET_MAX,
  EXERGUE_MAX,
  GLYPHES_MAX,
  LIGNES_TABLEAU_MAX,
  NOM_SORT_MAX,
  PARAGRAPHE_MAX,
  RUBRIQUES_MAX,
  SLUG_MAX,
  SOUS_TITRE_MAX,
  TITRE_CHAPITRE_MAX,
  TITRE_GRIMOIRE_MAX,
} from "./limites";
import { estUneReliure, type Reliure } from "./reliures";

/**
 * Ce qu'un grimoire, un chapitre et un bloc ont le droit d'être — **la seule
 * porte par laquelle ils entrent en base**.
 *
 * `validerBloc` nettoie le balisage lui-même, si bien qu'aucun appelant ne
 * peut l'oublier : c'est le parti pris d'`envoyerCorbeau`, puis de
 * `validerPost`, puis des annonces. D'où le `server-only` — le nettoyeur n'a
 * rien à faire dans un paquet expédié au navigateur.
 *
 * **La liste blanche est celle du forum, et il n'y en a qu'une.**
 * `nettoyerHtml` porte le nom du forum parce qu'il y est né ; en écrire une
 * seconde pour les grimoires, ce serait garantir qu'un jour l'une laisse
 * passer ce que l'autre refuse.
 *
 * La base porte les mêmes limites **en plus grossier** : un signe qui ne soit
 * pas un blanc, une longueur, un objet JSON. Elle n'arrête que ce qui
 * casserait l'affichage, et le fait sur tous les chemins — le site, un
 * script, une commande tapée à la main. Le travail fin est ici.
 */

export type Resultat<T> =
  | { ok: true; valeur: T }
  | { ok: false; message: string };

const E = TEXTES_GRIMOIRES.erreurs;

/** Les identifiants de matière du cursus — la source, jamais recopiée. */
const MATIERES_CONNUES = new Set(MATIERES.map((m) => m.id));

const FORME_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function ligne(
  brut: unknown,
  max: number,
  vide: string,
  tropLong: string,
): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: vide };
  const net = nettoyerUneLigne(brut);
  if (net.length === 0) return { ok: false, message: vide };
  if (net.length > max) {
    return { ok: false, message: tropLong.replace("{max}", String(max)) };
  }
  return { ok: true, valeur: net };
}

// ─────────────────────────────────────────────────────────────
//  Le volume et ses chapitres
// ─────────────────────────────────────────────────────────────

/** L'adresse d'un volume ou d'un chapitre : `/grimoires/sortileges`. */
export function validerSlug(brut: unknown): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.slugInvalide };
  const net = brut.trim();
  if (!FORME_SLUG.test(net) || net.length > SLUG_MAX) {
    return { ok: false, message: E.slugInvalide };
  }
  return { ok: true, valeur: net };
}

export function validerTitreGrimoire(brut: unknown): Resultat<string> {
  return ligne(brut, TITRE_GRIMOIRE_MAX, E.titreVide, E.titreTropLong);
}

export function validerTitreChapitre(brut: unknown): Resultat<string> {
  return ligne(brut, TITRE_CHAPITRE_MAX, E.titreVide, E.titreTropLong);
}

export function validerDescriptionGrimoire(brut: unknown): Resultat<string> {
  return ligne(
    brut,
    DESCRIPTION_GRIMOIRE_MAX,
    E.descriptionVide,
    E.descriptionTropLongue,
  );
}

/** L'exergue est **facultatif** : un volume peut n'avoir que son titre. */
export function validerExergue(brut: unknown): Resultat<string | null> {
  if (brut === null || brut === undefined || brut === "") {
    return { ok: true, valeur: null };
  }
  const r = ligne(brut, EXERGUE_MAX, E.titreVide, E.exergueTropLong);
  return r.ok ? { ok: true, valeur: r.valeur } : r;
}

export function validerAcces(brut: unknown): Resultat<AccesGrimoire> {
  if (brut === "TOUS" || brut === "ADMINISTRATION") {
    return { ok: true, valeur: brut };
  }
  return { ok: false, message: E.accesInconnu };
}

export function validerReliure(brut: unknown): Resultat<Reliure> {
  return estUneReliure(brut)
    ? { ok: true, valeur: brut }
    : { ok: false, message: E.reliureInconnue };
}

/** L'ancre d'un lien précis. Facultative : un séparateur n'en a pas. */
export function validerAncre(brut: unknown): Resultat<string | null> {
  if (brut === null || brut === undefined || brut === "") {
    return { ok: true, valeur: null };
  }
  if (typeof brut !== "string") return { ok: false, message: E.ancreInvalide };
  const net = brut.trim();
  if (!FORME_SLUG.test(net) || net.length > ANCRE_MAX) {
    return { ok: false, message: E.ancreInvalide };
  }
  return { ok: true, valeur: net };
}

// ─────────────────────────────────────────────────────────────
//  Les blocs
// ─────────────────────────────────────────────────────────────

/** Ce qu'on s'apprête à écrire : un bloc, sans son identifiant. */
export type BlocAEcrire = Pick<Bloc, "type" | "ancre"> & { donnees: object };

function texteLibre(
  brut: unknown,
  max: number,
): Resultat<string> {
  if (typeof brut !== "string") return { ok: false, message: E.blocVide };
  const net = nettoyerTexteLibre(brut);
  if (net.length === 0) return { ok: false, message: E.blocVide };
  if (net.length > max) return { ok: false, message: E.blocTropLong };
  return { ok: true, valeur: net };
}

function texteLibreFacultatif(
  brut: unknown,
  max: number,
): Resultat<string | null> {
  if (brut === null || brut === undefined || brut === "") {
    return { ok: true, valeur: null };
  }
  return texteLibre(brut, max);
}

function validerParagraphe(d: {
  html?: unknown;
}): Resultat<DonneesParagraphe> {
  if (typeof d.html !== "string") return { ok: false, message: E.blocVide };
  const net = nettoyerHtml(d.html);
  // Le vide se juge sur le CONTENU, jamais sur la chaîne : « <p></p> » pèse
  // sept signes et ne dit rien. Leçon des annonces.
  if (!porteQuelqueChose(net)) return { ok: false, message: E.blocVide };
  if (net.length > PARAGRAPHE_MAX) {
    return { ok: false, message: E.blocTropLong };
  }
  return { ok: true, valeur: { html: net } };
}

function validerSousTitre(d: { texte?: unknown }): Resultat<DonneesSousTitre> {
  const r = ligne(d.texte, SOUS_TITRE_MAX, E.blocVide, E.blocTropLong);
  return r.ok ? { ok: true, valeur: { texte: r.valeur } } : r;
}

function validerFicheSort(d: {
  nom?: unknown;
  glyphes?: unknown;
  formule?: unknown;
  lie?: unknown;
  matiere?: unknown;
  annee?: unknown;
  effet?: unknown;
  limite?: unknown;
}): Resultat<DonneesFicheSort> {
  const nom = ligne(d.nom, NOM_SORT_MAX, E.blocVide, E.blocTropLong);
  if (!nom.ok) return nom;

  const formule = ligne(d.formule, NOM_SORT_MAX, E.blocVide, E.blocTropLong);
  if (!formule.ok) return formule;

  if (!Array.isArray(d.glyphes) || d.glyphes.length === 0) {
    return { ok: false, message: E.blocVide };
  }
  if (d.glyphes.length > GLYPHES_MAX) {
    return { ok: false, message: E.glyphesTropNombreux };
  }
  const glyphes: string[] = [];
  for (const g of d.glyphes) {
    if (typeof g !== "string" || g.trim().length === 0) {
      return { ok: false, message: E.blocVide };
    }
    glyphes.push(g.trim());
  }

  // ⚠️ La matière s'accroche au cursus, qui est la source. Un libellé recopié
  // finirait par diverger, et c'est la copie oubliée qu'un joueur lirait.
  if (typeof d.matiere !== "string" || !MATIERES_CONNUES.has(d.matiere)) {
    return {
      ok: false,
      message: E.matiereInconnue.replace("{matiere}", String(d.matiere)),
    };
  }

  if (
    typeof d.annee !== "number" ||
    !Number.isInteger(d.annee) ||
    d.annee < 1 ||
    d.annee > 7
  ) {
    return { ok: false, message: E.anneeHorsBornes };
  }

  const effet = texteLibre(d.effet, EFFET_MAX);
  if (!effet.ok) return effet;

  const limite = texteLibreFacultatif(d.limite, EFFET_MAX);
  if (!limite.ok) return limite;

  return {
    ok: true,
    valeur: {
      nom: nom.valeur,
      glyphes,
      formule: formule.valeur,
      lie: d.lie === true,
      matiere: d.matiere,
      annee: d.annee,
      effet: effet.valeur,
      limite: limite.valeur,
    },
  };
}

function validerFicheInterdite(d: {
  nom?: unknown;
  verbe?: unknown;
  rubriques?: unknown;
}): Resultat<DonneesFicheInterdite> {
  const nom = ligne(d.nom, NOM_SORT_MAX, E.blocVide, E.blocTropLong);
  if (!nom.ok) return nom;

  const verbe = ligne(d.verbe, NOM_SORT_MAX, E.blocVide, E.blocTropLong);
  if (!verbe.ok) return verbe;

  if (
    !Array.isArray(d.rubriques) ||
    d.rubriques.length === 0 ||
    d.rubriques.length > RUBRIQUES_MAX
  ) {
    return { ok: false, message: E.blocVide };
  }

  const rubriques: { titre: string; texte: string }[] = [];
  for (const brute of d.rubriques) {
    const r = (brute ?? {}) as { titre?: unknown; texte?: unknown };
    const titre = ligne(r.titre, NOM_SORT_MAX, E.blocVide, E.blocTropLong);
    if (!titre.ok) return titre;
    const texte = texteLibre(r.texte, EFFET_MAX);
    if (!texte.ok) return texte;
    rubriques.push({ titre: titre.valeur, texte: texte.valeur });
  }

  return {
    ok: true,
    valeur: { nom: nom.valeur, verbe: verbe.valeur, rubriques },
  };
}

function validerTableau(d: {
  entetes?: unknown;
  lignes?: unknown;
}): Resultat<DonneesTableau> {
  if (
    !Array.isArray(d.entetes) ||
    d.entetes.length === 0 ||
    d.entetes.length > COLONNES_MAX
  ) {
    return { ok: false, message: E.blocVide };
  }
  const entetes = d.entetes.map((e) =>
    typeof e === "string" ? nettoyerUneLigne(e) : "",
  );

  if (!Array.isArray(d.lignes) || d.lignes.length === 0) {
    return { ok: false, message: E.blocVide };
  }
  if (d.lignes.length > LIGNES_TABLEAU_MAX) {
    return { ok: false, message: E.blocTropLong };
  }

  const lignes: string[][] = [];
  for (const l of d.lignes) {
    if (!Array.isArray(l) || l.length !== entetes.length) {
      return { ok: false, message: E.tableauIrregulier };
    }
    lignes.push(
      l.map((c) => (typeof c === "string" ? nettoyerUneLigne(c) : "")),
    );
  }

  return { ok: true, valeur: { entetes, lignes } };
}

/** Ce que le navigateur envoie est-il un type de bloc ? */
export function estUnTypeDeBloc(brut: unknown): brut is TypeBloc {
  return (
    typeof brut === "string" && (TYPES_BLOC as readonly string[]).includes(brut)
  );
}

/**
 * **Un bloc, validé et nettoyé.** La seule porte.
 *
 * ⚠️ Elle ne dit rien du chapitre où il ira : c'est la base qui refuse une
 * `FICHE_INTERDITE` hors d'un chapitre réservé à l'administration, et elle le
 * fait pour tous les chemins — y compris un script lancé à la main.
 */
export function validerBloc(brut: unknown): Resultat<BlocAEcrire> {
  if (typeof brut !== "object" || brut === null) {
    return { ok: false, message: E.typeInconnu };
  }
  const { type, donnees, ancre } = brut as {
    type?: unknown;
    donnees?: unknown;
    ancre?: unknown;
  };

  if (!estUnTypeDeBloc(type)) return { ok: false, message: E.typeInconnu };

  const ancreValide = validerAncre(ancre);
  if (!ancreValide.ok) return ancreValide;

  const d =
    typeof donnees === "object" && donnees !== null
      ? (donnees as Record<string, unknown>)
      : {};

  const contenu: Resultat<object> =
    type === "PARAGRAPHE"
      ? validerParagraphe(d)
      : type === "SOUS_TITRE"
        ? validerSousTitre(d)
        : type === "FICHE_SORT"
          ? validerFicheSort(d)
          : type === "FICHE_INTERDITE"
            ? validerFicheInterdite(d)
            : type === "TABLEAU"
              ? validerTableau(d)
              : // Un séparateur ne porte rien, et ne peut donc pas être vide.
                { ok: true, valeur: {} };

  if (!contenu.ok) return contenu;

  return {
    ok: true,
    valeur: { type, donnees: contenu.valeur, ancre: ancreValide.valeur },
  };
}
