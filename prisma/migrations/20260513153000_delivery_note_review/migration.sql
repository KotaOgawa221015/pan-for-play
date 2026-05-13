PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_InventoryCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "checkedByUserId" TEXT NOT NULL,
    "uploadBatchId" TEXT,
    "status" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 6,
    "sourceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryCheck_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryCheck_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryCheck_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_InventoryCheck" (
    "id",
    "productId",
    "checkedByUserId",
    "uploadBatchId",
    "status",
    "count",
    "sourceType",
    "isActive",
    "checkedAt",
    "note",
    "createdAt"
)
SELECT
    "id",
    "productId",
    "checkedByUserId",
    "uploadBatchId",
    "status",
    CASE "status"
        WHEN 'SOLD_OUT' THEN 0
        WHEN 'FEW_LEFT' THEN 5
        ELSE 6
    END,
    "sourceType",
    true,
    "checkedAt",
    "note",
    "createdAt"
FROM "InventoryCheck";

DROP TABLE "InventoryCheck";
ALTER TABLE "new_InventoryCheck" RENAME TO "InventoryCheck";

CREATE INDEX "InventoryCheck_productId_checkedAt_idx" ON "InventoryCheck"("productId", "checkedAt");
CREATE INDEX "InventoryCheck_checkedByUserId_idx" ON "InventoryCheck"("checkedByUserId");
CREATE INDEX "InventoryCheck_uploadBatchId_idx" ON "InventoryCheck"("uploadBatchId");

CREATE TABLE "new_UploadBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadedByUserId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "appliedAt" DATETIME,
    "revertedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UploadBatch_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_UploadBatch" (
    "id",
    "uploadedByUserId",
    "originalFileName",
    "storagePath",
    "processingStatus",
    "processedAt",
    "appliedAt",
    "revertedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "uploadedByUserId",
    "originalFileName",
    "storagePath",
    "processingStatus",
    "processedAt",
    CASE WHEN "processingStatus" = 'APPLIED' THEN COALESCE("processedAt", "updatedAt") ELSE NULL END,
    NULL,
    "createdAt",
    "updatedAt"
FROM "UploadBatch";

DROP TABLE "UploadBatch";
ALTER TABLE "new_UploadBatch" RENAME TO "UploadBatch";

CREATE INDEX "UploadBatch_uploadedByUserId_idx" ON "UploadBatch"("uploadedByUserId");

CREATE TABLE "new_UploadBatchLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "matchedProductId" TEXT,
    "matchStatus" TEXT NOT NULL,
    "appliedStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadBatchLine_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UploadBatchLine_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_UploadBatchLine" (
    "id",
    "uploadBatchId",
    "lineNumber",
    "rawText",
    "count",
    "matchedProductId",
    "matchStatus",
    "appliedStatus",
    "createdAt"
)
SELECT
    "id",
    "uploadBatchId",
    "lineNumber",
    "rawText",
    CASE "appliedStatus"
        WHEN 'SOLD_OUT' THEN 0
        WHEN 'FEW_LEFT' THEN 5
        ELSE 6
    END,
    "matchedProductId",
    "matchStatus",
    "appliedStatus",
    "createdAt"
FROM "UploadBatchLine";

DROP TABLE "UploadBatchLine";
ALTER TABLE "new_UploadBatchLine" RENAME TO "UploadBatchLine";

CREATE INDEX "UploadBatchLine_uploadBatchId_lineNumber_idx" ON "UploadBatchLine"("uploadBatchId", "lineNumber");
CREATE INDEX "UploadBatchLine_matchedProductId_idx" ON "UploadBatchLine"("matchedProductId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
