import MenuParchemin from "@/components/ecole/MenuParchemin";
import { compterNonLus } from "@/lib/corbeaux/depot";
import { blasonAffiche, mentionMaison } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { entreesVisibles } from "@/lib/session/acces";
import { exigerConnexion } from "@/lib/session/garde";

/**
 * Gabarit commun des pages de l’école : le bandeau-parchemin, et rien d’autre.
 *
 * Il exige d’être connecté, sans plus : c’est chaque page qui vérifie le
 * droit d’ouvrir *son* chemin. Un gabarit d’App Router ne connaît pas l’URL
 * demandée, et c’est justement elle qui décide — un membre suspendu garde son
 * bureau et sa fiche, pas les cours.
 */
export default async function EcoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const compte = await exigerConnexion();

  // Les corbeaux non lus, relus à chaque page de l’école — c’est le prix d’un
  // compteur qui ne ment jamais. Une seule requête, et elle rend zéro sans
  // toucher la base pour un compte à qui la Tour est fermée.
  const nonLus = await compterNonLus(compte);

  return (
    <div className="min-h-[100svh] bg-void">
      {/* Le bandeau ne montre que ce que ce compte peut réellement ouvrir.
          Un lien qui renvoie ailleurs sans rien expliquer est pire que pas de
          lien du tout — et le nouvel arrivant a sa note pour savoir ce qui
          lui manque. */}
      {/* Le blason et la mention se décident ici, côté serveur : un compte
          que la répartition ne concerne pas porte celui de l’école, et rien
          n’est écrit sous son nom — surtout pas « Répartition à venir ». */}
      <MenuParchemin
        prenomNom={compte.prenomNom}
        blason={blasonAffiche(compte)}
        mention={mentionMaison(compte)}
        entrees={entreesVisibles(compte)}
        compteurs={{ [ROUTES.corbeaux]: nonLus }}
      />
      {children}
    </div>
  );
}
