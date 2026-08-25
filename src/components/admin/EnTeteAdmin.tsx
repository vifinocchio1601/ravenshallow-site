import Link from "next/link";

/** En-tête commun des pages d’administration : fil d’ariane, titre, sortie. */
export default function EnTeteAdmin({
  eyebrow,
  titre,
  demonstration = false,
  retour,
}: {
  eyebrow: string;
  titre: string;
  demonstration?: boolean;
  retour?: { href: string; libelle: string };
}) {
  return (
    <header className="border-b border-silver/10 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={retour?.href ?? "/admin"}
          className="group inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-1"
          >
            ←
          </span>
          {retour?.libelle ?? "Administration"}
        </Link>

        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="font-display text-[0.68rem] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-aurora-teal"
          >
            Se déconnecter
          </button>
        </form>
      </div>

      <p className="eyebrow mt-8 flex items-center gap-3">
        <span aria-hidden="true" className="rune text-aurora-teal/80">
          ᚨᛞᛗᛁᚾ
        </span>
        <span>{eyebrow}</span>
      </p>

      <h1 className="mt-3 font-display text-[clamp(1.8rem,5vw,2.5rem)] font-bold leading-[1.1] tracking-[0.04em] text-parchment">
        {titre}
      </h1>

      {demonstration ? (
        <p className="mt-4 inline-flex rounded-sm border border-ember/40 bg-ember/[0.06] px-4 py-2 font-display text-[0.66rem] uppercase tracking-[0.14em] text-ember">
          Données de démonstration — la base n’est pas encore branchée
        </p>
      ) : null}
    </header>
  );
}
