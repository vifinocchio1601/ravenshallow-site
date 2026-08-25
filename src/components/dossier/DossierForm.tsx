"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import CartesRadio from "./CartesRadio";
import Champ, { CLASSES_SAISIE } from "./Champ";
import ChipsLimites from "./ChipsLimites";
import CompteurBiographie from "./CompteurBiographie";
import PortraitCropper from "./PortraitCropper";
import ReglesMotDePasse from "./ReglesMotDePasse";
import EcranEtat from "./EcranEtat";
import {
  ecrireEtatDossier,
  effacerBrouillon,
  enregistrerBrouillon,
  lireBrouillon,
  lireEtatDossier,
  lireReglementAccepte,
  type EtatLocal,
} from "@/lib/dossier/brouillon";
import { TEXTES_ETATS } from "@/lib/dossier/etats";
import {
  champsManquants,
  normaliserVisage,
  pourValidation,
  REGEX_PRENOM_NOM,
  schemaDossier,
} from "@/lib/dossier/schema";
import {
  AGE_MINIMUM_JOUEUR,
  FAMILLES,
  GENRES,
  MESSAGES,
  TEXTES,
  TYPES_PORTRAIT,
} from "@/lib/dossier/constantes";

type Trio = [string, string, string];

type Valeurs = {
  email: string;
  ageReel: string;
  motDePasse: string;
  confirmation: string;
  limitesEcriture: string[];
  limitesAutres: string;
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
  certification104: boolean;
};

const VIDE: Valeurs = {
  email: "",
  ageReel: "",
  motDePasse: "",
  confirmation: "",
  limitesEcriture: [],
  limitesAutres: "",
  prenomNom: "",
  genre: "",
  famille: "",
  portraitType: "",
  acteurNom: "",
  portrait: "",
  biographie: "",
  qualites: ["", "", ""],
  defauts: ["", "", ""],
  plusGrandePeur: "",
  certification104: false,
};

type EtatVisage = "vide" | "verification" | "libre" | "pris" | "indisponible";

/**
 * Le brouillon porte-t-il quelque chose ? Sert à ne pas écrire un brouillon
 * vide au montage, ni à annoncer une restauration qui n’a rien restauré.
 */
function contientQuelqueChose(valeurs: Partial<Valeurs>): boolean {
  return Object.entries(valeurs).some(([cle, valeur]) => {
    if (cle === "certification104") return valeur === true;
    if (Array.isArray(valeur)) {
      return valeur.some((entree) => String(entree).trim() !== "");
    }
    return typeof valeur === "string" && valeur.trim() !== "";
  });
}

export default function DossierForm() {
  const [valeurs, setValeurs] = useState<Valeurs>(VIDE);
  const [touches, setTouches] = useState<Record<string, boolean>>({});
  const [reglementAccepteLe, setReglementAccepteLe] = useState<string | null>(
    null,
  );
  const [pret, setPret] = useState(false);
  const [brouillonRestaure, setBrouillonRestaure] = useState(false);
  const [etatVisage, setEtatVisage] = useState<EtatVisage>("vide");
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [etatDossier, setEtatDossier] = useState<EtatLocal | null>(null);

  // ── Reprise du brouillon et de l’acceptation du règlement ──
  useEffect(() => {
    setReglementAccepteLe(lireReglementAccepte());
    setEtatDossier(lireEtatDossier());

    const brouillon = lireBrouillon();
    if (brouillon && contientQuelqueChose(brouillon as Partial<Valeurs>)) {
      setValeurs((actuelles) => ({ ...actuelles, ...brouillon }) as Valeurs);
      setBrouillonRestaure(true);
    }
    setPret(true);
  }, []);

  // ── Sauvegarde automatique ──
  useEffect(() => {
    if (!pret || !contientQuelqueChose(valeurs)) return;
    enregistrerBrouillon(valeurs as unknown as Record<string, unknown>);
  }, [valeurs, pret]);

  const modifier = useCallback(
    <C extends keyof Valeurs>(champ: C, valeur: Valeurs[C]) => {
      setValeurs((actuelles) => ({ ...actuelles, [champ]: valeur }));
      setErreurEnvoi(null);
    },
    [],
  );

  const marquerTouche = (champ: string) =>
    setTouches((actuels) => ({ ...actuels, [champ]: true }));

  // ── Registre des visages : vérification en direct ──
  useEffect(() => {
    if (valeurs.portraitType !== "ACTEUR") {
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
    const minuterie = setTimeout(async () => {
      try {
        const reponse = await fetch(
          `/api/visages?nom=${encodeURIComponent(normaliserVisage(nom))}`,
          { signal: controleur.signal },
        );
        if (!reponse.ok) {
          setEtatVisage("indisponible");
          return;
        }
        const donnees: { pris?: boolean } = await reponse.json();
        setEtatVisage(donnees.pris ? "pris" : "libre");
      } catch (erreur) {
        if ((erreur as Error).name !== "AbortError") {
          setEtatVisage("indisponible");
        }
      }
    }, 400);

    return () => {
      controleur.abort();
      clearTimeout(minuterie);
    };
  }, [valeurs.acteurNom, valeurs.portraitType]);

  // ── Ce qui manque encore ──
  const manquants = useMemo(
    () =>
      champsManquants(pourValidation(valeurs, reglementAccepteLe), {
        visagePris: etatVisage === "pris",
      }),
    [valeurs, reglementAccepteLe, etatVisage],
  );

  const complet = manquants.length === 0;

  const ligneRestante = complet
    ? TEXTES.envoi.complet
    : manquants.length <= 3
      ? TEXTES.envoi.resteListe.replace("{champs}", manquants.join(", "))
      : TEXTES.envoi.resteNombre.replace("{n}", String(manquants.length));

  // ── Messages affichés au fil de la saisie (après passage sur le champ) ──
  function messageDe(champ: keyof Valeurs, test: () => string | null) {
    if (!touches[champ]) return null;
    return test();
  }

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (envoi) return;

    const resultat = schemaDossier.safeParse(
      pourValidation(valeurs, reglementAccepteLe),
    );
    if (!resultat.success || etatVisage === "pris") {
      // Tous les champs deviennent « touchés » : les erreurs s’affichent.
      setTouches(
        Object.fromEntries(Object.keys(valeurs).map((cle) => [cle, true])),
      );
      return;
    }

    setEnvoi(true);
    setErreurEnvoi(null);
    try {
      const reponse = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultat.data),
      });
      const donnees: { erreur?: string } = await reponse
        .json()
        .catch(() => ({}));

      if (!reponse.ok) {
        setErreurEnvoi(donnees.erreur ?? MESSAGES.envoiEchoue);
        setEnvoi(false);
        return;
      }

      ecrireEtatDossier({ statut: "EN_ATTENTE", noteAdmin: null });
      effacerBrouillon();
      window.location.assign("/inscription/envoye");
    } catch {
      setErreurEnvoi(MESSAGES.envoiEchoue);
      setEnvoi(false);
    }
  }

  // ── Garde : pas de dossier sans règlement approuvé ──
  if (!pret) {
    return <div className="min-h-[40vh]" aria-hidden="true" />;
  }

  // Dossier renvoyé en correction : la note d’abord, la saisie intacte
  // derrière — le joueur ne retape rien.
  if (etatDossier?.statut === "A_CORRIGER") {
    const t = TEXTES_ETATS.correction;
    return (
      <EcranEtat
        ton="correction"
        titre={t.titre}
        corps={t.corps}
        badge={t.badge}
      >
        {etatDossier.noteAdmin ? (
          <blockquote className="mx-auto mt-8 max-w-[46ch] border-l-2 border-ember/60 pl-5 text-left">
            <p className="font-display text-[0.68rem] uppercase tracking-[0.16em] text-silver">
              {t.noteTitre}
            </p>
            <p className="mt-2 font-body italic leading-relaxed text-parchment-dim">
              «&nbsp;{etatDossier.noteAdmin}&nbsp;»
            </p>
          </blockquote>
        ) : null}

        <div className="mt-9">
          <button
            type="button"
            onClick={() => {
              // On ne touche pas au brouillon : tout est déjà là.
              ecrireEtatDossier(null);
              setEtatDossier(null);
            }}
            className="btn btn-ghost"
          >
            {t.action}
          </button>
        </div>
      </EcranEtat>
    );
  }

  if (!reglementAccepteLe) {
    return (
      <div className="rounded-sm border border-silver/15 bg-fjord/70 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[0.03em] text-parchment">
          {TEXTES.garde.titre}
        </h2>
        <p className="mx-auto mt-4 max-w-md leading-[1.8] text-parchment-dim">
          {TEXTES.garde.corps}
        </p>
        <Link href="/reglement" className="btn btn-solid mt-7">
          {TEXTES.garde.action}
        </Link>
      </div>
    );
  }

  const c = TEXTES.champs;

  return (
    <>
      <div className="flex items-start gap-3 border border-silver/10 border-l-2 border-l-aurora-teal/70 bg-aurora-teal/[0.04] px-5 py-4">
        <p className="font-body text-sm leading-relaxed text-parchment-dim">
          {TEXTES.page.reglementApprouve.replace(
            "{date}",
            new Date(reglementAccepteLe).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          )}
        </p>
      </div>

      {brouillonRestaure ? (
        <p className="mt-4 font-display text-[0.68rem] uppercase tracking-[0.14em] text-silver">
          {TEXTES.brouillon.restaure}
        </p>
      ) : null}

      <form onSubmit={envoyer} noValidate className="mt-12">
        {/* ═══════ Partie I ═══════ */}
        <section className="mb-16">
          <EnTetePartie {...TEXTES.parties.postulant} />

          <div className="grid gap-7">
            <div className="grid gap-7 sm:grid-cols-2">
              <Champ
                id="email"
                label={c.email.label}
                aide={c.email.aide}
                message={messageDe("email", () =>
                  valeurs.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeurs.email)
                    ? MESSAGES.email
                    : null,
                )}
              >
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={c.email.placeholder}
                  value={valeurs.email}
                  onChange={(e) => modifier("email", e.target.value)}
                  onBlur={() => marquerTouche("email")}
                  className={CLASSES_SAISIE}
                />
              </Champ>

              <Champ
                id="ageReel"
                label={c.ageReel.label}
                aide={c.ageReel.aide}
                message={messageDe("ageReel", () =>
                  valeurs.ageReel &&
                  Number(valeurs.ageReel) < AGE_MINIMUM_JOUEUR
                    ? MESSAGES.ageReel
                    : null,
                )}
              >
                <input
                  id="ageReel"
                  type="number"
                  min={AGE_MINIMUM_JOUEUR}
                  max={120}
                  inputMode="numeric"
                  placeholder={c.ageReel.placeholder}
                  value={valeurs.ageReel}
                  onChange={(e) => modifier("ageReel", e.target.value)}
                  onBlur={() => marquerTouche("ageReel")}
                  className={CLASSES_SAISIE}
                />
              </Champ>
            </div>

            <div className="grid gap-7 sm:grid-cols-2">
              <Champ id="motDePasse" label={c.motDePasse.label}>
                <input
                  id="motDePasse"
                  type="password"
                  autoComplete="new-password"
                  placeholder={c.motDePasse.placeholder}
                  value={valeurs.motDePasse}
                  onChange={(e) => modifier("motDePasse", e.target.value)}
                  aria-describedby="regles-mot-de-passe"
                  className={CLASSES_SAISIE}
                />
                <ReglesMotDePasse
                  id="regles-mot-de-passe"
                  valeur={valeurs.motDePasse}
                />
              </Champ>

              <Champ
                id="confirmation"
                label={c.confirmation.label}
                message={messageDe("confirmation", () =>
                  valeurs.confirmation &&
                  valeurs.confirmation !== valeurs.motDePasse
                    ? MESSAGES.confirmation
                    : null,
                )}
              >
                <input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  placeholder={c.confirmation.placeholder}
                  value={valeurs.confirmation}
                  onChange={(e) => modifier("confirmation", e.target.value)}
                  onBlur={() => marquerTouche("confirmation")}
                  className={CLASSES_SAISIE}
                />
              </Champ>
            </div>

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
          </div>
        </section>

        {/* ═══════ Partie II ═══════ */}
        <section className="mb-12">
          <EnTetePartie {...TEXTES.parties.eleve} />

          <div className="grid gap-7">
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
              <Champ
                id="prenomNom"
                label={c.prenomNom.label}
                aide={c.prenomNom.aide}
                message={messageDe("prenomNom", () =>
                  valeurs.prenomNom &&
                  !REGEX_PRENOM_NOM.test(valeurs.prenomNom.trim())
                    ? MESSAGES.prenomNom
                    : null,
                )}
              >
                <input
                  id="prenomNom"
                  type="text"
                  placeholder={c.prenomNom.placeholder}
                  value={valeurs.prenomNom}
                  onChange={(e) => modifier("prenomNom", e.target.value)}
                  onBlur={() => marquerTouche("prenomNom")}
                  className={CLASSES_SAISIE}
                />
              </Champ>

              {/* Âge de l’élève : affiché en dur, art. 10.2 */}
              <Champ label={c.ageEleve.label} aide={c.ageEleve.aide}>
                <p className="flex h-[3.25rem] items-center font-display text-xl text-parchment">
                  {c.ageEleve.valeur}
                </p>
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
                      placeholder={c.portrait.acteurPlaceholder}
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

            <Champ
              id="biographie"
              label={c.biographie.label}
              aide={c.biographie.aide}
            >
              <textarea
                id="biographie"
                rows={12}
                placeholder={c.biographie.placeholder}
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
                placeholders={c.qualites.placeholders}
                aria={c.qualites.aria}
                onChange={(t) => modifier("qualites", t)}
              />
              <Trois
                label={c.defauts.label}
                valeurs={valeurs.defauts}
                placeholders={c.defauts.placeholders}
                aria={c.defauts.aria}
                onChange={(t) => modifier("defauts", t)}
              />
            </div>

            <Champ id="plusGrandePeur" label={c.peur.label}>
              <input
                id="plusGrandePeur"
                type="text"
                placeholder={c.peur.placeholder}
                value={valeurs.plusGrandePeur}
                onChange={(e) => modifier("plusGrandePeur", e.target.value)}
                className={CLASSES_SAISIE}
              />
            </Champ>

            <label className="flex cursor-pointer items-start gap-4">
              <input
                type="checkbox"
                checked={valeurs.certification104}
                onChange={(e) => modifier("certification104", e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-[background-color,border-color] duration-300
                            peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-aurora-teal ${
                              valeurs.certification104
                                ? "border-aurora-teal/70 bg-aurora-teal/10"
                                : "border-silver/35 bg-mist/60"
                            }`}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="var(--aurora-teal)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={valeurs.certification104 ? 1 : 0}
                  />
                </svg>
              </span>
              <span className="font-body leading-relaxed text-parchment-dim">
                {c.certification104.label}
              </span>
            </label>
          </div>
        </section>

        {/* ═══════ Envoi ═══════ */}
        <div className="flex flex-col items-center gap-4 border-t border-silver/10 pt-10 text-center">
          <button
            type="submit"
            disabled={!complet || envoi}
            className="btn btn-solid disabled:cursor-not-allowed disabled:opacity-45"
          >
            {envoi ? TEXTES.envoi.enCours : TEXTES.envoi.bouton}
          </button>

          <p
            aria-live="polite"
            className="font-body text-sm italic text-silver"
          >
            {ligneRestante}
          </p>

          {erreurEnvoi ? (
            <p
              role="alert"
              className="font-display text-[0.68rem] uppercase tracking-[0.12em] text-ember"
            >
              {erreurEnvoi}
            </p>
          ) : null}
        </div>
      </form>
    </>
  );
}

/** Bandeau « I — Le postulant / hors RP ». */
function EnTetePartie({
  numero,
  titre,
  portee,
}: {
  numero: string;
  titre: string;
  portee: string;
}) {
  return (
    <div className="mb-9 flex items-baseline gap-4 border-b border-silver/15 pb-3">
      <span
        aria-hidden="true"
        className="font-display text-2xl leading-none text-aurora-teal"
      >
        {numero}
      </span>
      <h2 className="flex-1 font-display text-sm font-semibold uppercase tracking-[0.2em] text-parchment">
        {titre}
      </h2>
      <span className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver">
        {portee}
      </span>
    </div>
  );
}

/** Trois champs courts et séparés — qualités ou défauts. */
function Trois({
  label,
  valeurs,
  placeholders,
  aria,
  onChange,
}: {
  label: string;
  valeurs: Trio;
  placeholders: readonly string[];
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
            placeholder={placeholders[index]}
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
