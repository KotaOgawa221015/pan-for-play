import type {
  ProductCategory,
  UploadBatchLineMatchStatus,
  UploadBatchProcessingStatus,
} from '@prisma/client';
import type { CatalogProduct } from '@/features/product-catalog/products';

export type ReviewLine = {
  lineId: string;
  name: string;
  category: ProductCategory;
  count: number;
  selectedProductId: string | null;
  matchStatus: UploadBatchLineMatchStatus;
};

export type ReviewDraft = {
  batchId: string;
  originalFileName: string;
  processedAt: string;
  catalog: CatalogProduct[];
  products: ReviewLine[];
};

export type ReviewInput = {
  batchId: string;
  products: Array<{
    lineId: string;
    name: string;
    category: ProductCategory;
    count: number;
    selectedProductId: string | null;
  }>;
};

export type HistoryLine = {
  id: string;
  name: string;
  count: number;
  matchedProductName: string | null;
};

export type HistoryEntry = {
  id: string;
  originalFileName: string;
  processingStatus: UploadBatchProcessingStatus;
  createdAt: string;
  processedAt: string | null;
  lineCount: number;
  publicationCount: number;
  lastPublishedAt: string | null;
  lastPublishedByName: string | null;
  isCurrent: boolean;
  lines: HistoryLine[];
};
