"use client";

import { useState } from "react";
import { TEXTES_ETATS } from "@/lib/dossier/etats";
import { ROUTES } from "@/lib/ecole/menu";

/**
 * Déconnexion.
 *
 * Un bouton, pas un lien : se déconnecter change l’état du serveur, et un
 * lien serait suivi par les préchargements du navigateur.
 */
export default function BoutonDeconnexion({
  className = "btn btn-ghost",
}: {
  className?: string;
}) {
  const [enCours, setEnCours] = useState(false);

  async function partir() {
    if (enCours) return;
    setEnCours(true);
    try {
      await fetch("/api/deconnexion", { method: "POST" });
    } catch {
      // Même en cas de coupure : on renvoie à l’accueil, le cookie mourra
      // de lui-même à son expiration.
    }
    window.location.assign(ROUTES.accueil);
  }

  return (
    <button type="button" onClick={partir} disabled={enCours} className={className}>
      {TEXTES_ETATS.pages.deconnexion}
    </button>
  );
}
