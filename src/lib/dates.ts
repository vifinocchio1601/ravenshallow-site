/**
 * **Une date écrite en toutes lettres, et le « 1er » qui va avec.**
 *
 * `toLocaleDateString("fr-FR")` rend « 1 août 2026 ». En français on écrit
 * « 1er août » — et seulement pour le premier du mois : le 2 ne prend rien.
 * C'est la faute que personne ne relit, comme « 0 point » au pluriel.
 *
 * ⚠️ **Pas de `server-only`, et c'est nécessaire** : les deux côtés
 * l'appellent. Le serveur rend une date dans le HTML, le navigateur la remet
 * en forme dans le fuseau du lecteur — voir ci-dessous.
 *
 * ── Le fuseau, qui n'est pas un détail ──
 *
 * Le serveur de Vercel vit en UTC, le joueur non : le même instant s'écrit
 * « 23:40 hier » d'un côté et « 01:40 aujourd'hui » de l'autre. Tout ce qui
 * affiche une date porte donc `<time dateTime={iso}>` et
 * `suppressHydrationWarning` — l'instant voyage en ISO, et c'est la mise en
 * forme du navigateur qui gagne, la seule juste pour la personne qui lit.
 * Cette fonction est appelée des deux côtés ; elle ne décide pas du fuseau,
 * elle met en forme ce qu'on lui donne.
 *
 * ── Ce qui reste à rallier ──
 *
 * Une douzaine d'écrans d'administration portent encore leur propre `jour()`,
 * née avant celle-ci et sans le « 1er ». Les rallier un par un, au fil des
 * lots qui les touchent — un remplacement en masse sur des écrans qu'on ne
 * regarde pas ensuite est le meilleur moyen d'en casser un en silence.
 */

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/**
 * « 1er août 2026 », « 27 août 2026 ».
 *
 * Les mois sont écrits ici plutôt que demandés à `Intl` : il faut de toute
 * façon composer le jour à la main pour le « 1er », et deux sources — la
 * nôtre pour le nombre, celle du navigateur pour le mois — donneraient un jour
 * « 1er Août » sur un moteur qui capitalise.
 */
export function jourEnToutesLettres(date: Date): string {
  const jour = date.getDate();
  return `${jour === 1 ? "1er" : jour} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────
//  Un `<input type="date">`, dans les deux sens
// ─────────────────────────────────────────────────────────────

/**
 * **Le jour saisi devient un instant, posé à MIDI.**
 *
 * Un champ `date` rend « 2026-09-04 » : une journée, pas un instant. On la
 * fixe à midi et non à minuit — à minuit UTC, la moitié de la planète lit la
 * veille, et l'écran afficherait un jour de moins que celui qu'on a saisi.
 *
 * Rend `null` pour tout ce qui n'est pas un jour lisible, **le 31 février
 * compris** : `new Date(2026, 1, 31)` se lit sans broncher et devient le
 * 3 mars. Poser une date que personne n'a saisie est pire que la refuser.
 *
 * ⚠️ **Pas de comparaison ici.** « Cette date est-elle permise ? » dépend de
 * ce qu'on pose — une entrée en vigueur se compare à l'affichage, une fin
 * d'événement à son début. Cette fonction lit, elle n'arbitre pas.
 */
export function jourSaisi(brut: unknown): Date | null {
  if (typeof brut !== "string") return null;

  const net = brut.trim();
  if (net.length === 0) return null;

  const lu = /^(\d{4})-(\d{2})-(\d{2})$/.exec(net);
  if (!lu) return null;

  const [annee, mois, jour] = [Number(lu[1]), Number(lu[2]), Number(lu[3])];
  const date = new Date(annee, mois - 1, jour, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;

  // Le débordement silencieux : février 31 devient mars 3, et personne ne
  // s'en aperçoit avant de relire la page.
  if (
    date.getFullYear() !== annee ||
    date.getMonth() !== mois - 1 ||
    date.getDate() !== jour
  ) {
    return null;
  }

  return date;
}

/**
 * L'inverse : l'instant redevient la journée que le champ attend.
 *
 * ⚠️ **En heure LOCALE, jamais `toISOString`**, qui rend l'heure UTC : une
 * date posée à midi le 4 sortirait « 2026-09-03 » pour qui vit à l'ouest, et
 * le formulaire de correction afficherait la veille de ce qu'on a saisi.
 */
export function enJourSaisissable(date: Date | string | null): string {
  if (!date) return "";
  const lu = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(lu.getTime())) return "";
  const deuxChiffres = (n: number) => String(n).padStart(2, "0");
  return `${lu.getFullYear()}-${deuxChiffres(lu.getMonth() + 1)}-${deuxChiffres(lu.getDate())}`;
}
