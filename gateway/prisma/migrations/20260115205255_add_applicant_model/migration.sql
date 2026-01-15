/*
  Warnings:

  - You are about to drop the column `endUserId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `monoAccountId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `BankAccount` table. All the data in the column will be lost.
  - Added the required column `applicantId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `applicantId` to the `BankAccount` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_userId_fkey";

-- DropIndex
DROP INDEX "Application_userId_idx";

-- DropIndex
DROP INDEX "BankAccount_userId_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "endUserId",
DROP COLUMN "monoAccountId",
DROP COLUMN "userId",
ADD COLUMN     "applicantId" TEXT NOT NULL,
ADD COLUMN     "bankAccountId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "BankAccount" DROP COLUMN "userId",
ADD COLUMN     "applicantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bvn" TEXT,
    "fintechId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Applicant_fintechId_idx" ON "Applicant"("fintechId");

-- CreateIndex
CREATE INDEX "Applicant_email_idx" ON "Applicant"("email");

-- CreateIndex
CREATE INDEX "Application_applicantId_idx" ON "Application"("applicantId");

-- CreateIndex
CREATE INDEX "BankAccount_applicantId_idx" ON "BankAccount"("applicantId");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_fintechId_fkey" FOREIGN KEY ("fintechId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
