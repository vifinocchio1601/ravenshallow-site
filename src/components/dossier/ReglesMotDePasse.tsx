"use client";

import { REGLES_MOT_DE_PASSE, type RegleMotDePasse } from "@/lib/dossier/schema";
import { TEXTES } from "@/lib/dossier/constantes";

/**
 * Les trois règles du mot de passe, cochées en direct pendant la frappe.
 * `aria-live` annonce le passage de chaque règle sans voler le focus.
 */
export default function ReglesMotDePasse({
  valeur,
  id,
}: {
  valeur: string;
  id: string;
}) {
  const libelles = TEXTES.champs.motDePasse.regles;
  const regles: { cle: RegleMotDePasse; libelle: string }[] = [
    { cle: "longueur", libelle: libelles.longueur },
    { cle: "majuscule", libelle: libelles.majuscule },
    { cle: "chiffre", libelle: libelles.chiffre },
  ];

  return (
    <ul
      id={id}
      aria-live="polite"
      className="mt-1 flex flex-wrap gap-x-5 gap-y-1"
    >
      {regles.map(({ cle, libelle }) => {
        const validee = REGLES_MOT_DE_PASSE[cle](valeur);
        return (
          <li
            key={cle}
            className={`flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.12em] transition-colors duration-300 ${
              validee ? "text-aurora-teal" : "text-silver/70"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                validee ? "bg-aurora-teal" : "bg-silver/30"
              }`}
            />
            {libelle}
            <span className="sr-only">
              {validee ? " : règle respectée" : " : règle non respectée"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
