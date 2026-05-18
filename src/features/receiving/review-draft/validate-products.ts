import { isProductCategory } from '@/features/product-catalog/category';
import type { CatalogProduct } from '@/features/product-catalog/products';
import type { ReviewInput } from '../types';
import { normalizeProductName } from './normalize-product-name';

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

    if (!isProductCategory(product.category)) {
      throw new Error(`カテゴリが不正です: ${name}`);
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
      category: product.category,
      count: product.count,
      selectedProductId: product.selectedProductId,
    };
  });
}
