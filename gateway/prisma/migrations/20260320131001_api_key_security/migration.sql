-- AlterTable
ALTER TABLE "User" ADD COLUMN     "webhookSecret" TEXT,
ALTER COLUMN "apiKey" DROP NOT NULL;
