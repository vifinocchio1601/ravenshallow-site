import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import BrumeDeFond from "@/components/ceremonie/BrumeDeFond";
import Ceremonie from "@/components/ceremonie/Ceremonie";
import { TEXTES_CEREMONIE, type Paragraphe } from "@/lib/ceremonie/constantes";
import { ouvrirCeremonie } from "@/lib/ceremonie/depot";
import { pourLAffichage } from "@/lib/ceremonie/questionnaire";
import { ROUTES } from "@/lib/ecole/menu";
import { doitPasserAKaldvik, doitPasserAuMiroir } from "@/lib/session/acces";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CEREMONIE.titrePage,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * La Cérémonie du Miroir.
 *
 * Quatre gardes, dans cet ordre, et toutes côté serveur :
 *
 *   1. `exigerAcces` — dossier accepté et accès non suspendu, sinon renvoi
 *      vers l’écran que réserve l’état du compte. C’est la même table de
 *      vérité que partout ailleurs, aucune condition n’est réécrite ici.
 *   2. `doitPasserAuMiroir` — la salle n’ouvre qu’à qui le Miroir attend.
 *      Deux comptes en repartent vers leur bureau, pour des raisons
 *      opposées : celui qui est **déjà réparti** — la cérémonie ne se joue
 *      qu’une fois, art. 11.2 — et celui que la répartition **ne concerne
 *      pas**. Une directrice n’a rien à faire ici.
 *   3. `doitPasserAKaldvik` — **la baguette d’abord.** On ne se présente pas
 *      devant le Miroir les mains vides ; l’élève est renvoyé à Kaldvik. Un
 *      compte que la boutique ne concerne pas n’y est évidemment pas envoyé.
 *      Le lien grisé sur le bureau ne suffirait pas : l’adresse se tape.
 *   4. La fiche doit exister : un compte sans élève n’a rien à faire ici.
 *
 * L’ordre des deux du milieu n’est pas indifférent. Le Miroir passe en
 * premier : à un élève qu’il a déjà lu, la vraie réponse est « c’est fait »,
 * et non « va chercher une baguette » — même s’il lui en manque une.
 * Sa note des premiers pas l’enverra à la boutique depuis son bureau.
 *
 * Le mélange des réponses est tiré et rangé au premier passage seulement :
 * recharger la page relit le même ordre.
 *
 * La page vit **hors du groupe `(ecole)`** : pas de bandeau-parchemin. On
 * entre dans la salle, on n’en sort que par le Miroir.
 */
export default async function CeremoniePage() {
  const compte = await exigerAcces(ROUTES.ceremonie);
  if (!doitPasserAuMiroir(compte)) redirect(ROUTES.bureau);
  if (doitPasserAKaldvik(compte)) redirect(ROUTES.bjornstav);
  if (!compte.eleveId) notFound();

  const melange = await ouvrirCeremonie(compte.eleveId);
  const questions = pourLAffichage(melange);

  const t = TEXTES_CEREMONIE;

  return (
    <main className="min-h-[100svh]">
      <BrumeDeFond />

      <div className="ceremonie">
        <header className="flex min-h-[78svh] flex-col justify-center pt-24">
          <p className="eyebrow mb-7">{t.hero.eyebrow}</p>

          <h1 className="mb-6 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-normal leading-[1.06] tracking-[0.02em] text-parchment [text-shadow:0_0_44px_rgb(190_215_240_/_0.28)]">
            {t.hero.titre.map((ligne, index) => (
              <span key={ligne} className="block">
                {ligne}
                {index === 0 ? <span className="sr-only"> </span> : null}
              </span>
            ))}
          </h1>

          <p className="m-0 max-w-[34rem] font-body italic leading-[1.85] text-parchment-dim">
            {t.hero.accroche}
          </p>
        </header>

        <section className="recit">
          {t.recitAvantPhoto.map((paragraphe, index) => (
            <Paragraphe key={index} paragraphe={paragraphe} />
          ))}

          <figure className="my-12">
            <Image
              src="/ceremonie/miroir.webp"
              alt={t.photo.alt}
              width={1000}
              height={562}
              sizes="(max-width: 47rem) 100vw, 38rem"
              className="h-auto w-full border border-ember/30 shadow-[0_30px_80px_rgb(0_0_0_/_0.7)]"
            />
            <figcaption className="mt-4 text-center font-display text-[0.82rem] uppercase tracking-[0.12em] text-silver">
              {t.photo.legende}
            </figcaption>
          </figure>

          {t.recitApresPhoto.map((paragraphe, index) => (
            <Paragraphe key={index} paragraphe={paragraphe} />
          ))}
        </section>

        <div className="filet" aria-hidden="true">
          <span className="text-[0.8rem] tracking-[0.3em]">◆</span>
        </div>

        <Ceremonie questions={questions} />
      </div>
    </main>
  );
}

/** Narration en italique, parole de la directrice détachée et tenue. */
function Paragraphe({ paragraphe }: { paragraphe: Paragraphe }) {
  return (
    <p
      className={
        paragraphe.ton === "parole" ? "recit__parole" : "recit__narration"
      }
    >
      {paragraphe.texte}
    </p>
  );
}
