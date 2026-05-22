/*
  Warnings:

  - Added the required column `fridgeId` to the `InventoryPublication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fridgeId` to the `InventoryStatusChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fridgeId` to the `UploadBatch` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Fridge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fridgeId" TEXT NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "publishedByUserId" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryPublication_fridgeId_fkey" FOREIGN KEY ("fridgeId") REFERENCES "Fridge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryPublication_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryPublication_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryPublication" ("createdAt", "id", "publishedAt", "publishedByUserId", "uploadBatchId") SELECT "createdAt", "id", "publishedAt", "publishedByUserId", "uploadBatchId" FROM "InventoryPublication";
DROP TABLE "InventoryPublication";
ALTER TABLE "new_InventoryPublication" RENAME TO "InventoryPublication";
CREATE INDEX "InventoryPublication_fridgeId_publishedAt_idx" ON "InventoryPublication"("fridgeId", "publishedAt" DESC);
CREATE INDEX "InventoryPublication_uploadBatchId_idx" ON "InventoryPublication"("uploadBatchId");
CREATE INDEX "InventoryPublication_publishedByUserId_idx" ON "InventoryPublication"("publishedByUserId");
CREATE TABLE "new_InventoryStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicationId" TEXT,
    "fridgeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "nextStatus" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryStatusChange_fridgeId_fkey" FOREIGN KEY ("fridgeId") REFERENCES "Fridge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "InventoryPublication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryStatusChange" ("changedAt", "changedByUserId", "createdAt", "id", "nextStatus", "previousStatus", "productId", "publicationId") SELECT "changedAt", "changedByUserId", "createdAt", "id", "nextStatus", "previousStatus", "productId", "publicationId" FROM "InventoryStatusChange";
DROP TABLE "InventoryStatusChange";
ALTER TABLE "new_InventoryStatusChange" RENAME TO "InventoryStatusChange";
CREATE INDEX "InventoryStatusChange_fridgeId_productId_changedAt_idx" ON "InventoryStatusChange"("fridgeId", "productId", "changedAt" DESC);
CREATE INDEX "InventoryStatusChange_publicationId_changedAt_idx" ON "InventoryStatusChange"("publicationId", "changedAt");
CREATE INDEX "InventoryStatusChange_changedByUserId_idx" ON "InventoryStatusChange"("changedByUserId");
CREATE TABLE "new_UploadBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fridgeId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UploadBatch_fridgeId_fkey" FOREIGN KEY ("fridgeId") REFERENCES "Fridge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadBatch_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UploadBatch" ("createdAt", "id", "originalFileName", "processedAt", "processingStatus", "storagePath", "updatedAt", "uploadedByUserId") SELECT "createdAt", "id", "originalFileName", "processedAt", "processingStatus", "storagePath", "updatedAt", "uploadedByUserId" FROM "UploadBatch";
DROP TABLE "UploadBatch";
ALTER TABLE "new_UploadBatch" RENAME TO "UploadBatch";
CREATE INDEX "UploadBatch_uploadedByUserId_idx" ON "UploadBatch"("uploadedByUserId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "favoriteFridgeId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "User_favoriteFridgeId_fkey" FOREIGN KEY ("favoriteFridgeId") REFERENCES "Fridge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "deletedAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt") SELECT "createdAt", "deletedAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Fridge_name_key" ON "Fridge"("name");
