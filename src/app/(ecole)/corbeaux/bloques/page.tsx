import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ListeBloques from "@/components/corbeaux/ListeBloques";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { listerBlocages } from "@/lib/corbeaux/depot";
import { porteeDeLaTour } from "@/lib/corbeaux/droits";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CORBEAUX.metaTitre,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Les personnes bloquées.
 *
 * **Elle vit dans la Tour, et non dans des « réglages du compte »** — parce
 * qu'il n'en existe pas encore sur ce site, et qu'inventer une page de
 * réglages pour une seule liste aurait été un détour. Le jour où d'autres
 * préférences apparaîtront, cette liste ira les rejoindre : elle n'a aucune
 * logique propre, tout vit dans `lib/corbeaux/`.
 *
 * Fermée à un membre suspendu, qui n'a devant lui que le fil de
 * l'administration — et donc personne à bloquer ni à débloquer. Même mécanique
 * que `/corbeaux/nouveau` : la page se referme sur son propre prédicat plutôt
 * que sur une fermeture de route, qui produirait une redirection en boucle.
 */
export default async function BloquesPage() {
  const compte = await exigerAcces(ROUTES.corbeaux);
  if (porteeDeLaTour(compte) !== "TOUT") redirect(ROUTES.corbeaux);

  const bloquees = await listerBlocages(compte);
  const t = TEXTES_CORBEAUX.bloques;

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
        <ListeBloques initiales={bloquees} />
      </div>
    </main>
  );
}
