CREATE TABLE "CurrentInventory" (
    "fridgeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "lastPublishedAt" DATETIME NOT NULL,
    "lastChangedAt" DATETIME,
    "lastChangedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CurrentInventory_fridgeId_fkey" FOREIGN KEY ("fridgeId") REFERENCES "Fridge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CurrentInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CurrentInventory_lastChangedByUserId_fkey" FOREIGN KEY ("lastChangedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    PRIMARY KEY ("fridgeId", "productId")
);

CREATE INDEX "CurrentInventory_fridgeId_isVisible_idx" ON "CurrentInventory"("fridgeId", "isVisible");
CREATE INDEX "CurrentInventory_lastChangedByUserId_idx" ON "CurrentInventory"("lastChangedByUserId");
