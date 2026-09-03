import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEXTES_COURS } from "@/lib/cours/constantes";
import { matiereDe } from "@/lib/cours/cursus";
import {
  listerLesControles,
  listerLesMembresDeLaSalle,
  type ControleVu,
  type MembreDeLaSalle,
} from "@/lib/cours/depot";
import { lecon } from "@/lib/cours/lecons";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVoirLesControles } from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_COURS.salle;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Combien d'envois récents on montre. Une mesure, pas une règle. */
const RECENTS_MAX = 10;

/**
 * **La salle des professeurs** — le nom est du joueur.
 *
 * ── Qui entre ──
 *
 * `peutVoirLesControles` : le staff, ou qui détient la sixième permission.
 * Les professeurs sont des joueurs ordinaires, et **le rôle affiché n'ouvre
 * jamais rien** : c'est un vrai pouvoir, accordé depuis `/admin/pouvoirs`.
 *
 * ⚠️ **404 pour qui n'a pas le droit**, jamais 403 : « elle existe, mais pas
 * pour vous » se lit comme une confirmation. Même choix que le forum, la Tour,
 * le Grand Hall, les maisons et les grimoires.
 *
 * ── Ce qu'on y trouve ──
 *
 * La liste des membres, groupée par année, avec ce que chacun a passé — et
 * en dessous, les derniers envois, qui répondent à une autre question : non
 * pas « où en est untel » mais « qui a travaillé cette semaine ».
 *
 * ⚠️ **Aucune copie, nulle part.** Le dépôt ne rend pas les réponses.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.cours);
  const pouvoirs = await pouvoirsDe(compte.id);
  if (!peutVoirLesControles(pouvoirs)) notFound();

  const [membres, recents] = await Promise.all([
    listerLesMembresDeLaSalle(),
    listerLesControles(),
  ]);

  // ⚠️ **Le groupement se fait sur `place`**, qui porte déjà le titre au
  // château quand il y en a un — jamais en relisant `roleAffiche`, qui est
  // décoratif et qu'aucune décision d'affichage ne doit consulter.
  const parAnnee = new Map<number, MembreDeLaSalle[]>();
  for (const m of membres) {
    const groupe = parAnnee.get(m.annee) ?? [];
    groupe.push(m);
    parAnnee.set(m.annee, groupe);
  }

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.cours}
        className="eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-aurora-teal"
      >
        <span aria-hidden="true">←</span>
        {TEXTES_COURS.annee.retour}
      </Link>

      <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>

      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      {membres.length === 0 ? (
        <p className="mt-10 font-body italic text-silver">{T.aucun}</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-2">
          {membres.map((m) => (
            <LigneMembre key={m.eleveId} membre={m} />
          ))}
        </ul>
      )}

      <section aria-labelledby="recents" className="mt-14">
        <h2
          id="recents"
          className="font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {T.recents}
        </h2>

        {recents.length === 0 ? (
          <p className="mt-3 font-body text-sm italic text-silver">
            {T.recentsAucun}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-1.5">
            {recents.slice(0, RECENTS_MAX).map((c) => (
              <LigneRecente key={c.id} controle={c} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/**
 * Un membre, et ce qu'il a passé.
 *
 * ⚠️ **`break-words` sur le nom.** Un joueur écrit ce qu'il veut dans sa
 * fiche, et une chaîne sans espace pousse la page à cinq mille pixels de
 * large — piège déjà payé sur le Registre.
 */
function LigneMembre({ membre: m }: { membre: MembreDeLaSalle }) {
  const avancement =
    m.controlesEnvoyes === 0
      ? T.avancementAucun
      : m.controlesEnvoyes === 1
        ? T.avancementUn
        : T.avancement.replace("{n}", String(m.controlesEnvoyes));

  return (
    <li className="min-w-0">
      <Link
        href={`${ROUTES.cours}/professeurs/${m.eleveId}`}
        className="group flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md border border-silver/15 bg-void/40 px-5 py-4 transition-colors duration-300 hover:border-aurora-teal/50"
      >
        <span className="min-w-0">
          <span className="block min-w-0 break-words font-display text-base leading-snug text-parchment transition-colors duration-300 group-hover:text-aurora-teal">
            {m.prenomNom}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs italic text-silver">
            {/* L'année, **ou le titre qui la remplace** — `libellePlace`. */}
            <span>{m.place}</span>
            {m.maison ? <span>{NOMS_MAISON[m.maison] ?? m.maison}</span> : null}
          </span>
        </span>

        <span className="font-display text-[0.62rem] uppercase tracking-[0.16em] text-aurora-teal/80">
          {avancement}
        </span>
      </Link>
    </li>
  );
}

/** Un envoi récent, tous membres confondus. */
function LigneRecente({ controle: c }: { controle: ControleVu }) {
  const matiere = matiereDe(c.matiereId)?.nom ?? c.matiereId;
  const laLecon = lecon(c.matiereId, String(c.rang));

  return (
    <li className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 font-body text-xs text-silver">
      <span className="min-w-0 break-words text-parchment-dim">
        {c.prenomNom ?? T.compteParti}
      </span>
      <span className="min-w-0 break-words italic">
        {matiere}
        {laLecon ? ` — ${laLecon.titre}` : ` — leçon ${c.rang}`}
      </span>
      <span className="text-aurora-teal/80">
        {c.note} / {c.surCombien}
      </span>
      {/*
        ⚠️ **L'instant voyage en ISO, et c'est le navigateur qui le met en
        forme.** Le serveur de Vercel vit en UTC, le lecteur non.
      */}
      <time dateTime={c.envoyeLe.toISOString()} suppressHydrationWarning>
        {c.envoyeLe.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        })}
      </time>
    </li>
  );
}
