import { NextResponse } from "next/server";
import { aUneMaison } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { peutEcrireLesAnnoncesDe } from "@/lib/forum/pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import {
  lireLeSalon,
  nouveautesDuSalon,
  parlerAuSalon,
  retirerDuSalon,
} from "@/lib/salon/depot";
import { libellePlace, type Maison } from "@/lib/dossier/etats";

/**
 * Le salon d'une maison : ce qui s'y dit, et ce qu'on y dit.
 *
 * **Les gardes sont refaites ici en entier**, sans se reposer sur la page :
 * une route d'API est publique, et rien n'oblige un joueur à passer par
 * `/maison/salon` avant de l'appeler. Même discipline que la Tour, la
 * boutique et le Miroir.
 *
 *   401 — pas de session
 *   403 — le salon ne s'ouvre pas à ce compte
 *   422 — le message est vide, ou trop long
 *   **429 — pas si vite**, et le délai est donné en clair
 *
 * ⚠️ **429 et 403 ne disent pas la même chose**, et les confondre ferait lire
 * « vous n'avez pas le droit » à quelqu'un qui a seulement parlé trop vite.
 * Un message refusé ne partira jamais ; celui-là partira dans trois secondes.
 *
 * ⚠️ **La maison ne vient jamais de la requête.** Elle est relue sur la fiche
 * du compte : la recevoir en paramètre laisserait lire et écrire dans le salon
 * d'une autre maison en changeant une valeur.
 */

export const dynamic = "force-dynamic";

/** Ce que toute requête doit établir avant de toucher à la pièce. */
type DansLaPiece =
  | { ok: false; code: 401 | 403 }
  | {
      ok: true;
      eleveId: string;
      maison: Maison;
      nom: string;
      place: string;
      peutFaireLeMenage: boolean;
    };

async function danslaPiece(): Promise<DansLaPiece> {
  const compte = await compteConnecte();
  if (!compte) return { ok: false, code: 401 };
  if (!compte.eleveId || !aUneMaison(compte)) return { ok: false, code: 403 };

  const maison = (compte.maison ?? null) as Maison | null;
  if (!maison) return { ok: false, code: 403 };

  const pouvoirs = await pouvoirsDe(compte.id);
  return {
    ok: true,
    eleveId: compte.eleveId,
    maison,
    nom: compte.prenomNom,
    place: libellePlace(compte.fonction, compte.roleAffiche),
    // Le même partage que le tableau d'affichage : préfets et staff tiennent
    // la pièce, chacun retire toujours le sien.
    peutFaireLeMenage: peutEcrireLesAnnoncesDe(pouvoirs, maison),
  };
}

function refus(code: 401 | 403) {
  const erreur =
    code === 401 ? "Session absente." : TEXTES_SALON.erreurs.pasLeDroit;
  return NextResponse.json({ erreur }, { status: code });
}

/**
 * Lire la pièce.
 *
 * Sans `depuis`, on entre : les derniers messages. Avec, c'est le
 * rafraîchissement — et il rapporte aussi **les retraits**, sans quoi un
 * message décroché resterait à l'écran des autres.
 */
export async function GET(requete: Request) {
  const dans = await danslaPiece();
  if (!dans.ok) return refus(dans.code);

  const brut = new URL(requete.url).searchParams.get("depuis");
  if (!brut) {
    const messages = await lireLeSalon(dans.maison);
    return NextResponse.json({
      messages,
      retires: [],
      jusqua: new Date().toISOString(),
      peutFaireLeMenage: dans.peutFaireLeMenage,
      moiId: dans.eleveId,
    });
  }

  const depuis = new Date(brut);
  // Une date illisible ne doit pas tout renvoyer : on repart de l'instant
  // présent plutôt que de recopier la pièce entière à chaque tour.
  const instant = Number.isNaN(depuis.getTime()) ? new Date() : depuis;

  const nouveautes = await nouveautesDuSalon(dans.maison, instant);
  return NextResponse.json(nouveautes);
}

/** Parler. */
export async function POST(requete: Request) {
  const dans = await danslaPiece();
  if (!dans.ok) return refus(dans.code);

  const charge = await requete.json().catch(() => ({}));
  const resultat = await parlerAuSalon({
    maison: dans.maison,
    auteurId: dans.eleveId,
    corps: (charge as { corps?: unknown }).corps,
    aLeDroit: true,
  });

  if (resultat.sort === "ATTENDRE") {
    const t = TEXTES_SALON.erreurs;
    return NextResponse.json(
      {
        erreur:
          resultat.secondes === 1
            ? t.tropViteUne
            : t.tropVite.replace("{n}", String(resultat.secondes)),
        secondes: resultat.secondes,
      },
      { status: 429 },
    );
  }

  if (resultat.sort === "REFUSE") {
    return NextResponse.json({ erreur: resultat.raison }, { status: 422 });
  }

  return NextResponse.json({ message: resultat.message }, { status: 201 });
}

/**
 * Retirer un message.
 *
 * `POST` sur une adresse de retrait plutôt qu'un `DELETE` : **rien n'est
 * effacé**, le message sort de la pièce et reste en base. Un verbe qui
 * promettrait une suppression mentirait sur ce qui se passe — le choix des
 * masquages de la Tour.
 */
export async function PATCH(requete: Request) {
  const dans = await danslaPiece();
  if (!dans.ok) return refus(dans.code);

  const charge = await requete.json().catch(() => ({}));
  const id = String((charge as { id?: unknown }).id ?? "");
  if (!id) {
    return NextResponse.json(
      { erreur: TEXTES_SALON.erreurs.introuvable },
      { status: 422 },
    );
  }

  const resultat = await retirerDuSalon({
    id,
    maison: dans.maison,
    parId: dans.eleveId,
    parNom: dans.nom,
    peutFaireLeMenage: dans.peutFaireLeMenage,
  });

  if (!resultat.ok) {
    return NextResponse.json({ erreur: resultat.message }, { status: 403 });
  }
  return NextResponse.json({ retire: id });
}
