-- CreateEnum
CREATE TYPE "Role" AS ENUM ('JOUEUR', 'MODERATEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutAcces" AS ENUM ('EN_ATTENTE', 'VALIDE', 'EN_BANNISSEMENT');

-- CreateEnum
CREATE TYPE "LimiteEcriture" AS ENUM ('DEUIL', 'MALTRAITANCE', 'NOYADE', 'ENFERMEMENT', 'EMPRISE_MENTALE', 'BLESSURES_DECRITES', 'HARCELEMENT', 'ROMANCE');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('FEMININ', 'MASCULIN', 'AUTRE');

-- CreateEnum
CREATE TYPE "Fonction" AS ENUM ('PREMIERE_ANNEE', 'DEUXIEME_ANNEE', 'TROISIEME_ANNEE', 'QUATRIEME_ANNEE', 'CINQUIEME_ANNEE', 'SIXIEME_ANNEE', 'SEPTIEME_ANNEE', 'PROFESSEUR', 'DIRECTION');

-- CreateEnum
CREATE TYPE "Famille" AS ENUM ('SORCIERS', 'MIXTE', 'PREMIER_LIGNEE');

-- CreateEnum
CREATE TYPE "PortraitType" AS ENUM ('ACTEUR', 'IA_ILLUSTRATION');

-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'ACCEPTE', 'A_CORRIGER', 'REFUSE');

-- CreateEnum
CREATE TYPE "EvenementMembre" AS ENUM ('DOSSIER_SOUMIS', 'DOSSIER_ACCEPTE', 'DOSSIER_RENVOYE_EN_CORRECTION', 'DOSSIER_REFUSE', 'AGE_MODIFIE', 'FONCTION_MODIFIEE', 'ACCES_MODIFIE');

-- CreateEnum
CREATE TYPE "Maison" AS ENUM ('KALDRAFN', 'NATTORM', 'BRYGGELD', 'TIDEAL');

-- CreateEnum
CREATE TYPE "BaguetteBois" AS ENUM ('FRENE', 'IF', 'SORBIER', 'BOULEAU', 'CHENE_DES_TEMPETES');

-- CreateEnum
CREATE TYPE "BaguetteCoeur" AS ENUM ('PLUME_DE_CORBEAU', 'ECAILLE_ANGUILLE_ARGENTEE', 'NERF_LOUP_DES_FJORDS', 'GRIFFE_OURS_DES_CAVERNES', 'CRISTAL_DE_GLACE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "majeur16" BOOLEAN NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'JOUEUR',
    "reglementAccepteLe" TIMESTAMP(3) NOT NULL,
    "reglementVersion" TEXT NOT NULL,
    "statutAcces" "StatutAcces" NOT NULL DEFAULT 'EN_ATTENTE',
    "limitesEcriture" "LimiteEcriture"[] DEFAULT ARRAY[]::"LimiteEcriture"[],
    "limitesAutres" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "prenomNom" TEXT NOT NULL,
    "genre" "Genre" NOT NULL,
    "famille" "Famille" NOT NULL,
    "age" INTEGER NOT NULL DEFAULT 13,
    "fonction" "Fonction" NOT NULL DEFAULT 'PREMIERE_ANNEE',
    "portraitType" "PortraitType" NOT NULL,
    "acteurNom" TEXT,
    "portraitUrl" TEXT,
    "biographie" TEXT NOT NULL,
    "qualite1" TEXT NOT NULL,
    "qualite2" TEXT NOT NULL,
    "qualite3" TEXT NOT NULL,
    "defaut1" TEXT NOT NULL,
    "defaut2" TEXT NOT NULL,
    "defaut3" TEXT NOT NULL,
    "plusGrandePeur" TEXT NOT NULL,
    "certification104Le" TIMESTAMP(3),
    "statut" "StatutDossier" NOT NULL DEFAULT 'BROUILLON',
    "soumisLe" TIMESTAMP(3),
    "decideLe" TIMESTAMP(3),
    "noteAdmin" TEXT,
    "baguetteBois" "BaguetteBois",
    "baguetteCoeur" "BaguetteCoeur",
    "baguetteChoisieLe" TIMESTAMP(3),
    "maison" "Maison",
    "repartiLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visages_pris" (
    "id" TEXT NOT NULL,
    "nomActeur" TEXT NOT NULL,
    "nomNormalise" TEXT NOT NULL,
    "eleveId" TEXT,
    "prisLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visages_pris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_membres" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "EvenementMembre" NOT NULL,
    "valeurAvant" TEXT,
    "valeurApres" TEXT,
    "note" TEXT,
    "parUtilisateurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_membres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_utilisateurId_key" ON "eleves"("utilisateurId");

-- CreateIndex
CREATE INDEX "eleves_statut_soumisLe_idx" ON "eleves"("statut", "soumisLe");

-- CreateIndex
CREATE INDEX "eleves_fonction_idx" ON "eleves"("fonction");

-- CreateIndex
CREATE UNIQUE INDEX "visages_pris_nomNormalise_key" ON "visages_pris"("nomNormalise");

-- CreateIndex
CREATE UNIQUE INDEX "visages_pris_eleveId_key" ON "visages_pris"("eleveId");

-- CreateIndex
CREATE INDEX "journal_membres_utilisateurId_creeLe_idx" ON "journal_membres"("utilisateurId", "creeLe");

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visages_pris" ADD CONSTRAINT "visages_pris_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_membres" ADD CONSTRAINT "journal_membres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_membres" ADD CONSTRAINT "journal_membres_parUtilisateurId_fkey" FOREIGN KEY ("parUtilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

