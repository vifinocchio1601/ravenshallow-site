"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRafraichissement } from "@/components/corbeaux/useRafraichissement";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import { MESSAGE_MAX, RAFRAICHISSEMENT_MS } from "@/lib/salon/limites";
import { validerMessage } from "@/lib/salon/schema";
import type { MessageAffiche } from "@/lib/salon/depot";

/**
 * **Le salon d'une maison** — la salle commune, en direct.
 *
 * Le direct n'existe pas sur cette architecture : Vercel n'ouvre pas de
 * connexions permanentes. On interroge donc toutes les quelques secondes, par
 * `useRafraichissement` — celui de la Tour aux Corbeaux, qui **s'arrête quand
 * l'onglet est caché**, rattrape au retour, et n'appelle jamais deux fois en
 * même temps. Un salon laissé ouvert toute la journée ne réveille pas la base
 * pour rien.
 *
 * ⚠️ **Le rafraîchissement rapporte aussi les RETRAITS.** Sans eux, un message
 * décroché par un préfet resterait à l'écran de tous les autres jusqu'au
 * prochain chargement, et la pièce dirait deux choses selon qui regarde.
 *
 * **On ne descend qu'à qui était déjà en bas.** Quelqu'un qui remonte relire
 * un échange ne doit pas se faire arracher sa lecture par l'arrivée d'un
 * message : c'est la règle de tous les salons, et son absence les rend
 * insupportables.
 */
export default function Salon({
  messagesInitiaux,
  jusqua,
  moiId,
  peutFaireLeMenage,
}: {
  messagesInitiaux: MessageAffiche[];
  /** L'instant du serveur au chargement : le premier « depuis » du tour suivant. */
  jusqua: string;
  moiId: string | null;
  peutFaireLeMenage: boolean;
}) {
  const t = TEXTES_SALON;
  const [messages, setMessages] = useState(messagesInitiaux);
  const [depuis, setDepuis] = useState(jusqua);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const fil = useRef<HTMLOListElement>(null);
  const idChamp = useId();
  const idAide = useId();
  const idErreur = useId();

  const verdict = validerMessage(texte);
  const restants = MESSAGE_MAX - texte.trim().length;

  /** Le lecteur est-il collé au bas ? À trente pixels près : on ne vise pas. */
  const enBas = () => {
    const e = fil.current;
    if (!e) return true;
    return e.scrollHeight - e.scrollTop - e.clientHeight < 30;
  };

  const descendre = useCallback(() => {
    const e = fil.current;
    if (e) e.scrollTop = e.scrollHeight;
  }, []);

  // À l'ouverture, on est en bas de la conversation — c'est là qu'elle en est.
  useEffect(descendre, [descendre]);

  const rafraichir = useCallback(async () => {
    const collé = enBas();
    const reponse = await fetch(
      `/api/maison/salon?depuis=${encodeURIComponent(depuis)}`,
      { cache: "no-store" },
    );
    if (!reponse.ok) return;
    const donnees: {
      messages: MessageAffiche[];
      retires: string[];
      jusqua: string;
    } = await reponse.json();

    setDepuis(donnees.jusqua);
    if (donnees.messages.length === 0 && donnees.retires.length === 0) return;

    setMessages((avant) => {
      const retires = new Set(donnees.retires);
      const connus = new Set(avant.map((m) => m.id));
      return [
        ...avant.filter((m) => !retires.has(m.id)),
        // Un message qu'on a déjà — celui qu'on vient d'envoyer soi-même —
        // ne doit pas apparaître deux fois.
        ...donnees.messages.filter(
          (m) => !connus.has(m.id) && !retires.has(m.id),
        ),
      ];
    });

    if (collé) requestAnimationFrame(descendre);
  }, [depuis, descendre]);

  useRafraichissement(rafraichir, RAFRAICHISSEMENT_MS);

  async function envoyer() {
    if (envoi || !verdict.ok) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/maison/salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corps: texte }),
      });
      const donnees = await reponse.json().catch(() => ({}));

      if (!reponse.ok) {
        // 429 comme 422 : on affiche la phrase du serveur, qui dit combien de
        // secondes il reste. Elle est plus juste que tout ce qu'on devinerait.
        setErreur(donnees.erreur ?? t.erreurs.reseau);
        return;
      }

      setTexte("");
      setMessages((avant) => [...avant, donnees.message]);
      requestAnimationFrame(descendre);
    } catch {
      setErreur(t.erreurs.reseau);
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer(id: string) {
    const reponse = await fetch("/api/maison/salon", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!reponse.ok) return;
    setMessages((avant) => avant.filter((m) => m.id !== id));
  }

  return (
    <div className="salon">
      <ol
        ref={fil}
        className="salon__fil"
        aria-label={t.ariaFil}
        // La pièce est vivante : un lecteur d'écran doit apprendre ce qui
        // arrive, sans qu'on lui déplace le focus.
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <li className="salon__vide">{t.vide}</li>
        ) : (
          messages.map((message) => (
            <li key={message.id} className="salon__message">
              <p className="salon__entete">
                <span className="salon__nom">
                  {message.auteurNom ?? t.auteurParti}
                </span>
                {message.auteurPlace ? (
                  <span className="salon__place">{message.auteurPlace}</span>
                ) : null}
                {/* L'instant voyage en ISO ; c'est le navigateur qui met en
                    forme, la seule juste pour qui lit — le serveur vit en UTC. */}
                <time
                  dateTime={message.ecritLe}
                  suppressHydrationWarning
                  className="salon__heure"
                >
                  {aLHeure(message.ecritLe)}
                </time>

                {peutFaireLeMenage ||
                (moiId !== null && message.auteurId === moiId) ? (
                  <button
                    type="button"
                    onClick={() => void retirer(message.id)}
                    aria-label={t.retirer.aria.replace(
                      "{qui}",
                      message.auteurNom ?? t.auteurParti,
                    )}
                    title={t.retirer.aide}
                    className="salon__retirer"
                  >
                    {t.retirer.libelle}
                  </button>
                ) : null}
              </p>

              {/* `whitespace-pre-wrap` et jamais une conversion en `<br>` :
                  celle-ci obligerait à assembler du HTML à la main. Le choix
                  de la Tour aux Corbeaux. */}
              <p className="salon__corps">{message.corps}</p>
            </li>
          ))
        )}
      </ol>

      <div className="salon__saisie">
        <label htmlFor={idChamp} className="sr-only">
          {t.champ.libelle}
        </label>
        <textarea
          id={idChamp}
          rows={2}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            // Entrée envoie, Maj+Entrée va à la ligne : la convention de tous
            // les salons. Le contraire de `ChampCorbeau`, où l'on écrit long
            // et où c'est Ctrl+Entrée qui envoie.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void envoyer();
            }
          }}
          aria-describedby={erreur ? `${idAide} ${idErreur}` : idAide}
          aria-invalid={erreur ? true : undefined}
          placeholder={t.champ.libelle}
          className="salon__champ"
        />

        <p id={idAide} className="salon__aide" aria-live="polite">
          {texte.trim().length === 0
            ? t.champ.aide.replace("{max}", String(MESSAGE_MAX))
            : restants === 1
              ? t.champ.restantUn
              : t.champ.restant.replace("{n}", String(restants))}
        </p>

        {erreur ? (
          <p id={idErreur} role="alert" className="salon__erreur">
            {erreur}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void envoyer()}
          disabled={envoi || !verdict.ok}
          className="btn btn-ghost mt-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.champ.envoyer}
        </button>
      </div>
    </div>
  );
}

/** « 14:32 » — l'heure du lecteur, jamais celle du serveur. */
function aLHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
