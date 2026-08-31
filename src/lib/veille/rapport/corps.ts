import { estPersistante, type AnomalieDatee } from "../anomalies";
import type { CeQuiAttend } from "../collecteurs/attente";
import type { Vie } from "../collecteurs/vie";
import { REGLEMENT, TEXTES } from "../constantes";
import type { Bilan } from "./bilan";
import { jourCourt } from "./objet";

/**
 * Le corps du rapport — **du texte, court, lu sur un téléphone à 8 h**.
 *
 * ── Pourquoi pas de HTML ──
 *
 * Décision du brief, et elle se tient : un tableau de bord se regarde, un
 * texte se lit. Le second passe partout — client de messagerie ancien, mode
 * texte, lecteur d'écran — et surtout il oblige à ne dire que l'essentiel. On
 * ne met pas un graphique dans un rapport qu'on veut voir lu tous les jours.
 *
 * ── L'ordre est celui de l'urgence ──
 *
 *   1. ce qui ne va pas       les anomalies, les plus graves d'abord
 *   2. ce qui t'attend        des nombres, du travail
 *   3. la vie du site         les chiffres et leur écart
 *   4. suggestions            clairement séparées des faits
 *
 * Et à la fin seulement, ce que la ronde n'a pas pu voir — c'est important,
 * mais ce n'est pas ce qu'on lit en premier.
 *
 * ── Ce qui n'y figure jamais ──
 *
 * ⚠️ **Aucun nom, aucune adresse, aucun extrait de message.** La règle est
 * tenue en amont : les collecteurs ne rapportent que des nombres et des
 * identifiants. `caviardage.ts` relit ce texte avant l'envoi et **refuse de le
 * laisser partir** s'il y trouve une adresse.
 *
 * ── Largeur ──
 *
 * Soixante-six colonnes : au-delà, un client de messagerie replie les lignes
 * n'importe où et l'alignement des chiffres se défait.
 */

const LARGEUR = 66;

/** Un titre de section, souligné. */
function section(titre: string): string[] {
  return ["", titre, "─".repeat(Math.min(titre.length, LARGEUR)), ""];
}

/** « il y a 3 jours », « depuis ce matin ». */
function depuisQuand(anomalie: AnomalieDatee): string {
  if (!estPersistante(anomalie)) return "vue ce matin";
  return `déjà là depuis ${anomalie.jours} jours`;
}

/** Accorde un nom au nombre. Zéro est au singulier en français. */
function accorde(nombre: number, singulier: string, pluriel = `${singulier}s`): string {
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`;
}

/**
 * Replie un texte à la largeur voulue, en gardant une marge à gauche.
 *
 * `margeSuite` permet d'indenter les lignes de continuation davantage que la
 * première — c'est ce qui fait qu'une suggestion à trois lignes reste un bloc
 * sous son tiret, au lieu de se confondre avec la suivante.
 */
function replier(texte: string, marge: string, margeSuite = marge): string[] {
  const lignes: string[] = [];
  let courante = "";
  let premiere = true;

  const pousser = () => {
    lignes.push((premiere ? marge : margeSuite) + courante);
    premiere = false;
  };

  for (const mot of texte.split(/\s+/)) {
    const large = LARGEUR - (premiere ? marge.length : margeSuite.length);
    if (courante && `${courante} ${mot}`.length > large) {
      pousser();
      courante = mot;
    } else {
      courante = courante ? `${courante} ${mot}` : mot;
    }
  }
  if (courante) pousser();
  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  1. Ce qui ne va pas
// ─────────────────────────────────────────────────────────────

function ceQuiNeVaPas(anomalies: readonly AnomalieDatee[]): string[] {
  if (anomalies.length === 0) {
    return [...section(TEXTES.sections.anomalies), "  Rien à signaler ce matin."];
  }

  const lignes = section(TEXTES.sections.anomalies);

  for (const anomalie of anomalies) {
    lignes.push(`  ${TEXTES.gravites[anomalie.gravite].toUpperCase()}`);
    lignes.push(...replier(anomalie.quoi, "  "));
    // Où, et depuis quand : les deux choses qu'on veut avant de décider quoi
    // que ce soit. Sur la même ligne, elles se lisent d'un coup.
    lignes.push(`    ${anomalie.ou} · ${depuisQuand(anomalie)}`);
    if (anomalie.detail) lignes.push(...replier(anomalie.detail, "    "));
    lignes.push("");
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  2. Ce qui t'attend
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **Des nombres, jamais des noms.** « 3 dossiers attendent une lecture »,
 * et pas qui les a déposés : un dossier porte une candidature, parfois un
 * refus à venir, et cela ne voyage pas dans un courriel.
 */
function ceQuiAttend(attente: CeQuiAttend | null): string[] {
  const lignes = section(TEXTES.sections.attente);
  if (!attente) {
    lignes.push(...replier(TEXTES.collecteurTombe, "  "));
    return lignes;
  }

  const postes: [number, string][] = [
    [attente.dossiers, "dossier d’admission attend une lecture|dossiers d’admission attendent une lecture"],
    [attente.dossiersACorriger, "dossier est en correction chez son auteur|dossiers sont en correction chez leur auteur"],
    [attente.signalements, "signalement n’a pas été traité|signalements n’ont pas été traités"],
    [attente.courrier, "lettre au château attend une réponse|lettres au château attendent une réponse"],
    [attente.partenariats, "demande de partenariat est sans suite|demandes de partenariat sont sans suite"],
    [
      attente.scenesMuettes,
      `scène est sans réponse depuis plus d’un mois (art. 17.2)|scènes sont sans réponse depuis plus d’un mois (art. 17.2)`,
    ],
    [
      attente.correctionsEnRetard,
      `post masqué a dépassé ses ${REGLEMENT.correctionJours} jours de correction (art. 19.3)|posts masqués ont dépassé leurs ${REGLEMENT.correctionJours} jours de correction (art. 19.3)`,
    ],
    [
      attente.comptesInactifs,
      "compte est inactif depuis plus d’un mois (art. 7.2)|comptes sont inactifs depuis plus d’un mois (art. 7.2)",
    ],
    [
      attente.comptesArchivables,
      "compte peut être archivé, trois mois atteints (art. 7.3)|comptes peuvent être archivés, trois mois atteints (art. 7.3)",
    ],
  ];

  const aDire = postes.filter(([nombre]) => nombre > 0);

  if (aDire.length === 0) {
    lignes.push("  Rien n’attend. Tout est à jour.");
    return lignes;
  }

  for (const [nombre, formes] of aDire) {
    const [singulier, pluriel] = formes.split("|");
    lignes.push(...replier(`${nombre} ${nombre > 1 ? pluriel : singulier}`, "  "));
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  3. La vie du site
// ─────────────────────────────────────────────────────────────

/** « 12 » aligné à droite sur quatre colonnes, pour que l'œil suive. */
const cadre = (valeur: string, large: number) => valeur.padStart(large);

function laVieDuSite(vie: Vie | null): string[] {
  const lignes = section(TEXTES.sections.vie);
  if (!vie) {
    lignes.push(...replier(TEXTES.collecteurTombe, "  "));
    return lignes;
  }

  const nomLarge = Math.max(...vie.chiffres.map((c) => c.nom.length));

  for (const chiffre of vie.chiffres) {
    let ligne = `  ${chiffre.nom.padEnd(nomLarge)}  ${cadre(String(chiffre.aujourdhui), 4)}`;

    if (chiffre.hier !== null) ligne += `   hier ${cadre(String(chiffre.hier), 3)}`;

    if (chiffre.moyenne !== null) {
      // Une décimale sur la moyenne, aucune sur le reste : c'est le seul
      // chiffre qui n'est pas un compte d'objets réels.
      ligne += `   moy. ${cadre(chiffre.moyenne.toFixed(1).replace(".", ","), 5)}`;
    }

    if (chiffre.ecartPourcent !== null && chiffre.ecartPourcent !== 0) {
      // ⚠️ Le VRAI signe moins (U+2212), jamais le trait d'union : dans une
      // colonne de chiffres, « -15 » et « +15 » ne se lisent pas à la même
      // hauteur. Même règle que `points/affichage.ts`.
      const signe = chiffre.ecartPourcent > 0 ? "+" : "−";
      ligne += `   ${signe}${Math.abs(chiffre.ecartPourcent)} %`;
    }

    lignes.push(ligne);
  }

  if (vie.historique === 0) {
    lignes.push("");
    lignes.push(
      ...replier(
        "Pas encore d’historique : les écarts apparaîtront après quelques rondes.",
        "  ",
      ),
    );
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  3 bis. Les erreurs du serveur
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **Groupées, jamais listées.** Une base qui s’endort produit cinquante
 * fois la même erreur dans la nuit : cinquante lignes dans un courriel lu sur
 * un téléphone, c’est un rapport qu’on referme.
 *
 * Les familles qui se répètent assez sont déjà remontées en anomalie, plus
 * haut. Celles-ci sont le reste : trop rares pour alerter, trop présentes pour
 * être tues.
 */
function lesErreurs(erreurs: Bilan["erreurs"]): string[] {
  // Le collecteur a tourné et n’a rien trouvé : rien à dire, et une section
  // « 0 erreur » chaque matin finirait par ne plus être lue.
  if (!erreurs || erreurs.total === 0) return [];

  const lignes = ["", "Erreurs du serveur sur vingt-quatre heures :"];

  for (const famille of erreurs.familles) {
    lignes.push(
      `  ${String(famille.nombre).padStart(3)} × ${famille.portee} — ${famille.type}` +
        (famille.code ? ` (${famille.code})` : ""),
    );
  }

  if (erreurs.nonDetaillees > 0) {
    lignes.push(`  et ${accorde(erreurs.nonDetaillees, "autre famille", "autres familles")}.`);
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  4. Les suggestions
// ─────────────────────────────────────────────────────────────

/**
 * ⚠️ **Séparées des faits, et annoncées comme telles.** Elles sont écrites par
 * un modèle de langage à partir des seuls chiffres du rapport ; il n'a vu ni
 * la base, ni un message, ni un nom. Les mêler aux observations ferait lire
 * une hypothèse comme une mesure.
 */
function lesSuggestions(suggestions: string[] | null): string[] {
  const lignes = section(TEXTES.sections.suggestions);

  if (suggestions === null) {
    lignes.push(...replier(TEXTES.suggestionsAbsentes, "  "));
    return lignes;
  }
  if (suggestions.length === 0) return [];

  lignes.push(...replier(TEXTES.avertissementSuggestions, "  "));
  lignes.push("");
  for (const suggestion of suggestions) {
    // Le tiret sur la première ligne, la suite alignée dessous : sans cela,
    // deux suggestions de trois lignes se confondent en un seul paragraphe.
    lignes.push(...replier(`— ${suggestion}`, "  ", "    "));
    lignes.push("");
  }
  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  Ce que la ronde n'a pas pu voir
// ─────────────────────────────────────────────────────────────

function ceQuiManque(bilan: Bilan): string[] {
  if (bilan.manquants.length === 0 && !bilan.ecourtee) return [];

  const lignes = section(TEXTES.sections.manquant);

  if (bilan.ecourtee) {
    lignes.push(
      ...replier(
        "La ronde a atteint sa durée maximale et s’est arrêtée d’elle-même. " +
          "Ce qui suit a été rapporté ; le reste n’a pas été vérifié.",
        "  ",
      ),
    );
    lignes.push("");
  }

  for (const manquant of bilan.manquants) {
    lignes.push(`  ${manquant.nom}`);
    lignes.push(...replier(manquant.raison, "    "));
    lignes.push("");
  }

  return lignes;
}

// ─────────────────────────────────────────────────────────────
//  Le tout
// ─────────────────────────────────────────────────────────────

export function corpsDuRapport(bilan: Bilan): string {
  const enTete = [
    `Ronde du ${jourCourt(bilan.instant)}, ${new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Brussels",
      hour: "2-digit",
      minute: "2-digit",
    }).format(bilan.instant)}.`,
  ];

  const pied = [
    "",
    "─".repeat(LARGEUR),
    ...replier(TEXTES.pied, ""),
    `Ronde faite en ${(bilan.dureeMs / 1000).toFixed(0)} s.`,
  ];

  return [
    ...enTete,
    ...ceQuiNeVaPas(bilan.anomalies),
    ...ceQuiAttend(bilan.attente),
    ...laVieDuSite(bilan.vie),
    ...lesErreurs(bilan.erreurs),
    ...lesSuggestions(bilan.suggestions),
    ...ceQuiManque(bilan),
    ...pied,
  ]
    .join("\n")
    // Jamais trois sauts de ligne d'affilée : le texte respire, il ne bâille pas.
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .concat("\n");
}

/** Le corps du courriel qu'on envoie quand la ronde elle-même est tombée. */
export function corpsDeLEchec(instant: Date, erreur: string): string {
  return [
    `La ronde du ${jourCourt(instant)} n’est pas allée au bout.`,
    "",
    ...replier(erreur, "  "),
    "",
    ...replier(
      "Rien n’a été vérifié ce matin. Un échec silencieux étant pire qu’une " +
        "panne, ce message part quand même — c’est sa seule raison d’être.",
      "",
    ),
    "",
    "─".repeat(LARGEUR),
    ...replier(TEXTES.pied, ""),
  ].join("\n");
}

/** Exporté pour les essais : le nombre de postes qui attendent vraiment. */
export { accorde };
