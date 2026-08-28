import type { Metadata } from "next";
import Image from "next/image";
import { jourEnToutesLettres as jour } from "@/lib/dates";
import { blasonDe, NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import {
  moyenneAffichee,
  pointsAffiches,
  pointsSignes,
} from "@/lib/points/affichage";
import { TEXTES_POINTS } from "@/lib/points/constantes";
import {
  historiqueDesAjustements,
  lireLeTournoi,
  palmares,
  type AnneeArchivee,
} from "@/lib/points/depot";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_POINTS.resultats;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Les résultats** — la deuxième feuille du Grand Hall (bible §12).
 *
 * On y lit, on n’y débat pas : aucun bouton, aucun formulaire. Tout se règle
 * à `/admin/points`, et cette page ne fait que rendre ce qui s’y est décidé.
 *
 * Trois choses, et chacune dit ce que les deux autres ne peuvent pas dire :
 * où en sont les quatre maisons, ce que l’administration a ajouté ou retiré —
 * avec son motif —, et ce qu’ont donné les années closes.
 *
 * ⚠️ **Ce n’est pas un second affichage des tubes du bureau.** Les chiffres
 * sortent du même `lireLeTournoi`, ils ne peuvent donc pas se contredire ; ce
 * qui est nouveau ici, c’est l’historique et le palmarès, que quatre tubes ne
 * sauraient pas montrer.
 */
export default async function Page() {
  await exigerAcces(ROUTES.resultats);

  const tournoi = await lireLeTournoi();
  const [ajustements, annees] = await Promise.all([
    tournoi ? historiqueDesAjustements(tournoi.saison.id) : [],
    palmares(),
  ]);

  const rienDeMarque =
    tournoi?.lignes.every((l) => l.pointsAuTournoi === 0) ?? false;

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᛊ
        </span>
        {T.eyebrow}
      </p>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      {/* ── Le tournoi en cours ──
          Sans saison ouverte, il n’y a pas de tournoi du tout : quatre zéros
          laisseraient croire à une session que personne n’aurait commencée. */}
      <section aria-labelledby="en-cours" className="mt-12">
        <h2
          id="en-cours"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {T.saison.titre}
        </h2>

        {!tournoi ? (
          <p className="mt-3 max-w-[62ch] font-body italic leading-[1.8] text-silver">
            {T.saison.aucune}
          </p>
        ) : (
          <>
            <p className="mt-2 font-body text-parchment">
              {tournoi.saison.nom}
              <span className="text-silver">
                {" · "}
                {/* L’instant voyage en ISO : le serveur vit en UTC, le joueur
                    non, et c’est la mise en forme du navigateur qui est juste
                    pour la personne qui lit. */}
                <time
                  dateTime={tournoi.saison.ouverteLe.toISOString()}
                  suppressHydrationWarning
                >
                  {T.saison.ouverteDepuis.replace(
                    "{date}",
                    jour(tournoi.saison.ouverteLe),
                  )}
                </time>
              </span>
            </p>

            <Classement
              lignes={tournoi.lignes.map((l) => ({
                maison: l.maison,
                // **Le chiffre public est celui qui compte au tournoi**, avec
                // son plancher à zéro. Le vrai compteur — qui peut être
                // négatif — n’est montré qu’à l’administration, et une ligne
                // le lui dit là-bas.
                points: l.pointsAuTournoi,
                effectif: l.effectif,
                moyenne: l.moyenne,
                rang: l.rang,
              }))}
            />

            {rienDeMarque ? (
              <p className="mt-3 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
                {T.saison.vierge}
              </p>
            ) : null}

            <p className="mt-3 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
              {TEXTES_POINTS.tournoi.explication}
            </p>
          </>
        )}
      </section>

      {/* ── Ce que l’administration a décidé ──
          L’historique public que la colonne `motif` annonçait depuis le lot
          des points : « affiché dans l’historique public de la maison ». Il
          est ici, au Grand Hall, plutôt que sur la page d’une maison — qui ne
          verrait que ses propres décisions, donc jamais celle qui explique
          pourquoi une autre est passée devant. */}
      {tournoi ? (
        <section aria-labelledby="decisions" className="mt-14">
          <h2
            id="decisions"
            className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
          >
            {T.ajustements.titre}
          </h2>
          <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
            {T.ajustements.aide}
          </p>

          {ajustements.length === 0 ? (
            <p className="mt-5 font-body italic leading-[1.8] text-silver">
              {T.ajustements.vide}
            </p>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-2">
              {ajustements.map((ligne) => {
                // **Un ajustement annulé reste affiché, barré.** Le schéma le
                // dit : « un retrait de points qui disparaîtrait de
                // l’historique serait pire qu’un retrait injuste ». On garde
                // le geste ET son retrait.
                const annule = ligne.annuleLe !== null;
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
                          {pointsSignes(ligne.points)}
                        </span>{" "}
                        <span
                          className={`break-words ${annule ? "text-silver line-through" : ""}`}
                        >
                          {NOMS_MAISON[ligne.maison] ?? ligne.maison} —{" "}
                          {ligne.motif}
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
                        {T.ajustements.parQui.replace("{qui}", ligne.parNom)}
                      </span>
                    </div>

                    {annule ? (
                      <p className="mt-1 font-body text-xs italic text-silver">
                        <time
                          dateTime={ligne.annuleLe!.toISOString()}
                          suppressHydrationWarning
                        >
                          {T.ajustements.annule.replace(
                            "{date}",
                            jour(ligne.annuleLe!),
                          )}
                        </time>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {/* ── Les années passées ──
          `ClassementArchive` était écrit à chaque clôture et n’était lu nulle
          part. C’est cette section qui donne enfin une trace visible à la fin
          d’une année. */}
      <section aria-labelledby="palmares" className="mt-14">
        <h2
          id="palmares"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {T.palmares.titre}
        </h2>
        <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-[1.75] text-silver">
          {T.palmares.aide}
        </p>

        {annees.length === 0 ? (
          <p className="mt-5 font-body italic leading-[1.8] text-silver">
            {T.palmares.vide}
          </p>
        ) : (
          annees.map((annee) => <AnneeClose key={annee.saison.id} annee={annee} />)
        )}
      </section>

      <div className="hairline mt-14 max-w-[28rem]" />
    </main>
  );
}

/** Une année close : son nom, sa gagnante, et son classement figé. */
function AnneeClose({ annee }: { annee: AnneeArchivee }) {
  const blason = blasonDe(annee.gagnante);

  return (
    <article className="mt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* ⚠️ `sizes` déclaré : sans lui, `next/image` réclame la pleine
            largeur pour un écu de trente pixels — 109 Ko au lieu de 7. */}
        <Image
          src={blason.src}
          alt=""
          width={blason.largeur}
          height={blason.hauteur}
          sizes="32px"
          aria-hidden="true"
          className="h-9 w-auto opacity-90"
        />
        <div className="min-w-0">
          <h3 className="font-display text-base leading-snug text-parchment">
            {annee.saison.nom}
          </h3>
          <p className="font-body text-xs italic text-silver">
            {annee.gagnante
              ? T.palmares.gagnante.replace(
                  "{maison}",
                  NOMS_MAISON[annee.gagnante] ?? annee.gagnante,
                )
              : T.palmares.aucuneGagnante}
            {" · "}
            <time
              dateTime={annee.saison.closeLe.toISOString()}
              suppressHydrationWarning
            >
              {T.palmares.closeLe.replace("{date}", jour(annee.saison.closeLe))}
            </time>
          </p>
        </div>
      </div>

      <Classement lignes={annee.lignes} />
    </article>
  );
}

type LigneAffichee = {
  maison: string;
  points: number;
  effectif: number;
  moyenne: number;
  rang: number;
};

/**
 * Le tableau des quatre maisons — le même pour la saison en cours et pour une
 * année close. Deux tableaux finiraient par ne plus dire la même chose.
 *
 * **L’ordre est celui de `MAISONS`, jamais le rang** : un tableau dont les
 * lignes changent de place entre deux visites est illisible — on cherche la
 * sienne, elle a bougé. Le rang voyage dans sa colonne.
 */
function Classement({ lignes }: { lignes: readonly LigneAffichee[] }) {
  return (
    // Une table large ne pousse jamais la page : elle défile dans son cadre.
    //
    // **Bornée en largeur**, et ce n'est pas cosmétique : étalée sur toute la
    // page, la ligne « Kaldrafn » se retrouve à quarante centimètres de son
    // rang, et l'œil ne les relie plus. Cinq colonnes courtes se lisent en
    // bloc ou ne se lisent pas.
    <div className="mt-5 max-w-[44rem] overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-left">
        <caption className="sr-only">{T.tableau.aria}</caption>
        <thead>
          <tr className="border-b border-silver/15">
            <Titre>{T.tableau.maison}</Titre>
            <Titre alignee>{T.tableau.points}</Titre>
            <Titre alignee>{T.tableau.effectif}</Titre>
            <Titre alignee>{T.tableau.moyenne}</Titre>
            <Titre alignee>{T.tableau.rang}</Titre>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
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
  );
}

function Titre({
  children,
  alignee,
}: {
  children: React.ReactNode;
  alignee?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`py-2 font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver ${
        alignee ? "pl-4 text-right" : "pr-4"
      }`}
    >
      {children}
    </th>
  );
}

function Cellule({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-3 pl-4 text-right font-body tabular-nums text-parchment">
      {children}
    </td>
  );
}
