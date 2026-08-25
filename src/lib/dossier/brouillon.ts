"use client";

/**
 * Brouillon du dossier, conservé dans le navigateur avant l’envoi.
 *
 * La biographie fait 700 signes minimum : personne ne doit perdre son texte
 * sur un rechargement. Sauvegarde différée pour ne pas écrire à chaque frappe.
 */

const CLE_BROUILLON = "ravenshallow:dossier:brouillon";
const CLE_REGLEMENT = "ravenshallow:reglement:accepte-le";
const DELAI_ECRITURE = 600;

/** Champs jamais conservés en clair dans le navigateur. */
const CHAMPS_EXCLUS = ["motDePasse", "confirmation"] as const;

function disponible(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function lireBrouillon(): Record<string, unknown> | null {
  if (!disponible()) return null;
  try {
    const brut = window.localStorage.getItem(CLE_BROUILLON);
    if (!brut) return null;
    const valeur: unknown = JSON.parse(brut);
    return valeur && typeof valeur === "object"
      ? (valeur as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function effacerBrouillon(): void {
  if (!disponible()) return;
  try {
    window.localStorage.removeItem(CLE_BROUILLON);
  } catch {
    // Rien à faire : le brouillon n’est qu’un confort.
  }
}

let minuterie: ReturnType<typeof setTimeout> | null = null;

/**
 * Enregistre le brouillon après un court délai d’inactivité.
 * `onEnregistre` sert à afficher la mention « brouillon enregistré ».
 */
export function enregistrerBrouillon(
  valeurs: Record<string, unknown>,
  onEnregistre?: () => void,
): void {
  if (!disponible()) return;
  if (minuterie) clearTimeout(minuterie);

  minuterie = setTimeout(() => {
    const aConserver: Record<string, unknown> = {};
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (!CHAMPS_EXCLUS.includes(cle as (typeof CHAMPS_EXCLUS)[number])) {
        aConserver[cle] = valeur;
      }
    }

    try {
      window.localStorage.setItem(CLE_BROUILLON, JSON.stringify(aConserver));
      onEnregistre?.();
    } catch {
      // Quota dépassé — le portrait est de loin le plus lourd.
      // Le texte prime : on retente sans lui.
      try {
        const { portrait: _portrait, ...sansPortrait } = aConserver;
        window.localStorage.setItem(
          CLE_BROUILLON,
          JSON.stringify(sansPortrait),
        );
        onEnregistre?.();
      } catch {
        // Tant pis : la saisie reste à l’écran, elle n’est simplement pas
        // conservée d’un rechargement à l’autre.
      }
    }
  }, DELAI_ECRITURE);
}

// ── Acceptation du règlement ──────────────────────────────────

/** Posé par la case « Lu et approuvé » de la page /reglement. */
export function marquerReglementAccepte(): string {
  const horodatage = new Date().toISOString();
  if (!disponible()) return horodatage;
  try {
    window.localStorage.setItem(CLE_REGLEMENT, horodatage);
  } catch {
    // Sans stockage, le dossier redemandera l’approbation.
  }
  return horodatage;
}

export function lireReglementAccepte(): string | null {
  if (!disponible()) return null;
  try {
    const valeur = window.localStorage.getItem(CLE_REGLEMENT);
    if (!valeur) return null;
    return Number.isNaN(Date.parse(valeur)) ? null : valeur;
  } catch {
    return null;
  }
}

// ── État du dossier renvoyé par l’administration ──────────────
//
// En attendant la session : le joueur connecté lira son statut depuis la
// base. D’ici là, l’état est conservé localement pour que l’écran
// « à corriger » soit accessible et testable.

const CLE_ETAT = "ravenshallow:dossier:etat";

export type EtatLocal = {
  statut: "EN_ATTENTE" | "A_CORRIGER" | "ACCEPTE" | "REFUSE";
  noteAdmin: string | null;
};

export function lireEtatDossier(): EtatLocal | null {
  if (!disponible()) return null;
  try {
    const brut = window.localStorage.getItem(CLE_ETAT);
    if (!brut) return null;
    const valeur = JSON.parse(brut) as EtatLocal;
    return valeur?.statut ? valeur : null;
  } catch {
    return null;
  }
}

export function ecrireEtatDossier(etat: EtatLocal | null): void {
  if (!disponible()) return;
  try {
    if (etat) {
      window.localStorage.setItem(CLE_ETAT, JSON.stringify(etat));
    } else {
      window.localStorage.removeItem(CLE_ETAT);
    }
  } catch {
    // Sans stockage, le joueur retombe simplement sur le formulaire.
  }
}
