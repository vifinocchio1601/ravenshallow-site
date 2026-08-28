import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEXTES_ANNONCES } from "@/lib/annonces/constantes";
import { lireAnnonce } from "@/lib/annonces/depot";
import { ROUTES } from "@/lib/ecole/menu";
import { CLASSE_CONTENEUR } from "@/lib/forum/mise-en-forme";
import { nettoyerHtml } from "@/lib/forum/nettoyer-html";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_ANNONCES.annonce;

export const metadata: Metadata = {
  title: `${TEXTES_ANNONCES.liste.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Une annonce du Grand Hall.
 *
 * **Une annonce retirée rend 404**, comme une annonce qui n'a jamais existé :
 * `lireAnnonce` ne les distingue pas, et l'écran non plus. Dire « elle existe,
 * mais on l'a retirée » se lit comme une confirmation — même choix que le
 * forum et la Tour.
 */
export default async function Page({ params }: { params: { id: string } }) {
  await exigerAcces(ROUTES.annonces);

  const annonce = await lireAnnonce(params.id);
  if (!annonce) notFound();

  const enVigueur = annonce.entreeEnVigueurLe;
  // Passée ou à venir : c'est la même date, ce n'est pas la même phrase. « En
  // vigueur le 4 septembre » sur une règle qui s'applique depuis trois
  // semaines se lit comme une annonce à venir.
  const dejaEnVigueur =
    enVigueur !== null && new Date(enVigueur).getTime() <= Date.now();

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <Link
        href={ROUTES.annonces}
        className="font-body text-sm text-silver hover:text-aurora-teal"
      >
        {T.retour}
      </Link>

      <h1 className="mt-6 font-display text-[clamp(1.6rem,4.4vw,2.3rem)] font-semibold leading-[1.2] tracking-[0.02em] text-parchment">
        {annonce.titre}
      </h1>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {/* L'instant voyage en ISO ; c'est le navigateur qui met en forme, la
            seule juste pour qui lit — le serveur vit en UTC. */}
        <time
          dateTime={annonce.publieeLe}
          suppressHydrationWarning
          className="font-body text-xs italic text-silver"
        >
          {T.affichee.replace("{date}", enJour(annonce.publieeLe))}
        </time>

        {/* La marque « modifiée le » vaut ici ce qu'elle vaut sur un post : une
            annonce est ce qu'on lit une fois, et l'on doit voir qu'elle a bougé
            depuis. */}
        {annonce.modifieLe ? (
          <time
            dateTime={annonce.modifieLe}
            suppressHydrationWarning
            className="font-body text-[0.68rem] italic text-silver/70"
          >
            {T.modifiee.replace("{date}", enJour(annonce.modifieLe))}
          </time>
        ) : null}
      </p>

      {/* **La date d'entrée en vigueur est mise en avant, pas glissée dans une
          ligne de métadonnées.** C'est elle qui porte les sept jours du
          préambule, et c'est la seule chose de cette page qui oblige. */}
      {enVigueur ? (
        <p className="mt-5 border-l-2 border-ember/60 py-1 pl-4">
          <time
            dateTime={enVigueur}
            suppressHydrationWarning
            className="font-display text-[0.72rem] uppercase tracking-[0.22em] text-ember"
          >
            {(dejaEnVigueur ? T.enVigueurPassee : T.enVigueur).replace(
              "{date}",
              enJour(enVigueur),
            )}
          </time>
        </p>
      ) : null}

      {/* ── Le second nettoyage, et il n'est pas superflu ──

          Le premier a eu lieu à l'enregistrement, dans `validerCorpsAnnonce`.
          Celui-ci protège l'écran de tout ce qui aurait pu entrer autrement :
          une reprise de données, une commande tapée à la main contre la base.
          La classe `post-rendu` porte les styles de la mise en forme et **les
          borne** : hors d'elle, une classe de post ne peint rien. */}
      <div
        className={`${CLASSE_CONTENEUR} mt-8 font-body leading-[1.85] text-parchment-dim`}
        dangerouslySetInnerHTML={{ __html: nettoyerHtml(annonce.corps) }}
      />

      <div className="hairline mt-12 max-w-[28rem]" />
    </main>
  );
}

/** « 28 août 2026 ». */
function enJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
