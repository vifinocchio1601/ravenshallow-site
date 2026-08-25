import MenuParchemin from "@/components/ecole/MenuParchemin";
import { blasonAffiche, mentionMaison } from "@/lib/ecole/blasons";
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
      />
      {children}
    </div>
  );
}
