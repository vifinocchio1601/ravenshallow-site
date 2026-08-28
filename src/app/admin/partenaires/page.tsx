import type { Metadata } from "next";
import Link from "next/link";
import {
  remettreAction,
  retirerAction,
  suiteAction,
} from "@/app/admin/partenaires/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulairePartenaire from "@/components/admin/FormulairePartenaire";
import { jourEnToutesLettres } from "@/lib/dates";
import { TEXTES_PARTENARIAT } from "@/lib/partenariat/constantes";
import {
  listerDemandes,
  listerPourAdministration,
} from "@/lib/partenariat/depot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_PARTENARIAT.administration.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Le bloc de partenaires, côté administration.**
 *
 * Deux choses sur un seul écran, et elles ne se confondent pas : le **bloc**,
 * qui est ce que la page publique affiche, et les **demandes**, qui sont ce
 * qu'on nous a écrit. Marquer une demande acceptée n'ajoute personne au bloc —
 * une demande porte le nom qu'ils se donnent, le bloc porte ce que nous
 * affichons, et l'adresse de leur bannière ne figure même pas dans le
 * formulaire public.
 *
 * **La correction se fait sur place**, par `?corriger=<id>` : un second écran
 * aurait eu son propre formulaire, et deux formulaires finissent par accepter
 * deux saisies différentes.
 *
 * ⚠️ **Les partenaires retirés s'affichent ici, et nulle part ailleurs.**
 * Retirer n'efface pas : la ligne reste, et « Remettre » existe pour que le
 * clic malheureux ne soit pas définitif.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { corriger?: string };
}) {
  const t = TEXTES_PARTENARIAT.administration;
  const [tous, demandes] = await Promise.all([
    listerPourAdministration(),
    listerDemandes(),
  ]);

  // Un partenaire retiré ne se corrige pas : on le remet d'abord. Corriger ce
  // que personne ne voit ne mène nulle part.
  const enCorrection = searchParams?.corriger
    ? tous.find((p) => p.id === searchParams.corriger && p.retireLe === null)
    : undefined;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappel}
        </p>
        <Link
          href="/partenariat"
          className="mt-4 inline-block font-display text-[0.66rem] uppercase tracking-[0.2em] text-aurora-teal transition-opacity duration-300 hover:opacity-75"
        >
          {t.lienPublic}
        </Link>

        {/* — Ajouter, ou corriger — */}
        <section className="mt-10">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {enCorrection ? t.formulaire.enregistrer : t.formulaire.titre}
          </h2>

          <FormulairePartenaire
            // La clé force un formulaire neuf quand on passe d'un partenaire à
            // l'autre : sans elle, React garde l'état du précédent et l'on
            // corrige le second avec la saisie du premier.
            key={enCorrection?.id ?? "neuf"}
            partenaire={enCorrection}
          />

          {enCorrection ? (
            <Link
              href="/admin/partenaires"
              className="mt-3 inline-block font-body text-sm text-silver hover:text-aurora-teal"
            >
              {t.formulaire.annuler}
            </Link>
          ) : null}
        </section>

        {/* — Le bloc — */}
        <section className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.liste.titre}
          </h2>

          {tous.length === 0 ? (
            <p className="mt-4 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.liste.aucun}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3">
              {tous.map((partenaire) => {
                // **Une seule liste, retirés compris**, et le trait pointillé
                // les distingue — doublé de la phrase « Retiré le… », parce
                // qu'un état ne se signale jamais par la seule apparence.
                const retire = partenaire.retireLe !== null;

                return (
                  <li
                    key={partenaire.id}
                    className={`min-w-0 rounded-sm p-4 ${
                      retire
                        ? "border border-dashed border-silver/15 bg-void/40"
                        : "border border-silver/12 bg-mist/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p
                        className={`min-w-0 break-words font-display text-base leading-snug ${
                          retire ? "text-silver" : "text-parchment"
                        }`}
                      >
                        {partenaire.nom}
                      </p>
                      <a
                        href={partenaire.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 break-all font-body text-xs text-silver hover:text-aurora-teal"
                      >
                        {partenaire.url}
                      </a>
                    </div>

                    <p className="mt-1 font-body text-xs italic text-silver">
                      {t.liste.noue.replace(
                        "{jour}",
                        jourEnToutesLettres(new Date(partenaire.noueLe)),
                      )}
                      {partenaire.modifieLe ? (
                        <>
                          {" · "}
                          {t.liste.modifie.replace(
                            "{jour}",
                            jourEnToutesLettres(new Date(partenaire.modifieLe)),
                          )}
                        </>
                      ) : null}
                      {partenaire.retireLe ? (
                        <>
                          {" · "}
                          {t.liste.retire.replace(
                            "{jour}",
                            jourEnToutesLettres(new Date(partenaire.retireLe)),
                          )}
                        </>
                      ) : null}
                    </p>

                    {partenaire.description ? (
                      <p className="mt-2 break-words font-body text-sm leading-[1.7] text-parchment-dim">
                        {partenaire.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {retire ? (
                        <form action={remettreAction}>
                          <input type="hidden" name="id" value={partenaire.id} />
                          <button
                            type="submit"
                            aria-label={t.liste.remettreAria.replace(
                              "{nom}",
                              partenaire.nom,
                            )}
                            className={BOUTON}
                          >
                            {t.liste.remettre}
                          </button>
                        </form>
                      ) : (
                        <>
                          <Link
                            href={`/admin/partenaires?corriger=${partenaire.id}`}
                            aria-label={t.liste.corrigerAria.replace(
                              "{nom}",
                              partenaire.nom,
                            )}
                            className={BOUTON}
                          >
                            {t.liste.corriger}
                          </Link>

                          <form action={retirerAction}>
                            <input
                              type="hidden"
                              name="id"
                              value={partenaire.id}
                            />
                            <button
                              type="submit"
                              aria-label={t.liste.retirerAria.replace(
                                "{nom}",
                                partenaire.nom,
                              )}
                              className={BOUTON}
                            >
                              {t.liste.retirer}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* — Les demandes reçues — */}
        <section className="mt-14">
          <h2 className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
            {t.demandes.titre}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
            {t.demandes.rappel}
          </p>

          {demandes.length === 0 ? (
            <p className="mt-4 rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
              {t.demandes.aucune}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3">
              {demandes.map((demande) => {
                const attend = demande.suite === "EN_ATTENTE";
                const etiquette =
                  demande.suite === "ACCEPTEE"
                    ? t.demandes.acceptee
                    : demande.suite === "REFUSEE"
                      ? t.demandes.refusee
                      : t.demandes.enAttente;

                return (
                  <li
                    key={demande.id}
                    className={`min-w-0 rounded-sm p-4 ${
                      attend
                        ? "border border-silver/12 bg-mist/30"
                        : "border border-dashed border-silver/15 bg-void/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="min-w-0 break-words font-display text-base leading-snug text-parchment">
                        {demande.nomDuForum}
                      </p>
                      <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/80">
                        {etiquette}
                      </span>
                    </div>

                    <p className="mt-1 font-body text-xs italic text-silver">
                      {t.demandes.recueLe.replace(
                        "{jour}",
                        jourEnToutesLettres(new Date(demande.recuLe)),
                      )}
                      {demande.traiteLe ? (
                        <>
                          {" · "}
                          {t.demandes.traiteeLe.replace(
                            "{jour}",
                            jourEnToutesLettres(new Date(demande.traiteLe)),
                          )}
                        </>
                      ) : null}
                    </p>

                    <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-body text-xs">
                      <a
                        href={demande.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 break-all text-silver hover:text-aurora-teal"
                      >
                        {demande.url}
                      </a>
                      {/* `mailto:` — la zone d'administration n'envoie pas de
                          courriel elle-même, et n'a pas à le faire : cette
                          réponse-là s'écrit à la main, une fois, dans son
                          propre client de messagerie. */}
                      <a
                        href={`mailto:${demande.courriel}`}
                        aria-label={t.demandes.ecrire.replace(
                          "{nom}",
                          demande.nomDuForum,
                        )}
                        className="min-w-0 break-all text-silver hover:text-aurora-teal"
                      >
                        {demande.courriel}
                      </a>
                    </p>

                    <p className="mt-3 whitespace-pre-wrap break-words font-body text-sm leading-[1.7] text-parchment-dim">
                      {demande.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {attend ? (
                        <>
                          <BoutonSuite
                            id={demande.id}
                            suite="ACCEPTEE"
                            libelle={t.demandes.accepter}
                            aria={t.demandes.accepterAria.replace(
                              "{nom}",
                              demande.nomDuForum,
                            )}
                          />
                          <BoutonSuite
                            id={demande.id}
                            suite="REFUSEE"
                            libelle={t.demandes.refuser}
                            aria={t.demandes.refuserAria.replace(
                              "{nom}",
                              demande.nomDuForum,
                            )}
                          />
                        </>
                      ) : (
                        <BoutonSuite
                          id={demande.id}
                          suite="EN_ATTENTE"
                          libelle={t.demandes.rouvrir}
                          aria={t.demandes.rouvrirAria.replace(
                            "{nom}",
                            demande.nomDuForum,
                          )}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

/** Un bouton de suite — trois usages, un seul formulaire. */
function BoutonSuite({
  id,
  suite,
  libelle,
  aria,
}: {
  id: string;
  suite: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  libelle: string;
  aria: string;
}) {
  return (
    <form action={suiteAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="suite" value={suite} />
      <button type="submit" aria-label={aria} className={BOUTON}>
        {libelle}
      </button>
    </form>
  );
}

const BOUTON =
  "font-display text-[0.62rem] uppercase tracking-[0.2em] text-silver transition-colors duration-300 hover:text-aurora-teal";
