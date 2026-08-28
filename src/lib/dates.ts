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
