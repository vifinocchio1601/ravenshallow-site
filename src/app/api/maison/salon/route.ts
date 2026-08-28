import { NextResponse } from "next/server";
import { aUneMaison } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import {
  peutEcrireLesAnnoncesDe,
  peutParlerDansLeSalonDe,
  peutVisiterLaMaison,
} from "@/lib/forum/pouvoirs";
import { TEXTES_SALON } from "@/lib/salon/constantes";
import {
  lireLeSalon,
  nouveautesDuSalon,
  parlerAuSalon,
  retirerDuSalon,
} from "@/lib/salon/depot";
import {
  libellePlace,
  maisonDepuisCle,
  type Maison,
} from "@/lib/dossier/etats";

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
 * ⚠️ **La maison vient de la requête, et le serveur vérifie qu'on a le droit
 * d'y être.** C'était l'inverse jusqu'au 28 août 2026 — elle était relue sur
 * la fiche —, et cela interdisait le salon d'une autre maison à tout le monde,
 * staff compris : une directrice n'a pas de maison, et n'atteignait donc aucun
 * salon. Le sens de la garde n'a pas changé : **c'est `peutVisiterLaMaison`
 * qui décide**, jamais le paramètre.
 *
 * ⚠️ **Et entrer ne donne pas la parole.** `peutParlerDansLeSalonDe` est une
 * seconde question : un professeur à qui l'on donne la lecture d'un dortoir y
 * lit sans y bavarder.
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
      peutParler: boolean;
      peutFaireLeMenage: boolean;
    };

async function danslaPiece(cle: unknown): Promise<DansLaPiece> {
  const visee = typeof cle === "string" ? maisonDepuisCle(cle) : null;
  if (!visee) return { ok: false, code: 403 };

  const compte = await compteConnecte();
  if (!compte) return { ok: false, code: 401 };
  if (!compte.eleveId) return { ok: false, code: 403 };

  const pouvoirs = await pouvoirsDe(compte.id);
  // Sa maison **au sens de l'affichage** : une directrice en `SANS_OBJET` n'en
  // a aucune, même si la colonne en garde une au chaud.
  const laSienne = aUneMaison(compte) ? ((compte.maison ?? null) as Maison) : null;

  if (!peutVisiterLaMaison(pouvoirs, laSienne, visee)) {
    return { ok: false, code: 403 };
  }

  return {
    ok: true,
    eleveId: compte.eleveId,
    maison: visee,
    nom: compte.prenomNom,
    place: libellePlace(compte.fonction, compte.roleAffiche),
    peutParler: peutParlerDansLeSalonDe(pouvoirs, laSienne, visee),
    // Le même partage que le tableau d'affichage : préfets et staff tiennent
    // la pièce, chacun retire toujours le sien.
    peutFaireLeMenage: peutEcrireLesAnnoncesDe(pouvoirs, visee),
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
  const parametres = new URL(requete.url).searchParams;
  const dans = await danslaPiece(parametres.get("maison"));
  if (!dans.ok) return refus(dans.code);

  const brut = parametres.get("depuis");
  if (!brut) {
    const messages = await lireLeSalon(dans.maison);
    return NextResponse.json({
      messages,
      retires: [],
      jusqua: new Date().toISOString(),
      peutParler: dans.peutParler,
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
  const charge = await requete.json().catch(() => ({}));
  const dans = await danslaPiece((charge as { maison?: unknown }).maison);
  if (!dans.ok) return refus(dans.code);

  const resultat = await parlerAuSalon({
    maison: dans.maison,
    auteurId: dans.eleveId,
    corps: (charge as { corps?: unknown }).corps,
    // **Entrer ne donne pas la parole.** Le champ est caché à qui ne l'a pas,
    // mais c'est ici que ça se refuse.
    aLeDroit: dans.peutParler,
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
  const charge = await requete.json().catch(() => ({}));
  const dans = await danslaPiece((charge as { maison?: unknown }).maison);
  if (!dans.ok) return refus(dans.code);

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
