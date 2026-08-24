import AdminLink from "@/components/AdminLink";
import FoundingSection from "@/components/FoundingSection";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HousesSection from "@/components/HousesSection";
import Nav from "@/components/Nav";
import WorldSection from "@/components/WorldSection";

export default function Home() {
  return (
    <>
      <Nav />
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
