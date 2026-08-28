"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEXTES_REGISTRE } from "@/lib/registre/constantes";

/**
 * **Bloquer quelqu'un depuis sa fiche.**
 *
 * C'est le second endroit d'où l'on bloque, après la conversation elle-même —
 * et c'était la raison d'être annoncée du Registre. La route est celle de la
 * Tour, inchangée : `/api/corbeaux/blocages`.
 *
 * ⚠️ **L'écran doit dire ce que le geste fait, au moment du geste.** Bloquer
 * n'avertit pas la personne bloquée : ses corbeaux partiront et n'arriveront
 * pas. C'est la mesure de protection elle-même — un refus explicite
 * déclencherait l'escalade —, et c'est aussi ce qui oblige à l'expliquer à
 * celui qui bloque, faute de quoi il croirait avoir prévenu.
 *
 * **Débloquer ne ramène rien** : ce qui est parti dans le vide a été masqué à
 * l'arrivée, et le reste.
 */
export default function BoutonBloquer({
  compteId,
  nom,
  dejaBloque,
}: {
  /** L'identifiant du COMPTE : on bloque un joueur, pas une fiche. */
  compteId: string;
  nom: string;
  dejaBloque: boolean;
}) {
  const router = useRouter();
  const t = TEXTES_REGISTRE.actions;
  const [bloque, setBloque] = useState(dejaBloque);
  const [envoi, setEnvoi] = useState(false);

  async function basculer() {
    if (envoi) return;
    setEnvoi(true);
    try {
      const reponse = await fetch("/api/corbeaux/blocages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membreId: compteId,
          action: bloque ? "DEBLOQUER" : "BLOQUER",
        }),
      });
      if (!reponse.ok) return;
      const donnees: { bloque?: boolean } = await reponse.json();
      setBloque(donnees.bloque === true);
      // La liste des conversations et la pastille du bandeau changent avec le
      // blocage : les laisser périmées ferait croire à un geste sans effet.
      router.refresh();
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void basculer()}
        disabled={envoi}
        aria-label={(bloque ? t.debloquerAria : t.bloquerAria).replace(
          "{nom}",
          nom,
        )}
        className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bloque ? t.debloquer : t.bloquer}
      </button>
      <p className="mt-2 max-w-[46ch] font-body text-xs italic leading-relaxed text-silver">
        {bloque ? t.debloquerAide : t.bloquerAide}
      </p>
    </div>
  );
}
