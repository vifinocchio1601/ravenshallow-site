"use client";

import { useRef, useState } from "react";
import { deciderDossierAction } from "@/app/admin/actions";
import { TEXTES_ETATS } from "@/lib/dossier/etats";

/**
 * Les trois décisions sur un dossier.
 *
 * Le refus et le renvoi en correction exigent une note : le joueur ne verra
 * que ça. L’action serveur la réclame aussi — ce contrôle-ci n’est là que
 * pour le dire à l’administrateur au lieu de laisser le bouton muet.
 */
export default function FormulaireDecision({ id }: { id: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const t = TEXTES_ETATS.admin.actions;

  function verifier(decision: string) {
    if (decision === "ACCEPTER") {
      setErreur(null);
      return true;
    }
    if (!noteRef.current?.value.trim()) {
      setErreur(t.noteRequise);
      noteRef.current?.focus();
      return false;
    }
    setErreur(null);
    return true;
  }

  return (
    <form
      action={deciderDossierAction}
      className="mt-12 rounded-sm border border-silver/12 bg-mist/40 p-6 sm:p-8"
    >
      <input type="hidden" name="id" value={id} />

      <label
        htmlFor="note"
        className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-parchment-dim"
      >
        {t.note}
      </label>
      <textarea
        id="note"
        name="note"
        ref={noteRef}
        rows={4}
        placeholder={t.notePlaceholder}
        aria-describedby="note-aide"
        aria-invalid={erreur ? true : undefined}
        onChange={() => erreur && setErreur(null)}
        className="mt-3 w-full resize-y rounded-sm border border-silver/25 bg-mist/60 px-4 py-3 font-body text-base leading-[1.7] text-parchment placeholder:italic placeholder:text-silver/50 transition-colors duration-300 hover:border-silver/40 focus:border-aurora-teal/70"
      />

      <p
        id="note-aide"
        role={erreur ? "alert" : undefined}
        aria-live="polite"
        className={`mt-2 font-body text-sm ${
          erreur ? "not-italic text-ember" : "italic text-silver"
        }`}
      >
        {erreur ?? t.noteRequise}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="ACCEPTER"
          onClick={() => verifier("ACCEPTER")}
          className="btn btn-solid"
        >
          {t.accepter}
        </button>
        <button
          type="submit"
          name="decision"
          value="CORRIGER"
          onClick={(e) => {
            if (!verifier("CORRIGER")) e.preventDefault();
          }}
          className="btn btn-ghost"
        >
          {t.corriger}
        </button>
        <button
          type="submit"
          name="decision"
          value="REFUSER"
          onClick={(e) => {
            if (!verifier("REFUSER")) e.preventDefault();
          }}
          className="btn btn-ghost border-ember/40 text-ember hover:border-ember hover:text-ember"
        >
          {t.refuser}
        </button>
      </div>
    </form>
  );
}
