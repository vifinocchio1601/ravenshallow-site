"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Champ, { CLASSES_SAISIE } from "@/components/dossier/Champ";
import EcranEtat from "@/components/dossier/EcranEtat";
import { TEXTES_OUBLI } from "@/lib/connexion/constantes";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Demande d’un lien de réinitialisation.
 *
 * L’écran de confirmation ne dit pas si l’adresse est connue — et le
 * formulaire ne peut pas le savoir non plus : la route répond toujours la
 * même chose. C’est le prix à payer pour que ce champ ne devienne pas un
 * annuaire des inscrits.
 */
export default function FormulaireOubli() {
  const t = TEXTES_OUBLI;

  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi) return;

    setEnvoi(true);
    try {
      await fetch("/api/mot-de-passe-oublie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Même en cas de coupure réseau : la confirmation ne dit rien de plus.
    }
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <EcranEtat
        titre={t.confirmation.titre}
        corps={t.confirmation.corps}
        badge={t.confirmation.badge}
      >
        <div className="mt-9">
          <Link href={ROUTES.connexion} className="btn btn-ghost">
            {t.retour}
          </Link>
        </div>
      </EcranEtat>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-1">
        <Champ id="oubli-email" label={t.champEmail.label}>
          <input
            id="oubli-email"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            placeholder={t.champEmail.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSES_SAISIE}
          />
        </Champ>

        <button
          type="submit"
          disabled={envoi}
          className="btn btn-solid mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {envoi ? t.enCours : t.bouton}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link
          href={ROUTES.connexion}
          className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          {t.retour}
        </Link>
      </p>
    </div>
  );
}
