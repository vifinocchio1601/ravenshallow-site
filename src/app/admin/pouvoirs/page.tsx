import type { Metadata } from "next";
import Link from "next/link";
import EnTeteAdmin from "@/components/admin/EnTeteAdmin";
import {
  demettrePrefetAction,
  basculerPermissionAction,
} from "@/app/admin/pouvoirs/actions";
import { LIBELLES_ROLE, MAISONS, type Maison } from "@/lib/dossier/etats";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import { TEXTES_POUVOIRS } from "@/lib/forum/constantes";
import {
  listerTousLesPouvoirs,
  type LignePouvoir,
} from "@/lib/forum/depot-pouvoirs";
import { PERMISSIONS, porteSurUneMaison } from "@/lib/forum/pouvoirs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: TEXTES_POUVOIRS.metaTitre,
  robots: { index: false, follow: false },
};

/**
 * **Qui détient quoi.**
 *
 * Une permission accordée en juin et oubliée en décembre est le vrai risque de
 * ce lot : elle ne se voit nulle part, personne ne la cherche, et elle ne se
 * retire jamais. Cette page existe pour ça, et pour rien d’autre.
 *
 * Classée **par permission** et non par membre : la question qu’on se pose est
 * « qui peut clore une scène ? », pas « que peut Sigrid ? » — celle-là, la
 * fiche du membre y répond déjà.
 *
 * Le retrait est possible ici aussi, d’un clic : « le retrait est aussi simple
 * que l’attribution » (art. 13.5) ne vaut que si l’on peut retirer là où l’on
 * s’aperçoit du problème.
 */
export default async function PouvoirsPage() {
  const { permissions, prefets, staff } = await listerTousLesPouvoirs();
  const t = TEXTES_POUVOIRS;

  return (
    <main className="relative min-h-[100svh] bg-void">
      <div className="mx-auto max-w-content px-6 py-14 sm:px-8 sm:py-20">
        <EnTeteAdmin eyebrow={t.eyebrow} titre={t.ensemble.titre} />

        <p className="mt-6 max-w-[68ch] font-body leading-[1.8] text-parchment-dim">
          {t.ensemble.aide}
        </p>
        <p className="mt-3 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappel}
        </p>
        <p className="mt-2 max-w-[68ch] font-body text-sm italic leading-relaxed text-silver">
          {t.rappelCorbeaux}
        </p>

        {/* ── Le staff, d’abord : il passe partout sans qu’on lui ait rien
            accordé, et l’oublier fausserait la lecture de tout le reste. ── */}
        <Bloc titre={t.ensemble.staff.titre} aide={t.ensemble.staff.aide}>
          {staff.length === 0 ? (
            <Vide>{t.ensemble.staff.aucun}</Vide>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {staff.map((s) => (
                <li
                  key={s.utilisateurId}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                >
                  <span className="min-w-0 truncate font-body text-parchment">
                    {s.prenomNom}
                  </span>
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                    {LIBELLES_ROLE[s.role].court}
                  </span>
                  <FicheDuMembre id={s.utilisateurId} />
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        {/* ── Les préfets ── */}
        <Bloc titre={t.prefets.titre} aide={t.prefets.aide}>
          {prefets.length === 0 ? (
            <Vide>{t.prefets.aucun}</Vide>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {prefets.map((p) => (
                <li
                  key={`${p.eleveId}-${p.maison}`}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
                >
                  <span className="min-w-0 truncate font-body text-parchment">
                    {p.prenomNom}
                  </span>
                  <span className="font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver">
                    {NOMS_MAISON[p.maison] ?? p.maison}
                  </span>
                  <form action={demettrePrefetAction}>
                    <input type="hidden" name="eleveId" value={p.eleveId} />
                    <input
                      type="hidden"
                      name="utilisateurId"
                      value={p.utilisateurId}
                    />
                    <input type="hidden" name="maison" value={p.maison} />
                    <BoutonRetirer libelle={t.prefets.demettre} />
                  </form>
                  <FicheDuMembre id={p.utilisateurId} />
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        {/* ── Les cinq permissions, chacune avec ses détenteurs ── */}
        {PERMISSIONS.map((permission) => {
          const tp = t.permissions[permission];
          const lignes = permissions.filter((l) => l.permission === permission);
          return (
            <Bloc key={permission} titre={tp.nom} aide={tp.detail}>
              {lignes.length === 0 ? (
                <Vide>{t.ensemble.personne}</Vide>
              ) : porteSurUneMaison(permission) ? (
                // Groupées par maison : « qui écrit les annonces de Nattorm ? »
                // est la question réelle, et une liste à plat n'y répond pas.
                <div className="grid gap-3">
                  {MAISONS.filter((m) => lignes.some((l) => l.maison === m)).map(
                    (maison) => (
                      <div key={maison}>
                        <p className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-parchment-dim">
                          {NOMS_MAISON[maison] ?? maison}
                        </p>
                        <ListeDetenteurs
                          lignes={lignes.filter((l) => l.maison === maison)}
                        />
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <ListeDetenteurs lignes={lignes} />
              )}
            </Bloc>
          );
        })}

        <Link href="/admin" className="btn btn-ghost mt-12">
          {t.ensemble.retour}
        </Link>
      </div>
    </main>
  );
}

/**
 * La liste des détenteurs d’une permission.
 *
 * `grid-cols-1` sur la liste **et** `min-w-0` sur l’élément : une colonne de
 * grille vaut `auto`, un élément de liste `min-width: auto`, et il faut les
 * deux pour qu’un nom long n’élargisse pas la page sur téléphone. Un `truncate`
 * ne peut rien tant que rien ne borne la largeur.
 */
function ListeDetenteurs({ lignes }: { lignes: LignePouvoir[] }) {
  const t = TEXTES_POUVOIRS;
  return (
    <ul className="mt-2 grid grid-cols-1 gap-2">
      {lignes.map((l) => (
        <li
          key={`${l.utilisateurId}-${l.permission}-${l.maison ?? "globale"}`}
          className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-sm border border-silver/12 bg-mist/40 px-4 py-3"
        >
          <span className="min-w-0 truncate font-body text-parchment">
            {l.prenomNom}
          </span>
          {/* L'instant voyage en ISO ; c'est le navigateur qui met en forme,
              la seule mise en forme juste pour qui lit. */}
          <time
            dateTime={l.accordeeLe}
            suppressHydrationWarning
            className="font-body text-xs italic text-silver"
          >
            {t.panneau.depuis
              .replace(
                "{date}",
                new Date(l.accordeeLe).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              )
              .replace("{auteur}", l.accordeePar)}
          </time>
          <form action={basculerPermissionAction}>
            <input type="hidden" name="utilisateurId" value={l.utilisateurId} />
            <input type="hidden" name="permission" value={l.permission} />
            {l.maison ? (
              <input type="hidden" name="maison" value={l.maison} />
            ) : null}
            <input type="hidden" name="sens" value="RETIRER" />
            <BoutonRetirer libelle={t.panneau.retirer} />
          </form>
          <FicheDuMembre id={l.utilisateurId} />
        </li>
      ))}
    </ul>
  );
}

function BoutonRetirer({ libelle }: { libelle: string }) {
  return (
    <button
      type="submit"
      className="rounded-sm border border-silver/25 px-3 py-1.5 font-display text-[0.6rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:border-silver/50 hover:text-parchment"
    >
      {libelle}
    </button>
  );
}

function FicheDuMembre({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/dossiers/${id}`}
      className="font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-aurora-teal"
    >
      {TEXTES_POUVOIRS.ensemble.versLaFiche}
    </Link>
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

function Vide({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-silver/20 bg-void/40 px-5 py-6 text-center font-body leading-[1.7] text-parchment-dim">
      {children}
    </p>
  );
}
