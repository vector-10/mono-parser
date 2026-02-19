-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "enrichmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "incomeData" JSONB,
ADD COLUMN     "insightsJobId" TEXT,
ADD COLUMN     "statementInsightsData" JSONB;

-- CreateIndex
CREATE INDEX "BankAccount_enrichmentStatus_idx" ON "BankAccount"("enrichmentStatus");
