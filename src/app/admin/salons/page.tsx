import type { Metadata } from "next";
import { retirerAction } from "@/app/admin/salons/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import { MAISONS } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { lireLesSalonsPourAdministration } from "@/lib/salon/depot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${TEXTES_SALON.administration.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

/**
 * **Les quatre salons, en lecture.**
 *
 * ⚠️ **C'est le seul endroit du site où le staff lit une conversation, et il
 * faut savoir pourquoi c'est légitime.** Un salon est une **pièce** : y entrer
 * et lire est normal, comme un professeur qui traverse la salle commune. Une
 * correspondance ne l'est pas — « le staff ne lit pas les conversations
 * privées » reste vrai, tenu par `etancheite.test.ts`, et aucun écran ne
 * permet d'ouvrir un fil de corbeaux.
 *
 * Cet écran existe parce que la page `/maison` exige d'avoir une maison :
 * une directrice n'en a pas, et n'atteindrait donc aucun salon. Sans lui, le
 * pouvoir de retirer un message ne voudrait rien dire.
 *
 * **On y lit, on n'y parle pas.** La zone d'administration n'a pas de comptes
 * distincts, et un message sans auteur dans un salon ne signifierait rien —
 * ce sens-là est déjà pris par les réponses du château dans la Tour.
 */
export default async function Page() {
  const t = TEXTES_SALON.administration;
  const pieces = await lireLesSalonsPourAdministration(MAISONS);

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[72ch] font-body leading-[1.8] text-parchment-dim">
          {t.chapeau}
        </p>

        {/* **Les quatre maisons sortent toujours dans l'ordre de `MAISONS`**,
            jamais triées par activité : une pièce qui change de place entre
            deux visites est désorientante. Même règle que les tubes. */}
        {pieces.map((piece) => (
          <section key={piece.maison} className="mt-12">
            <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
              {NOMS_MAISON[piece.maison] ?? piece.maison}
            </h2>

            {piece.messages.length === 0 ? (
              <p className="mt-3 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
                {t.aucun}
              </p>
            ) : (
              <ol className="mt-3 grid grid-cols-1 gap-3 rounded-sm border border-silver/12 bg-mist/30 p-4">
                {piece.messages.map((message) => (
                  <li key={message.id} className="min-w-0">
                    {/* ⚠️ Un `div`, et jamais un `p` : il contient un
                        `form`, que le navigateur refuse dans un paragraphe —
                        il referme le `p` avant, l'arbre rendu cesse de
                        ressembler à celui du serveur, et React échoue à
                        l'hydratation. Le message d'erreur ne dit rien de la
                        balise fautive. */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[0.68rem] uppercase tracking-[0.1em] text-parchment">
                        {message.auteurNom ?? TEXTES_SALON.auteurParti}
                      </span>
                      {message.auteurPlace ? (
                        <span className="font-body text-xs italic text-silver">
                          {message.auteurPlace}
                        </span>
                      ) : null}
                      {/* L'instant voyage en ISO ; c'est le navigateur qui met
                          en forme, le serveur vivant en UTC. */}
                      <time
                        dateTime={message.ecritLe}
                        suppressHydrationWarning
                        className="font-body text-xs italic text-silver/80"
                      >
                        {quand(message.ecritLe)}
                      </time>

                      <form action={retirerAction} className="inline">
                        <input type="hidden" name="id" value={message.id} />
                        <input
                          type="hidden"
                          name="maison"
                          value={piece.maison}
                        />
                        <button
                          type="submit"
                          aria-label={TEXTES_SALON.retirer.aria.replace(
                            "{qui}",
                            message.auteurNom ?? TEXTES_SALON.auteurParti,
                          )}
                          title={TEXTES_SALON.retirer.aide}
                          className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-silver hover:text-ember"
                        >
                          {TEXTES_SALON.retirer.libelle}
                        </button>
                      </form>
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words font-body text-sm leading-[1.7] text-parchment-dim">
                      {message.corps}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

/** « 28 août, 14:32 ». */
function quand(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
