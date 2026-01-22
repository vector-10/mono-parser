/*
  Warnings:

  - Added the required column `tenor` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "approvedAmount" INTEGER,
ADD COLUMN     "approvedTenor" INTEGER,
ADD COLUMN     "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "monthlyPayment" DOUBLE PRECISION,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "tenor" INTEGER NOT NULL;
