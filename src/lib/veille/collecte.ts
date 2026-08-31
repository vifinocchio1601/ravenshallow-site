import type { Anomalie } from "./anomalies";

/**
 * Ce qu'un collecteur rend, et ce qui arrive quand il tombe.
 *
 * ── Une famille qui tombe n'emporte pas les autres ──
 *
 * C'est l'exigence même du dispositif : si le contrôle de cohérence échoue
 * — une requête mal écrite, une table renommée —, la disponibilité, les
 * chiffres de vie et ce qui attend doivent partir quand même. Un rapport
 * amputé qui le dit vaut infiniment mieux qu'un rapport absent.
 *
 * ⚠️ **Et il doit le DIRE.** Un collecteur tombé en silence se lit comme
 * « rien à signaler », ce qui est exactement le contraire de la vérité. C'est
 * la raison d'être de l'état `TOMBE` : le rapport porte une section « ce que
 * la ronde n'a pas pu voir », et un trou n'y passe jamais pour un calme.
 *
 * ── `executer` est le SEUL endroit qui sache qu'un collecteur peut tomber ──
 *
 * Les collecteurs, eux, lèvent librement. Ils n'ont ni `try` ni `catch`, ne
 * rendent pas de code d'erreur, et ne se demandent jamais ce qui arrive à la
 * ronde s'ils échouent. C'est ce qui les rend lisibles — et testables un par
 * un, sans monter la ronde entière autour.
 */

export type Recolte<T> = {
  /** Les faits. Des nombres, jamais des noms — voir `rapport/caviardage.ts`. */
  donnees: T;
  /** Ce qui ne va pas, s'il y a lieu. */
  anomalies: Anomalie[];
};

export type Resultat<T> =
  | { etat: "FAIT"; nom: string; dureeMs: number } & Recolte<T>
  | { etat: "TOMBE"; nom: string; dureeMs: number; raison: string };

/**
 * Lance un collecteur et rapporte ce qui s'est passé — sans jamais lever.
 *
 * ⚠️ **`horloge` est passée en paramètre**, et ce n'est pas une coquetterie :
 * la durée doit se mesurer sans lire l'horloge du système, faute de quoi la
 * fonction cesse d'être éprouvable. C'est le parti pris de tout le domaine.
 */
export async function executer<T>(
  nom: string,
  travail: () => Promise<Recolte<T>>,
  horloge: () => number = () => Date.now(),
): Promise<Resultat<T>> {
  const debut = horloge();
  try {
    const recolte = await travail();
    return { etat: "FAIT", nom, dureeMs: horloge() - debut, ...recolte };
  } catch (erreur) {
    return {
      etat: "TOMBE",
      nom,
      dureeMs: horloge() - debut,
      raison: messageDe(erreur),
    };
  }
}

/**
 * Le message d'une erreur, sans sa pile.
 *
 * ⚠️ **La pile ne remonte jamais dans le rapport.** Elle contient des chemins
 * de fichiers, parfois des valeurs, et le rapport part par courriel. Le
 * message suffit à savoir quoi regarder ; le reste se retrouve en relançant la
 * ronde à la main.
 */
export function messageDe(erreur: unknown): string {
  if (erreur instanceof Error) return erreur.message;
  return String(erreur);
}

/**
 * Coupe un travail au bout d'un délai.
 *
 * Sans cela, une page qui ne répond jamais retiendrait la ronde entière — et
 * c'est précisément le jour où le site est en panne qu'on a besoin du rapport.
 */
export async function avecDelai<T>(
  travail: (signal: AbortSignal) => Promise<T>,
  delaiMs: number,
  quoi: string,
): Promise<T> {
  const arret = new AbortController();
  const minuteur = setTimeout(() => arret.abort(), delaiMs);
  try {
    return await travail(arret.signal);
  } catch (erreur) {
    if (arret.signal.aborted) {
      throw new Error(`${quoi} n’a pas répondu en ${Math.round(delaiMs / 1000)} s.`);
    }
    throw erreur;
  } finally {
    clearTimeout(minuteur);
  }
}
