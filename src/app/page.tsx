import AdminLink from "@/components/AdminLink";
import FoundingSection from "@/components/FoundingSection";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HousesSection from "@/components/HousesSection";
import Nav from "@/components/Nav";
import WorldSection from "@/components/WorldSection";
import { destinationApres } from "@/lib/session/acces";
import { compteConnecte } from "@/lib/session/garde";

/**
 * L'accueil lit la session pour savoir laquelle des deux portes montrer :
 * il ne peut donc plus être rendu une fois pour toutes. Une requête indexée
 * par visite, contre une page juste pour chacun.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const compte = await compteConnecte();

  return (
    <>
      <Nav
        connecte={compte ? { destination: destinationApres(compte) } : null}
      />
      <main>
        <Hero />
        <WorldSection />
        <HousesSection />
        <FoundingSection />
      </main>
      <Footer />
      <AdminLink />
    </>
  );
}
