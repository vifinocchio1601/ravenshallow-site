"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Champ, { CLASSES_SAISIE } from "@/components/dossier/Champ";
import EcranEtat from "@/components/dossier/EcranEtat";
import ReglesMotDePasse from "@/components/dossier/ReglesMotDePasse";
import {
  MESSAGES_CONNEXION,
  TEXTES_REINITIALISATION,
} from "@/lib/connexion/constantes";
import { schemaNouveauMotDePasse } from "@/lib/connexion/schema";
import { MESSAGES } from "@/lib/dossier/constantes";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Choix du nouveau mot de passe.
 *
 * Les trois règles se cochent pendant la frappe, avec le composant du dossier
 * d’admission et le même schéma Zod : un mot de passe accepté ici l’aurait
 * été là-bas, et réciproquement.
 */
export default function FormulaireNouveauMotDePasse({
  jeton,
}: {
  jeton: string;
}) {
  const t = TEXTES_REINITIALISATION;

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touche, setTouche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [etat, setEtat] = useState<"saisie" | "reussi" | "perime">("saisie");

  const lecture = schemaNouveauMotDePasse.safeParse({ motDePasse, confirmation });
  const complet = lecture.success;

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi) return;

    setTouche(true);
    if (!lecture.success) {
      setErreur(lecture.error.issues[0]?.message ?? MESSAGES.motDePasse);
      return;
    }

    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/reinitialisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, ...lecture.data }),
      });
      const donnees: { erreur?: string; perime?: boolean } = await reponse
        .json()
        .catch(() => ({}));

      if (reponse.ok) {
        setEtat("reussi");
        return;
      }
      if (donnees.perime) {
        setEtat("perime");
        return;
      }
      setErreur(donnees.erreur ?? MESSAGES_CONNEXION.indisponible);
      setEnvoi(false);
    } catch {
      setErreur(MESSAGES_CONNEXION.indisponible);
      setEnvoi(false);
    }
  }

  if (etat === "reussi") {
    return (
      <EcranEtat
        ton="accepte"
        titre={t.reussite.titre}
        corps={t.reussite.corps}
        badge={t.reussite.badge}
      >
        <div className="mt-9">
          <Link href={ROUTES.connexion} className="btn btn-solid" autoFocus>
            {t.reussite.action}
          </Link>
        </div>
      </EcranEtat>
    );
  }

  // Le jeton a expiré ou servi ailleurs entre l’affichage et l’envoi.
  if (etat === "perime") {
    return (
      <EcranEtat
        ton="correction"
        titre={t.perime.titre}
        corps={t.perime.corps}
        badge={t.perime.badge}
      >
        <div className="mt-9">
          <Link href={ROUTES.motDePasseOublie} className="btn btn-solid">
            {t.perime.action}
          </Link>
        </div>
      </EcranEtat>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-1">
        <Champ id="nouveau-mot-de-passe" label={t.champs.motDePasse.label}>
          <input
            id="nouveau-mot-de-passe"
            type="password"
            name="motDePasse"
            autoComplete="new-password"
            autoFocus
            required
            aria-describedby="regles-mot-de-passe"
            placeholder={t.champs.motDePasse.placeholder}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className={CLASSES_SAISIE}
          />
          <ReglesMotDePasse id="regles-mot-de-passe" valeur={motDePasse} />
        </Champ>

        <Champ
          id="nouvelle-confirmation"
          label={t.champs.confirmation.label}
          message={
            touche && confirmation && confirmation !== motDePasse
              ? MESSAGES.confirmation
              : null
          }
        >
          <input
            id="nouvelle-confirmation"
            type="password"
            name="confirmation"
            autoComplete="new-password"
            required
            placeholder={t.champs.confirmation.placeholder}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            onBlur={() => setTouche(true)}
            className={CLASSES_SAISIE}
          />
        </Champ>

        <p
          role="alert"
          aria-live="assertive"
          className="min-h-[1.4rem] font-display text-[0.68rem] uppercase tracking-[0.12em] text-ember"
        >
          {erreur}
        </p>

        <button
          type="submit"
          disabled={envoi || !complet}
          className="btn btn-solid mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {envoi ? t.enCours : t.bouton}
        </button>
      </form>
    </div>
  );
}
