import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import reglages from "@/config/bureau.json";
import type { Annonce } from "@/lib/bureau/donnees";
import { TEXTES_ECOLE } from "@/lib/ecole/constantes";

/**
 * **Le Guetteur du Nord** — le journal du château, en haut du bureau.
 *
 * Une une de gazette photographiée, dont on remplit le cadre vide du milieu.
 * Le principe est celui des tubes : l’image est du **décor**, et tout ce qui
 * compte est du vrai texte posé par-dessus — sélectionnable, lisible par un
 * lecteur d’écran, jamais une image de mots. Le papier porte donc un `alt`
 * vide, et le titre du panneau est écrit à côté, invisible à l’œil.
 *
 * Il a remplacé le panneau « Annonces du Grand Hall » le 27 août 2026, et
 * n’est **pas** dans un `Panneau` : le papier est son propre cadre, et une
 * bordure autour d’une une de journal ferait un cadre dans un cadre.
 *
 * ⚠️ **C’est la hauteur qui est plafonnée, jamais la largeur.** L’inverse
 * déformerait le papier, et une une de journal étirée se voit au premier coup
 * d’œil. Les quatre bornes du cadre, elles, sont relevées sur l’image : les
 * réajuster à l’œil ferait sortir le texte du filet.
 *
 * Les annonces n’existent pas encore — `annonces()` rend une liste vide, et
 * le lot du Grand Hall reste à faire. Le jour où elles arriveront, elles
 * s’afficheront ici **sans que ce composant bouge**.
 */

/** L’image, telle qu’elle est dans le dépôt. Ne pas la retoucher. */
const PAPIER = { src: "/bureau/journal.webp", largeur: 900, hauteur: 1350 };

export default function JournalDuNord({ annonces }: { annonces: Annonce[] }) {
  const t = TEXTES_ECOLE.bureau.journal;

  return (
    <section
      aria-labelledby="journal-titre"
      className="journal"
      style={
        {
          "--journal-h-grand": `${reglages.journalHauteurMax}px`,
          "--journal-h-telephone": `${reglages.journalHauteurMaxTelephone}px`,
          "--cadre-gauche": `${reglages.cadreGauche}%`,
          "--cadre-droite": `${reglages.cadreDroite}%`,
          "--cadre-haut": `${reglages.cadreHaut}%`,
          "--cadre-bas": `${reglages.cadreBas}%`,
          "--cadre-marge": `${reglages.cadreMarge}%`,
        } as CSSProperties
      }
    >
      {/* Le titre est déjà dans l'image, en grandes capitales. Celui-ci est le
          même, et il existe pour deux raisons : une image ne donne pas son
          titre à un lecteur d'écran, et un panneau sans titre ne se repère pas
          dans une page. */}
      <h2 id="journal-titre" className="sr-only">
        {t.titre}
      </h2>

      <Image
        src={PAPIER.src}
        alt={t.altDecor}
        width={PAPIER.largeur}
        height={PAPIER.hauteur}
        // Sans `sizes`, `next/image` réclame la pleine largeur pour un journal
        // qui n'en fait jamais que trois cent soixante. Le trou déjà bouché
        // sur les blasons.
        sizes="(min-width: 1024px) 360px, 90vw"
        className="journal__papier"
        // Il est haut dans la page : le charger tôt évite qu'il apparaisse
        // après le reste, en découvrant le texte déjà posé sur du vide.
        priority
      />

      {/* Le cadre vide du milieu. `tabindex` parce que la zone défile : sans
          lui, on ne peut pas la parcourir au clavier — et une zone de texte
          qu'on ne peut pas faire défiler sans souris est une zone dont on ne
          lit que le début. */}
      <div
        className="journal__colonne"
        role="region"
        aria-label={t.regionAnnonces}
        tabIndex={0}
      >
        {annonces.length === 0 ? (
          <p className="journal__vide">{t.vide}</p>
        ) : (
          <ul>
            {annonces.map((annonce) => (
              <li key={annonce.id} className="journal__annonce">
                <h3 className="journal__titre">
                  <Link href={`/annonces/${annonce.id}`}>{annonce.titre}</Link>
                </h3>
                {/* L'instant voyage en ISO ; c'est le navigateur qui met en
                    forme, la seule juste pour qui lit — le serveur vit en UTC. */}
                <time
                  className="journal__date"
                  dateTime={annonce.publieeLe}
                  suppressHydrationWarning
                >
                  {jour(annonce.publieeLe)}
                </time>
                <p className="journal__extrait">{annonce.extrait}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** « 27 août 2026 ». */
function jour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
