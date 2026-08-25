import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma unique.
 *
 * En développement, Next recharge les modules à chaque modification : sans
 * cette mise en cache sur `globalThis`, chaque rechargement ouvrirait un
 * nouveau pool de connexions et la base finirait par les refuser.
 */
const CLE = Symbol.for("ravenshallow.prisma");

type GlobalPrisma = typeof globalThis & { [CLE]?: PrismaClient };

function creer(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const global = globalThis as GlobalPrisma;

export const prisma: PrismaClient = (global[CLE] ??= creer());
