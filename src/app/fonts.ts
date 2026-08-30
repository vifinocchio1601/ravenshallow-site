import { Cinzel, EB_Garamond, Kalam, Noto_Sans_Runic } from "next/font/google";

/** Police d'affichage : titres, navigation, boutons, petits libellés. */
export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Police de corps de texte, avec italique pour les citations et l'ambiance. */
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Écriture à la main — la note épinglée sur le bureau, et elle seule.
 *
 * Elle ne porte jamais un état à elle toute seule : la case cochée et la
 * raison d’un verrou restent écrites en clair à côté du texte manuscrit.
 */
export const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-manuscrit",
  display: "swap",
});

/**
 * **Les runes des grimoires**, et rien d'autre.
 *
 * ⚠️ **Une quatrième police, contre la règle du projet** — accordée par le
 * joueur le 30 août 2026, pour une raison qui ne se contourne pas : le
 * grimoire des Sortilèges porte vingt-quatre runes et les glyphes de
 * soixante-cinq sorts, et **aucune des trois autres ne les dessine**. Sans
 * elle, l'affichage retombe sur une police système — présente sur Mac et
 * Windows, incertaine sur Android : le lecteur y verrait des rectangles à la
 * place du contenu.
 *
 * Le sous-ensemble `runic` ne pèse que le bloc U+16A0–U+16FF : quelques
 * kilo-octets, et les runes décoratives du reste du site n'y touchent pas —
 * elles gardent `.rune`, qui suit la police du corps.
 */
export const notoRunic = Noto_Sans_Runic({
  subsets: ["runic"],
  weight: ["400"],
  variable: "--font-runes",
  display: "swap",
});
