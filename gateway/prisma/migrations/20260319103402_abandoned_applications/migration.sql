/*
  Warnings:

  - A unique constraint covering the columns `[email,fintechId]` on the table `Applicant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "abandonedAt" TIMESTAMP(3),
ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_fintechId_key" ON "Applicant"("email", "fintechId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_idempotencyKey_key" ON "Application"("idempotencyKey");
