import { bilanCalme, bilanCharge } from "./exemples";
import { corpsDuRapport } from "./corps";
import { objetDuRapport } from "./objet";

/**
 * Montre à quoi ressemble un rapport — sans attendre un vrai mauvais matin.
 *
 * Utile en changeant la mise en forme : on voit tout de suite ce qu'un joueur
 * lira, plutôt que de le découvrir le jour où quelque chose casse.
 *
 *   npm run veille:exemple
 */
for (const [quoi, bilan] of [
  ["UN MATIN CALME", bilanCalme()],
  ["UN MAUVAIS MATIN", bilanCharge()],
] as const) {
  console.log(`\n${"═".repeat(66)}\n  ${quoi}\n${"═".repeat(66)}\n`);
  console.log(`Objet : ${objetDuRapport(bilan)}\n`);
  console.log(corpsDuRapport(bilan));
}
