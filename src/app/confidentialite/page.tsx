import type { Metadata } from "next";
import PageLegale from "@/components/PageLegale";
import { CONFIDENTIALITE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Données personnelles — Ravenshallow",
  description:
    "Ce que Ravenshallow conserve, ce qu’il ne conserve pas, combien de temps, et comment exercer ses droits.",
};

export default function PageConfidentialite() {
  return <PageLegale document={CONFIDENTIALITE} />;
}
