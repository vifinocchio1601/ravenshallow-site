"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import CartesRadio from "./CartesRadio";
import Champ, { CLASSES_SAISIE } from "./Champ";
import ChipsLimites from "./ChipsLimites";
import CompteurBiographie from "./CompteurBiographie";
import PortraitCropper from "./PortraitCropper";
import {
  normaliserVisage,
  REGEX_PRENOM_NOM,
  schemaFiche,
} from "@/lib/dossier/schema";
import {
  FAMILLES,
  GENRES,
  MESSAGES,
  TEXTES,
  TYPES_PORTRAIT,
} from "@/lib/dossier/constantes";

type Trio = [string, string, string];

export type ValeursFiche = {
  prenomNom: string;
  genre: string;
  famille: string;
  portraitType: string;
  acteurNom: string;
  portrait: string;
  biographie: string;
  qualites: Trio;
  defauts: Trio;
  plusGrandePeur: string;
  limitesEcriture: string[];
  limitesAutres: string;
};

type EtatVisage = "vide" | "verification" | "libre" | "pris" | "indisponible";

/**
 * Reprise de la partie II par le joueur, depuis le lien reçu par courriel.
 * Mêmes champs, mêmes validations et mêmes composants que le dossier — c’est
 * le même schéma Zod qui décide des deux côtés.
 */
export default function FicheForm({
  valeursInitiales,
  jeton,
}: {
  valeursInitiales: ValeursFiche;
  jeton: string;
}) {
  const [valeurs, setValeurs] = useState<ValeursFiche>(valeursInitiales);
  const [touches, setTouches] = useState<Record<string, boolean>>({});
  const [etatVisage, setEtatVisage] = useState<EtatVisage>("vide");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<
    { ton: "succes" | "erreur"; texte: string } | null
  >(null);

  const modifier = useCallback(
    <C extends keyof ValeursFiche>(champ: C, valeur: ValeursFiche[C]) => {
      setValeurs((actuelles) => ({ ...actuelles, [champ]: valeur }));
      setMessage(null);
    },
    [],
  );

  // Le registre n’est interrogé que si le nom d’acteur a bougé : garder le
  // sien ne doit pas se voir refuser au motif qu’il est déjà pris — par soi.
  const acteurInchange =
    valeurs.acteurNom.trim() === valeursInitiales.acteurNom.trim();

  useEffect(() => {
    if (valeurs.portraitType !== "ACTEUR" || acteurInchange) {
      setEtatVisage("vide");
      return;
    }
    const nom = valeurs.acteurNom.trim();
    if (!nom) {
      setEtatVisage("vide");
      return;
    }

    setEtatVisage("verification");
    const controleur = new AbortController();
    const minuterie = setTimeout(() => {
      fetch(`/api/visages?nom=${encodeURIComponent(normaliserVisage(nom))}`, {
        signal: controleur.signal,
      })
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error("indisponible")),
        )
        .then((d: { pris?: boolean }) => setEtatVisage(d.pris ? "pris" : "libre"))
        .catch((erreur: Error) => {
          if (erreur.name !== "AbortError") setEtatVisage("indisponible");
        });
    }, 400);

    return () => {
      controleur.abort();
      clearTimeout(minuterie);
    };
  }, [valeurs.acteurNom, valeurs.portraitType, acteurInchange]);

  const validation = useMemo(
    () => schemaFiche.safeParse({ ...valeurs, certification104: true }),
    [valeurs],
  );

  const complet = validation.success && etatVisage !== "pris";

  function messageDe(champ: keyof ValeursFiche, test: () => string | null) {
    return touches[champ] ? test() : null;
  }

  async function enregistrer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi || !complet) return;

    setEnvoi(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, fiche: valeurs }),
      });
      const donnees: { erreur?: string } = await reponse
        .json()
        .catch(() => ({}));

      if (!reponse.ok) {
        setMessage({
          ton: "erreur",
          texte: donnees.erreur ?? MESSAGES.envoiEchoue,
        });
      } else {
        setMessage({ ton: "succes", texte: TEXTES.fiche.enregistree });
      }
    } catch {
      setMessage({ ton: "erreur", texte: MESSAGES.envoiEchoue });
    }
    setEnvoi(false);
  }

  const c = TEXTES.champs;

  return (
    <form onSubmit={enregistrer} noValidate className="mt-10 grid gap-7">
      <div className="grid gap-7 sm:grid-cols-2">
        <Champ
          id="prenomNom"
          label={c.prenomNom.label}
          aide={c.prenomNom.aide}
          message={messageDe("prenomNom", () =>
            valeurs.prenomNom && !REGEX_PRENOM_NOM.test(valeurs.prenomNom.trim())
              ? MESSAGES.prenomNom
              : null,
          )}
        >
          <input
            id="prenomNom"
            type="text"
            value={valeurs.prenomNom}
            onChange={(e) => modifier("prenomNom", e.target.value)}
            onBlur={() => setTouches((t) => ({ ...t, prenomNom: true }))}
            className={CLASSES_SAISIE}
          />
        </Champ>

        <Champ id="genre" label={c.genre.label} aide={c.genre.aide}>
          <select
            id="genre"
            value={valeurs.genre}
            onChange={(e) => modifier("genre", e.target.value)}
            className={CLASSES_SAISIE}
          >
            <option value="">{c.genre.vide}</option>
            {GENRES.map((g) => (
              <option key={g.valeur} value={g.valeur}>
                {g.libelle}
              </option>
            ))}
          </select>
        </Champ>
      </div>

      <Champ label={c.famille.label}>
        <CartesRadio
          nom="famille"
          legende={c.famille.label}
          options={FAMILLES}
          valeur={valeurs.famille}
          onChange={(v) => modifier("famille", v)}
          colonnes={3}
        />
      </Champ>

      <Champ label={c.portrait.label}>
        <CartesRadio
          nom="portraitType"
          legende={c.portrait.label}
          options={TYPES_PORTRAIT}
          valeur={valeurs.portraitType}
          onChange={(v) => modifier("portraitType", v)}
        />

        {valeurs.portraitType === "ACTEUR" ? (
          <div className="mt-5">
            <Champ
              id="acteurNom"
              label={c.portrait.acteurLabel}
              message={
                etatVisage === "pris"
                  ? MESSAGES.acteurPris
                  : etatVisage === "libre"
                    ? MESSAGES.acteurLibre
                    : etatVisage === "verification"
                      ? MESSAGES.acteurVerification
                      : etatVisage === "indisponible"
                        ? MESSAGES.acteurIndisponible
                        : null
              }
              tonMessage={
                etatVisage === "libre"
                  ? "succes"
                  : etatVisage === "verification"
                    ? "neutre"
                    : "erreur"
              }
            >
              <input
                id="acteurNom"
                type="text"
                value={valeurs.acteurNom}
                onChange={(e) => modifier("acteurNom", e.target.value)}
                aria-invalid={etatVisage === "pris" || undefined}
                className={CLASSES_SAISIE}
              />
            </Champ>
          </div>
        ) : null}

        <div className="mt-5">
          <PortraitCropper
            valeur={valeurs.portrait}
            onChange={(dataUrl) => modifier("portrait", dataUrl)}
            message={valeurs.portrait ? MESSAGES.portraitPret : null}
            tonMessage="succes"
          />
        </div>
      </Champ>

      <Champ id="biographie" label={c.biographie.label} aide={c.biographie.aide}>
        <textarea
          id="biographie"
          rows={12}
          value={valeurs.biographie}
          onChange={(e) => modifier("biographie", e.target.value)}
          className={`${CLASSES_SAISIE} min-h-[16rem] resize-y leading-[1.8]`}
        />
        <CompteurBiographie nombre={valeurs.biographie.trim().length} />
      </Champ>

      <div className="grid gap-7 sm:grid-cols-2">
        <Trois
          label={c.qualites.label}
          valeurs={valeurs.qualites}
          aria={c.qualites.aria}
          onChange={(t) => modifier("qualites", t)}
        />
        <Trois
          label={c.defauts.label}
          valeurs={valeurs.defauts}
          aria={c.defauts.aria}
          onChange={(t) => modifier("defauts", t)}
        />
      </div>

      <Champ id="plusGrandePeur" label={c.peur.label}>
        <input
          id="plusGrandePeur"
          type="text"
          value={valeurs.plusGrandePeur}
          onChange={(e) => modifier("plusGrandePeur", e.target.value)}
          className={CLASSES_SAISIE}
        />
      </Champ>

      {/* Art. 15.4 — les limites appartiennent au joueur et changent avec lui. */}
      <Champ label={c.limites.label} aide={c.limites.aide}>
        <ChipsLimites
          legende={c.limites.label}
          choisies={valeurs.limitesEcriture}
          onToggle={(valeur) =>
            modifier(
              "limitesEcriture",
              valeurs.limitesEcriture.includes(valeur)
                ? valeurs.limitesEcriture.filter((v) => v !== valeur)
                : [...valeurs.limitesEcriture, valeur],
            )
          }
        />
        <input
          type="text"
          aria-label={c.limites.autresPlaceholder}
          placeholder={c.limites.autresPlaceholder}
          value={valeurs.limitesAutres}
          onChange={(e) => modifier("limitesAutres", e.target.value)}
          className={`${CLASSES_SAISIE} mt-3`}
        />
      </Champ>

      <div className="flex flex-col items-center gap-4 border-t border-silver/10 pt-8 text-center">
        <button
          type="submit"
          disabled={!complet || envoi}
          className="btn btn-solid disabled:cursor-not-allowed disabled:opacity-45"
        >
          {envoi ? TEXTES.fiche.enregistrement : TEXTES.fiche.enregistrer}
        </button>

        <p
          role={message?.ton === "erreur" ? "alert" : undefined}
          aria-live="polite"
          className={`min-h-[1.2rem] font-body text-sm ${
            message?.ton === "succes"
              ? "text-aurora-teal"
              : message
                ? "text-ember"
                : "italic text-silver"
          }`}
        >
          {message?.texte ?? (complet ? "" : TEXTES.fiche.incomplete)}
        </p>
      </div>
    </form>
  );
}

function Trois({
  label,
  valeurs,
  aria,
  onChange,
}: {
  label: string;
  valeurs: Trio;
  aria: readonly string[];
  onChange: (trio: Trio) => void;
}) {
  return (
    <Champ label={label}>
      <div className="grid gap-3 sm:grid-cols-3">
        {valeurs.map((valeur, index) => (
          <input
            key={index}
            type="text"
            aria-label={aria[index]}
            value={valeur}
            onChange={(e) => {
              const trio = [...valeurs] as Trio;
              trio[index] = e.target.value;
              onChange(trio);
            }}
            className={CLASSES_SAISIE}
          />
        ))}
      </div>
    </Champ>
  );
}
