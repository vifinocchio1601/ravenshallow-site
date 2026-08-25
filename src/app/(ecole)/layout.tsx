import MenuParchemin from "@/components/ecole/MenuParchemin";
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
      <MenuParchemin prenomNom={compte.prenomNom} maison={compte.maison} />
      {children}
    </div>
  );
}
