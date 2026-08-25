/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    /**
     * Modules à ne pas empaqueter côté serveur.
     *
     * `@node-rs/argon2` et le moteur de Prisma embarquent des binaires natifs,
     * que webpack ne sait pas suivre : empaquetés, ils se cherchent au mauvais
     * endroit et échouent à l’exécution. Laissés à Node, ils se chargent seuls.
     */
    serverComponentsExternalPackages: ["@node-rs/argon2", "@prisma/client"],
  },
};

export default nextConfig;
