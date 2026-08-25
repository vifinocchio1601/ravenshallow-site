import { NextResponse } from "next/server";
import { enregistrerRepartition } from "@/lib/ceremonie/depot";
import { calculerRepartition } from "@/lib/ceremonie/repartition";
import { ROUTES } from "@/lib/ecole/menu";
import {
  doitPasserAKaldvik,
  doitPasserAuMiroir,
  estConcerneParLeMiroir,
  routeAutorisee,
} from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Ce que le Miroir répond.
 *
 * **Tout le calcul est ici, côté serveur.** Le navigateur n’envoie que cinq
 * identifiants de réponse ; il ne connaît ni les pondérations, ni le
 * départage, et il n’a aucun moyen de proposer une maison.
 *
 * Les gardes sont refaites en entier, sans se reposer sur la page : une route
 * d’API est publique, et rien n’oblige un joueur à passer par `/ceremonie`
 * avant de l’appeler.
 *
 *   401 — pas de session
 *   403 — dossier non accepté, accès suspendu, **compte non concerné**, ou
 *         **la baguette d’abord**
 *   409 — **déjà réparti** : la cérémonie ne se rejoue pas (art. 11.2)
 *   422 — cinq identifiants attendus, connus, et chacun de sa question
 */
export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  // Même table de vérité que la page : accepté, non suspendu.
  if (!routeAutorisee(compte, ROUTES.ceremonie) || !compte.eleveId) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  // La répartition ne concerne pas ce compte. Réponse distincte du rejeu :
  // « le Miroir a déjà parlé » serait faux pour une directrice qu’il n’a
  // jamais lue — et le dire lui indiquerait une maison qui n’existe pas.
  if (!estConcerneParLeMiroir(compte)) {
    return NextResponse.json(
      {
        erreur: "La répartition ne concerne pas ce compte.",
        destination: ROUTES.bureau,
      },
      { status: 403 },
    );
  }

  // La baguette d’abord. La page renvoie déjà à Kaldvik, mais une route
  // d’API est publique : refaire la garde ici est le seul moyen qu’elle
  // tienne pour de bon. Un compte que la boutique ne concerne pas n’y est
  // évidemment pas renvoyé — `doitPasserAKaldvik` le dit tout seul.
  if (doitPasserAKaldvik(compte)) {
    return NextResponse.json(
      { erreur: "La baguette d’abord.", destination: ROUTES.bjornstav },
      { status: 403 },
    );
  }

  // Premier verrou contre le rejeu. Le second est en base, dans la
  // transaction : celui-ci évite seulement d’y aller pour rien.
  if (!doitPasserAuMiroir(compte)) {
    return NextResponse.json(
      { erreur: "Le Miroir a déjà parlé.", destination: ROUTES.bureau },
      { status: 409 },
    );
  }

  let corps: { reponses?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const reponses = Array.isArray(corps.reponses) ? corps.reponses : [];
  const calcul = calculerRepartition(reponses);
  if (!calcul.valide) {
    return NextResponse.json(
      { erreur: "Réponses invalides.", raison: calcul.raison },
      { status: 422 },
    );
  }

  const { enregistree } = await enregistrerRepartition(
    compte.eleveId,
    reponses as string[],
    calcul.repartition,
  );

  // La base a refusé : une autre requête a écrit entre-temps. On ne renvoie
  // surtout pas la maison qu’on venait de calculer — elle n’est pas celle qui
  // a été retenue.
  if (!enregistree) {
    return NextResponse.json(
      { erreur: "Le Miroir a déjà parlé.", destination: ROUTES.bureau },
      { status: 409 },
    );
  }

  // Seule la maison repart. Ni les points, ni le départage : ils serviraient
  // à reconstituer le barème en rejouant la cérémonie avec plusieurs comptes.
  return NextResponse.json({ maison: calcul.repartition.maison });
}
