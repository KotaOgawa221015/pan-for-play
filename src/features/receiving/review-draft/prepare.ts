import { ProductCategory } from '@prisma/client';
import type { ExtractDeliveryNoteProducts } from '../delivery-note/extract-products';
import type { CatalogProduct } from '@/features/product-catalog/products';
import type { ReviewLine } from '../types';
import { normalizeProductName } from './normalize-product-name';

export async function prepareReviewDraft(
  input: {
    fileName: string;
    imageBuffer: Buffer;
  },
  deps: {
    getCurrentUserId: () => Promise<string | null>;
    extractProducts: ExtractDeliveryNoteProducts;
    listCatalogProducts: () => Promise<CatalogProduct[]>;
    now?: () => Date;
  },
) {
  const userId = await deps.getCurrentUserId();

  if (!userId) {
    throw new Error('セッションが無効です。再ログインしてください。');
  }

  const normalizedFileName = input.fileName.trim();

  if (!normalizedFileName) {
    throw new Error('ファイル名を取得できませんでした。');
  }

  const [catalog, extractedProducts] = await Promise.all([
    deps.listCatalogProducts(),
    deps.extractProducts({
      fileName: normalizedFileName,
      imageBuffer: input.imageBuffer,
    }),
  ]);
  const productByName = new Map(
    catalog.map((product) => [normalizeProductName(product.name), product]),
  );

  return {
    userId,
    fileName: normalizedFileName,
    processedAt: (deps.now ?? (() => new Date()))(),
    catalog,
    lines: extractedProducts.map((product) => {
      const matchedProduct =
        productByName.get(normalizeProductName(product.name)) ?? null;

      return {
        name: product.name,
        category: matchedProduct?.category ?? ProductCategory.BREAD,
        count: product.count,
        selectedProductId: matchedProduct?.id ?? null,
        matchStatus: matchedProduct ? 'MATCHED' : 'NEEDS_REVIEW',
      } satisfies Omit<ReviewLine, 'lineId'>;
    }),
  };
}
