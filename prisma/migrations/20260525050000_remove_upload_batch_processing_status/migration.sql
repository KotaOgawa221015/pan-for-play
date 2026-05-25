-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UploadBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fridgeId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "processedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UploadBatch_fridgeId_fkey" FOREIGN KEY ("fridgeId") REFERENCES "Fridge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadBatch_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UploadBatch" ("createdAt", "fridgeId", "id", "originalFileName", "processedAt", "storagePath", "deletedAt", "updatedAt", "uploadedByUserId") SELECT "createdAt", "fridgeId", "id", "originalFileName", "processedAt", "storagePath", NULL, "updatedAt", "uploadedByUserId" FROM "UploadBatch";
DROP TABLE "UploadBatch";
ALTER TABLE "new_UploadBatch" RENAME TO "UploadBatch";
CREATE INDEX "UploadBatch_uploadedByUserId_idx" ON "UploadBatch"("uploadedByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
