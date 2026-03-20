-- CreateTable
CREATE TABLE "RiskPolicy" (
    "id" TEXT NOT NULL,
    "fintechId" TEXT NOT NULL,
    "scoreRejectFloor" INTEGER NOT NULL DEFAULT 500,
    "scoreManualFloor" INTEGER NOT NULL DEFAULT 600,
    "scoreApproveFloor" INTEGER NOT NULL DEFAULT 700,
    "manualReviewBuffer" INTEGER NOT NULL DEFAULT 20,
    "highValueThreshold" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "affordabilityCap" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "minViableOfferRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "thinFileIncomeMultiple" INTEGER NOT NULL DEFAULT 2,
    "thinFileMaxTenor" INTEGER NOT NULL DEFAULT 6,
    "minimumMonthlyIncome" DOUBLE PRECISION NOT NULL DEFAULT 30000,
    "incomeStalenessdays" INTEGER NOT NULL DEFAULT 90,
    "minAccountAgeMonths" INTEGER NOT NULL DEFAULT 3,
    "maxOverdrafts" INTEGER NOT NULL DEFAULT 10,
    "maxBouncedPayments" INTEGER NOT NULL DEFAULT 3,
    "maxConsecutiveFailures" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskPolicy_fintechId_key" ON "RiskPolicy"("fintechId");

-- AddForeignKey
ALTER TABLE "RiskPolicy" ADD CONSTRAINT "RiskPolicy_fintechId_fkey" FOREIGN KEY ("fintechId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
