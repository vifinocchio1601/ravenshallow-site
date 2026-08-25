"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Champ, { CLASSES_SAISIE } from "@/components/dossier/Champ";
import {
  MESSAGES_CONNEXION,
  TEXTES_CONNEXION,
} from "@/lib/connexion/constantes";
import { schemaConnexion } from "@/lib/connexion/schema";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Formulaire de connexion.
 *
 * Une seule zone de message, sous les champs : l’échec n’a qu’une cause
 * visible, quelle que soit la vraie. `role="alert"` la fait annoncer par les
 * lecteurs d’écran sans déplacer le focus, et le focus retourne au premier
 * champ pour que la correction se fasse sans souris.
 */
export default function FormulaireConnexion() {
  const t = TEXTES_CONNEXION;

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi) return;

    const lecture = schemaConnexion.safeParse({ email, motDePasse });
    if (!lecture.success) {
      setErreur(lecture.error.issues[0]?.message ?? MESSAGES_CONNEXION.echec);
      return;
    }

    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lecture.data),
      });
      const donnees: { destination?: string; erreur?: string } = await reponse
        .json()
        .catch(() => ({}));

      if (!reponse.ok || !donnees.destination) {
        setErreur(donnees.erreur ?? MESSAGES_CONNEXION.echec);
        setMotDePasse("");
        setEnvoi(false);
        document.getElementById("connexion-email")?.focus();
        return;
      }

      // Rechargement complet : le gabarit serveur relit la session en base.
      window.location.assign(donnees.destination);
    } catch {
      setErreur(MESSAGES_CONNEXION.indisponible);
      setEnvoi(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-1">
        <Champ id="connexion-email" label={t.champs.email.label}>
          <input
            id="connexion-email"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            placeholder={t.champs.email.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSES_SAISIE}
          />
        </Champ>

        <Champ id="connexion-mot-de-passe" label={t.champs.motDePasse.label}>
          {/* Le bouton « afficher » vit dans le champ : c’est un vrai bouton,
              atteignable au clavier, jamais une icône décorative. */}
          <div className="relative">
            <input
              id="connexion-mot-de-passe"
              type={visible ? "text" : "password"}
              name="motDePasse"
              autoComplete="current-password"
              required
              placeholder={t.champs.motDePasse.placeholder}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={`${CLASSES_SAISIE} pr-24`}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
              aria-label={
                visible
                  ? t.champs.motDePasse.masquerComplet
                  : t.champs.motDePasse.afficherComplet
              }
              aria-controls="connexion-mot-de-passe"
              className="absolute inset-y-0 right-0 px-4 font-display text-[0.64rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
            >
              {visible ? t.champs.motDePasse.masquer : t.champs.motDePasse.afficher}
            </button>
          </div>
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
          disabled={envoi}
          className="btn btn-solid mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {envoi ? t.enCours : t.bouton}
        </button>
      </form>

      <p className="mt-5 text-center">
        <Link
          href={ROUTES.motDePasseOublie}
          className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          {t.oublie}
        </Link>
      </p>

      <div className="hairline my-8" />

      <p className="text-center font-body text-sm leading-relaxed text-parchment-dim">
        {t.pasDeDossier}{" "}
        <Link
          href={ROUTES.inscription}
          className="text-aurora-teal underline decoration-aurora-teal/40 underline-offset-4 transition-colors duration-300 hover:decoration-aurora-teal"
        >
          {t.faireDemande}
        </Link>
      </p>
    </div>
  );
}
