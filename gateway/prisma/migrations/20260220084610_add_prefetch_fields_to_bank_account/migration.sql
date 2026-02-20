-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "accountDetailsData" JSONB,
ADD COLUMN     "balanceData" JSONB,
ADD COLUMN     "creditWorthinessData" JSONB,
ADD COLUMN     "identityData" JSONB,
ADD COLUMN     "transactionsData" JSONB;
