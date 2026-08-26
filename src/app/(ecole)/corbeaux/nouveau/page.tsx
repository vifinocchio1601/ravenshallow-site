import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import RechercheCorbeau from "@/components/corbeaux/RechercheCorbeau";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { porteeDeLaTour } from "@/lib/corbeaux/droits";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CORBEAUX.metaTitre,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Écrire à quelqu’un pour la première fois.
 *
 * La page se referme sur son propre prédicat plutôt que sur une fermeture de
 * route : un membre suspendu a bien accès à la Tour — c’est sa voie de
 * recours —, mais il n’a personne à chercher. Le renvoyer à la liste vaut
 * mieux qu’un champ qui ne rendrait jamais rien.
 *
 * C’est la même mécanique que `/bjornstav` et `/ceremonie`, et pour la même
 * raison : fermer la route entière produirait une redirection en boucle.
 */
export default async function NouveauCorbeauPage() {
  const compte = await exigerAcces(ROUTES.corbeaux);
  if (porteeDeLaTour(compte) !== "TOUT") redirect(ROUTES.corbeaux);

  const t = TEXTES_CORBEAUX.nouveau;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.corbeaux}
        className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
      >
        ← {TEXTES_CORBEAUX.fil.retour}
      </Link>

      <h1 className="mt-5 font-display text-[clamp(1.6rem,4.5vw,2.2rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {t.titre}
      </h1>
      <p className="mt-3 max-w-[52ch] font-body leading-[1.8] text-parchment-dim">
        {t.aide}
      </p>

      <div className="mt-8 max-w-[38rem]">
        <RechercheCorbeau />
      </div>
    </main>
  );
}
