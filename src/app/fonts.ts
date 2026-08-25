import { Cinzel, EB_Garamond, Kalam } from "next/font/google";

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
