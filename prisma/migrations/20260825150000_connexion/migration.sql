-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "banniJusquau" TIMESTAMP(3),
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "jetons_reinitialisation" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "jetonHash" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utiliseLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jetons_reinitialisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentatives_connexion" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentatives_connexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jetons_reinitialisation_jetonHash_key" ON "jetons_reinitialisation"("jetonHash");

-- CreateIndex
CREATE INDEX "jetons_reinitialisation_utilisateurId_creeLe_idx" ON "jetons_reinitialisation"("utilisateurId", "creeLe");

-- CreateIndex
CREATE INDEX "tentatives_connexion_cle_creeLe_idx" ON "tentatives_connexion"("cle", "creeLe");

-- AddForeignKey
ALTER TABLE "jetons_reinitialisation" ADD CONSTRAINT "jetons_reinitialisation_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

