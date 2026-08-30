import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VueVolume from "@/components/grimoires/VueVolume";
import { ROUTES } from "@/lib/ecole/menu";
import { pouvoirsDe } from "@/lib/forum/depot-pouvoirs";
import { estStaff } from "@/lib/forum/pouvoirs";
import { TEXTES_GRIMOIRES } from "@/lib/grimoires/constantes";
import { lireLeVolumeEntier } from "@/lib/grimoires/depot";
import { exigerAcces } from "@/lib/session/garde";

export const metadata: Metadata = {
  title: `${TEXTES_GRIMOIRES.nom} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Un volume ouvert.**
 *
 * ⚠️ **Un volume qui n'existe pas et un volume dont rien ne s'ouvre rendent
 * la même page.** « Il existe, mais pas pour vous » se lit comme une
 * confirmation — même choix que le forum, la Tour et le Grand Hall.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: { volume: string };
  searchParams: { lecture?: string };
}) {
  const compte = await exigerAcces(ROUTES.grimoires);
  const pouvoirs = await pouvoirsDe(compte.id);
  const lu = await lireLeVolumeEntier(params.volume, estStaff(pouvoirs));
  if (!lu) notFound();

  return (
    <VueVolume
      volume={lu.volume}
      chapitres={lu.chapitres}
      continu={searchParams.lecture === "continue"}
      chapitreInitial={null}
    />
  );
}
