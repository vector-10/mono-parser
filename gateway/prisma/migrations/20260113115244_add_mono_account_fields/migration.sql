/*
  Warnings:

  - A unique constraint covering the columns `[monoAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "monoAccountId" TEXT,
ADD COLUMN     "monoCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_monoAccountId_key" ON "User"("monoAccountId");
