import type { ProductCategory } from '@prisma/client';
import type { CatalogProduct } from '@/features/product-catalog/products';

export type ReviewLine = {
  lineId: string;
  name: string;
  category: ProductCategory;
  count: number;
};

export type ReviewDraft = {
  batchId: string;
  originalFileName: string;
  sourceImageUrl: string;
  processedAt: string;
  catalog: CatalogProduct[];
  products: ReviewLine[];
};

export type ReviewInput = {
  batchId: string;
  originalFileName: string;
  products: Array<{
    lineId: string;
    name: string;
    category: ProductCategory;
    count: number;
  }>;
};

type HistoryLine = {
  id: string;
  name: string;
  count: number;
  matchedProductName: string | null;
};

export type HistoryEntry = {
  id: string;
  originalFileName: string;
  createdAt: string;
  processedAt: string | null;
  hasPublication: boolean;
  appliedFridgeNames: string[];
  lastPublishedByName: string | null;
  isCurrent: boolean;
  lines: HistoryLine[];
};
