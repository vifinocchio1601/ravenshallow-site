"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";
import { MOTIF_MAX } from "@/lib/corbeaux/schema";

/**
 * Ce qu’on peut faire d’un corbeau : le signaler, le retirer de sa vue.
 *
 * ── Deux gestes, côte à côte, et jamais l’un dans l’autre ──
 *
 * Signaler ne bloque pas. Bloquer ne signale pas. Chacun des deux dialogues
 * le redit à celui qui hésite, parce que c’est précisément le moment où l’on
 * croit qu’un geste suffit — et où quelqu’un finit par ne rien faire du tout,
 * persuadé d’avoir agi.
 *
 * ── Atteignables sans souris ──
 *
 * Ce sont deux vrais `<button>` dans le flux du document, **jamais des icônes
 * qui apparaissent au survol**. Ils sont dans l’ordre de tabulation, lisibles
 * par un lecteur d’écran, et utilisables sur un écran tactile où le survol
 * n’existe pas. Ils s’effacent visuellement au repos et reviennent au focus
 * comme au survol — mais ils sont toujours là.
 */
export default function ActionsCorbeau({
  corbeauId,
  deMoi,
  onRetire,
}: {
  corbeauId: string;
  /** Un corbeau qu’on a écrit soi-même ne se signale pas. */
  deMoi: boolean;
  /** Prévient le fil : la bulle disparaît sans attendre un rechargement. */
  onRetire: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-end gap-4 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
      {!deMoi ? <BoutonSignaler corbeauId={corbeauId} /> : null}
      <BoutonRetirer corbeauId={corbeauId} onRetire={onRetire} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Signaler
// ─────────────────────────────────────────────────────────────

function BoutonSignaler({ corbeauId }: { corbeauId: string }) {
  const titreId = useId();
  const motifId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);
  const t = TEXTES_CORBEAUX.signaler;

  useEffect(() => {
    const el = dialogue.current;
    if (!el) return;
    if (ouvert && !el.open) {
      el.showModal();
      annuler.current?.focus();
    } else if (!ouvert && el.open) {
      el.close();
    }
  }, [ouvert]);

  async function confirmer() {
    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch("/api/corbeaux/signalements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: corbeauId, motif }),
    });

    setEnvoi(false);

    if (!reponse.ok) {
      const lu = (await reponse.json().catch(() => null)) as {
        erreur?: string;
      } | null;
      setErreur(lu?.erreur ?? t.echec);
      return;
    }

    setOuvert(false);
    setFait(true);
  }

  // Une fois signalé, le bouton cède la place à un accusé de réception. Le
  // proposer à nouveau inviterait à signaler deux fois le même corbeau.
  if (fait) {
    return (
      <span
        role="status"
        className="font-display text-[0.58rem] uppercase tracking-[0.12em] text-aurora-teal"
      >
        {t.fait}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={t.actionAria}
        className="font-display text-[0.58rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-ember"
      >
        {t.action}
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={titreId}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-sm border border-silver/30 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <h2
            id={titreId}
            className="font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre}
          </h2>

          {/* Ce que la modération verra — dit AVANT d’envoyer. Quelqu’un qui
              signale doit savoir quelle part de sa conversation part avec. */}
          <p className="mt-4 font-body leading-[1.7] text-parchment-dim">
            {t.cequeVoitLaModeration}
          </p>
          <p className="mt-3 font-body text-sm italic leading-relaxed text-silver">
            {t.confidentiel}
          </p>

          <div className="mt-5">
            <label
              htmlFor={motifId}
              className="font-display text-[0.66rem] uppercase tracking-[0.14em] text-parchment-dim"
            >
              {t.motif}
            </label>
            <textarea
              id={motifId}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              maxLength={MOTIF_MAX}
              placeholder={t.motifInvite}
              className="mt-2 w-full resize-y rounded-sm border border-silver/25 bg-mist/50 px-3 py-2 font-body text-base leading-[1.6] text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
            />
            <p className="mt-1 font-body text-xs italic text-silver">
              {t.motifAide}
            </p>
          </div>

          <p className="mt-5 border-t border-silver/15 pt-4 font-body text-sm italic leading-relaxed text-silver">
            {t.etBloquer}
          </p>

          <p role="alert" className="mt-2 min-h-[1.25rem] font-body text-sm text-ember">
            {erreur ?? ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              ref={annuler}
              onClick={() => setOuvert(false)}
              className="btn btn-ghost px-5 tracking-[0.12em]"
            >
              {t.annuler}
            </button>
            <button
              type="button"
              onClick={confirmer}
              disabled={envoi}
              className="btn btn-ghost border-aurora-teal/50 px-5 tracking-[0.12em] text-parchment disabled:opacity-50"
            >
              {t.confirmer}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Retirer de sa vue
// ─────────────────────────────────────────────────────────────

function BoutonRetirer({
  corbeauId,
  onRetire,
}: {
  corbeauId: string;
  onRetire: () => void;
}) {
  const titreId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);
  const t = TEXTES_CORBEAUX.supprimer;

  useEffect(() => {
    const el = dialogue.current;
    if (!el) return;
    if (ouvert && !el.open) {
      el.showModal();
      annuler.current?.focus();
    } else if (!ouvert && el.open) {
      el.close();
    }
  }, [ouvert]);

  async function confirmer() {
    setEnvoi(true);
    setErreur(null);

    const reponse = await fetch("/api/corbeaux/masquages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: corbeauId }),
    });

    setEnvoi(false);

    if (!reponse.ok) {
      setErreur(TEXTES_CORBEAUX.erreurs.envoiEchoue);
      return;
    }

    setOuvert(false);
    onRetire();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="font-display text-[0.58rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-parchment"
      >
        {t.action}
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onCancel={() => setOuvert(false)}
        aria-labelledby={titreId}
        className="w-[min(32rem,calc(100vw-2rem))] rounded-sm border border-silver/30 bg-fjord p-0 text-parchment backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 sm:p-8">
          <h2
            id={titreId}
            className="font-display text-xl font-semibold tracking-[0.03em] text-parchment"
          >
            {t.titre}
          </h2>

          {/* **La phrase la plus importante de tout le lot.**
              Elle est dite au moment du geste, et sans détour : ce qui part
              part de chez soi, et de chez soi seulement. Quelqu’un qui croirait
              avoir effacé des deux côtés se tromperait sur ce que le site
              vient de faire. */}
          <p className="mt-4 font-body leading-[1.7] text-parchment-dim">
            {t.avertissement}
          </p>

          <p role="alert" className="mt-2 min-h-[1.25rem] font-body text-sm text-ember">
            {erreur ?? ""}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              ref={annuler}
              onClick={() => setOuvert(false)}
              className="btn btn-ghost px-5 tracking-[0.12em]"
            >
              {t.annuler}
            </button>
            <button
              type="button"
              onClick={confirmer}
              disabled={envoi}
              className="btn btn-ghost px-5 tracking-[0.12em] disabled:opacity-50"
            >
              {t.confirmer}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
