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
 * **Le même volume, ouvert à un chapitre.**
 *
 * C'est cette adresse-là qui voyage dans un corbeau, avec l'ancre d'un bloc
 * en fragment : `/grimoires/sortileges/les-sorts-lies#sortilege-de-la-charge`.
 * **Jamais un numéro de page** — la pagination dépend de la largeur de
 * l'écran et de la taille du texte choisie, et « page 12 » ne désigne pas le
 * même contenu chez deux lecteurs.
 *
 * ⚠️ **Un chapitre réservé répond comme un chapitre qui n'existe pas.** Le
 * dépôt ne le met pas au sommaire ; on vérifie donc ici que le chapitre
 * demandé en fait partie, plutôt que d'ouvrir le volume à sa première page
 * comme si de rien n'était.
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: { volume: string; chapitre: string };
  searchParams: { lecture?: string };
}) {
  const compte = await exigerAcces(ROUTES.grimoires);
  const pouvoirs = await pouvoirsDe(compte.id);
  const lu = await lireLeVolumeEntier(params.volume, estStaff(pouvoirs));
  if (!lu) notFound();

  const existe = lu.chapitres.some((c) => c.slug === params.chapitre);
  if (!existe) notFound();

  return (
    <VueVolume
      volume={lu.volume}
      chapitres={lu.chapitres}
      continu={searchParams.lecture === "continue"}
      chapitreInitial={params.chapitre}
    />
  );
}
