import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Boutique from "@/components/bjornstav/Boutique";
import DecorEchoppe from "@/components/bjornstav/DecorEchoppe";
import Fragments from "@/components/bjornstav/Fragments";
import {
  CARTES_BOIS,
  CARTES_COEUR,
  ENTRE_LE_BOIS_ET_LE_COEUR,
  RECIT_APRES_ENSEIGNE,
  RECIT_AVANT_ENSEIGNE,
  SUITE_BOIS,
} from "@/lib/bjornstav/constantes";
import { TEXTES_BJORNSTAV } from "@/lib/bjornstav/textes";
import { ROUTES } from "@/lib/ecole/menu";
import { doitPasserAKaldvik } from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_BJORNSTAV.titrePage,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * La boutique Bjornstav, à Kaldvik.
 *
 * Trois gardes, dans cet ordre, et toutes côté serveur :
 *
 *   1. `exigerAcces` — dossier accepté et accès non suspendu, sinon renvoi
 *      vers l’écran que réserve l’état du compte. C’est la même table de
 *      vérité que partout ailleurs, aucune condition n’est réécrite ici.
 *   2. `doitPasserAKaldvik` — l’échoppe n’ouvre qu’à qui elle attend. Deux
 *      comptes en repartent aussitôt vers leur bureau, pour des raisons
 *      opposées : celui qui a **déjà** sa baguette — le choix est définitif —
 *      et celui que la boutique **ne concerne pas**, une directrice, un
 *      professeur. La question ne se pose plus en « a-t-il une baguette ? »,
 *      qui confondait les deux.
 *   3. La fiche doit exister : un compte sans élève n’a rien à faire ici.
 *
 * La page vit **hors du groupe `(ecole)`** : pas de bandeau-parchemin. On
 * entre dans l’échoppe, on en ressort par le sentier.
 *
 * Rien de ce qui suit n’a le moindre effet de jeu : aucun bois, aucun cœur
 * n’avantage qui que ce soit, et rien ici n’influence la répartition. La
 * boutique et le Miroir sont indépendants.
 */
export default async function BjornstavPage() {
  const compte = await exigerAcces(ROUTES.bjornstav);
  if (!doitPasserAKaldvik(compte)) redirect(ROUTES.bureau);
  if (!compte.eleveId) notFound();

  const t = TEXTES_BJORNSTAV;

  return (
    <main className="min-h-[100svh]">
      <DecorEchoppe />

      <div className="echoppe">
        <header className="flex min-h-[58svh] flex-col justify-end pb-9 pt-28">
          <p className="eyebrow mb-6">{t.hero.eyebrow}</p>

          <h1 className="mb-6 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-normal leading-[1.06] tracking-[0.02em] text-parchment [text-shadow:0_0_44px_rgb(230_170_90_/_0.28)]">
            {t.hero.titre}
          </h1>

          <p className="m-0 max-w-[34rem] font-body italic leading-[1.85] text-parchment-dim">
            {t.hero.accroche}
          </p>
        </header>

        {/* Le récit et l’enseigne dans une seule section : c’est ce qui donne
            une lettrine à la page, et une seule — elle se pose sur le premier
            paragraphe de narration, pas sur celui de chaque bloc. */}
        <section className="recit">
          <Fragments paragraphes={RECIT_AVANT_ENSEIGNE} />

          {/* La pancarte, à l’endroit exact où le texte la décrit. Ses
              dimensions sont écrites : sans elles, la page sauterait au
              moment où l’image arrive. */}
          <Image
            src="/bjornstav/enseigne.webp"
            alt={t.enseigne.alt}
            width={1100}
            height={290}
            sizes="(max-width: 40rem) 100vw, 34rem"
            className="enseigne"
          />

          <Fragments paragraphes={RECIT_APRES_ENSEIGNE} />
        </section>

        {/* Les cartes du bois s’intercalent ici, sur « Alors ? Qu’est-ce qui
            te tire l’œil ? ». */}
        <Boutique
          cartesBois={CARTES_BOIS}
          cartesCoeur={CARTES_COEUR}
          suitesBois={SUITE_BOIS}
          entreLeBoisEtLeCoeur={ENTRE_LE_BOIS_ET_LE_COEUR}
        />
      </div>
    </main>
  );
}
