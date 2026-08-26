import {
  accorderToutesLesMaisonsAction,
  basculerPermissionAction,
  demettrePrefetAction,
  modifierRoleAction,
  nommerPrefetAction,
  retirerToutesLesMaisonsAction,
} from "@/app/admin/pouvoirs/actions";
import { NOMS_MAISON } from "@/lib/ecole/blasons";
import {
  LIBELLES_ROLE,
  MAISONS,
  ROLES,
  type Maison,
  type Role,
} from "@/lib/dossier/etats";
import { TEXTES_POUVOIRS } from "@/lib/forum/constantes";
import {
  PERMISSIONS,
  porteSurUneMaison,
  type Permission,
  type Pouvoirs,
} from "@/lib/forum/pouvoirs";

/**
 * Les pouvoirs d’un membre, sur sa fiche.
 *
 * Composant **serveur**, et sans une ligne de JavaScript : chaque bascule est
 * un petit formulaire qui poste une action. C’est plus lourd à écrire qu’un
 * `onClick`, et ça marche au clavier, sans script, et sans état à
 * resynchroniser après coup.
 *
 * **Un état ne se signale jamais par la seule couleur** : « Accordé » est
 * écrit, et le bouton dit ce qu’il fera — « Retirer », pas une croix.
 */
export default function PanneauPouvoirs({
  utilisateurId,
  eleveId,
  pouvoirs,
}: {
  utilisateurId: string;
  /** Nul si le compte n’a pas de fiche — on ne peut alors pas le nommer préfet. */
  eleveId: string | null;
  pouvoirs: Pouvoirs;
}) {
  const t = TEXTES_POUVOIRS;
  const detient = (permission: Permission, maison: Maison | null) =>
    pouvoirs.permissions.some(
      (p) => p.permission === permission && p.maison === maison,
    );

  return (
    <section className="mt-10">
      <h2 className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
        {t.panneau.titre}
      </h2>
      <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
        {t.panneau.aide}
      </p>
      {/* Le rappel qui distingue ce panneau du champ « rôle particulier ». */}
      <p className="mt-2 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
        {t.rappel}
      </p>

      {/* ── Le rôle technique ── */}
      <form
        action={modifierRoleAction}
        className="mt-5 flex flex-wrap items-end gap-3 rounded-sm border border-silver/12 bg-mist/40 px-5 py-4"
      >
        <input type="hidden" name="utilisateurId" value={utilisateurId} />
        <div className="min-w-[14rem] flex-1">
          <label
            htmlFor={`role-${utilisateurId}`}
            className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
          >
            {t.role.terme}
          </label>
          <select
            id={`role-${utilisateurId}`}
            name="role"
            defaultValue={pouvoirs.role}
            aria-describedby={`role-aide-${utilisateurId}`}
            className="mt-2 w-full rounded-sm border border-silver/25 bg-mist/60 px-3 py-2 font-body text-base text-parchment transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
          >
            {ROLES.map((role: Role) => (
              <option key={role} value={role}>
                {LIBELLES_ROLE[role].court} — {LIBELLES_ROLE[role].detail}
              </option>
            ))}
          </select>
          <p
            id={`role-aide-${utilisateurId}`}
            className="mt-1 font-body text-xs italic text-silver"
          >
            {t.role.aide}
          </p>
        </div>
        <button type="submit" className="btn btn-ghost">
          {t.role.enregistrer}
        </button>
      </form>

      {/* ── Les cinq permissions ── */}
      <ul className="mt-4 grid gap-3">
        {PERMISSIONS.map((permission) => {
          const tp = t.permissions[permission];
          return (
            <li
              key={permission}
              className="rounded-sm border border-silver/12 bg-mist/40 px-5 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim">
                  {tp.nom}
                </p>
                <p className="font-body text-xs uppercase tracking-[0.1em] text-silver">
                  {tp.portee}
                </p>
              </div>
              <p className="mt-1 max-w-[62ch] font-body text-xs italic leading-relaxed text-silver">
                {tp.detail}
              </p>

              {porteSurUneMaison(permission) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {MAISONS.map((maison) => (
                    <BasculeMaison
                      key={maison}
                      utilisateurId={utilisateurId}
                      permission={permission}
                      maison={maison}
                      accordee={detient(permission, maison)}
                    />
                  ))}
                  <BasculeQuatreMaisons
                    utilisateurId={utilisateurId}
                    permission={permission}
                    toutes={MAISONS.every((m) => detient(permission, m))}
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <BasculeGlobale
                    utilisateurId={utilisateurId}
                    permission={permission}
                    accordee={detient(permission, null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── Les préfets ── */}
      <div className="mt-4 rounded-sm border border-silver/12 bg-mist/40 px-5 py-4">
        <p className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim">
          {t.prefets.titre}
        </p>
        <p className="mt-1 max-w-[62ch] font-body text-xs italic leading-relaxed text-silver">
          {t.prefets.aide}
        </p>

        {eleveId === null ? null : (
          <div className="mt-3 flex flex-wrap gap-2">
            {MAISONS.map((maison) => {
              const estPrefet = pouvoirs.prefetDe.includes(maison);
              return (
                <form
                  key={maison}
                  action={estPrefet ? demettrePrefetAction : nommerPrefetAction}
                >
                  <input type="hidden" name="eleveId" value={eleveId} />
                  <input
                    type="hidden"
                    name="utilisateurId"
                    value={utilisateurId}
                  />
                  <input type="hidden" name="maison" value={maison} />
                  <BoutonEtat
                    actif={estPrefet}
                    libelle={NOMS_MAISON[maison] ?? maison}
                    action={estPrefet ? t.prefets.demettre : t.prefets.nommer}
                  />
                </form>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 max-w-[62ch] font-body text-sm italic leading-relaxed text-silver">
        {t.rappelCorbeaux}
      </p>
    </section>
  );
}

/**
 * Un bouton qui dit **son état** et **ce qu’il fera**, tous deux écrits.
 *
 * L’état porte aussi `aria-pressed` : un lecteur d’écran annonce « Kaldrafn,
 * activé » sans avoir à deviner ce que veut dire un cadre plus clair.
 */
function BoutonEtat({
  actif,
  libelle,
  action,
}: {
  actif: boolean;
  libelle: string;
  action: string;
}) {
  return (
    <button
      type="submit"
      aria-pressed={actif}
      className={`rounded-sm border px-3 py-2 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors duration-300 ${
        actif
          ? "border-aurora-teal/60 bg-aurora-teal/10 text-parchment hover:border-aurora-teal"
          : "border-silver/25 text-silver hover:border-silver/50 hover:text-parchment"
      }`}
    >
      <span aria-hidden="true" className="mr-2">
        {actif ? "◆" : "◇"}
      </span>
      {libelle}
      <span className="ml-2 normal-case tracking-normal text-silver">
        · {action}
      </span>
    </button>
  );
}

function BasculeMaison({
  utilisateurId,
  permission,
  maison,
  accordee,
}: {
  utilisateurId: string;
  permission: Permission;
  maison: Maison;
  accordee: boolean;
}) {
  const t = TEXTES_POUVOIRS.panneau;
  return (
    <form action={basculerPermissionAction}>
      <input type="hidden" name="utilisateurId" value={utilisateurId} />
      <input type="hidden" name="permission" value={permission} />
      <input type="hidden" name="maison" value={maison} />
      <input
        type="hidden"
        name="sens"
        value={accordee ? "RETIRER" : "ACCORDER"}
      />
      <BoutonEtat
        actif={accordee}
        libelle={NOMS_MAISON[maison] ?? maison}
        action={accordee ? t.retirer : t.accorder}
      />
    </form>
  );
}

function BasculeGlobale({
  utilisateurId,
  permission,
  accordee,
}: {
  utilisateurId: string;
  permission: Permission;
  accordee: boolean;
}) {
  const t = TEXTES_POUVOIRS.panneau;
  return (
    <form action={basculerPermissionAction}>
      <input type="hidden" name="utilisateurId" value={utilisateurId} />
      <input type="hidden" name="permission" value={permission} />
      <input
        type="hidden"
        name="sens"
        value={accordee ? "RETIRER" : "ACCORDER"}
      />
      <BoutonEtat
        actif={accordee}
        libelle={accordee ? "Accordé" : "Non accordé"}
        action={accordee ? t.retirer : t.accorder}
      />
    </form>
  );
}

/** Les quatre d’un coup — et leur retrait, aussi simple (art. 13.5). */
function BasculeQuatreMaisons({
  utilisateurId,
  permission,
  toutes,
}: {
  utilisateurId: string;
  permission: Permission;
  toutes: boolean;
}) {
  const t = TEXTES_POUVOIRS.panneau;
  return (
    <form
      action={
        toutes ? retirerToutesLesMaisonsAction : accorderToutesLesMaisonsAction
      }
    >
      <input type="hidden" name="utilisateurId" value={utilisateurId} />
      <input type="hidden" name="permission" value={permission} />
      <BoutonEtat
        actif={toutes}
        libelle={t.toutesLesMaisons}
        action={toutes ? t.retirer : t.accorder}
      />
    </form>
  );
}
