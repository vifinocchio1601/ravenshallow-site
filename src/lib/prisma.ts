import "server-only";
import { PrismaClient } from "@prisma/client";
import { adresseAvecDelaiDeConnexion } from "./base/adresse";

/**
 * Client Prisma unique.
 *
 * En développement, Next recharge les modules à chaque modification : sans
 * cette mise en cache sur `globalThis`, chaque rechargement ouvrirait un
 * nouveau pool de connexions et la base finirait par les refuser.
 *
 * C’est aussi **le seul endroit qui ouvre une connexion**, donc le seul où
 * poser le délai d’attente que réclame le réveil de Neon — voir
 * `base/adresse.ts`. Une adresse absente est laissée à Prisma, qui la lira
 * lui-même et se plaindra bien mieux que nous.
 */
const CLE = Symbol.for("ravenshallow.prisma");

type GlobalPrisma = typeof globalThis & { [CLE]?: PrismaClient };

function creer(): PrismaClient {
  const adresse = process.env.DATABASE_URL;

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(adresse ? { datasourceUrl: adresseAvecDelaiDeConnexion(adresse) } : {}),
  });
}

const global = globalThis as GlobalPrisma;

export const prisma: PrismaClient = (global[CLE] ??= creer());
