import type { ReactNode } from "react";

/**
 * Enveloppe commune d’un champ : libellé, aide à la saisie, message.
 * Le libellé est un vrai `<label for>` quand le champ a un id, sinon un
 * simple intitulé (`<span>`) pour les groupes de cases ou de cartes.
 */
export default function Champ({
  id,
  label,
  aide,
  message,
  tonMessage = "erreur",
  children,
  className = "",
}: {
  id?: string;
  label: string;
  aide?: string;
  message?: string | null;
  tonMessage?: "erreur" | "succes" | "neutre";
  children: ReactNode;
  className?: string;
}) {
  const couleur =
    tonMessage === "succes"
      ? "text-aurora-teal"
      : tonMessage === "neutre"
        ? "text-silver"
        : "text-ember";

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      {id ? (
        <label
          htmlFor={id}
          className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim"
        >
          {label}
        </label>
      ) : (
        <span className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim">
          {label}
        </span>
      )}

      {aide ? (
        <p className="font-body text-sm italic leading-relaxed text-silver">
          {aide}
        </p>
      ) : null}

      {children}

      {/* Hauteur réservée : le message n’ajoute pas de saut de mise en page. */}
      <p
        id={id ? `${id}-message` : undefined}
        role={message && tonMessage === "erreur" ? "alert" : undefined}
        aria-live="polite"
        className={`min-h-[1.1rem] font-display text-[0.68rem] uppercase tracking-[0.12em] ${couleur}`}
      >
        {message}
      </p>
    </div>
  );
}

/** Classes communes des champs de saisie, alignées sur le design du site. */
export const CLASSES_SAISIE =
  "w-full rounded-sm border border-silver/25 bg-mist/60 px-4 py-3 font-body text-base text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70";
