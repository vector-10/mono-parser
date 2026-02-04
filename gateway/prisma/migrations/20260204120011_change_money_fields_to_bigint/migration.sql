-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "amount" SET DATA TYPE BIGINT,
ALTER COLUMN "approvedAmount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "BankAccount" ALTER COLUMN "balance" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
