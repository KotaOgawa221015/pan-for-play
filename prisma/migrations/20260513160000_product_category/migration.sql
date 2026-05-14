PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

ALTER TABLE "Product" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'BREAD';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
