import { getProductStatusFromCount } from '@/features/inventory/counts';
import type { ExtractProducts } from '@/features/product-list-extraction/types';
import type { CatalogProduct } from '@/features/product-catalog/products';
import type { ReviewInput, ReviewLine } from './types';

export function normalizeProductName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export async function prepareReviewDraft(
  fileName: string,
  deps: {
    getCurrentUserId: () => Promise<string | null>;
    extractProducts: ExtractProducts;
    listCatalogProducts: () => Promise<CatalogProduct[]>;
    now?: () => Date;
  },
) {
  const userId = await deps.getCurrentUserId();

  if (!userId) {
    throw new Error('セッションが無効です。再ログインしてください。');
  }

  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    throw new Error('ファイル名を取得できませんでした。');
  }

  const [catalog, extractedProducts] = await Promise.all([
    deps.listCatalogProducts(),
    deps.extractProducts({ fileName: normalizedFileName }),
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
        count: product.count,
        selectedProductId: matchedProduct?.id ?? null,
        matchStatus: matchedProduct ? 'MATCHED' : 'NEEDS_REVIEW',
        appliedStatus: getProductStatusFromCount(product.count),
      } satisfies Omit<ReviewLine, 'lineId'>;
    }),
  };
}

export function validateReviewProducts(
  products: ReviewInput['products'],
  catalog: CatalogProduct[],
) {
  if (products.length === 0) {
    throw new Error('納品書に商品がありません。');
  }

  const productById = new Map(catalog.map((product) => [product.id, product]));
  const catalogByName = new Map(
    catalog.map((product) => [normalizeProductName(product.name), product]),
  );
  const seenNames = new Set<string>();

  return products.map((product) => {
    const name = normalizeProductName(product.name);

    if (!name) {
      throw new Error('商品名が空の行があります。');
    }

    if (!Number.isInteger(product.count) || product.count <= 0) {
      throw new Error(`数量は 1 以上の整数である必要があります: ${name}`);
    }

    let resolvedName = name;

    if (product.selectedProductId) {
      const selectedProduct = productById.get(product.selectedProductId);

      if (!selectedProduct) {
        throw new Error(`選択された商品が存在しません: ${name}`);
      }

      resolvedName = normalizeProductName(selectedProduct.name);
    } else if (catalogByName.has(name)) {
      throw new Error(
        `既存商品と同名の商品は新規登録できません: ${catalogByName.get(name)?.name}`,
      );
    }

    if (seenNames.has(resolvedName)) {
      throw new Error(`同じ商品が複数回含まれています: ${resolvedName}`);
    }

    seenNames.add(resolvedName);

    return {
      lineId: product.lineId,
      name,
      count: product.count,
      selectedProductId: product.selectedProductId,
    };
  });
}
