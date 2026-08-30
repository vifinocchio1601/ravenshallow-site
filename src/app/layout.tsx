import type { Metadata, Viewport } from "next";
import { cinzel, ebGaramond, kalam, notoRunic } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ravenshallow — École de magie · Côte de Norvège",
  description:
    "Un château dressé à flanc de falaise, entre mer, lac et forêt sombre — où l'on enseigne encore ce que quatre fondateurs ont juré de garder scellé.",
  openGraph: {
    title: "Ravenshallow — École de magie",
    description:
      "Entre mer, lac et forêt sombre : quatre maisons, une falaise, et un secret scellé sous le château.",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${cinzel.variable} ${ebGaramond.variable} ${kalam.variable} ${notoRunic.variable}`}
    >
      <body className="bg-void font-body text-parchment antialiased">
        {children}
      </body>
    </html>
  );
}
