/*
  Warnings:

  - You are about to drop the column `activeOrganizationId` on the `session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,tenantId,roleId]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserRole_userId_roleId_key";

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "session" DROP COLUMN "activeOrganizationId",
ADD COLUMN     "activeTenantId" TEXT;

-- CreateTable
CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_name_key" ON "tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "UserRole_tenantId_idx" ON "UserRole"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_tenantId_roleId_key" ON "UserRole"("userId", "tenantId", "roleId");

-- CreateIndex
CREATE INDEX "session_activeTenantId_idx" ON "session"("activeTenantId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_activeTenantId_fkey" FOREIGN KEY ("activeTenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
