import type { Anomalie } from "./anomalies";
import { executer, type Recolte } from "./collecte";

/**
 * La boucle de la ronde — **et la seule chose qui sache qu'un collecteur peut
 * tomber**.
 *
 * ── Pourquoi elle vit ici et non dans `ronde.ts` ──
 *
 * Parce que `ronde.ts` est un point d'entrée : il lit l'environnement, ouvre
 * une base, envoie un courriel. Rien de tout cela ne s'éprouve, et la boucle
 * qui décide de la robustesse de tout le dispositif se retrouvait donc
 * vérifiée seulement à travers `executer` — c'est-à-dire un cran trop bas.
 *
 * Ici, elle est pure au sens qui compte : on lui donne des familles et une
 * horloge, elle rend ce qui a été vu, ce qui manque, et pourquoi. Les trois
 * garanties du brief se vérifient alors sans monter une ronde autour :
 *
 *   • une famille qui tombe n'emporte pas les autres ;
 *   • elle est NOMMÉE dans ce qui manque, jamais tue ;
 *   • la borne de durée arrête le reste et laisse envoyer ce qu'on a.
 */

export type Famille = {
  nom: string;
  faire: () => Promise<Recolte<unknown>>;
};

export type Resultat = {
  /** Les récoltes abouties, par nom de famille. */
  recoltes: Map<string, unknown>;
  /** Toutes les anomalies, dans l'ordre où elles ont été trouvées. */
  anomalies: Anomalie[];
  /** Ce qui n'a pas abouti, et pourquoi. */
  manquants: { nom: string; raison: string }[];
  /** La borne de durée a-t-elle coupé la ronde ? */
  ecourtee: boolean;
};

export type Options = {
  /** Ce qu'il reste de temps, en millisecondes. Appelée avant chaque famille. */
  resteMs: () => number;
  /** Pour dire où l'on en est. Muette par défaut — le journal est public. */
  dire?: (ligne: string) => void;
  horloge?: () => number;
};

export async function orchestrer(
  familles: readonly Famille[],
  { resteMs, dire = () => undefined, horloge }: Options,
): Promise<Resultat> {
  const recoltes = new Map<string, unknown>();
  const anomalies: Anomalie[] = [];
  const manquants: Resultat["manquants"] = [];
  let ecourtee = false;

  for (const famille of familles) {
    /**
     * ⚠️ **On s'arrête et l'on ENVOIE ce qu'on a.** Une ronde qui irait au
     * bout coûte que coûte serait tuée par le délai du workflow, et rien ne
     * partirait — c'est-à-dire le silence, précisément le jour où quelque
     * chose ne va pas.
     */
    if (resteMs() <= 0) {
      ecourtee = true;
      manquants.push({
        nom: famille.nom,
        raison: "La ronde avait atteint sa durée maximale avant d’y arriver.",
      });
      continue;
    }

    const resultat = await executer(famille.nom, famille.faire, horloge);

    if (resultat.etat === "FAIT") {
      anomalies.push(...resultat.anomalies);
      recoltes.set(famille.nom, resultat.donnees);
      dire(`  ${famille.nom} : vu`);
    } else {
      // ⚠️ Nommée, jamais tue : un trou silencieux se lit comme « rien à
      // signaler », ce qui est le contraire de la vérité.
      manquants.push({ nom: famille.nom, raison: resultat.raison });
      dire(`  ${famille.nom} : pas abouti`);
    }
  }

  return { recoltes, anomalies, manquants, ecourtee };
}
