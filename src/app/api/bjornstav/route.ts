import { NextResponse } from "next/server";
import { inscrireBaguette } from "@/lib/bjornstav/depot";
import { assemblerDenouement, verifierCodes } from "@/lib/bjornstav/reaction";
import { ROUTES } from "@/lib/ecole/menu";
import { aChoisiSaBaguette, routeAutorisee } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * Ce que la baguette répond.
 *
 * **Tout l’assemblage est ici, côté serveur.** Le navigateur n’envoie que deux
 * codes ; il ne connaît aucune des vingt-cinq réactions, et n’a aucun moyen
 * d’en réclamer une autre que celle de la baguette qu’on vient de lui
 * inscrire.
 *
 * L’ordre importe : **on écrit d’abord, on raconte ensuite.** Si l’écriture
 * échoue, rien ne part — sans quoi un joueur pourrait lire sa réaction sans
 * que la baguette existe, et la relire différemment à l’essai suivant.
 *
 * Les gardes sont refaites en entier, sans se reposer sur la page : une route
 * d’API est publique, et rien n’oblige un joueur à passer par `/bjornstav`
 * avant de l’appeler.
 *
 *   401 — pas de session
 *   403 — dossier non accepté, ou accès suspendu
 *   409 — **une baguette est déjà posée** : le choix ne se rejoue pas
 *   422 — bois ou cœur inconnu de la liste
 */
export async function POST(request: Request) {
  const compte = await compteConnecte();
  if (!compte) {
    return NextResponse.json({ erreur: "Session absente." }, { status: 401 });
  }

  // Même table de vérité que la page : accepté, non suspendu.
  if (!routeAutorisee(compte, ROUTES.bjornstav) || !compte.eleveId) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  // Premier verrou contre le rejeu. Le deuxième est dans le `updateMany`, le
  // troisième dans la base : celui-ci évite seulement d’y aller pour rien.
  if (aChoisiSaBaguette(compte)) {
    return NextResponse.json(
      { erreur: "Votre baguette est déjà choisie.", destination: ROUTES.bureau },
      { status: 409 },
    );
  }

  let corps: { bois?: unknown; coeur?: unknown };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }

  const codes = verifierCodes(corps.bois, corps.coeur);
  if (!codes.valide) {
    return NextResponse.json(
      { erreur: "Baguette inconnue.", raison: codes.raison },
      { status: 422 },
    );
  }

  const { inscrite } = await inscrireBaguette(
    compte.eleveId,
    codes.bois,
    codes.coeur,
  );

  // La base a refusé : une autre requête a écrit entre-temps. On ne raconte
  // surtout pas la réaction qu’on venait d’assembler — ce n’est pas celle de
  // la baguette qui a été retenue.
  if (!inscrite) {
    return NextResponse.json(
      { erreur: "Votre baguette est déjà choisie.", destination: ROUTES.bureau },
      { status: 409 },
    );
  }

  // Seul le dénouement de CETTE baguette repart. Les vingt-quatre autres ne
  // traversent jamais.
  return NextResponse.json(assemblerDenouement(codes.bois, codes.coeur));
}
