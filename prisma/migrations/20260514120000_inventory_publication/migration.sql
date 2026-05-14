PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "InventoryPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
    "publishedByUserId" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryPublication_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryPublication_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "InventoryStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicationId" TEXT,
    "productId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "nextStatus" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryStatusChange_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "InventoryPublication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryStatusChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "InventoryPublication" (
    "id",
    "uploadBatchId",
    "publishedByUserId",
    "publishedAt",
    "createdAt"
)
SELECT
    lower(hex(randomblob(16))),
    "id",
    "uploadedByUserId",
    COALESCE("appliedAt", "processedAt", "createdAt"),
    COALESCE("appliedAt", "processedAt", "createdAt")
FROM "UploadBatch"
WHERE "processingStatus" IN ('APPLIED', 'REVERTED');

WITH "publicationSequence" AS (
    SELECT
        "id",
        "uploadBatchId",
        "publishedByUserId",
        "publishedAt",
        LAG("id") OVER (
            ORDER BY "publishedAt", "createdAt", "id"
        ) AS "previousPublicationId"
    FROM "InventoryPublication"
),
"publicationProducts" AS (
    SELECT DISTINCT
        "sequence"."id" AS "publicationId",
        "sequence"."uploadBatchId",
        "sequence"."previousPublicationId",
        "sequence"."publishedByUserId",
        "sequence"."publishedAt",
        "line"."matchedProductId" AS "productId"
    FROM "publicationSequence" AS "sequence"
    JOIN "UploadBatchLine" AS "line"
        ON "line"."uploadBatchId" = "sequence"."uploadBatchId"
    WHERE "line"."matchedProductId" IS NOT NULL
),
"statusDiff" AS (
    SELECT
        lower(hex(randomblob(16))) AS "id",
        "products"."publicationId",
        "products"."productId",
        "products"."publishedByUserId" AS "changedByUserId",
        CASE
            WHEN "previousLine"."count" IS NULL THEN NULL
            WHEN "previousLine"."count" = 0 THEN 'SOLD_OUT'
            WHEN "previousLine"."count" <= 5 THEN 'FEW_LEFT'
            ELSE 'PLENTIFUL'
        END AS "previousStatus",
        CASE
            WHEN "currentLine"."count" = 0 THEN 'SOLD_OUT'
            WHEN "currentLine"."count" <= 5 THEN 'FEW_LEFT'
            ELSE 'PLENTIFUL'
        END AS "nextStatus",
        "products"."publishedAt" AS "changedAt",
        "products"."publishedAt" AS "createdAt"
    FROM "publicationProducts" AS "products"
    LEFT JOIN "InventoryPublication" AS "previousPublication"
        ON "previousPublication"."id" = "products"."previousPublicationId"
    LEFT JOIN "UploadBatchLine" AS "previousLine"
        ON "previousLine"."uploadBatchId" = "previousPublication"."uploadBatchId"
        AND "previousLine"."matchedProductId" = "products"."productId"
    LEFT JOIN "UploadBatchLine" AS "currentLine"
        ON "currentLine"."uploadBatchId" = "products"."uploadBatchId"
        AND "currentLine"."matchedProductId" = "products"."productId"
)
INSERT INTO "InventoryStatusChange" (
    "id",
    "publicationId",
    "productId",
    "changedByUserId",
    "previousStatus",
    "nextStatus",
    "changedAt",
    "createdAt"
)
SELECT
    "id",
    "publicationId",
    "productId",
    "changedByUserId",
    "previousStatus",
    "nextStatus",
    "changedAt",
    "createdAt"
FROM "statusDiff"
WHERE COALESCE("previousStatus", '__NONE__') <> "nextStatus";

CREATE TABLE "new_UploadBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadedByUserId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
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
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "uploadedByUserId",
    "originalFileName",
    "storagePath",
    CASE
        WHEN "processingStatus" IN ('APPLIED', 'REVERTED') THEN 'PROCESSED'
        ELSE "processingStatus"
    END,
    "processedAt",
    "createdAt",
    "updatedAt"
FROM "UploadBatch";

CREATE TABLE "new_UploadBatchLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadBatchId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawText" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "matchedProductId" TEXT,
    "matchStatus" TEXT NOT NULL,
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
    "createdAt"
)
SELECT
    "id",
    "uploadBatchId",
    "lineNumber",
    "rawText",
    "count",
    "matchedProductId",
    "matchStatus",
    "createdAt"
FROM "UploadBatchLine";

DROP TABLE "InventoryCheck";
DROP TABLE "UploadBatchLine";
DROP TABLE "UploadBatch";

ALTER TABLE "new_UploadBatch" RENAME TO "UploadBatch";
ALTER TABLE "new_UploadBatchLine" RENAME TO "UploadBatchLine";

CREATE INDEX "UploadBatch_uploadedByUserId_idx" ON "UploadBatch"("uploadedByUserId");
CREATE INDEX "UploadBatchLine_uploadBatchId_lineNumber_idx" ON "UploadBatchLine"("uploadBatchId", "lineNumber");
CREATE INDEX "UploadBatchLine_matchedProductId_idx" ON "UploadBatchLine"("matchedProductId");
CREATE INDEX "InventoryPublication_uploadBatchId_idx" ON "InventoryPublication"("uploadBatchId");
CREATE INDEX "InventoryPublication_publishedByUserId_idx" ON "InventoryPublication"("publishedByUserId");
CREATE INDEX "InventoryPublication_publishedAt_idx" ON "InventoryPublication"("publishedAt");
CREATE INDEX "InventoryStatusChange_productId_changedAt_idx" ON "InventoryStatusChange"("productId", "changedAt");
CREATE INDEX "InventoryStatusChange_publicationId_changedAt_idx" ON "InventoryStatusChange"("publicationId", "changedAt");
CREATE INDEX "InventoryStatusChange_changedByUserId_idx" ON "InventoryStatusChange"("changedByUserId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
