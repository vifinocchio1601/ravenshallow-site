/**
 * Retirer d'un texte ce qui désigne quelqu'un.
 *
 * ── Où cela sert, et pourquoi c'est le même fichier des deux côtés ──
 *
 * Deux endroits s'en servent, et il ne faut pas qu'ils divergent :
 *
 *   `lib/erreurs/depot.ts`        avant d'écrire une erreur en base
 *   `lib/veille/rapport/…`        avant de laisser partir le rapport
 *
 * Deux caviardages écrits séparément finiraient par ne pas masquer les mêmes
 * choses, et c'est celui qu'on a oublié de corriger qui laisserait passer une
 * adresse.
 *
 * ── Ce que ce fichier N'EST PAS ──
 *
 * ⚠️ **Ce n'est pas une sécurité, c'est un filet.** La vraie protection est
 * que rien de personnel ne soit collecté : les requêtes de La Veille comptent
 * des lignes et ne demandent jamais `prenomNom` ni `email`. Un filet attrape
 * ce qui a échappé à la règle — le message d'erreur d'un envoi de courriel,
 * qui porte l'adresse du destinataire sans que personne l'ait voulu.
 *
 * S'y fier comme à une garantie serait l'erreur : un jour un format
 * d'identifiant lui échapperait, et l'on aurait cessé de faire attention en
 * amont.
 *
 * ── Ce qu'il masque ──
 *
 * Les adresses de courriel, et rien d'autre. C'est délibérément étroit : un
 * caviardage trop large rendrait les messages d'erreur illisibles — un chemin
 * de fichier masqué, un code d'erreur masqué, et le rapport ne sert plus à
 * rien. Les noms de personnages, eux, ne sont jamais collectés : c'est la
 * règle qui les protège, pas ce filet.
 */

/**
 * L'adresse de courriel, dans sa forme la plus large.
 *
 * ⚠️ **Volontairement permissive du côté gauche** : `untel+étiquette` et
 * `prenom.nom` doivent tomber. Une expression trop stricte laisserait passer
 * les adresses qui sortent de l'ordinaire, c'est-à-dire justement celles qu'on
 * ne pense pas à essayer.
 */
const ADRESSE = /[^\s<>()[\],;:"]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+/g;

/** Ce qu'on écrit à la place. Dit ce qui a été retiré, sans le dire. */
export const MASQUE = "[adresse masquée]";

export function caviarder(texte: string): string {
  return texte.replace(ADRESSE, MASQUE);
}

/**
 * Le texte porte-t-il encore une adresse ?
 *
 * Sert à la vérification finale du rapport : **on refuse de l'envoyer** plutôt
 * que de le caviarder en silence. Un rapport qui se corrigerait tout seul
 * masquerait le vrai problème, qui est qu'un collecteur a ramené ce qu'il
 * n'aurait pas dû.
 */
export function porteUneAdresse(texte: string): boolean {
  // `test` sur une expression globale avance `lastIndex` : on repart de zéro
  // à chaque appel, sinon un appel sur deux répondrait faux.
  ADRESSE.lastIndex = 0;
  return ADRESSE.test(texte);
}
