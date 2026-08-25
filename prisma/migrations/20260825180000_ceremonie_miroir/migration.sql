-- CreateTable
CREATE TABLE "ceremonies_miroir" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "melange" TEXT[],
    "ouverteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reponses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "points" JSONB,
    "closeLe" TIMESTAMP(3),

    CONSTRAINT "ceremonies_miroir_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ceremonies_miroir_eleveId_key" ON "ceremonies_miroir"("eleveId");

-- AddForeignKey
ALTER TABLE "ceremonies_miroir" ADD CONSTRAINT "ceremonies_miroir_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

