/**
 * Gabarit commun des pages de l’école.
 *
 * Il accueillera le bandeau-parchemin au lot suivant. La garde, elle, reste
 * dans chaque page : un gabarit d’App Router ne connaît pas le chemin
 * demandé, et c’est justement le chemin qui décide — un membre suspendu
 * garde son bureau et sa fiche, pas les cours.
 */
export default function EcoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[100svh] bg-void">{children}</div>;
}
