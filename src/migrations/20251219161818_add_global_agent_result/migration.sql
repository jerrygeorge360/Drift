-- CreateTable
CREATE TABLE "GlobalAgentResult" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalAgentResult_pkey" PRIMARY KEY ("id")
);
