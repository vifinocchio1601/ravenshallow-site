import { Cinzel, EB_Garamond } from "next/font/google";

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
