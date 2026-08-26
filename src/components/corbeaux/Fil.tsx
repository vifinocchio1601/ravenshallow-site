"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ActionsCorbeau from "@/components/corbeaux/ActionsCorbeau";
import BlasonCorrespondant from "@/components/corbeaux/BlasonCorrespondant";
import BoutonBloquer from "@/components/corbeaux/BoutonBloquer";
import ChampCorbeau from "@/components/corbeaux/ChampCorbeau";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { heureDe, jourDe, journeeDe } from "@/lib/corbeaux/dates";
import type { CorbeauAffiche, FilCharge } from "@/lib/corbeaux/depot";
import { ROUTES } from "@/lib/ecole/menu";
import { signalerLectureCorbeaux } from "./useNonLus";
import { useRafraichissement } from "./useRafraichissement";

/**
 * Un fil de la Tour aux Corbeaux.
 *
 * ── Accessibilité : ce que fait ce composant, et pourquoi ──
 *
 * Le fil porte `role="log"` et `aria-live="polite"` : un lecteur d’écran
 * annonce les corbeaux qui arrivent, **sans jamais déplacer le focus**. C’est
 * la différence entre `polite` et `assertive`, et elle compte : voler le
 * curseur à quelqu’un en train d’écrire une réponse est le meilleur moyen de
 * lui faire perdre sa phrase.
 *
 * Le défilement automatique suit la même règle — il ne descend que si le
 * lecteur était **déjà en bas**. Quelqu’un qui remonte lire un vieux corbeau
 * ne doit pas se faire renvoyer en bas à chaque arrivée.
 */
export default function Fil({
  initial,
  destinataire,
}: {
  /** Nul pour un fil qui n’existe pas encore — l’administration, avant le premier corbeau. */
  initial: FilCharge | null;
  destinataire: { membreId: string } | { administration: true };
}) {
  const [fil, setFil] = useState(initial);
  const [chargementAncien, setChargementAncien] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  /**
   * Posé dès que le blocage est confirmé, sans attendre que le serveur soit
   * relu : la conversation se referme sous les yeux de celui qui vient de
   * bloquer. Le prochain rafraîchissement dira la même chose.
   */
  const [vientDeBloquer, setVientDeBloquer] = useState(false);

  const zone = useRef<HTMLDivElement>(null);
  const etaitEnBas = useRef(true);
  const t = TEXTES_CORBEAUX;

  const corbeaux = fil?.corbeaux ?? [];
  const conversationId = fil?.conversation.id ?? null;
  const correspondant = fil?.conversation.correspondant ?? null;
  const avecAdministration = fil?.conversation.avecAdministration ?? "administration" in destinataire;
  const close = (fil?.conversation.close ?? false) || vientDeBloquer;

  const nom = avecAdministration
    ? t.administration.nom
    : (correspondant?.prenomNom ?? t.administration.nom);

  // ── Le défilement ──
  // Mesuré AVANT le rendu des nouveaux corbeaux : après, la position a déjà
  // changé et la question « était-il en bas ? » n’a plus de réponse.
  const noterPosition = useCallback(() => {
    const el = zone.current;
    if (!el) return;
    etaitEnBas.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    const el = zone.current;
    if (el && etaitEnBas.current) el.scrollTop = el.scrollHeight;
  }, [corbeaux.length]);

  // ── Le rafraîchissement ──
  const recharger = useCallback(async () => {
    if (!conversationId) return;
    noterPosition();
    const reponse = await fetch(`/api/corbeaux/${conversationId}`, {
      cache: "no-store",
    });
    if (!reponse.ok) return;
    setFil(await reponse.json());
  }, [conversationId, noterPosition]);

  useRafraichissement(recharger);

  // ── « J’ai lu » ──
  // Une fois à l’ouverture, et à chaque arrivée : c’est ce qui éteint la
  // pastille du bandeau sans attendre le rechargement de la page.
  useEffect(() => {
    if (!conversationId) return;
    // On prévient le bandeau une fois la lecture inscrite : sa pastille
    // s'éteint à l'instant, sans attendre le prochain tour de la minuterie.
    void fetch(`/api/corbeaux/${conversationId}/lu`, { method: "POST" }).then(
      () => signalerLectureCorbeaux(),
    );
  }, [conversationId, corbeaux.length]);

  // ── Le passé, en remontant ──
  async function chargerAncien() {
    const plusAncien = corbeaux[0];
    if (!conversationId || !plusAncien || chargementAncien) return;

    setChargementAncien(true);
    setErreur(null);
    try {
      const reponse = await fetch(
        `/api/corbeaux/${conversationId}?avant=${encodeURIComponent(plusAncien.id)}`,
        { cache: "no-store" },
      );
      if (!reponse.ok) throw new Error();
      const page = (await reponse.json()) as FilCharge;

      // Le point de lecture ne doit pas sauter : on retient la hauteur avant
      // d’insérer, et on la rend après.
      const el = zone.current;
      const hauteurAvant = el?.scrollHeight ?? 0;
      etaitEnBas.current = false;

      setFil((precedent) =>
        precedent
          ? {
              ...precedent,
              corbeaux: [...page.corbeaux, ...precedent.corbeaux],
              encoreAvant: page.encoreAvant,
            }
          : page,
      );

      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - hauteurAvant;
      });
    } catch {
      setErreur(t.erreurs.chargement);
    } finally {
      setChargementAncien(false);
    }
  }

  // ── L’envoi ──
  async function envoyer(corps: string): Promise<{ ok: boolean; message?: string }> {
    const reponse = await fetch("/api/corbeaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        "administration" in destinataire
          ? { administration: true, corps }
          : { destinataireId: destinataire.membreId, corps },
      ),
    });

    if (!reponse.ok) {
      const lu = (await reponse.json().catch(() => null)) as { erreur?: string } | null;
      return { ok: false, message: lu?.erreur ?? t.erreurs.envoiEchoue };
    }

    // Le corbeau est parti : on redescend, et on relit le fil.
    etaitEnBas.current = true;
    const { conversationId: idFil } = (await reponse.json()) as {
      conversationId: string;
    };

    const suite = await fetch(`/api/corbeaux/${idFil}`, { cache: "no-store" });
    if (suite.ok) setFil(await suite.json());

    return { ok: true };
  }

  return (
    <div className="flex min-h-[calc(100svh-7rem)] flex-col">
      {/* — L’en-tête du fil — */}
      <header className="flex items-center gap-4 border-b border-silver/12 pb-4">
        <Link
          href={ROUTES.corbeaux}
          className="shrink-0 font-display text-[0.66rem] uppercase tracking-[0.14em] text-silver transition-colors duration-300 hover:text-aurora-teal"
        >
          ← <span className="sr-only sm:not-sr-only">{t.fil.retour}</span>
        </Link>

        <BlasonCorrespondant correspondant={correspondant} />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[1.05rem] font-semibold tracking-[0.04em] text-parchment">
            {nom}
          </h1>
          {avecAdministration ? (
            <p className="mt-0.5 font-body text-xs italic leading-tight text-silver">
              {t.administration.aide}
            </p>
          ) : null}
        </div>

        {/* Bloquer se propose depuis la conversation, et pas ailleurs dans ce
            lot — la fiche publique d’un membre n’existe pas encore, elle
            viendra avec le Registre magique.

            Jamais sur le fil de l’administration : on ne bloque pas le staff.
            Ni sur un fil déjà clos, où le bouton n’aurait plus rien à faire.

            C’est un vrai bouton dans le flux, atteignable au clavier, qui ne
            dépend d’aucun survol. */}
        {correspondant && !avecAdministration && !close ? (
          <BoutonBloquer
            membreId={correspondant.id}
            nom={correspondant.prenomNom}
            onBloque={() => setVientDeBloquer(true)}
          />
        ) : null}
      </header>

      {/* — Le fil —
          `role="log"` + `aria-live="polite"` : ce qui arrive est annoncé, le
          focus ne bouge jamais. */}
      <div
        ref={zone}
        role="log"
        aria-live="polite"
        aria-label={t.fil.aria.replace("{nom}", nom)}
        className="flex-1 overflow-y-auto py-6"
      >
        {fil?.encoreAvant ? (
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={chargerAncien}
              disabled={chargementAncien}
              className="btn btn-ghost text-[0.62rem] disabled:opacity-50"
            >
              {t.fil.plusAncien}
            </button>
          </div>
        ) : corbeaux.length > 0 ? (
          <p className="mb-6 text-center font-body text-sm italic text-silver">
            {t.fil.debut}
          </p>
        ) : null}

        {erreur ? (
          <p role="alert" className="mb-4 text-center font-body text-sm text-ember">
            {erreur}
          </p>
        ) : null}

        <ol className="space-y-1">
          {corbeaux.map((corbeau, i) => (
            <Corbeau
              key={corbeau.id}
              corbeau={corbeau}
              // Le séparateur de journée n’apparaît qu’au changement de jour.
              nouvelleJournee={
                i === 0 || jourDe(corbeaux[i - 1].envoyeLe) !== jourDe(corbeau.envoyeLe)
              }
              // Le fil du staff ne se signale pas et ne se retire pas : ce
              // n’est pas une conversation entre joueurs.
              avecAdministration={avecAdministration}
              avecActions={!avecAdministration}
              onRetire={() => {
                signalerLectureCorbeaux();
                setFil((precedent) =>
                  precedent
                    ? {
                        ...precedent,
                        corbeaux: precedent.corbeaux.filter(
                          (c) => c.id !== corbeau.id,
                        ),
                      }
                    : precedent,
                );
              }}
            />
          ))}
        </ol>
      </div>

      {/* — Écrire — */}
      <div className="border-t border-silver/12 pt-4">
        {close ? (
          <p className="rounded-sm border border-silver/20 bg-mist/40 px-4 py-3 font-body text-sm leading-relaxed text-parchment-dim">
            {t.erreurs.conversationClose}
          </p>
        ) : (
          <ChampCorbeau onEnvoyer={envoyer} />
        )}
      </div>
    </div>
  );
}

/**
 * Un corbeau dans le fil.
 *
 * Le texte est rendu par React, donc **échappé d’office** : aucune balise,
 * aucun lien cliquable, rien qui vienne du texte d’un joueur ne s’exécute.
 * Les retours à la ligne sont conservés par `whitespace-pre-wrap`, et non par
 * une conversion en `<br>` — qui supposerait d’assembler du HTML à la main,
 * c’est-à-dire exactement ce qu’on veut éviter.
 */
function Corbeau({
  corbeau,
  nouvelleJournee,
  avecAdministration,
  avecActions,
  onRetire,
}: {
  corbeau: CorbeauAffiche;
  nouvelleJournee: boolean;
  /** Le fil du château : un corbeau sans auteur y vient de lui, pas d’un absent. */
  avecAdministration: boolean;
  avecActions: boolean;
  onRetire: () => void;
}) {
  return (
    <>
      {nouvelleJournee ? (
        <li className="py-4 text-center">
          <span
            suppressHydrationWarning
            className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-silver"
          >
            {journeeDe(corbeau.envoyeLe)}
          </span>
        </li>
      ) : null}

      <li className={`group flex ${corbeau.deMoi ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[min(42rem,85%)] rounded-sm border px-4 py-3 ${
            corbeau.deMoi
              ? "border-aurora-teal/25 bg-aurora-teal/[0.07]"
              : "border-silver/15 bg-mist/40"
          }`}
        >
          {/* Le nom n’est répété que sur les corbeaux reçus : sur les siens,
              il n’apprendrait rien. */}
          {!corbeau.deMoi ? (
            <p className="font-display text-[0.62rem] uppercase tracking-[0.14em] text-silver">
              {/* Un corbeau sans auteur veut dire deux choses opposées selon
                  le fil : dans le courrier du château, c’est lui qui parle —
                  la zone d’administration n’a pas de comptes, il n’y a
                  personne d’autre à nommer. Ailleurs, c’est un membre qui
                  s’en est allé. Écrire « Un membre qui n’est plus là » sous
                  la réponse de l’administration serait absurde. */}
              {corbeau.auteur?.prenomNom ??
                (avecAdministration
                  ? TEXTES_CORBEAUX.administration.nom
                  : TEXTES_CORBEAUX.fil.auteurDisparu)}
            </p>
          ) : null}

          <p className="mt-1 whitespace-pre-wrap break-words font-body leading-[1.7] text-parchment">
            {corbeau.corps}
          </p>

          <time
            dateTime={corbeau.envoyeLe}
            suppressHydrationWarning
            className="mt-1.5 block text-right font-display text-[0.58rem] uppercase tracking-[0.1em] text-silver"
          >
            {heureDe(corbeau.envoyeLe)}
          </time>

          {avecActions ? (
            <ActionsCorbeau
              corbeauId={corbeau.id}
              deMoi={corbeau.deMoi}
              onRetire={onRetire}
            />
          ) : null}
        </div>
      </li>
    </>
  );
}
