import type { Metadata } from "next";
import Link from "next/link";
import ListeConversations from "@/components/corbeaux/ListeConversations";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { listerConversations } from "@/lib/corbeaux/depot";
import { porteeDeLaTour } from "@/lib/corbeaux/droits";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: TEXTES_CORBEAUX.metaTitre,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * La Tour aux Corbeaux — la liste des conversations.
 *
 * La page est rendue côté serveur, pleine dès le premier affichage ; c’est le
 * composant client qui prend le relais pour le rafraîchissement. Un joueur
 * sans JavaScript voit donc quand même ses conversations, et peut les ouvrir.
 *
 * Deux publics, et l’écran n’est pas le même :
 *
 *   TOUT                 — ses fils, et de quoi en ouvrir un nouveau
 *   ADMINISTRATION_SEULE — un membre suspendu : on lui dit où sont passées ses
 *                          conversations, et on lui laisse la voie de recours
 */
export default async function CorbeauxPage() {
  const compte = await exigerAcces(ROUTES.corbeaux);
  const portee = porteeDeLaTour(compte);
  const t = TEXTES_CORBEAUX;

  const conversations = await listerConversations(compte);

  const suspendu = portee === "ADMINISTRATION_SEULE";

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᚲ
        </span>
        {t.liste.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {t.liste.titre}
      </h1>
      <p className="mt-3 max-w-[54ch] font-body leading-[1.8] text-parchment-dim">
        {t.liste.accueil}
      </p>

      {/* Un membre suspendu ne doit pas croire que ses conversations ont
          disparu : on lui dit qu’elles l’attendent, et pourquoi. */}
      {suspendu ? (
        <div className="mt-8 max-w-[52ch] rounded-sm border border-ember/25 bg-mist/40 px-5 py-4">
          <p className="font-display text-[0.72rem] uppercase tracking-[0.16em] text-parchment">
            {t.suspendu.titre}
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-parchment-dim">
            {t.suspendu.corps}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {/* Le nouvel arrivant comme le membre de longue date écrivent au
            château par la même porte. Elle mène au fil existant s’il y en a
            un : il n’y en a jamais deux. */}
        <Link href={ROUTES.corbeauxAdministration} className="btn btn-ghost">
          {t.administration.ouvrir}
        </Link>

        {!suspendu ? (
          <>
            <Link href={ROUTES.corbeauxNouveau} className="btn btn-ghost">
              {t.liste.nouveau}
            </Link>
            {/* La liste des personnes bloquées vit ici, faute de « réglages du
                compte » sur ce site. Elle ira les rejoindre le jour où il y en
                aura. */}
            <Link href={ROUTES.corbeauxBloques} className="btn btn-ghost">
              {t.bloques.lien}
            </Link>
          </>
        ) : null}
      </div>

      <div className="hairline mt-8" />

      <div className="mt-8">
        <ListeConversations initiales={conversations} />
      </div>
    </main>
  );
}
