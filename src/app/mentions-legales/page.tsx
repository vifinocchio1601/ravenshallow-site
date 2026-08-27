import type { Metadata } from "next";
import PageLegale from "@/components/PageLegale";
import { MENTIONS_LEGALES } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — Ravenshallow",
  description:
    "Qui édite Ravenshallow, qui l’héberge, et comment signaler un contenu.",
};

export default function PageMentionsLegales() {
  return <PageLegale document={MENTIONS_LEGALES} />;
}
