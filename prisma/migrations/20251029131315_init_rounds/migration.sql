-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('CREATED', 'STARTED', 'REVEALED');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RoundStatus" NOT NULL DEFAULT 'CREATED',
    "nonce" TEXT NOT NULL,
    "commitHex" TEXT NOT NULL,
    "serverSeed" TEXT,
    "clientSeed" TEXT NOT NULL,
    "combinedSeed" TEXT NOT NULL,
    "pegMapHash" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "dropColumn" INTEGER NOT NULL,
    "binIndex" INTEGER NOT NULL,
    "payoutMultiplier" DOUBLE PRECISION NOT NULL,
    "betCents" INTEGER NOT NULL,
    "pathJson" JSONB NOT NULL,
    "revealedAt" TIMESTAMP(3),

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);
