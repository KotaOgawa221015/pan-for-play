/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `idToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `sessionState` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `tokenType` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - The primary key for the `VerificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "Session_userId_idx";

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
CREATE TABLE "new_InventoryCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "checkedByUserId" TEXT NOT NULL,
    "uploadBatchId" TEXT,
    "status" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryCheck_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryCheck_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryCheck_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryCheck" ("checkedAt", "checkedByUserId", "count", "createdAt", "id", "isActive", "note", "productId", "sourceType", "status", "uploadBatchId") SELECT "checkedAt", "checkedByUserId", "count", "createdAt", "id", "isActive", "note", "productId", "sourceType", "status", "uploadBatchId" FROM "InventoryCheck";
DROP TABLE "InventoryCheck";
ALTER TABLE "new_InventoryCheck" RENAME TO "InventoryCheck";
CREATE INDEX "InventoryCheck_productId_checkedAt_idx" ON "InventoryCheck"("productId", "checkedAt");
CREATE INDEX "InventoryCheck_checkedByUserId_idx" ON "InventoryCheck"("checkedByUserId");
CREATE INDEX "InventoryCheck_uploadBatchId_idx" ON "InventoryCheck"("uploadBatchId");
CREATE TABLE "new_UploadBatchLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "matchedProductId" TEXT,
    "matchStatus" TEXT NOT NULL,
    "appliedStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadBatchLine_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadBatchLine_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UploadBatchLine" ("appliedStatus", "count", "createdAt", "id", "lineNumber", "matchStatus", "matchedProductId", "rawText", "uploadBatchId") SELECT "appliedStatus", "count", "createdAt", "id", "lineNumber", "matchStatus", "matchedProductId", "rawText", "uploadBatchId" FROM "UploadBatchLine";
DROP TABLE "UploadBatchLine";
ALTER TABLE "new_UploadBatchLine" RENAME TO "UploadBatchLine";
CREATE INDEX "UploadBatchLine_uploadBatchId_lineNumber_idx" ON "UploadBatchLine"("uploadBatchId", "lineNumber");
CREATE INDEX "UploadBatchLine_matchedProductId_idx" ON "UploadBatchLine"("matchedProductId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
INSERT INTO "new_VerificationToken" ("expires", "identifier", "token") SELECT "expires", "identifier", "token" FROM "VerificationToken";
DROP TABLE "VerificationToken";
ALTER TABLE "new_VerificationToken" RENAME TO "VerificationToken";
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
