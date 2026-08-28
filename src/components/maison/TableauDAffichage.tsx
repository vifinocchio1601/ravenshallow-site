import Image from "next/image";
import type { CSSProperties } from "react";
import reglages from "@/config/maison.json";
import { TEXTES_TABLEAU } from "@/lib/tableau/constantes";
import type { MotAffiche } from "@/lib/tableau/depot";
import BoutonRetirerMot from "./BoutonRetirerMot";

/**
 * **Le tableau d'affichage d'une maison** — un mur de bois, et des parchemins
 * épinglés dessus.
 *
 * Le principe est celui du journal du bureau et des tubes : **l'image est du
 * décor**, et tout ce qui compte est du vrai texte posé par-dessus —
 * sélectionnable, lisible par un lecteur d'écran, jamais une image de mots.
 * Le bois porte donc un `alt` vide.
 *
 * **Les mots sont sur du parchemin, et c'est ce qui les rend lisibles.** Le
 * bois est sombre ; du texte clair posé dessus se battrait avec le grain. De
 * l'encre sur du papier clair, non. C'est la même solution que le journal,
 * arrivée par l'autre bout : là-bas le papier était donné, ici on le pose.
 *
 * ⚠️ **Le rapport est tenu par la BOÎTE, jamais par l'image.** Les quatre
 * bornes du cadre sont des pourcentages de cette boîte : si elle cesse de
 * suivre le rapport du bois, `object-fit` centre gentiment l'image dedans,
 * mais le cadre se décale et les parchemins passent sur le fer. D'où
 * `width: 100%` + `max-width: calc(hauteur × rapport)` + `aspect-ratio`, et
 * **surtout pas** `height` + `width: auto` — piège déjà payé sur le journal.
 */
export default function TableauDAffichage({
  mots,
  moiId,
  peutFaireLeMenage,
  maison,
}: {
  mots: MotAffiche[];
  /** La maison dont c'est le tableau — pas forcément celle du lecteur. */
  maison: string;
  /** Pour savoir quels mots sont les siens : on décroche toujours le sien. */
  moiId: string | null;
  /** Un préfet tient son tableau : il décroche aussi le mot des autres. */
  peutFaireLeMenage: boolean;
}) {
  const t = TEXTES_TABLEAU;

  return (
    <div
      className="tableau"
      style={
        {
          "--tableau-h-grand": `${reglages.tableauHauteurMax}px`,
          "--tableau-h-telephone": `${reglages.tableauHauteurMaxTelephone}px`,
          "--tableau-rapport": `${reglages.imageLargeur} / ${reglages.imageHauteur}`,
          "--cadre-gauche": `${reglages.cadreGauche}%`,
          "--cadre-droite": `${reglages.cadreDroite}%`,
          "--cadre-haut": `${reglages.cadreHaut}%`,
          "--cadre-bas": `${reglages.cadreBas}%`,
          "--cadre-marge": `${reglages.cadreMarge}%`,
        } as CSSProperties
      }
    >
      <Image
        src="/maison/tableau.webp"
        alt={t.altDecor}
        width={reglages.imageLargeur}
        height={reglages.imageHauteur}
        // Sans `sizes`, `next/image` réclame la pleine largeur pour un tableau
        // qui n'en fait jamais que huit cents. Le trou déjà bouché sur les
        // blasons, puis sur le journal.
        sizes="(min-width: 1024px) 840px, 92vw"
        className="tableau__bois"
        priority
      />

      {/* Le bois nu du milieu. `tabindex` parce que la zone défile : sans lui,
          on ne peut pas la parcourir au clavier — et une zone qu'on ne peut
          pas faire défiler sans souris est une zone dont on ne lit que le
          début. */}
      <div
        className="tableau__mur"
        role="region"
        aria-label={t.ariaMur}
        tabIndex={0}
      >
        {mots.length === 0 ? (
          <p className="tableau__vide">{t.vide}</p>
        ) : (
          <ul className="tableau__mots">
            {mots.map((mot) => (
              <li key={mot.id}>
                <article
                  className="mot-epingle"
                  style={
                    { "--inclinaison": `${inclinaisonDe(mot.id)}deg` } as CSSProperties
                  }
                >
                  {/* Le clou. Décor pur : il ne dit rien qu'un lecteur
                      d'écran ait besoin d'entendre. */}
                  <span aria-hidden="true" className="mot-epingle__clou" />

                  {/* `whitespace-pre-wrap` et jamais une conversion en `<br>` :
                      celle-ci obligerait à assembler du HTML à la main, c'est-
                      à-dire exactement ce qu'on évite en gardant du texte
                      brut. Le choix de la Tour aux Corbeaux. */}
                  <p className="mot-epingle__corps">{mot.corps}</p>

                  <p className="mot-epingle__signature">
                    <span className="mot-epingle__nom">
                      {mot.auteurNom ?? t.auteurParti}
                    </span>
                    {mot.auteurPlace ? (
                      <span className="mot-epingle__place">
                        {mot.auteurPlace}
                      </span>
                    ) : null}
                    {/* L'instant voyage en ISO ; c'est le navigateur qui met en
                        forme, la seule juste pour qui lit — le serveur vit en
                        UTC. */}
                    <time
                      dateTime={mot.epingleLe}
                      suppressHydrationWarning
                      className="mot-epingle__date"
                    >
                      {enJour(mot.epingleLe)}
                    </time>
                  </p>

                  {peutFaireLeMenage ||
                  (moiId !== null && mot.auteurId === moiId) ? (
                    <BoutonRetirerMot
                      id={mot.id}
                      qui={mot.auteurNom ?? t.auteurParti}
                      maison={maison}
                    />
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * **L'inclinaison d'un parchemin, tirée de son identifiant.**
 *
 * Un mur de mots parfaitement alignés fait une grille de tableur ; deux
 * degrés suffisent à en faire un tableau. Mais l'angle doit être **stable** :
 * ce composant est rendu sur le serveur, et un `Math.random()` donnerait un
 * angle au rendu et un autre à l'hydratation — React s'en plaindrait, et le
 * parchemin sauterait sous les yeux du lecteur au chargement de la page.
 *
 * D'où une somme sur les codes de l'identifiant : le même mot penche toujours
 * du même côté, d'une visite à l'autre.
 */
function inclinaisonDe(id: string): string {
  let somme = 0;
  for (let i = 0; i < id.length; i += 1) somme += id.charCodeAt(i);
  // Un pas de 0,1° donne trente-sept positions distinctes de part et d'autre :
  // largement assez pour que deux voisins ne penchent pas pareil.
  const pas = (somme % 37) / 36; // 0 → 1
  return ((pas * 2 - 1) * reglages.inclinaisonMax).toFixed(2);
}

/** « 28 août 2026 ». */
function enJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
