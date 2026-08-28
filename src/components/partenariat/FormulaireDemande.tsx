"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  demanderAction,
  type EtatDemande,
} from "@/app/partenariat/actions";
import { DISCORD } from "@/lib/content";
import { TEXTES_PARTENARIAT } from "@/lib/partenariat/constantes";
import {
  COURRIEL_MAX,
  MESSAGE_DEMANDE_MAX,
  NOM_FORUM_MAX,
  URL_MAX,
} from "@/lib/partenariat/limites";

/**
 * **Nous proposer un partenariat** — le seul formulaire du site ouvert à qui
 * n'a pas de compte.
 *
 * C'est donc la seule porte à spam, et elle porte trois verrous, tous posés
 * côté serveur : un pot de miel, un délai minimal de remplissage, et un
 * plafond horaire. Ce composant ne fait que transporter de quoi les évaluer —
 * ce qui décide vit dans `lib/partenariat/freins.ts`.
 *
 * Composant client pour deux raisons, les mêmes que le formulaire du
 * calendrier : dire pourquoi un envoi n'est pas passé, et remplacer le
 * formulaire par un accusé de réception quand il l'est.
 */
export default function FormulaireDemande() {
  const t = TEXTES_PARTENARIAT.demande;
  const [etat, envoyer] = useFormState<EtatDemande, FormData>(demanderAction, {
    erreur: null,
    envoye: false,
  });

  const idNom = useId();
  const idUrl = useId();
  const idCourriel = useId();
  const idMessage = useId();
  const idPot = useId();
  const idAideNom = useId();
  const idAideUrl = useId();
  const idAideCourriel = useId();
  const idAideMessage = useId();

  /**
   * L'instant d'ouverture du formulaire, posé **après le montage**.
   *
   * ⚠️ Jamais à la construction : `Date.now()` donnerait une valeur au rendu
   * du serveur et une autre à l'hydratation, et React s'en plaindrait. Le
   * champ part vide quand le script ne tourne pas — et le serveur traite
   * l'absence comme « on ne sait pas », jamais comme un envoi trop rapide.
   */
  const [ouvertLe, setOuvertLe] = useState("");
  useEffect(() => setOuvertLe(String(Date.now())), []);

  if (etat.envoye) {
    return (
      <p
        role="status"
        className="mt-6 rounded-sm border border-aurora-teal/25 bg-fjord/70 px-6 py-7 leading-[1.8] text-parchment-dim"
      >
        {t.envoye}
      </p>
    );
  }

  return (
    <form action={envoyer} className="mt-6 grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="ouvertLe" value={ouvertLe} />

      {/* ── Le pot de miel ──
          Caché à l'œil, retiré de la tabulation, et annoncé à qui écoute :
          `aria-hidden` le ferait disparaître pour un lecteur d'écran, mais
          certains le remplissent quand même par autocomplétion. Une consigne
          claire vaut mieux qu'un champ muet. */}
      <p className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={idPot}>{t.champs.pot}</label>
        <input
          id={idPot}
          name="site"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
        <span>{t.champs.potAide}</span>
      </p>

      <div>
        <label htmlFor={idNom} className={ETIQUETTE}>
          {t.champs.nom}
        </label>
        <input
          id={idNom}
          name="nom"
          type="text"
          required
          maxLength={NOM_FORUM_MAX}
          aria-describedby={idAideNom}
          className={CHAMP}
        />
        <p id={idAideNom} className={AIDE}>
          {t.champs.nomAide}
        </p>
      </div>

      <div>
        <label htmlFor={idUrl} className={ETIQUETTE}>
          {t.champs.url}
        </label>
        <input
          id={idUrl}
          name="url"
          type="url"
          required
          maxLength={URL_MAX}
          placeholder="https://"
          aria-describedby={idAideUrl}
          className={CHAMP}
        />
        <p id={idAideUrl} className={AIDE}>
          {t.champs.urlAide}
        </p>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={idCourriel} className={ETIQUETTE}>
          {t.champs.courriel}
        </label>
        <input
          id={idCourriel}
          name="courriel"
          type="email"
          required
          maxLength={COURRIEL_MAX}
          autoComplete="email"
          aria-describedby={idAideCourriel}
          className={CHAMP}
        />
        <p id={idAideCourriel} className={AIDE}>
          {t.champs.courrielAide}
        </p>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={idMessage} className={ETIQUETTE}>
          {t.champs.message}
        </label>
        <textarea
          id={idMessage}
          name="message"
          required
          rows={5}
          maxLength={MESSAGE_DEMANDE_MAX}
          aria-describedby={idAideMessage}
          className={`${CHAMP} resize-y`}
        />
        <p id={idAideMessage} className={AIDE}>
          {t.champs.messageAide}
        </p>
      </div>

      {/* La hauteur du message d'erreur n'est pas réservée : il est rare, et
          le formulaire n'a rien en dessous qui sauterait. */}
      {etat.erreur ? (
        <p
          role="alert"
          className="sm:col-span-2 rounded-sm border border-aurora-violet/30 bg-mist/50 px-4 py-3 text-sm leading-relaxed text-parchment"
        >
          {etat.erreur}
        </p>
      ) : null}

      <p className="sm:col-span-2 font-body text-xs italic leading-relaxed text-silver">
        {t.confidentialite}{" "}
        <Link
          href="/confidentialite"
          className="underline decoration-silver/40 underline-offset-2 transition-colors duration-300 hover:text-aurora-teal"
        >
          {t.confidentialiteLien}
        </Link>
        .
      </p>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-5">
        <Bouton />
        <a
          href={DISCORD.url}
          target="_blank"
          rel="noreferrer noopener"
          className="font-display text-[0.66rem] uppercase tracking-[0.2em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          {t.discord}
        </a>
      </div>
    </form>
  );
}

/** Le bouton connaît l'état de l'envoi ; le formulaire, lui, ne le voit pas. */
function Bouton() {
  const { pending } = useFormStatus();
  const t = TEXTES_PARTENARIAT.demande;

  return (
    <button type="submit" disabled={pending} className="btn btn-solid">
      {pending ? t.envoi : t.bouton}
    </button>
  );
}

const ETIQUETTE =
  "block font-display text-[0.66rem] uppercase tracking-[0.2em] text-parchment-dim";

const CHAMP =
  "mt-2 w-full rounded-sm border border-silver/15 bg-void/60 px-3 py-2 font-body text-parchment placeholder:text-silver/40 focus:border-aurora-teal/50 focus:outline-none";

const AIDE = "mt-1 font-body text-xs italic leading-relaxed text-silver";
