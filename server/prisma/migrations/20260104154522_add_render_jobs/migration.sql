-- CreateEnum
CREATE TYPE "RenderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "nexrender_templates" (
    "id" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "nexrenderId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "compositions" JSONB NOT NULL,
    "layers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nexrender_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "render_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "status" "RenderStatus" NOT NULL DEFAULT 'PENDING',
    "nexrenderJobId" TEXT,
    "outputUrl" TEXT,
    "nexrenderOutputUrl" TEXT,
    "error" TEXT,
    "customizations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "render_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nexrender_templates_templateId_key" ON "nexrender_templates"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "nexrender_templates_nexrenderId_key" ON "nexrender_templates"("nexrenderId");

-- CreateIndex
CREATE UNIQUE INDEX "render_jobs_nexrenderJobId_key" ON "render_jobs"("nexrenderJobId");

-- AddForeignKey
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
