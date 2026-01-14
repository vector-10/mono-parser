/*
  Warnings:

  - You are about to drop the column `monoAccountId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_monoAccountId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "monoAccountId";

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "monoAccountId" TEXT NOT NULL,
    "institution" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "balance" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_monoAccountId_key" ON "BankAccount"("monoAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("monoAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;
