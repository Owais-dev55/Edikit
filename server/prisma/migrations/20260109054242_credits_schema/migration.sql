-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('PURCHASE', 'RENDER', 'REFUND', 'BONUS', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "render_jobs" ADD COLUMN     "creditsUsed" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "credits" SET DEFAULT 5;

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT,
    "renderJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");

-- CreateIndex
CREATE INDEX "render_jobs_userId_idx" ON "render_jobs"("userId");

-- CreateIndex
CREATE INDEX "render_jobs_nexrenderJobId_idx" ON "render_jobs"("nexrenderJobId");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
