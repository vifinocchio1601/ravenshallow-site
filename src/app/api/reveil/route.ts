import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * **Le point qu'on appelle pour empêcher la base de s'endormir.**
 *
 * ── Le défaut qu'il corrige ──
 *
 * Neon, en formule gratuite, suspend le calcul après **cinq minutes** sans
 * requête, et cette durée n'est pas modifiable. Vercel, de son côté, laisse
 * refroidir une fonction inutilisée. Les deux s'additionnent : le premier
 * visiteur après une accalmie attend **quinze à trente secondes**, et peut
 * tomber sur une erreur — mesuré le 27 août 2026, 30 s en échec, puis 14,7 s,
 * puis 0,4 s.
 *
 * Le code avait déjà fait ce qu'il pouvait : `connect_timeout` et les délais
 * de transaction empêchent l'erreur 500 franche. Ils ne peuvent pas empêcher
 * l'attente. **Le seul remède restant est d'empêcher l'endormissement**, en
 * appelant le site de l'extérieur toutes les quelques minutes.
 *
 * ── Ce qu'il fait, et rien de plus ──
 *
 * La requête la plus petite que Postgres accepte. Elle ne lit aucune table,
 * ne révèle rien, et ne demande aucune session : elle réveille, c'est tout.
 *
 * ── Pourquoi il n'a pas de secret ──
 *
 * Parce qu'un secret ne protégerait de rien. Neon facture **le temps
 * d'éveil**, pas le nombre de requêtes : mille appels sur une base déjà
 * éveillée coûtent exactement ce que coûte le fait qu'elle soit éveillée —
 * ce qui est précisément le but. Un secret n'ajouterait qu'une variable
 * d'environnement de plus à tenir, et une panne de plus le jour où elle
 * manque.
 *
 * ⚠️ **Ce qui se surveille, en revanche, c'est le quota.** Garder la base
 * éveillée en permanence consomme des heures de calcul, et la formule
 * gratuite en donne un nombre fini. D'où l'appel restreint à une plage
 * horaire plutôt qu'aux vingt-quatre heures — voir `CLAUDE.md`.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const debut = Date.now();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    // Un réveil raté n'est pas une panne du site : le prochain appel
    // retombera sur une base réveillée. On le dit sans dramatiser, et sans
    // laisser fuir le message d'erreur, qui porte l'adresse de la base.
    return NextResponse.json(
      { eveille: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { eveille: true, ms: Date.now() - debut },
    { headers: { "Cache-Control": "no-store" } },
  );
}
