import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEXTES_COURS } from "@/lib/cours/constantes";
import { matiereDe, type Annee } from "@/lib/cours/cursus";
import { listerLesControles, type ControleVu } from "@/lib/cours/depot";
import { lecon } from "@/lib/cours/lecons";
import { libelleAnnee, FONCTIONS, type Fonction } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutVoirLesControles } from "@/lib/forum/pouvoirs";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_COURS.controles;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le registre des contrôles** — la porte des professeurs.
 *
 * ── Qui entre ──
 *
 * `peutVoirLesControles` : le staff, ou qui détient la sixième permission.
 * Décision du joueur du 4 septembre 2026 — les professeurs sont des joueurs
 * ordinaires, et **le rôle affiché n'ouvre jamais rien**.
 *
 * ⚠️ **404 pour qui n'a pas le droit**, jamais 403 : « elle existe, mais pas
 * pour vous » se lit comme une confirmation. Même choix que le forum, la Tour,
 * le Grand Hall, les maisons et les grimoires.
 *
 * ── Ce qu'on y voit, et ce qu'on n'y voit pas ──
 *
 * Qui a passé quoi, quand, avec quelle note. **Aucune copie** : le dépôt ne
 * rend pas les réponses, et cette page n'aurait pas de quoi les afficher. Un
 * professeur a besoin d'une note, pas d'une copie — et le jour où il faudra
 * les copies, ce sera une décision, pas un `select` de plus.
 *
 * ── L'adresse ──
 *
 * `/cours/controles`, et **non** `/cours/<année>` : le segment est statique, il
 * l'emporte donc sur `[annee]`, qui de toute façon refuserait « controles ».
 * `routeAutorisee` reconnaît tout ce qui commence par `/cours/` et lui applique
 * les règles de la page des cours — il n'y a rien à déclarer au menu.
 */
export default async function Page() {
  const compte = await exigerAcces(ROUTES.cours);
  const pouvoirs = await pouvoirsDe(compte.id);
  if (!peutVoirLesControles(pouvoirs)) notFound();

  const controles = await listerLesControles();

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

      {controles.length === 0 ? (
        <p className="mt-10 font-body italic text-silver">{T.aucun}</p>
      ) : (
        <>
          <p className="mt-8 font-display text-[0.68rem] uppercase tracking-[0.18em] text-silver">
            {/* Zéro et un au singulier : la faute que personne ne relit. */}
            {controles.length === 1
              ? T.compteUn
              : T.compte.replace("{n}", String(controles.length))}
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2">
            {controles.map((c) => (
              <Ligne key={c.id} controle={c} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

/**
 * Une ligne du registre.
 *
 * ⚠️ **`break-words` sur le nom.** Un joueur écrit ce qu'il veut dans sa fiche,
 * et une chaîne sans espace pousse la page à cinq mille pixels de large — piège
 * déjà payé sur le Registre.
 */
function Ligne({ controle: c }: { controle: ControleVu }) {
  const matiere = matiereDe(c.matiereId)?.nom ?? c.matiereId;
  const laLecon = lecon(c.matiereId, String(c.rang));
  const iso = c.envoyeLe.toISOString();

  return (
    <li className="min-w-0 rounded-md border border-silver/15 bg-void/40 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="min-w-0 break-words font-display text-base leading-snug text-parchment">
          {c.prenomNom ?? T.compteParti}
        </h2>

        {/* La note, et rien qu'elle : aucune copie ne descend jusqu'ici. */}
        <span className="font-display text-lg text-aurora-teal">
          {c.note}
          <span className="text-sm text-silver"> / {c.surCombien}</span>
        </span>
      </div>

      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-xs italic text-silver">
        <span className="min-w-0 break-words">
          {matiere}
          {laLecon ? ` — ${laLecon.titre}` : ` — leçon ${c.rang}`}
        </span>
        <span>{libelleAnnee(FONCTIONS[c.annee - 1] as Fonction)}</span>
        {c.maison ? <span>{NOMS_MAISON[c.maison] ?? c.maison}</span> : null}
        {/*
          ⚠️ **L'instant voyage en ISO, et c'est le navigateur qui le met en
          forme.** Le serveur de Vercel vit en UTC, le lecteur non : le même
          envoi s'écrirait « 23:40 hier » d'un côté et « 01:40 aujourd'hui » de
          l'autre. C'est la règle de tout ce qui affiche une date sur ce site.
        */}
        <time dateTime={iso} suppressHydrationWarning>
          {c.envoyeLe.toLocaleString("fr-FR", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>
    </li>
  );
}
