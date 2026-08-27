import type { MetadataRoute } from "next";

/**
 * Ce que les moteurs de recherche ont le droit de lire.
 *
 * Le parti pris est **l’inverse de l’habituel** : tout est fermé, et seules
 * les trois pages publiques sont rouvertes une à une. Une liste d’interdits
 * demanderait de penser à l’allonger à chaque nouvelle route — et l’oubli
 * livrerait une page privée à l’indexation, c’est-à-dire au cache de Google,
 * qui survit à la correction. Ici l’oubli va dans le sens de la fermeture,
 * comme pour les drapeaux du menu.
 *
 * `/_next/` et `/crests/` restent ouverts : sans la feuille de style ni les
 * blasons, un moteur ne rend pas la page d’accueil et la juge moins bien.
 *
 * Les adresses privées ne sont pas *citées* comme interdites : les nommer
 * dans un fichier public dirait à qui le lit où se trouve l’administration.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/$",
        "/reglement",
        "/inscription",
        "/mentions-legales",
        "/confidentialite",
        "/_next/",
        "/crests/",
      ],
      disallow: "/",
    },
  };
}
