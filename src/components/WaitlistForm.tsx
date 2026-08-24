"use client";

import { FormEvent, useState } from "react";

/**
 * Formulaire d'attente — purement visuel pour l'instant :
 * `preventDefault` sur le submit, aucun envoi, aucun stockage.
 */
export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="w-full max-w-xl">
      {/* `flex-wrap` : le bouton passe sous le champ dès que la colonne est
          trop étroite, plutôt que de comprimer la saisie. */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-wrap gap-3"
      >
        <label htmlFor="waitlist-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="vous@exemple.no"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (submitted) setSubmitted(false);
          }}
          className="min-w-[15rem] flex-1 rounded-sm border border-silver/25 bg-mist/60 px-4 py-3 font-body text-base text-parchment placeholder:text-silver/55 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
        />
        <button type="submit" className="btn btn-solid text-center">
          Rejoindre la liste d&apos;attente
        </button>
      </form>

      <p
        aria-live="polite"
        className="mt-4 text-sm leading-relaxed text-silver"
      >
        {submitted ? (
          <span className="text-aurora-teal">
            Le corbeau est parti. On te répondra avant la première brume.
          </span>
        ) : (
          <>
            L&apos;école ouvre bientôt ses portes aux premiers élèves. Laisse
            ton adresse pour être prévenu·e dès la répartition.
          </>
        )}
      </p>
    </div>
  );
}
