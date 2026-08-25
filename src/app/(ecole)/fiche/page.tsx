import type { Metadata } from "next";
import { ROUTES } from "@/lib/ecole/menu";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: "Ma fiche — Ravenshallow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await exigerAcces(ROUTES.fiche);

  return (
    <main className="mx-auto max-w-content px-6 py-32 sm:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-[0.03em] text-parchment">
        Ma fiche
      </h1>
      <p className="mt-4 font-body leading-[1.8] text-parchment-dim">
        Cette salle n’est pas encore ouverte.
      </p>
    </main>
  );
}
