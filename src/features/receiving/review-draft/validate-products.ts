import { isProductCategory } from '@/features/product-catalog/category';
import { normalizeProductName } from '@/features/product-catalog/products';
import type { ReviewInput } from '../types';

export function validateReviewProducts(products: ReviewInput['products']) {
  if (products.length === 0) {
    throw new Error('納品書に商品がありません。');
  }

  const seenNames = new Set<string>();

  return products.map((product) => {
    const name = normalizeProductName(product.name);

    if (!name) {
      throw new Error('商品名が空の行があります。');
    }

    if (!Number.isInteger(product.count) || product.count <= 0) {
      throw new Error(`数量は 1 以上の整数である必要があります: ${name}`);
    }

    if (!isProductCategory(product.category)) {
      throw new Error(`カテゴリが不正です: ${name}`);
    }

    if (seenNames.has(name)) {
      throw new Error(`同じ商品が複数回含まれています: ${name}`);
    }

    seenNames.add(name);

    return {
      lineId: product.lineId,
      name,
      category: product.category,
      count: product.count,
    };
  });
}
