import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { blasonDe, BLASON_ECOLE, NOMS_MAISON } from "@/lib/ecole/blasons";
import { ROUTES } from "@/lib/ecole/menu";
import { TEXTES_REGISTRE } from "@/lib/registre/constantes";
import { lireLeRegistre, type GroupeDuRegistre } from "@/lib/registre/depot";
import { exigerAcces } from "@/lib/session/garde";

const T = TEXTES_REGISTRE;

export const metadata: Metadata = {
  title: `${T.titre} — Ravenshallow`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Le Registre** — qui vit au château.
 *
 * ⚠️ **Aucune sanction ne s'y voit** (art. 8.2) : un membre suspendu y figure
 * exactement comme les autres, sans pastille et sans tri à part. Le dépôt ne
 * lit même pas `statutAcces` — ne pas l'y ajouter, fût-ce « pour information ».
 *
 * ⚠️ **À ne pas confondre avec le registre des visages** (art. 6.3), qui
 * recense les acteurs déjà pris et vit dans le formulaire d'inscription.
 */
export default async function Page() {
  await exigerAcces(ROUTES.registre);
  const groupes = await lireLeRegistre();
  const total = groupes.reduce((n, g) => n + g.membres.length, 0);

  return (
    <main className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow">{T.eyebrow}</p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,5vw,2.6rem)] font-semibold leading-[1.15] tracking-[0.03em] text-parchment">
        {T.titre}
      </h1>
      <p className="mt-4 max-w-[62ch] font-body leading-[1.8] text-parchment-dim">
        {T.chapeau}
      </p>

      {total === 0 ? (
        <p className="mt-12 font-body italic leading-[1.8] text-silver">
          {T.vide}
        </p>
      ) : (
        groupes.map((groupe) => (
          <Groupe key={groupe.cle + (groupe.maison ?? "")} groupe={groupe} />
        ))
      )}
    </main>
  );
}

function Groupe({ groupe }: { groupe: GroupeDuRegistre }) {
  const titre =
    groupe.maison !== null
      ? (NOMS_MAISON[groupe.maison] ?? groupe.maison)
      : groupe.cle === "CHATEAU"
        ? T.groupes.chateau
        : T.groupes.attente;

  const aide =
    groupe.maison !== null
      ? null
      : groupe.cle === "CHATEAU"
        ? T.groupes.chateauAide
        : T.groupes.attenteAide;

  // Le blason de la maison, ou celui de l'école pour les deux groupes qui n'en
  // sont pas une : « Ravenshallow » est vrai des deux, là où une maison serait
  // fausse.
  const blason = groupe.maison !== null ? blasonDe(groupe.maison) : BLASON_ECOLE;

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-3 font-display text-[0.72rem] uppercase tracking-[0.18em] text-parchment-dim">
        <Image
          src={blason.src}
          alt=""
          width={blason.largeur}
          height={blason.hauteur}
          sizes="26px"
          className="h-[26px] w-auto"
        />
        {titre}
      </h2>
      {aide ? (
        <p className="mt-1 font-body text-sm italic leading-relaxed text-silver">
          {aide}
        </p>
      ) : null}

      {groupe.membres.length === 0 ? (
        <p className="mt-3 font-body text-sm italic text-silver">
          {T.maisonVide}
        </p>
      ) : (
        <ul
          aria-label={T.ariaListe.replace("{groupe}", titre)}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {groupe.membres.map((membre) => (
            // `min-w-0` sur l'élément ET `grid-cols-1` sur la liste : sans les
            // deux, un nom long élargit la carte au-delà de l'écran.
            <li
              key={membre.eleveId}
              className="min-w-0 rounded-md border border-silver/15 bg-void/40 transition-colors hover:border-aurora-teal/40"
            >
              <Link
                href={`${ROUTES.registre}/${membre.eleveId}`}
                className="flex items-center gap-3 p-3"
              >
                {membre.portrait ? (
                  // Un `<img>` ordinaire, et **non `next/image`** :
                  // l'optimiseur va chercher la source depuis le serveur, sans
                  // les cookies du lecteur, et se ferait refuser par
                  // `/api/portraits/[id]`, qui exige une session.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={membre.portrait}
                    alt={T.altPortrait}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[9/16] w-10 shrink-0 rounded-sm border border-silver/25 object-cover object-top"
                  />
                ) : (
                  <div className="grid aspect-[9/16] w-10 shrink-0 place-items-center rounded-sm border border-silver/15 bg-mist/50">
                    <Image
                      src={blason.src}
                      alt=""
                      width={blason.largeur}
                      height={blason.hauteur}
                      sizes="20px"
                      className="h-auto w-1/2 opacity-50"
                    />
                  </div>
                )}

                <span className="min-w-0">
                  {/* Le nom ne se coupe pas : c'est la seule chose que cette
                      carte doit dire à coup sûr. */}
                  <span className="block font-body leading-snug text-parchment">
                    {membre.prenomNom}
                  </span>
                  <span className="mt-0.5 block font-body text-xs italic text-silver">
                    {membre.place}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
