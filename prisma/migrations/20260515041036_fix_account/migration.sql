/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `idToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `sessionState` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `tokenType` on the `Account` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("id", "provider", "providerAccountId", "scope", "type", "userId") SELECT "id", "provider", "providerAccountId", "scope", "type", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE TABLE "new_InventoryStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicationId" TEXT,
    "productId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "nextStatus" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryStatusChange_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "InventoryPublication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InventoryStatusChange" ("changedAt", "changedByUserId", "createdAt", "id", "nextStatus", "previousStatus", "productId", "publicationId") SELECT "changedAt", "changedByUserId", "createdAt", "id", "nextStatus", "previousStatus", "productId", "publicationId" FROM "InventoryStatusChange";
DROP TABLE "InventoryStatusChange";
ALTER TABLE "new_InventoryStatusChange" RENAME TO "InventoryStatusChange";
CREATE INDEX "InventoryStatusChange_productId_changedAt_idx" ON "InventoryStatusChange"("productId", "changedAt");
CREATE INDEX "InventoryStatusChange_publicationId_changedAt_idx" ON "InventoryStatusChange"("publicationId", "changedAt");
CREATE INDEX "InventoryStatusChange_changedByUserId_idx" ON "InventoryStatusChange"("changedByUserId");
CREATE TABLE "new_UploadBatchLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "matchedProductId" TEXT,
    "matchStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadBatchLine_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadBatchLine_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UploadBatchLine" ("count", "createdAt", "id", "lineNumber", "matchStatus", "matchedProductId", "rawText", "uploadBatchId") SELECT "count", "createdAt", "id", "lineNumber", "matchStatus", "matchedProductId", "rawText", "uploadBatchId" FROM "UploadBatchLine";
DROP TABLE "UploadBatchLine";
ALTER TABLE "new_UploadBatchLine" RENAME TO "UploadBatchLine";
CREATE INDEX "UploadBatchLine_uploadBatchId_lineNumber_idx" ON "UploadBatchLine"("uploadBatchId", "lineNumber");
CREATE INDEX "UploadBatchLine_matchedProductId_idx" ON "UploadBatchLine"("matchedProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
