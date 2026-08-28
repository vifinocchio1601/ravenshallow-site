import type { Metadata } from "next";
import {
  annulerAjustementAction,
  reprendreDonAction,
} from "@/app/admin/points/actions";
import { recalculerAction } from "@/app/admin/cloture/actions";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import FormulaireAjustement from "@/components/admin/FormulaireAjustement";
import FormulaireDon from "@/components/admin/FormulaireDon";
import { jourEnToutesLettres as jour } from "@/lib/dates";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import {
  historiqueDesAjustements,
  historiqueDesDons,
  lireLeTournoi,
  listerLesElevesPourLesPoints,
} from "@/lib/points/depot";
import {
  moyenneAffichee,
  pointsAffiches,
  pointsSignes,
} from "@/lib/points/affichage";
import { PLANCHER_EFFECTIF } from "@/lib/points/regles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_POINTS.admin.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Les points de maison, et le seul endroit où on les touche à la main.**
 *
 * Trois choses, dans cet ordre : où en sont les quatre maisons, comment
 * ajuster, et ce qui a déjà été ajusté. L’historique vient en dernier mais
 * c’est lui qui justifie l’écran : des points visibles de tous ne doivent
 * jamais apparaître sans explication, et un retrait qu’on ne peut plus
 * retrouver six mois après n’est pas défendable.
 *
 * Il n’y a **aucun bouton de points ailleurs sur le site**. Un professeur ou
 * un modérateur qui en veut un écrit à l’administration par la Tour aux
 * Corbeaux — décision du joueur, et la raison pour laquelle aucune permission
 * attribuable n’ouvre ce geste.
 */
export default async function PointsPage() {
  const t = TEXTES_POINTS.admin;
  const tournoi = await lireLeTournoi();
  const [historique, dons, eleves] = tournoi
    ? await Promise.all([
        historiqueDesAjustements(tournoi.saison.id),
        historiqueDesDons(tournoi.saison.id),
        listerLesElevesPourLesPoints(),
      ])
    : [[], [], []];

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.accroche}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappelAutomatique}
        </p>
        <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappelUniqueGeste}
        </p>

        {!tournoi ? (
          // Quatre zéros laisseraient croire à un tournoi vide ; il n’y a pas
          // de tournoi du tout tant qu’aucune saison n’est ouverte.
          <p className="mt-10 rounded-sm border border-ember/40 bg-ember/[0.06] px-5 py-6 font-body leading-[1.7] text-ember">
            {t.saison.aucune}
          </p>
        ) : (
          <>
            <section className="mt-10">
              <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
                {t.saison.titre}
              </h2>
              <p className="mt-2 font-body text-parchment">
                {tournoi.saison.nom}
                <span className="text-silver">
                  {" · "}
                  {/* L’instant voyage en ISO ; c’est le navigateur qui met en
                      forme, la seule juste pour qui lit — le serveur vit en UTC. */}
                  <time
                    dateTime={tournoi.saison.ouverteLe.toISOString()}
                    suppressHydrationWarning
                  >
                    {t.saison.ouverteDepuis.replace("{date}", jour(tournoi.saison.ouverteLe))}
                  </time>
                </span>
              </p>
            </section>

            {/* ── Les quatre compteurs ── */}
            <Bloc titre={t.tableau.titre} aide={t.tableau.aide}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-silver/15">
                      <ColonneTitre>{t.tableau.maison}</ColonneTitre>
                      <ColonneTitre alignee>{t.tableau.points}</ColonneTitre>
                      <ColonneTitre alignee>{t.tableau.effectif}</ColonneTitre>
                      <ColonneTitre alignee>{t.tableau.moyenne}</ColonneTitre>
                      <ColonneTitre alignee>{t.tableau.rang}</ColonneTitre>
                    </tr>
                  </thead>
                  <tbody>
                    {tournoi.lignes.map((ligne) => (
                      <tr key={ligne.maison} className="border-b border-silver/8">
                        <td className="py-3 pr-4 font-body text-parchment">
                          {NOMS_MAISON[ligne.maison] ?? ligne.maison}
                        </td>
                        <Cellule>{pointsAffiches(ligne.points)}</Cellule>
                        <Cellule>{ligne.effectif}</Cellule>
                        <Cellule>{moyenneAffichee(ligne.moyenne)}</Cellule>
                        <Cellule>{ligne.rang}</Cellule>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
                {t.tableau.plancher.replace("{plancher}", String(PLANCHER_EFFECTIF))}
              </p>
              {/* Le compteur affiché est le vrai — il peut être négatif. Le
                  tournoi, lui, plancher à zéro. Le dire ici évite qu'un
                  retrait « sans effet » soit refait une seconde fois. */}
              {tournoi.lignes.some((l) => l.points < 0) ? (
                <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-relaxed text-ember">
                  {t.tableau.sousZero}
                </p>
              ) : null}
            </Bloc>

            {/* ── Ajouter, retirer ── */}
            <Bloc titre={t.formulaire.titre} aide={t.formulaire.aide}>
              <FormulaireAjustement />
            </Bloc>

            {/* ── Donner à un joueur ──
                Un formulaire à part, et non un interrupteur dans le premier :
                les deux gestes se ressemblent et ne font pas la même chose.
                On se trompe d'interrupteur sans s'en apercevoir, et un point
                personnel accordé par erreur fait passer une année. */}
            <Bloc titre={t.don.titre} aide={t.don.aide}>
              <p className="max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
                {t.don.difference}
              </p>
              <FormulaireDon eleves={eleves} />
            </Bloc>

            {/* ── Ce qui a été donné ── */}
            <Bloc titre={t.historiqueDesDons.titre} aide={t.historiqueDesDons.aide}>
              {dons.length === 0 ? (
                <p className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
                  {t.historiqueDesDons.vide}
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2">
                  {dons.map((don) => {
                    const repris = don.repriseLe !== null;
                    const signe = pointsSignes(don.points);
                    const nom =
                      don.eleve?.prenomNom ?? t.historiqueDesDons.membreParti;
                    return (
                      <li
                        key={don.id}
                        className="min-w-0 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="min-w-0 font-body text-parchment">
                            <span
                              className={`font-display text-sm tracking-[0.06em] ${
                                repris
                                  ? "text-silver line-through"
                                  : don.points > 0
                                    ? "text-aurora-teal"
                                    : "text-ember"
                              }`}
                            >
                              {signe}
                            </span>{" "}
                            <span className={repris ? "text-silver line-through" : undefined}>
                              {nom}
                              {don.maison ? (
                                <span className="text-silver">
                                  {" "}
                                  ({NOMS_MAISON[don.maison] ?? don.maison})
                                </span>
                              ) : null}{" "}
                              — {don.motif}
                            </span>
                          </p>

                          <span className="font-body text-xs italic text-silver">
                            <time
                              dateTime={don.gagneLe.toISOString()}
                              suppressHydrationWarning
                            >
                              {jour(don.gagneLe)}
                            </time>
                            {" · "}
                            {don.parNom}
                          </span>
                        </div>

                        {repris ? (
                          <p className="mt-1 font-body text-xs italic text-silver">
                            {t.historiqueDesDons.repris} —{" "}
                            <time
                              dateTime={don.repriseLe!.toISOString()}
                              suppressHydrationWarning
                            >
                              {jour(don.repriseLe!)}
                            </time>
                          </p>
                        ) : (
                          <form action={reprendreDonAction} className="mt-2">
                            <input type="hidden" name="id" value={don.id} />
                            <button
                              type="submit"
                              aria-label={t.historiqueDesDons.reprendreAria
                                .replace("{points}", signe)
                                .replace("{nom}", nom)}
                              className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
                            >
                              {t.historiqueDesDons.reprendre}
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Bloc>

            {/* ── Le filet ──
                Posé après l'historique et non avant : on ne refait pas des
                compteurs tous les jours, et ce bouton n'a rien à faire dans
                le chemin du geste ordinaire. */}
            <Bloc titre={t.recalcul.titre} aide={t.recalcul.aide}>
              <form action={recalculerAction}>
                <button type="submit" className="btn btn-ghost">
                  {t.recalcul.bouton}
                </button>
              </form>
              <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
                {t.recalcul.rassurer}
              </p>
            </Bloc>

            {/* ── L’historique ── */}
            <Bloc titre={t.historique.titre} aide={t.historique.aide}>
              {historique.length === 0 ? (
                <p className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
                  {t.historique.vide}
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2">
                  {historique.map((ligne) => {
                    const annule = ligne.annuleLe !== null;
                    const signe = pointsSignes(ligne.points);
                    return (
                      <li
                        key={ligne.id}
                        className="min-w-0 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="min-w-0 font-body text-parchment">
                            <span
                              className={`font-display text-sm tracking-[0.06em] ${
                                annule
                                  ? "text-silver line-through"
                                  : ligne.points > 0
                                    ? "text-aurora-teal"
                                    : "text-ember"
                              }`}
                            >
                              {signe}
                            </span>{" "}
                            <span className={annule ? "text-silver line-through" : undefined}>
                              {NOMS_MAISON[ligne.maison] ?? ligne.maison} — {ligne.motif}
                            </span>
                          </p>

                          <span className="font-body text-xs italic text-silver">
                            <time
                              dateTime={ligne.creeLe.toISOString()}
                              suppressHydrationWarning
                            >
                              {jour(ligne.creeLe)}
                            </time>
                            {" · "}
                            {ligne.parNom}
                          </span>
                        </div>

                        {annule ? (
                          // Annulé, jamais effacé : l’historique garde le geste
                          // ET son retrait. Un compteur qui remonterait sans
                          // qu’on sache pourquoi il avait baissé serait pire.
                          <p className="mt-1 font-body text-xs italic text-silver">
                            {t.historique.annule
                              .replace("{date}", jour(ligne.annuleLe!))
                              .replace("{auteur}", ligne.annulePar ?? "—")}
                          </p>
                        ) : (
                          <form action={annulerAjustementAction} className="mt-2">
                            <input type="hidden" name="id" value={ligne.id} />
                            <button
                              type="submit"
                              // Dans une liste de vingt lignes, « Annuler » ne
                              // dit pas quoi à qui écoute.
                              aria-label={t.historique.annulerAria
                                .replace("{points}", signe)
                                .replace(
                                  "{maison}",
                                  NOMS_MAISON[ligne.maison] ?? ligne.maison,
                                )}
                              className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
                            >
                              {t.historique.annuler}
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Bloc>
          </>
        )}
      </div>
    </main>
  );
}

function Bloc({
  titre,
  aide,
  children,
}: {
  titre: string;
  aide: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
        {titre}
      </h2>
      <p className="mt-1 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
        {aide}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ColonneTitre({
  children,
  alignee = false,
}: {
  children: React.ReactNode;
  alignee?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`pb-2 font-display text-[0.62rem] uppercase tracking-[0.14em] text-silver ${
        alignee ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Cellule({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-3 text-right font-body tabular-nums text-parchment-dim">
      {children}
    </td>
  );
}
