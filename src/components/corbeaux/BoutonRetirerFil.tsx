"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { TEXTES_CORBEAUX } from "@/lib/corbeaux/constantes";

/**
 * **Retirer une conversation entière de sa vue.**
 *
 * Le geste existait côté serveur depuis l'ouverture de la Tour —
 * `retirerLeFilDeMaVue`, et la route `masquages` accepte déjà un
 * `conversationId` — mais **aucun écran ne l'appelait**. Il ne manquait que
 * ce bouton.
 *
 * ── Ce que la confirmation doit dire, et pourquoi elle existe ──
 *
 * Le mot « supprimer » promet plus que ce qui se passe. Ici, la copie de
 * l'autre reste intacte : c'est ce qui protège un membre harcelé dont
 * l'agresseur voudrait faire disparaître ses traces. **Quelqu'un qui croirait
 * avoir effacé des deux côtés se tromperait sur ce que le site vient de
 * faire** — d'où la phrase, au moment du geste, et pas dans une aide qu'on
 * irait chercher.
 *
 * Le fil **revient** si l'autre réécrit, vidé de ce qui précède. Sans ce
 * retour, on pourrait faire disparaître quelqu'un de sa boîte pour de bon, ce
 * qui serait un piège pour un membre harcelé qui ne verrait plus rien
 * arriver. La confirmation le dit aussi, mais après l'essentiel.
 *
 * ── L'accessibilité ──
 *
 * Un `<dialog>` natif : il piège le focus, se ferme par Échap et rend le
 * focus tout seul. Le focus va sur **Annuler** à l'ouverture — jamais sur le
 * bouton qui agit, où une touche Entrée de trop suffirait.
 *
 * Le nom du bouton porte celui du correspondant : dans une liste de trente
 * fils, « Retirer cette conversation » ne dit pas laquelle à qui écoute.
 */
export default function BoutonRetirerFil({
  conversationId,
  nom,
  onRetire,
  variante = "fil",
}: {
  conversationId: string;
  /** Le nom du correspondant, pour nommer le bouton. */
  nom: string;
  /** Appelé une fois le retrait accepté par le serveur. */
  onRetire: () => void;
  /** « liste » : une icône seule au bout d'une ligne. « fil » : un bouton. */
  variante?: "liste" | "fil";
}) {
  const titreId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const dialogue = useRef<HTMLDialogElement | null>(null);
  const annuler = useRef<HTMLButtonElement | null>(null);
  const t = TEXTES_CORBEAUX.supprimer;

  const nomDuBouton = t.conversationAria.replace("{nom}", nom);

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

    // La même route que le retrait d'un seul corbeau, et le même verbe : un
    // `POST` sur `masquages`. Un `DELETE` promettrait une suppression, et
    // mentirait sur ce qui se passe.
    const reponse = await fetch("/api/corbeaux/masquages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
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
        aria-label={nomDuBouton}
        title={nomDuBouton}
        className={
          variante === "liste"
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-silver transition-colors duration-300 hover:bg-mist/60 hover:text-parchment"
            : "shrink-0 font-display text-[0.62rem] uppercase tracking-[0.12em] text-silver transition-colors duration-300 hover:text-parchment"
        }
      >
        {variante === "liste" ? (
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        ) : (
          t.conversationCourt
        )}
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
            {t.conversationTitre}
          </h2>

          {/* **La phrase la plus importante de l'écran.** Dite au moment du
              geste, et sans détour : ce qui part part de chez soi, et de chez
              soi seulement. */}
          <p className="mt-4 font-body leading-[1.7] text-parchment-dim">
            {t.conversationAvertissement}
          </p>

          <p
            role="alert"
            className="mt-2 min-h-[1.25rem] font-body text-sm text-ember"
          >
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
              {t.conversation}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
